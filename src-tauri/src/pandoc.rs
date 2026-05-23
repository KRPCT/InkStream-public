use serde::{Deserialize, Serialize};
use std::env;
use std::fs;
use std::io::Write;
use std::path::{Path, PathBuf};
use std::process::Command;

#[cfg(not(test))]
use tauri::Manager;

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum PandocFormat {
    Markdown,
    Html,
    Pdf,
    Docx,
    Rtf,
    Epub,
    Latex,
    Typst,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct PandocProbeResult {
    pub ok: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub path: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub source: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub version: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PandocExportOptions {
    pub input_path: Option<String>,
    pub output_path: String,
    pub from: PandocFormat,
    pub to: PandocFormat,
    pub content: Option<String>,
    pub pandoc_path: Option<String>,
    pub standalone: Option<bool>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PandocImportOptions {
    pub input_path: String,
    pub from: PandocFormat,
    pub to: Option<PandocFormat>,
    pub pandoc_path: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct PandocJobResult {
    pub ok: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub output_path: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub content: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub format: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub stderr: Option<String>,
}

pub fn pandoc_probe_impl(path: Option<String>) -> PandocProbeResult {
    pandoc_probe_with_resources(path, None)
}

pub fn pandoc_probe_with_resources(
    path: Option<String>,
    resource_dir: Option<PathBuf>,
) -> PandocProbeResult {
    let binary = match resolve_pandoc(path.as_deref(), resource_dir.as_deref()) {
        Ok(binary) => binary,
        Err(error) => {
            return PandocProbeResult {
                ok: false,
                path,
                source: None,
                version: None,
                error: Some(error),
            }
        }
    };

    match Command::new(&binary.path).arg("--version").output() {
        Ok(output) if output.status.success() => {
            let stdout = String::from_utf8_lossy(&output.stdout);
            PandocProbeResult {
                ok: true,
                path: Some(binary.path.to_string_lossy().to_string()),
                source: Some(binary.source),
                version: stdout.lines().next().map(str::to_string),
                error: None,
            }
        }
        Ok(output) => PandocProbeResult {
            ok: false,
            path: Some(binary.path.to_string_lossy().to_string()),
            source: Some(binary.source),
            version: None,
            error: Some(String::from_utf8_lossy(&output.stderr).trim().to_string()),
        },
        Err(error) => PandocProbeResult {
            ok: false,
            path: Some(binary.path.to_string_lossy().to_string()),
            source: Some(binary.source),
            version: None,
            error: Some(error.to_string()),
        },
    }
}

pub fn pandoc_export_impl(options: PandocExportOptions) -> PandocJobResult {
    pandoc_export_with_resources(options, None)
}

pub fn pandoc_export_with_resources(
    options: PandocExportOptions,
    resource_dir: Option<PathBuf>,
) -> PandocJobResult {
    let binary = match resolve_pandoc(options.pandoc_path.as_deref(), resource_dir.as_deref()) {
        Ok(binary) => binary,
        Err(error) => return job_error(error, None),
    };

    let mut temp_file = None;
    let input = if let Some(input_path) = options.input_path.clone() {
        input_path
    } else if let Some(content) = options.content.as_deref() {
        let path = temp_markdown_path("inkstream-export");
        if let Err(error) = write_temp(&path, content) {
            return job_error(error.to_string(), None);
        }
        temp_file = Some(path.clone());
        path.to_string_lossy().to_string()
    } else {
        return job_error("Pandoc export requires inputPath or content", None);
    };

    let mut command = Command::new(binary.path);
    command
        .arg("-f")
        .arg(format_arg(&options.from))
        .arg("-t")
        .arg(format_arg(&options.to))
        .arg(input)
        .arg("-o")
        .arg(&options.output_path);

    if options.standalone.unwrap_or(true) {
        command.arg("--standalone");
    }

    let output = command.output();
    if let Some(path) = temp_file {
        let _ = fs::remove_file(path);
    }

    match output {
        Ok(output) if output.status.success() => PandocJobResult {
            ok: true,
            output_path: Some(options.output_path),
            content: None,
            format: Some(format!("{:?}", options.to).to_lowercase()),
            error: None,
            stderr: None,
        },
        Ok(output) => job_error(
            "Pandoc export failed",
            Some(String::from_utf8_lossy(&output.stderr).to_string()),
        ),
        Err(error) => job_error(error.to_string(), None),
    }
}

pub fn pandoc_import_impl(options: PandocImportOptions) -> PandocJobResult {
    pandoc_import_with_resources(options, None)
}

pub fn pandoc_import_with_resources(
    options: PandocImportOptions,
    resource_dir: Option<PathBuf>,
) -> PandocJobResult {
    let binary = match resolve_pandoc(options.pandoc_path.as_deref(), resource_dir.as_deref()) {
        Ok(binary) => binary,
        Err(error) => return job_error(error, None),
    };

    let output = Command::new(binary.path)
        .arg("-f")
        .arg(format_arg(&options.from))
        .arg("-t")
        .arg("markdown")
        .arg(&options.input_path)
        .output();

    match output {
        Ok(output) if output.status.success() => PandocJobResult {
            ok: true,
            output_path: None,
            content: Some(String::from_utf8_lossy(&output.stdout).to_string()),
            format: Some("markdown".to_string()),
            error: None,
            stderr: None,
        },
        Ok(output) => job_error(
            "Pandoc import failed",
            Some(String::from_utf8_lossy(&output.stderr).to_string()),
        ),
        Err(error) => job_error(error.to_string(), None),
    }
}

struct PandocBinary {
    path: PathBuf,
    source: String,
}

fn resolve_pandoc(
    path: Option<&str>,
    resource_dir: Option<&Path>,
) -> Result<PandocBinary, String> {
    if let Some(path) = path.filter(|value| !value.trim().is_empty()) {
        if let Some(path) = normalize_pandoc_path(PathBuf::from(path)) {
            return Ok(PandocBinary {
                path,
                source: "configured".to_string(),
            });
        }
        return Err("Configured Pandoc path was not found".to_string());
    }

    for candidate in bundled_pandoc_candidates(resource_dir) {
        if let Some(path) = normalize_pandoc_path(candidate) {
            return Ok(PandocBinary {
                path,
                source: "bundled".to_string(),
            });
        }
    }

    let exe = if cfg!(windows) { "pandoc.exe" } else { "pandoc" };
    let path_var = env::var_os("PATH")
        .ok_or_else(|| "Pandoc was not found in bundled resources or PATH".to_string())?;
    for directory in env::split_paths(&path_var) {
        let candidate = directory.join(exe);
        if let Some(path) = normalize_pandoc_path(candidate) {
            return Ok(PandocBinary {
                path,
                source: "system".to_string(),
            });
        }
    }
    Err("Pandoc was not found in bundled resources or PATH".to_string())
}

fn normalize_pandoc_path(candidate: PathBuf) -> Option<PathBuf> {
    if candidate.is_file() {
        return Some(candidate);
    }

    if candidate.is_dir() {
        let exe = if cfg!(windows) { "pandoc.exe" } else { "pandoc" };
        let nested = candidate.join(exe);
        if nested.is_file() {
            return Some(nested);
        }
    }

    None
}

fn bundled_pandoc_candidates(resource_dir: Option<&Path>) -> Vec<PathBuf> {
    let exe = if cfg!(windows) { "pandoc.exe" } else { "pandoc" };
    let mut candidates = Vec::new();

    if let Some(resource_dir) = resource_dir {
        candidates.push(resource_dir.join("pandoc").join(exe));
        candidates.push(resource_dir.join("resources").join("pandoc").join(exe));
    }

    let manifest_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    candidates.push(manifest_dir.join("resources").join("pandoc").join(exe));
    candidates
}

fn format_arg(format: &PandocFormat) -> &'static str {
    match format {
        PandocFormat::Markdown => "markdown",
        PandocFormat::Html => "html",
        PandocFormat::Pdf => "pdf",
        PandocFormat::Docx => "docx",
        PandocFormat::Rtf => "rtf",
        PandocFormat::Epub => "epub",
        PandocFormat::Latex => "latex",
        PandocFormat::Typst => "typst",
    }
}

fn temp_markdown_path(prefix: &str) -> PathBuf {
    env::temp_dir().join(format!(
        "{prefix}-{}-{}.md",
        std::process::id(),
        chrono_like_timestamp()
    ))
}

fn chrono_like_timestamp() -> u128 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|duration| duration.as_millis())
        .unwrap_or(0)
}

fn write_temp(path: &Path, content: &str) -> std::io::Result<()> {
    let mut file = fs::File::create(path)?;
    file.write_all(content.as_bytes())
}

fn job_error(message: impl Into<String>, stderr: Option<String>) -> PandocJobResult {
    PandocJobResult {
        ok: false,
        output_path: None,
        content: None,
        format: None,
        error: Some(message.into()),
        stderr,
    }
}

#[cfg(not(test))]
#[tauri::command]
pub fn pandoc_probe(app: tauri::AppHandle, path: Option<String>) -> PandocProbeResult {
    pandoc_probe_with_resources(path, app.path().resource_dir().ok())
}

#[cfg(not(test))]
#[tauri::command]
pub fn pandoc_export(app: tauri::AppHandle, options: PandocExportOptions) -> PandocJobResult {
    pandoc_export_with_resources(options, app.path().resource_dir().ok())
}

#[cfg(not(test))]
#[tauri::command]
pub fn pandoc_import(app: tauri::AppHandle, options: PandocImportOptions) -> PandocJobResult {
    pandoc_import_with_resources(options, app.path().resource_dir().ok())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn probe_reports_missing_explicit_path() {
        let result = pandoc_probe_impl(Some("Z:/missing/pandoc.exe".to_string()));

        assert!(!result.ok);
        assert!(result.error.unwrap().contains("Pandoc"));
    }

    #[test]
    fn resolve_prefers_bundled_pandoc_when_unconfigured() {
        let root = unique_temp_dir("inkstream-pandoc-test");
        let pandoc_dir = root.join("pandoc");
        fs::create_dir_all(&pandoc_dir).unwrap();
        let exe = if cfg!(windows) { "pandoc.exe" } else { "pandoc" };
        fs::write(pandoc_dir.join(exe), "stub").unwrap();

        let result = resolve_pandoc(None, Some(&root)).unwrap();

        assert_eq!(result.source, "bundled");
        assert_eq!(result.path, pandoc_dir.join(exe));

        let _ = fs::remove_dir_all(root);
    }

    #[test]
    fn format_args_match_pandoc_names() {
        assert_eq!(format_arg(&PandocFormat::Docx), "docx");
        assert_eq!(format_arg(&PandocFormat::Markdown), "markdown");
        assert_eq!(format_arg(&PandocFormat::Typst), "typst");
    }

    fn unique_temp_dir(prefix: &str) -> PathBuf {
        env::temp_dir().join(format!(
            "{prefix}-{}-{}",
            std::process::id(),
            chrono_like_timestamp()
        ))
    }
}
