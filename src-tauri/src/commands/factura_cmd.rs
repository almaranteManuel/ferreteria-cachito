use crate::arca::ArcaState;
use crate::models::factura::{CreateFacturaDto, Factura, FacturaWithItems};
use crate::services::facturacion_service::FacturacionService;
use sqlx::SqlitePool;
use tauri::{AppHandle, State};

#[tauri::command]
pub async fn emitir_factura(
    pool: State<'_, SqlitePool>,
    arca: State<'_, ArcaState>,
    app: AppHandle,
    dto: CreateFacturaDto,
) -> Result<FacturaWithItems, String> {
    FacturacionService::emitir_factura_c(pool.inner(), arca.inner(), &app, dto).await
}

#[tauri::command]
pub async fn listar_facturas(
    pool: State<'_, SqlitePool>,
    limit: Option<i64>,
) -> Result<Vec<Factura>, String> {
    FacturacionService::listar(pool.inner(), limit.unwrap_or(50)).await
}

#[tauri::command]
pub async fn get_factura(
    pool: State<'_, SqlitePool>,
    id: i64,
) -> Result<FacturaWithItems, String> {
    FacturacionService::obtener(pool.inner(), id).await
}
