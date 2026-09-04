use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct GastoPersonal {
    pub id: i64,
    pub fecha: String,
    pub monto: f64,
    pub descripcion: String,
    pub categoria: String,
    pub created_at: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateGastoPersonalDto {
    pub fecha: String,
    pub monto: f64,
    pub descripcion: String,
    pub categoria: String,
}

pub const CATEGORIAS_VALIDAS: &[&str] = &["IMPUESTO", "GASTO_PERSONAL", "OTRO"];
