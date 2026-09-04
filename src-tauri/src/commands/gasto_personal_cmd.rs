use crate::models::gasto_personal::{CreateGastoPersonalDto, GastoPersonal};
use crate::services::gasto_personal_service::GastoPersonalService;
use sqlx::SqlitePool;
use tauri::State;

#[tauri::command]
pub async fn crear_gasto_personal(
    pool: State<'_, SqlitePool>,
    dto: CreateGastoPersonalDto,
) -> Result<GastoPersonal, String> {
    GastoPersonalService::crear(pool.inner(), dto).await
}

#[tauri::command]
pub async fn listar_gastos_personales(
    pool: State<'_, SqlitePool>,
    limit: Option<i64>,
) -> Result<Vec<GastoPersonal>, String> {
    GastoPersonalService::listar(pool.inner(), limit.unwrap_or(50)).await
}

#[tauri::command]
pub async fn eliminar_gasto_personal(pool: State<'_, SqlitePool>, id: i64) -> Result<(), String> {
    GastoPersonalService::eliminar(pool.inner(), id).await
}
