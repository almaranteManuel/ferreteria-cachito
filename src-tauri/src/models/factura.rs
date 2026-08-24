use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Factura {
    pub id: i64,
    pub fecha: String,
    pub tipo: i64,
    pub punto_venta: i64,
    pub numero: i64,
    pub total: f64,
    pub cae: Option<String>,
    pub cae_expiration: Option<String>,
    pub resultado: String,
    pub cliente_nombre: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct FacturaItem {
    pub id: i64,
    pub factura_id: i64,
    pub descripcion: String,
    pub cantidad: f64,
    pub precio_unitario: f64,
    pub product_id: Option<i64>,
}

#[derive(Debug, Serialize)]
pub struct FacturaWithItems {
    #[serde(flatten)]
    pub factura: Factura,
    pub items: Vec<FacturaItem>,
}

#[derive(Debug, Deserialize)]
pub struct CreateFacturaItemDto {
    pub descripcion: String,
    pub cantidad: f64,
    pub precio_unitario: f64,
    pub product_id: Option<i64>,
}

#[derive(Debug, Deserialize)]
pub struct CreateFacturaDto {
    pub items: Vec<CreateFacturaItemDto>,
    pub cliente_nombre: Option<String>,
}
