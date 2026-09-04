use crate::models::sale::{
    CreateDailySaleDto, CreateDetailedSaleDto, Sale, SaleWithItems,
};
use crate::services::sale_service::SaleService;
use sqlx::SqlitePool;
use tauri::State;

#[tauri::command]
pub async fn get_sale_by_id(
    pool: State<'_, SqlitePool>,
    id: i64,
) -> Result<SaleWithItems, String> {
    SaleService::get_sale_by_id(pool.inner(), id).await
}

#[tauri::command]
pub async fn list_recent_sales(
    pool: State<'_, SqlitePool>,
    limit: Option<i64>,
) -> Result<Vec<Sale>, String> {
    SaleService::list_recent_sales(pool.inner(), limit.unwrap_or(50)).await
}

#[tauri::command]
pub async fn list_sales_by_date_range(
    pool: State<'_, SqlitePool>,
    start: String,
    end: String,
) -> Result<Vec<Sale>, String> {
    SaleService::list_sales_by_date_range(pool.inner(), &start, &end).await
}

#[tauri::command]
pub async fn create_daily_sale(
    pool: State<'_, SqlitePool>,
    dto: CreateDailySaleDto,
) -> Result<Sale, String> {
    SaleService::create_daily_sale(pool.inner(), dto).await
}

#[tauri::command]
pub async fn create_detailed_sale(
    pool: State<'_, SqlitePool>,
    dto: CreateDetailedSaleDto,
) -> Result<SaleWithItems, String> {
    SaleService::create_detailed_sale(pool.inner(), dto).await
}

#[tauri::command]
pub async fn delete_sale(
    pool: State<'_, SqlitePool>,
    id: i64,
) -> Result<(), String> {
    SaleService::delete_sale(pool.inner(), id).await
}

#[tauri::command]
pub async fn calc_product_sale_price(
    pool: State<'_, SqlitePool>,
    product_id: i64,
) -> Result<f64, String> {
    use crate::models::sale::calc_sale_price;
    use crate::repositories::product_repo::ProductRepository;

    let product = ProductRepository::find_by_id(pool.inner(), product_id)
        .await
        .map_err(|e| format!("Error al consultar producto: {}", e))?
        .ok_or_else(|| format!("Producto {} no encontrado", product_id))?;

    Ok(calc_sale_price(product.price, product.variant))
}
