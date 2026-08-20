use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct CustomerPayment {
    pub id: i64,
    pub customer_id: i64,
    pub amount: f64,
    pub payment_method: String,
    pub note: Option<String>,
    pub date: String,
    pub transaction_type: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateCustomerPaymentDto {
    pub customer_id: i64,
    pub amount: f64,
    pub payment_method: String,
    pub note: Option<String>,
}
