use std::fs;
use std::path::Path;

#[tauri::command]
fn read_markdown(path: String) -> Result<String, String> {
  let path = Path::new(&path);
  if !path.is_file() {
    return Err("The selected path is not a file.".into());
  }
  fs::read_to_string(path).map_err(|e| format!("Could not read file: {e}"))
}

#[tauri::command]
fn write_markdown(path: String, content: String) -> Result<(), String> {
  let path = Path::new(&path);
  if let Some(parent) = path.parent() {
    fs::create_dir_all(parent).map_err(|e| format!("Could not create folder: {e}"))?;
  }
  fs::write(path, content).map_err(|e| format!("Could not save file: {e}"))
}

#[tauri::command]
fn create_markdown(path: String, content: String) -> Result<(), String> {
  let path = Path::new(&path);
  if path.exists() {
    return Err("A file already exists at that location.".into());
  }
  if let Some(parent) = path.parent() {
    fs::create_dir_all(parent).map_err(|e| format!("Could not create folder: {e}"))?;
  }
  fs::write(path, content).map_err(|e| format!("Could not create file: {e}"))
}

#[tauri::command]
fn list_markdown_files(folder: String) -> Result<Vec<String>, String> {
  let mut files = Vec::new();
  let root = Path::new(&folder);
  if !root.is_dir() {
    return Err("The selected path is not a folder.".into());
  }

  fn visit(dir: &Path, files: &mut Vec<String>) -> std::io::Result<()> {
    for entry in fs::read_dir(dir)? {
      let entry = entry?;
      let path = entry.path();
      if path.is_dir() {
        visit(&path, files)?;
      } else if matches!(
        path.extension().and_then(|e| e.to_str()).map(|e| e.to_ascii_lowercase()).as_deref(),
        Some("md") | Some("markdown")
      ) {
        files.push(path.to_string_lossy().into_owned());
      }
    }
    Ok(())
  }

  visit(root, &mut files).map_err(|e| format!("Could not read folder: {e}"))?;
  files.sort_by_key(|p| p.to_lowercase());
  Ok(files)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_fs::init())
    .invoke_handler(tauri::generate_handler![
      read_markdown,
      write_markdown,
      create_markdown,
      list_markdown_files
    ])
    .run(tauri::generate_context!())
    .expect("error while running markdown viewer");
}
