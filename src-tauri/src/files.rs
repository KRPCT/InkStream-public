use serde::Serialize;
use std::fs;

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct ReadTextFileResult {
    pub ok: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub content: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct WriteTextFileResult {
    pub ok: bool,
    pub path: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

pub fn read_text_file_impl(path: &str) -> ReadTextFileResult {
    match fs::read_to_string(path) {
        Ok(content) => ReadTextFileResult {
            ok: true,
            content: Some(content),
            error: None,
        },
        Err(error) => ReadTextFileResult {
            ok: false,
            content: None,
            error: Some(error.to_string()),
        },
    }
}

pub fn write_text_file_impl(path: &str, content: &str) -> WriteTextFileResult {
    match fs::write(path, content) {
        Ok(()) => WriteTextFileResult {
            ok: true,
            path: path.to_string(),
            error: None,
        },
        Err(error) => WriteTextFileResult {
            ok: false,
            path: path.to_string(),
            error: Some(error.to_string()),
        },
    }
}

#[cfg(not(test))]
#[tauri::command]
pub fn read_text_document(path: String) -> ReadTextFileResult {
    read_text_file_impl(&path)
}

#[cfg(not(test))]
#[tauri::command]
pub fn write_text_document(path: String, content: String) -> WriteTextFileResult {
    write_text_file_impl(&path, &content)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::env;

    #[test]
    fn writes_and_reads_text_content() {
        let path = env::temp_dir().join(format!(
            "inkstream-file-{}-{}.md",
            std::process::id(),
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_millis()
        ));

        let write = write_text_file_impl(path.to_str().unwrap(), "# Saved");
        assert!(write.ok);

        let read = read_text_file_impl(path.to_str().unwrap());
        assert!(read.ok);
        assert_eq!(read.content.as_deref(), Some("# Saved"));

        let _ = fs::remove_file(path);
    }

    #[test]
    fn read_reports_missing_file_as_structured_error() {
        let result = read_text_file_impl("Z:/missing/inkstream.md");

        assert!(!result.ok);
        assert!(result.error.is_some());
    }
}
