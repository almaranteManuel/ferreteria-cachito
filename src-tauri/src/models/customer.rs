use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Customer {
    pub id: i64,
    pub name: String,
    pub doc_type: Option<String>,
    pub doc_number: Option<String>,
    pub phone: Option<String>,
    pub address: Option<String>,
    pub current_balance: f64,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateCustomerDto {
    pub name: String,
    pub doc_type: Option<String>,
    pub doc_number: Option<String>,
    pub phone: Option<String>,
    pub address: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateCustomerDto {
    pub id: i64,
    pub name: String,
    pub doc_type: Option<String>,
    pub doc_number: Option<String>,
    pub phone: Option<String>,
    pub address: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct AddCustomerDebtDto {
    pub customer_id: i64,
    pub amount: f64,
    pub note: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct CustomerWithPayments {
    #[serde(flatten)]
    pub customer: Customer,
    pub payments: Vec<super::customer_payment::CustomerPayment>,
}
