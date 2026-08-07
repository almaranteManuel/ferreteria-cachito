use crate::models::category::{Category, CreateCategoryDto, UpdateCategoryDto};
use crate::services::category_service::CategoryService;
use sqlx::SqlitePool;
use tauri::State;

#[tauri::command]
pub async fn get_category_by_id(
    pool: State<'_, SqlitePool>,
    id: i64,
) -> Result<Category, String> {
    CategoryService::get_category_by_id(pool.inner(), id).await
}

#[tauri::command]
pub async fn create_category(
    pool: State<'_, SqlitePool>,
    dto: CreateCategoryDto,
) -> Result<Category, String> {
    CategoryService::create_category(pool.inner(), dto).await
}

#[tauri::command]
pub async fn update_category(
    pool: State<'_, SqlitePool>,
    dto: UpdateCategoryDto,
) -> Result<Category, String> {
    CategoryService::update_category(pool.inner(), dto).await
}

#[tauri::command]
pub async fn delete_category(
    pool: State<'_, SqlitePool>,
    id: i64,
) -> Result<(), String> {
    CategoryService::delete_category(pool.inner(), id).await
}