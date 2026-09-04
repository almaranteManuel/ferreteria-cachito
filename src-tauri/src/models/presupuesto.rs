use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Presupuesto {
    pub id: i64,
    pub fecha: String,
    pub cliente_nombre: Option<String>,
    pub total: f64,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct PresupuestoItem {
    pub id: i64,
    pub presupuesto_id: i64,
    pub descripcion: String,
    pub cantidad: f64,
    pub precio_unitario: f64,
    pub product_id: Option<i64>,
    pub code: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct PresupuestoWithItems {
    #[serde(flatten)]
    pub presupuesto: Presupuesto,
    pub items: Vec<PresupuestoItem>,
}

#[derive(Debug, Deserialize)]
pub struct CreatePresupuestoItemDto {
    pub descripcion: String,
    pub cantidad: f64,
    pub precio_unitario: f64,
    pub product_id: Option<i64>,
    pub code: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreatePresupuestoDto {
    pub fecha: String,
    pub cliente_nombre: Option<String>,
    pub items: Vec<CreatePresupuestoItemDto>,
}
