use crate::models::supplier::{CreateSupplierDto, Supplier, UpdateSupplierDto};
use crate::services::supplier_service::SupplierService;
use sqlx::SqlitePool;
use tauri::State;

#[tauri::command]
pub async fn get_supplier_by_id(
    pool: State<'_, SqlitePool>,
    id: i64,
) -> Result<Supplier, String> {
    SupplierService::get_supplier_by_id(pool.inner(), id).await
}

#[tauri::command]
pub async fn search_suppliers(
    pool: State<'_, SqlitePool>,
    query: String,
) -> Result<Vec<Supplier>, String> {
    SupplierService::search_suppliers(pool.inner(), &query).await
}

#[tauri::command]
pub async fn create_supplier(
    pool: State<'_, SqlitePool>,
    dto: CreateSupplierDto,
) -> Result<Supplier, String> {
    SupplierService::create_supplier(pool.inner(), dto).await
}

#[tauri::command]
pub async fn update_supplier(
    pool: State<'_, SqlitePool>,
    dto: UpdateSupplierDto,
) -> Result<Supplier, String> {
    SupplierService::update_supplier(pool.inner(), dto).await
}

#[tauri::command]
pub async fn delete_supplier(
    pool: State<'_, SqlitePool>,
    id: i64,
) -> Result<(), String> {
    SupplierService::delete_supplier(pool.inner(), id).await
}