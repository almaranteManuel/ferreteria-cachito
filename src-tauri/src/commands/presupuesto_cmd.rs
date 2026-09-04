use crate::models::presupuesto::{CreatePresupuestoDto, Presupuesto, PresupuestoWithItems};
use crate::services::presupuesto_service::PresupuestoService;
use sqlx::SqlitePool;
use tauri::State;

#[tauri::command]
pub async fn crear_presupuesto(
    pool: State<'_, SqlitePool>,
    dto: CreatePresupuestoDto,
) -> Result<PresupuestoWithItems, String> {
    PresupuestoService::crear(pool.inner(), dto).await
}

#[tauri::command]
pub async fn listar_presupuestos(
    pool: State<'_, SqlitePool>,
    limit: Option<i64>,
) -> Result<Vec<Presupuesto>, String> {
    PresupuestoService::listar(pool.inner(), limit.unwrap_or(50)).await
}

#[tauri::command]
pub async fn get_presupuesto(
    pool: State<'_, SqlitePool>,
    id: i64,
) -> Result<PresupuestoWithItems, String> {
    PresupuestoService::obtener(pool.inner(), id).await
}

#[tauri::command]
pub async fn eliminar_presupuesto(
    pool: State<'_, SqlitePool>,
    id: i64,
) -> Result<(), String> {
    PresupuestoService::eliminar(pool.inner(), id).await
}
