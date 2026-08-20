use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Sale {
    pub id: i64,
    pub date: String,
    pub total_amount: f64,
    pub payment_method: String,
    pub customer_id: Option<i64>,
    pub sale_type: String,
    pub is_facturada: bool,
    pub invoice_type: Option<String>,
    pub invoice_number: Option<String>,
    pub cae: Option<String>,
    pub cae_expiration: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateDailySaleDto {
    pub date: String,
    pub total_amount: f64,
    pub payment_method: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateSaleItemDto {
    pub product_id: i64,
    pub quantity: i64,
    pub unit_price: Option<f64>,
}

#[derive(Debug, Deserialize)]
pub struct CreateDetailedSaleDto {
    pub date: String,
    pub payment_method: String,
    pub customer_id: Option<i64>,
    pub items: Vec<CreateSaleItemDto>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct SaleItemDetail {
    pub id: i64,
    pub sale_id: i64,
    pub product_id: i64,
    pub product_code: String,
    pub product_description: String,
    pub quantity: i64,
    pub unit_price: f64,
    pub total_price: f64,
}

#[derive(Debug, Serialize)]
pub struct SaleWithItems {
    #[serde(flatten)]
    pub sale: Sale,
    pub items: Vec<SaleItemDetail>,
}

pub fn calc_sale_price(base_price: f64, variant: Option<f64>) -> f64 {
    base_price * variant.unwrap_or(1.0)
}
