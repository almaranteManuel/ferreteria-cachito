use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Purchase {
    pub id: i64,
    pub date: String,
    pub total_amount: f64,
    pub supplier_id: i64,
    pub invoice_number: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

// DTO para la creación de una nueva compra
#[derive(Debug, Deserialize)]
pub struct CreatePurchaseDto {
    pub date: String,
    pub total_amount: f64,
    pub supplier_id: i64,
    pub invoice_number: Option<String>,
}

/// DTO para la actualización de una compra existente
#[derive(Debug, Deserialize)]
pub struct UpdatePurchaseDto {
    pub id: i64,
    pub date: String,
    pub total_amount: f64,
    pub supplier_id: i64,
    pub invoice_number: Option<String>,
}