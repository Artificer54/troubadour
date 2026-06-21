use std::process::{Child, Command};
use std::sync::Mutex;
use tauri::Manager;
use tauri_plugin_updater::UpdaterExt;

struct ServerProcess(Mutex<Option<Child>>);

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            // In dev mode the Express server is already started by `npm run dev`.
            // In production we spawn it using the bundled node.exe — no system Node required.
            #[cfg(not(debug_assertions))]
            {
                let resource_dir = app
                    .path()
                    .resource_dir()
                    .unwrap_or_else(|_| std::path::PathBuf::from("."));

                let user_data = app
                    .path()
                    .app_data_dir()
                    .unwrap_or_else(|_| std::path::PathBuf::from("."));
                std::fs::create_dir_all(&user_data).ok();

                // Bundled node.exe shipped alongside the app
                let node_exe = resource_dir.join("node.exe");
                // ncc-compiled server bundle (all JS deps inlined; native addons in node_modules/ alongside)
                let server_script = resource_dir.join("server-bundle").join("index.js");

                let child = Command::new(&node_exe)
                    .arg(&server_script)
                    .env("DATA_DIR", user_data.to_str().unwrap_or("."))
                    .env("SERVER_PORT", "3001")
                    // Tell Node where to find native addons copied by bundle-server.js
                    .env("NODE_PATH", resource_dir.join("server-bundle").join("node_modules").to_str().unwrap_or(""))
                    .spawn()
                    .expect("Failed to start Troubadour server sidecar");

                app.manage(ServerProcess(Mutex::new(Some(child))));

                // Give Express a moment to boot before the window opens
                std::thread::sleep(std::time::Duration::from_millis(2000));
            }

            // Check for updates in the background (non-blocking)
            #[cfg(not(debug_assertions))]
            {
                let handle = app.handle().clone();
                tauri::async_runtime::spawn(async move {
                    if let Ok(updater) = handle.updater() {
                        if let Ok(Some(update)) = updater.check().await {
                            let dialog = handle.dialog();
                            let should_update = tauri_plugin_dialog::blocking::ask(
                                Some(&handle.get_webview_window("main").unwrap()),
                                "Update Available",
                                format!(
                                    "Troubadour {} is available. Install now?",
                                    update.version
                                ),
                            );
                            if should_update {
                                if let Err(e) = update.download_and_install(|_, _| {}, || {}).await {
                                    eprintln!("Update failed: {e}");
                                }
                            }
                        }
                    }
                });
            }

            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building the Tauri application")
        .run(|app, event| {
            if let tauri::RunEvent::Exit = event {
                #[cfg(not(debug_assertions))]
                if let Some(srv) = app.try_state::<ServerProcess>() {
                    if let Ok(mut guard) = srv.0.lock() {
                        if let Some(mut child) = guard.take() {
                            let _ = child.kill();
                        }
                    }
                }
            }
        });
}
