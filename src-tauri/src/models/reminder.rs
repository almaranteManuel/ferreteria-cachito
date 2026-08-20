use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Reminder {
    pub id: i64,
    pub title: String,
    pub description: Option<String>,
    pub is_completed: bool,
    pub due_date: Option<String>,
    pub amount: Option<f64>,
    pub supplier_id: Option<i64>,
    pub reminder_type: String,
    pub created_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateReminderDto {
    pub title: String,
    pub description: Option<String>,
    pub amount: Option<f64>,
    pub supplier_id: Option<i64>,
    pub reminder_type: String,
    pub due_date: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateSupplierDebtDto {
    pub title: String,
    pub description: Option<String>,
    pub amount: f64,
    pub supplier_id: Option<i64>,
    pub due_date: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct ReminderWithSupplier {
    pub id: i64,
    pub title: String,
    pub description: Option<String>,
    pub is_completed: bool,
    pub due_date: Option<String>,
    pub amount: Option<f64>,
    pub supplier_id: Option<i64>,
    pub supplier_name: Option<String>,
    pub reminder_type: String,
    pub created_at: String,
}
