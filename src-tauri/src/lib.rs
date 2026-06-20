use std::process::{Child, Command};
use std::sync::Mutex;
use tauri::Manager;

struct ServerProcess(Mutex<Option<Child>>);

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            // In dev mode the Express server is already started by beforeDevCommand ("npm run dev").
            // In production we spawn it ourselves so the app is self-contained.
            #[cfg(not(debug_assertions))]
            {
                let user_data = app
                    .path()
                    .app_data_dir()
                    .unwrap_or_else(|_| std::path::PathBuf::from("."));
                std::fs::create_dir_all(&user_data).ok();

                // In a packaged build, server/ is copied next to the binary via tauri.conf.json resources
                let server_script = app
                    .path()
                    .resource_dir()
                    .unwrap_or_else(|_| std::path::PathBuf::from("."))
                    .join("server")
                    .join("index.js");

                let child = Command::new("node")
                    .arg(&server_script)
                    .env("DATA_DIR", user_data.to_str().unwrap_or("."))
                    .env("SERVER_PORT", "3001")
                    .spawn()
                    .expect("Failed to start Troubadour server. Is Node.js installed?");

                app.manage(ServerProcess(Mutex::new(Some(child))));

                // Give the server a moment to initialise before the window opens
                std::thread::sleep(std::time::Duration::from_millis(2000));
            }

            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building the Tauri application")
        .run(|app, event| {
            if let tauri::RunEvent::Exit = event {
                // Kill the Express server cleanly when the app quits
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
