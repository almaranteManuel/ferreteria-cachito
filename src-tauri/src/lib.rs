pub mod commands;
pub mod db;
pub mod models;
pub mod repositories;
pub mod services;

use db::connection::init_database;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            // Inicialización asíncrona de la DB
            let handle = app.handle().clone();
            
            tauri::async_runtime::block_on(async move {
                let pool = init_database(&handle)
                    .await
                    .expect("Error al inicializar la base de datos");
                
                // Guardar el pool en el estado administrado por Tauri
                handle.manage(pool);
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Product commands
            commands::product_cmd::get_product_by_id,
            commands::product_cmd::search_products,
            commands::product_cmd::create_product,
            commands::product_cmd::update_product,
            commands::product_cmd::delete_product
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
