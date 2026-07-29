use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Customer {
    pub id: i64,
    pub name: String,
    pub doc_type: Option<String>, // 'DNI', 'CUIT'
    pub doc_number: Option<String>,
    pub phone: Option<String>,
    pub address: Option<String>,
    pub current_balance: f64,     // Saldo en cta cte (Positivo: debe / Negativo: a favor)
    pub created_at: String,
    pub updated_at: String,
}