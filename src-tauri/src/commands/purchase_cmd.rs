use crate::models::purchase::{Purchase, CreatePurchaseDto, UpdatePurchaseDto};
use crate::services::purchase_service::PurchaseService;
use sqlx::SqlitePool;
use tauri::State;

#[tauri::command]
pub async fn get_purchase_by_id(
    pool: State<'_, SqlitePool>,
    id: i64,
) -> Result<Purchase, String> {
    PurchaseService::get_purchase_by_id(pool.inner(), id).await
}

#[tauri::command]
pub async fn create_purchase(
    pool: State<'_, SqlitePool>,
    dto: CreatePurchaseDto,
) -> Result<Purchase, String> {
    PurchaseService::create_purchase(pool.inner(), dto).await
}

#[tauri::command]
pub async fn update_purchase(
    pool: State<'_, SqlitePool>,
    dto: UpdatePurchaseDto,
) -> Result<Purchase, String> {
    PurchaseService::update_purchase(pool.inner(), dto).await
}

#[tauri::command]
pub async fn delete_purchase(
    pool: State<'_, SqlitePool>,
    id: i64,
) -> Result<(), String> {
    PurchaseService::delete_purchase(pool.inner(), id).await
}

#[tauri::command]
pub async fn list_recent_purchases(
    pool: State<'_, SqlitePool>,
    limit: Option<i64>,
) -> Result<Vec<Purchase>, String> {
    PurchaseService::list_recent_purchases(pool.inner(), limit.unwrap_or(50)).await
}