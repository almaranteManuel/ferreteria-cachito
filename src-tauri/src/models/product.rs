use serde::{Deserialize, Serialize};

/// Entidad principal que refleja la tabla `products` en SQLite
#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Product {
    pub id: i64,
    pub code: String,
    pub description: String,
    pub price: f64,
    pub own_price: Option<String>,
    pub variant: Option<f64>,
    pub category_id: Option<i64>,
    pub stock: i64,
    pub created_at: String,
    pub updated_at: String,
}

/// DTO para la creación de un nuevo producto
#[derive(Debug, Deserialize)]
pub struct CreateProductDto {
    pub code: String,
    pub description: String,
    pub price: f64,
    pub own_price: Option<String>,
    pub variant: Option<f64>,
    pub category_id: Option<i64>,
    pub stock: i64,
}

/// DTO para la actualización de un producto existente
#[derive(Debug, Deserialize)]
pub struct UpdateProductDto {
    pub id: i64,
    pub code: String,
    pub description: String,
    pub price: f64,
    pub own_price: Option<String>,
    pub variant: Option<f64>,
    pub category_id: Option<i64>,
    pub stock: i64,
}