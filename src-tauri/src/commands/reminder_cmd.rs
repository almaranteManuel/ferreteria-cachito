use crate::models::reminder::{CreateSupplierDebtDto, ReminderWithSupplier};
use crate::services::reminder_service::ReminderService;
use sqlx::SqlitePool;
use tauri::State;

#[tauri::command]
pub async fn list_supplier_debts(
    pool: State<'_, SqlitePool>,
) -> Result<Vec<ReminderWithSupplier>, String> {
    ReminderService::list_pending_supplier_debts(pool.inner()).await
}

#[tauri::command]
pub async fn create_supplier_debt(
    pool: State<'_, SqlitePool>,
    dto: CreateSupplierDebtDto,
) -> Result<ReminderWithSupplier, String> {
    ReminderService::create_supplier_debt(pool.inner(), dto).await
}

#[tauri::command]
pub async fn mark_supplier_debt_paid(
    pool: State<'_, SqlitePool>,
    id: i64,
) -> Result<(), String> {
    ReminderService::mark_paid(pool.inner(), id).await
}

#[tauri::command]
pub async fn delete_supplier_debt(
    pool: State<'_, SqlitePool>,
    id: i64,
) -> Result<(), String> {
    ReminderService::delete(pool.inner(), id).await
}
