mod document;
mod files;
mod pandoc;

#[cfg(not(test))]
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            document::parse_document_structure,
            document::validate_frontmatter_language,
            document::export_latex_fragment_stub,
            files::read_text_document,
            files::write_text_document,
            pandoc::pandoc_probe,
            pandoc::pandoc_export,
            pandoc::pandoc_import
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
pub fn run() {}
