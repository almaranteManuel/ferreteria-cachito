use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
pub struct Supplier {
    pub id: i64,
    pub name: String,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub address: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

/// DTO para la creación de un nuevo proveedor
#[derive(Debug, Deserialize)]
pub struct CreateSupplierDto {
    pub name: String,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub address: Option<String>,
}

/// DTO para la actualización de un proveedor existente
#[derive(Debug, Deserialize)]
pub struct UpdateSupplierDto {
    pub id: i64,
    pub name: String,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub address: Option<String>,
}