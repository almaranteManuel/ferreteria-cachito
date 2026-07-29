use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Sale {
    pub id: i64,
    pub date: String,
    pub total_amount: f64,
    pub payment_method: String, // 'EFECTIVO', 'TRANSFERENCIA', 'DEBITO', 'CREDITO', 'CUENTA_CORRIENTE'
    pub customer_id: Option<i64>,
    
    // Datos de Facturación (Monotributo / ARCA)
    pub is_facturada: bool,
    pub invoice_type: Option<String>,   // 'B', 'C', 'REMITO'
    pub invoice_number: Option<String>, // Ej: 0001-00000123
    pub cae: Option<String>,            // Código de Autorización Electrónico de AFIP/ARCA
    pub cae_expiration: Option<String>,

    pub created_at: String,
    pub updated_at: String,
}