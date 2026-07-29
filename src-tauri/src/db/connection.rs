// Inicializador del pool SQLite y ejecución de migraciones

use sqlx::{sqlite::SqliteConnectOptions, SqlitePool};
use std::fs;
use std::path::PathBuf;
use std::str::FromStr;
use tauri::AppHandle;
use tauri::Manager;

pub async fn init_database(app_handle: &AppHandle) -> Result<SqlitePool, Box<dyn std::error::Error>> {
    // 1. Obtener la ruta estándar para datos de la app del SO
    let app_dir = app_handle
        .path()
        .app_data_dir()
        .expect("No se pudo obtener el directorio app_data");

    // Asegurar que el directorio exista
    if !app_dir.exists() {
        fs::create_dir_all(&app_dir)?;
    }

    // 2. Definir la ruta del archivo SQLite
    let db_path = app_dir.join("ferreteria.db");

    // 3. Configurar la conexión (Crea la DB si no existe y habilita WAL mode para máxima velocidad)
    let db_url = format!("sqlite://{}", db_path.to_str().unwrap());
    let options = SqliteConnectOptions::from_str(&db_url)?
        .create_if_missing(true)
        .foreign_keys(true); // Activa la integridad referencial en SQLite

    // 4. Crear el pool de conexiones
    let pool = SqlitePool::connect_with(options).await?;

    // 5. Correr migraciones automáticas si existen en la carpeta /migrations
    sqlx::migrate!("./migrations")
        .run(&pool)
        .await?;

    Ok(pool)
}