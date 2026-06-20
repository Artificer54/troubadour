use std::process::{Child, Command};
use std::sync::Mutex;
use tauri::Manager;

struct ServerProcess(Mutex<Option<Child>>);

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|_app| {
            // In dev mode the Express server is already started by `npm run dev`.
            // In production we spawn it using the bundled node.exe — no system Node required.
            #[cfg(not(debug_assertions))]
            {
                let resource_dir = _app
                    .path()
                    .resource_dir()
                    .unwrap_or_else(|_| std::path::PathBuf::from("."));

                let user_data = _app
                    .path()
                    .app_data_dir()
                    .unwrap_or_else(|_| std::path::PathBuf::from("."));
                std::fs::create_dir_all(&user_data).ok();

                // Bundled node.exe shipped alongside the app
                let node_exe = resource_dir.join("node.exe");
                // server/index.js bundled as a resource
                let server_script = resource_dir.join("server").join("index.js");

                let child = Command::new(&node_exe)
                    .arg(&server_script)
                    .env("DATA_DIR", user_data.to_str().unwrap_or("."))
                    .env("SERVER_PORT", "3001")
                    .spawn()
                    .expect("Failed to start Troubadour server sidecar");

                _app.manage(ServerProcess(Mutex::new(Some(child))));

                // Give Express a moment to boot before the window opens
                std::thread::sleep(std::time::Duration::from_millis(2000));
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
