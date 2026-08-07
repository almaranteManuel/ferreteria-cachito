use crate::models::category::{Category, CreateCategoryDto, UpdateCategoryDto};
use crate::repositories::category_repo::CategoryRepository;
use sqlx::SqlitePool;

pub struct CategoryService;

impl CategoryService {
    pub async fn get_category_by_id(pool: &SqlitePool, id: i64) -> Result<Category, String> {
        match CategoryRepository::find_by_id(pool, id).await {
            Ok(Some(category)) => Ok(category),
            Ok(None) => Err(format!("Categoría con ID {} no encontrada", id)),
            Err(e) => Err(format!("Error al obtener la categoría: {}", e)),
        }
    }

    pub async fn create_category(pool: &SqlitePool, dto: CreateCategoryDto) -> Result<Category, String> {
        match CategoryRepository::create(pool, &dto).await {
            Ok(id) => {
                // Obtener la categoría recién creada
                match CategoryRepository::find_by_id(pool, id).await {
                    Ok(Some(category)) => Ok(category),
                    Ok(None) => Err("Categoría creada pero no encontrada".to_string()),
                    Err(e) => Err(format!("Error al obtener la categoría creada: {}", e)),
                }
            }
            Err(e) => Err(format!("Error al crear la categoría: {}", e)),
        }
    }

    pub async fn update_category(pool: &SqlitePool, dto: UpdateCategoryDto) -> Result<Category, String> {
        match CategoryRepository::update(pool, &dto).await {
            Ok(_) => {
                // Obtener la categoría actualizada
                match CategoryRepository::find_by_id(pool, dto.id).await {
                    Ok(Some(category)) => Ok(category),
                    Ok(None) => Err("Categoría actualizada pero no encontrada".to_string()),
                    Err(e) => Err(format!("Error al obtener la categoría actualizada: {}", e)),
                }
            }
            Err(e) => Err(format!("Error al actualizar la categoría: {}", e)),
        }
    }

    pub async fn delete_category(pool: &SqlitePool, id: i64) -> Result<(), String> {
        match CategoryRepository::delete(pool, id).await {
            Ok(_) => Ok(()),
            Err(e) => Err(format!("Error al eliminar la categoría: {}", e)),
        }
    }
}