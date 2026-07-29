// Inicializador del pool SQLite y ejecución de migraciones

use sqlx::{sqlite::SqliteConnectOptions, SqlitePool};
use std::fs;
use std::str::FromStr;
use tauri::AppHandle;
use tauri::Manager;
use std::path::Path;

pub async fn init_database(app_handle: &AppHandle) -> Result<SqlitePool, Box<dyn std::error::Error>> {
    let app_dir = app_handle
        .path()
        .app_data_dir()
        .expect("No se pudo obtener el directorio app_data");

    if !app_dir.exists() {
        fs::create_dir_all(&app_dir)?;
    }

    let db_path = app_dir.join("Ventas.db");

    // Si la DB no existe en AppData (primera vez que corre la app), copiamos la DB semilla
    if !db_path.exists() {
        // Busca el archivo local en tu proyecto
        let seed_path = Path::new("src/db/Ventas.db"); 
        if seed_path.exists() {
            fs::copy(seed_path, &db_path)?;
            println!("Base de datos inicial copiada con éxito a: {:?}", db_path);
        }
    }

    let db_url = format!("sqlite://{}", db_path.to_str().unwrap());
    
    // Configurar e inicializar pool
    let options = SqliteConnectOptions::from_str(&db_url)?
        .create_if_missing(true)
        .foreign_keys(true);

    let pool = SqlitePool::connect_with(options).await?;

    // Ejecuta migraciones sobre el archivo copiado
    sqlx::migrate!("./migrations")
        .run(&pool)
        .await?;

    println!("Conexión a SQLite y migraciones exitosas.");

    Ok(pool)
}