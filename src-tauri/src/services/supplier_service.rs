use crate::models::supplier::{CreateSupplierDto, Supplier, UpdateSupplierDto};
use crate::repositories::supplier_repo::SupplierRepository;
use sqlx::SqlitePool;

pub struct SupplierService;

impl SupplierService {
    pub async fn get_supplier_by_id(pool: &SqlitePool, id: i64) -> Result<Supplier, String> {
        match SupplierRepository::find_by_id(pool, id).await {
            Ok(Some(supplier)) => Ok(supplier),
            Ok(None) => Err(format!("Proveedor con ID {} no encontrado", id)),
            Err(e) => Err(format!("Error al obtener el proveedor: {}", e)),
        }
    }

    pub async fn search_suppliers(pool: &SqlitePool, query: &str) -> Result<Vec<Supplier>, String> {
        match SupplierRepository::search_by_name(pool, query).await {
            Ok(suppliers) => Ok(suppliers),
            Err(e) => Err(format!("Error al buscar proveedores: {}", e)),
        }
    }

    pub async fn create_supplier(pool: &SqlitePool, dto: CreateSupplierDto) -> Result<Supplier, String> {
        match SupplierRepository::create(pool, &dto).await {
            Ok(id) => {
                // Obtener el proveedor recién creado
                match SupplierRepository::find_by_id(pool, id).await {
                    Ok(Some(supplier)) => Ok(supplier),
                    Ok(None) => Err("Proveedor creado pero no encontrado".to_string()),
                    Err(e) => Err(format!("Error al obtener el proveedor creado: {}", e)),
                }
            }
            Err(e) => Err(format!("Error al crear el proveedor: {}", e)),
        }
    }

    pub async fn update_supplier(pool: &SqlitePool, dto: UpdateSupplierDto) -> Result<Supplier, String> {
        match SupplierRepository::update(pool, &dto).await {
            Ok(_) => {
                // Obtener el proveedor actualizado
                match SupplierRepository::find_by_id(pool, dto.id).await {
                    Ok(Some(supplier)) => Ok(supplier),
                    Ok(None) => Err("Proveedor actualizado pero no encontrado".to_string()),
                    Err(e) => Err(format!("Error al obtener el proveedor actualizado: {}", e)),
                }
            }
            Err(e) => Err(format!("Error al actualizar el proveedor: {}", e)),
        }
    }

    pub async fn delete_supplier(pool: &SqlitePool, id: i64) -> Result<(), String> {
        match SupplierRepository::delete(pool, id).await {
            Ok(_) => Ok(()),
            Err(e) => Err(format!("Error al eliminar el proveedor: {}", e)),
        }
    }
}
