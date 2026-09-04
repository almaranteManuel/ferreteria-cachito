// Los handlers expuestos a la interfaz IPC de Tauri (invoke), ultra delgados.

use crate::models::product::{CreateProductDto, Product, UpdateProductDto};
use crate::services::product_service::ProductService;
use sqlx::SqlitePool;
use tauri::State;

#[tauri::command]
pub async fn get_product_by_id(
    pool: State<'_, SqlitePool>,
    id: i64,
) -> Result<Product, String> {
    ProductService::get_product_by_id(pool.inner(), id).await
}

#[tauri::command]
pub async fn search_products(
    pool: State<'_, SqlitePool>,
    query: String,
) -> Result<Vec<Product>, String> {
    ProductService::search_products(pool.inner(), &query).await
}

#[tauri::command]
pub async fn count_products(pool: State<'_, SqlitePool>) -> Result<i64, String> {
    ProductService::count_products(pool.inner()).await
}

#[tauri::command]
pub async fn create_product(
    pool: State<'_, SqlitePool>,
    dto: CreateProductDto,
) -> Result<Product, String> {
    ProductService::create_product(pool.inner(), dto).await
}

#[tauri::command]
pub async fn update_product(
    pool: State<'_, SqlitePool>,
    dto: UpdateProductDto,
) -> Result<Product, String> {
    ProductService::update_product(pool.inner(), dto).await
}

#[tauri::command]
pub async fn delete_product(
    pool: State<'_, SqlitePool>,
    id: i64,
) -> Result<(), String> {
    ProductService::delete_product(pool.inner(), id).await
}