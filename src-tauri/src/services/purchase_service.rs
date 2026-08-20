use crate::models::purchase::{Purchase, CreatePurchaseDto, UpdatePurchaseDto};
use crate::repositories::purchase_repo::PurchaseRepository;
use sqlx::SqlitePool;

pub struct PurchaseService;

impl PurchaseService {
    pub async fn get_purchase_by_id(pool: &SqlitePool, id: i64) -> Result<Purchase, String> {
        match PurchaseRepository::find_by_id(pool, id).await {
            Ok(Some(purchase)) => Ok(purchase),
            Ok(None) => Err(format!("Compra con ID {} no encontrada", id)),
            Err(e) => Err(format!("Error al obtener la compra: {}", e)),
        }
    }

    pub async fn create_purchase(pool: &SqlitePool, dto: CreatePurchaseDto) -> Result<Purchase, String> {
        match PurchaseRepository::create(pool, &dto).await {
            Ok(id) => {
                // Obtener la compra recién creada
                match PurchaseRepository::find_by_id(pool, id).await {
                    Ok(Some(purchase)) => Ok(purchase),
                    Ok(None) => Err("Compra creada pero no encontrada".to_string()),
                    Err(e) => Err(format!("Error al obtener la compra creada: {}", e)),
                }
            }
            Err(e) => Err(format!("Error al crear la compra: {}", e)),
        }
    }

    pub async fn update_purchase(pool: &SqlitePool, dto: UpdatePurchaseDto) -> Result<Purchase, String> {
        match PurchaseRepository::update(pool, &dto).await {
            Ok(_) => {
                // Obtener la compra actualizada
                match PurchaseRepository::find_by_id(pool, dto.id).await {
                    Ok(Some(purchase)) => Ok(purchase),
                    Ok(None) => Err("Compra actualizada pero no encontrada".to_string()),
                    Err(e) => Err(format!("Error al obtener la compra actualizada: {}", e)),
                }
            }
            Err(e) => Err(format!("Error al actualizar la compra: {}", e)),
        }
    }

    pub async fn delete_purchase(pool: &SqlitePool, id: i64) -> Result<(), String> {
        match PurchaseRepository::delete(pool, id).await {
            Ok(_) => Ok(()),
            Err(e) => Err(format!("Error al eliminar la compra: {}", e)),
        }
    }
}