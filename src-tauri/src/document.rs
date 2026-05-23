use serde::Serialize;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum DocumentLanguage {
    Markdown,
    Latex,
    Typst,
    Richtext,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum FencedBlockKind {
    Math,
    Typst,
    Latex,
    Code,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum DiagnosticSeverity {
    Warning,
    Error,
}

#[derive(Debug, Clone, PartialEq, Eq, Default, Serialize)]
pub struct BlockMeta {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub numbered: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub label: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct Diagnostic {
    pub severity: DiagnosticSeverity,
    pub message: String,
    pub from: usize,
    pub to: usize,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct Frontmatter {
    pub raw: String,
    pub from: usize,
    pub to: usize,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct FencedBlock {
    pub id: String,
    pub kind: FencedBlockKind,
    pub language: String,
    pub from: usize,
    pub to: usize,
    pub content_from: usize,
    pub content_to: usize,
    pub meta: BlockMeta,
    pub content: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct DocumentStructure {
    pub language: DocumentLanguage,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub frontmatter: Option<Frontmatter>,
    pub blocks: Vec<FencedBlock>,
    pub diagnostics: Vec<Diagnostic>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct FrontmatterLanguageResult {
    pub language: DocumentLanguage,
    pub diagnostics: Vec<Diagnostic>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct LatexExportStub {
    pub status: String,
    pub block_id: String,
    pub message: String,
}

pub fn parse_document_structure_impl(content: &str) -> DocumentStructure {
    let (frontmatter, language, mut diagnostics) = parse_frontmatter(content);
    let mut blocks = Vec::new();
    parse_fenced_blocks(content, &mut blocks, &mut diagnostics);

    DocumentStructure {
        language,
        frontmatter,
        blocks,
        diagnostics,
    }
}

pub fn validate_frontmatter_language_impl(content: &str) -> FrontmatterLanguageResult {
    let (_, language, diagnostics) = parse_frontmatter(content);
    FrontmatterLanguageResult {
        language,
        diagnostics,
    }
}

pub fn export_latex_fragment_stub_impl(block_id: String) -> LatexExportStub {
    LatexExportStub {
        status: "not_implemented".to_string(),
        block_id,
        message: "LaTeX PDF export via tectonic is deferred to v2; Phase 3 only exposes a structured stub.".to_string(),
    }
}

fn parse_frontmatter(content: &str) -> (Option<Frontmatter>, DocumentLanguage, Vec<Diagnostic>) {
    let mut diagnostics = Vec::new();
    if !content.starts_with("---") {
        return (None, DocumentLanguage::Markdown, diagnostics);
    }

    let first_line_end = line_end(content, 0);
    if first_line_end != 3 {
        return (None, DocumentLanguage::Markdown, diagnostics);
    }

    let mut cursor = line_next(content, first_line_end);
    while cursor < content.len() {
        let end = line_end(content, cursor);
        if content[cursor..end].trim() == "---" {
            let frontmatter_to = line_next(content, end);
            let raw = content[..frontmatter_to].to_string();
            let language = parse_language_from_yaml(
                &content[line_next(content, first_line_end)..cursor],
                &mut diagnostics,
                0,
            );
            return (
                Some(Frontmatter {
                    raw,
                    from: 0,
                    to: frontmatter_to,
                }),
                language,
                diagnostics,
            );
        }
        cursor = line_next(content, end);
    }

    diagnostics.push(Diagnostic {
        severity: DiagnosticSeverity::Error,
        message: "YAML frontmatter is missing a closing delimiter".to_string(),
        from: 0,
        to: content.len().min(3),
    });
    (None, DocumentLanguage::Markdown, diagnostics)
}

fn parse_language_from_yaml(
    yaml: &str,
    diagnostics: &mut Vec<Diagnostic>,
    offset: usize,
) -> DocumentLanguage {
    let mut language = DocumentLanguage::Markdown;
    let mut cursor = offset;

    for line in yaml.split_inclusive('\n') {
        let visible = line.trim_end_matches(['\r', '\n']);
        let trimmed = visible.trim();

        if let Some(value) = trimmed.strip_prefix("language:") {
            let raw_value = value.trim().trim_matches(['"', '\'']);
            match raw_value {
                "" | "markdown" => language = DocumentLanguage::Markdown,
                "latex" => language = DocumentLanguage::Latex,
                "typst" => language = DocumentLanguage::Typst,
                "richtext" => language = DocumentLanguage::Richtext,
                other => diagnostics.push(Diagnostic {
                    severity: DiagnosticSeverity::Error,
                    message: format!("Unsupported document language '{other}'"),
                    from: cursor,
                    to: cursor + visible.len(),
                }),
            }
        }

        cursor += line.len();
    }

    language
}

fn parse_fenced_blocks(
    content: &str,
    blocks: &mut Vec<FencedBlock>,
    diagnostics: &mut Vec<Diagnostic>,
) {
    let mut cursor = 0;
    while cursor < content.len() {
        let line_start = cursor;
        let line_end_pos = line_end(content, line_start);
        let line = &content[line_start..line_end_pos];
        let trimmed_start = line.trim_start();
        let indent = line.len() - trimmed_start.len();

        if !trimmed_start.starts_with("```") {
            cursor = line_next(content, line_end_pos);
            continue;
        }

        let fence_start = line_start + indent;
        let info = trimmed_start[3..].trim();
        let content_from = line_next(content, line_end_pos);
        let mut search = content_from;
        let mut closing_end = content.len();
        let mut content_to = content.len();
        let mut found = false;

        while search < content.len() {
            let candidate_end = line_end(content, search);
            let candidate = &content[search..candidate_end];
            if candidate.trim_start().starts_with("```") {
                content_to = search.saturating_sub(line_break_len_before(content, search));
                closing_end = line_next(content, candidate_end);
                found = true;
                break;
            }
            search = line_next(content, candidate_end);
        }

        if !found {
            diagnostics.push(Diagnostic {
                severity: DiagnosticSeverity::Error,
                message: "Fenced block is missing a closing delimiter".to_string(),
                from: fence_start,
                to: content.len(),
            });
        }

        let (language, meta) = parse_info_string(info, diagnostics, fence_start);
        let kind = match language.as_str() {
            "math" => FencedBlockKind::Math,
            "typst" => FencedBlockKind::Typst,
            "latex" => FencedBlockKind::Latex,
            _ => FencedBlockKind::Code,
        };
        let block_content = content[content_from..content_to].to_string();
        let id = stable_block_id(kind, fence_start, &block_content);

        blocks.push(FencedBlock {
            id,
            kind,
            language,
            from: fence_start,
            to: closing_end,
            content_from,
            content_to,
            meta,
            content: block_content,
        });

        cursor = closing_end.max(line_next(content, line_end_pos));
    }
}

fn parse_info_string(
    info: &str,
    diagnostics: &mut Vec<Diagnostic>,
    offset: usize,
) -> (String, BlockMeta) {
    let mut parts = info.splitn(2, char::is_whitespace);
    let language = parts.next().unwrap_or("").trim().to_lowercase();
    let raw_meta = parts.next().unwrap_or("").trim();
    let mut meta = BlockMeta::default();

    if raw_meta.is_empty() {
        return (language, meta);
    }

    let yaml = raw_meta
        .strip_prefix('{')
        .and_then(|value| value.strip_suffix('}'))
        .unwrap_or(raw_meta);

    for item in yaml.split(',') {
        let trimmed = item.trim();
        if trimmed.is_empty() {
            continue;
        }

        let Some((key, value)) = trimmed.split_once(':') else {
            diagnostics.push(Diagnostic {
                severity: DiagnosticSeverity::Error,
                message: "Block meta entries must use key: value syntax".to_string(),
                from: offset,
                to: offset + info.len(),
            });
            continue;
        };

        let key = key.trim();
        let value = value.trim().trim_matches(['"', '\'']);
        match key {
            "numbered" => match value {
                "true" => meta.numbered = Some(true),
                "false" => meta.numbered = Some(false),
                _ => diagnostics.push(Diagnostic {
                    severity: DiagnosticSeverity::Error,
                    message: "Block meta 'numbered' must be true or false".to_string(),
                    from: offset,
                    to: offset + info.len(),
                }),
            },
            "label" => meta.label = Some(value.to_string()),
            _ => diagnostics.push(Diagnostic {
                severity: DiagnosticSeverity::Warning,
                message: format!("Unknown block meta key '{key}'"),
                from: offset,
                to: offset + info.len(),
            }),
        }
    }

    (language, meta)
}

fn stable_block_id(kind: FencedBlockKind, from: usize, content: &str) -> String {
    format!("{kind:?}-{from}-{:08x}", fnv1a(content.as_bytes())).to_lowercase()
}

fn fnv1a(bytes: &[u8]) -> u32 {
    let mut hash = 0x811c9dc5_u32;
    for byte in bytes {
        hash ^= u32::from(*byte);
        hash = hash.wrapping_mul(0x01000193);
    }
    hash
}

fn line_end(content: &str, from: usize) -> usize {
    content[from..]
        .find('\n')
        .map(|index| from + index)
        .unwrap_or(content.len())
}

fn line_next(content: &str, line_end_pos: usize) -> usize {
    if line_end_pos < content.len() && content.as_bytes()[line_end_pos] == b'\n' {
        line_end_pos + 1
    } else {
        line_end_pos
    }
}

fn line_break_len_before(content: &str, pos: usize) -> usize {
    if pos >= 2 && &content[pos - 2..pos] == "\r\n" {
        2
    } else if pos >= 1 && &content[pos - 1..pos] == "\n" {
        1
    } else {
        0
    }
}

#[cfg(not(test))]
#[tauri::command]
pub fn parse_document_structure(content: String) -> DocumentStructure {
    parse_document_structure_impl(&content)
}

#[cfg(not(test))]
#[tauri::command]
pub fn validate_frontmatter_language(content: String) -> FrontmatterLanguageResult {
    validate_frontmatter_language_impl(&content)
}

#[cfg(not(test))]
#[tauri::command]
pub fn export_latex_fragment_stub(block_id: String) -> LatexExportStub {
    export_latex_fragment_stub_impl(block_id)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn frontmatter_language_defaults_to_markdown() {
        let result = validate_frontmatter_language_impl("# Title");

        assert_eq!(result.language, DocumentLanguage::Markdown);
        assert!(result.diagnostics.is_empty());
    }

    #[test]
    fn frontmatter_language_accepts_supported_values() {
        for (raw, expected) in [
            ("markdown", DocumentLanguage::Markdown),
            ("latex", DocumentLanguage::Latex),
            ("typst", DocumentLanguage::Typst),
            ("richtext", DocumentLanguage::Richtext),
        ] {
            let content = format!("---\nlanguage: {raw}\n---\nBody");

            let result = validate_frontmatter_language_impl(&content);

            assert_eq!(result.language, expected);
            assert!(result.diagnostics.is_empty());
        }
    }

    #[test]
    fn frontmatter_language_reports_invalid_values() {
        let result = validate_frontmatter_language_impl("---\nlanguage: docx\n---\nBody");

        assert_eq!(result.language, DocumentLanguage::Markdown);
        assert_eq!(result.diagnostics.len(), 1);
        assert_eq!(result.diagnostics[0].severity, DiagnosticSeverity::Error);
    }

    #[test]
    fn document_structure_indexes_fenced_block_ranges_and_meta() {
        let content = "---\nlanguage: typst\n---\n\n```math {numbered: true, label: eq-one}\na^2+b^2=c^2\n```\n";

        let result = parse_document_structure_impl(content);

        assert_eq!(result.language, DocumentLanguage::Typst);
        assert!(result.frontmatter.is_some());
        assert_eq!(result.blocks.len(), 1);
        let block = &result.blocks[0];
        assert_eq!(block.kind, FencedBlockKind::Math);
        assert_eq!(block.language, "math");
        assert_eq!(block.content, "a^2+b^2=c^2");
        assert_eq!(block.meta.numbered, Some(true));
        assert_eq!(block.meta.label.as_deref(), Some("eq-one"));
        assert_eq!(
            &content[block.from..block.to],
            "```math {numbered: true, label: eq-one}\na^2+b^2=c^2\n```\n"
        );
        assert_eq!(
            &content[block.content_from..block.content_to],
            "a^2+b^2=c^2"
        );
        assert!(result.diagnostics.is_empty());
    }

    #[test]
    fn block_meta_reports_parse_failures_without_dropping_source() {
        let content = "```latex {numbered: maybe}\n\\begin{equation}x\\end{equation}\n```";

        let result = parse_document_structure_impl(content);

        assert_eq!(result.blocks.len(), 1);
        assert_eq!(result.blocks[0].kind, FencedBlockKind::Latex);
        assert_eq!(
            result.blocks[0].content,
            "\\begin{equation}x\\end{equation}"
        );
        assert_eq!(result.diagnostics.len(), 1);
        assert_eq!(result.diagnostics[0].severity, DiagnosticSeverity::Error);
    }

    #[test]
    fn latex_export_returns_structured_stub() {
        let result = export_latex_fragment_stub_impl("latex-1".to_string());

        assert_eq!(result.status, "not_implemented");
        assert_eq!(result.block_id, "latex-1");
        assert!(result.message.contains("tectonic"));
    }
}
