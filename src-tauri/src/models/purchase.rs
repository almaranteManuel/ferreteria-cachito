use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Purchase {
    pub id: i64,
    pub date: String,
    pub total_amount: f64,
    pub supplier_id: Option<i64>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

// DTO para la creación de una nueva compra
#[derive(Debug, Deserialize)]
pub struct CreatePurchaseDto {
    pub date: String,
    pub total_amount: f64,
    pub supplier_id: Option<i64>,
}

/// DTO para la actualización de una compra existente
#[derive(Debug, Deserialize)]
pub struct UpdatePurchaseDto {
    pub id: i64,
    pub date: String,
    pub total_amount: f64,
    pub supplier_id: Option<i64>,
}