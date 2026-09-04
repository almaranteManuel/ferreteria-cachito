// Contiene la lógica de negocio, validaciones previas y orquestación.
use crate::models::product::{CreateProductDto, Product, UpdateProductDto};
use crate::repositories::product_repo::ProductRepository;
use sqlx::SqlitePool;

pub struct ProductService;

impl ProductService {
    pub async fn get_product_by_id(pool: &SqlitePool, id: i64) -> Result<Product, String> {
        ProductRepository::find_by_id(pool, id)
            .await
            .map_err(|e| format!("Error en base de datos: {}", e))?
            .ok_or_else(|| format!("Producto con ID {} no encontrado", id))
    }

    pub async fn search_products(pool: &SqlitePool, query: &str) -> Result<Vec<Product>, String> {
        let clean_query = query.trim();
        if clean_query.is_empty() {
            return Ok(Vec::new());
        }

        ProductRepository::search_by_code_or_name(pool, clean_query)
            .await
            .map_err(|e| format!("Error al buscar productos: {}", e))
    }

    pub async fn count_products(pool: &SqlitePool) -> Result<i64, String> {
        ProductRepository::count(pool)
            .await
            .map_err(|e| format!("Error al contar productos: {}", e))
    }

    pub async fn create_product(pool: &SqlitePool, dto: CreateProductDto) -> Result<Product, String> {
        // Validaciones de negocio
        if dto.code.trim().is_empty() {
            return Err("El código del producto no puede estar vacío".into());
        }
        if dto.description.trim().is_empty() {
            return Err("La descripción no puede estar vacía".into());
        }
        if dto.price < 0.0 {
            return Err("El precio no puede ser negativo".into());
        }

        // Verificar unicidad de código
        if let Ok(Some(_)) = ProductRepository::find_by_code(pool, dto.code.trim()).await {
            return Err(format!("Ya existe un producto con el código: {}", dto.code));
        }

        let new_id = ProductRepository::create(pool, &dto)
            .await
            .map_err(|e| format!("Error al crear producto: {}", e))?;

        Self::get_product_by_id(pool, new_id).await
    }

    pub async fn update_product(pool: &SqlitePool, dto: UpdateProductDto) -> Result<Product, String> {
        if dto.price < 0.0 {
            return Err("El precio no puede ser negativo".into());
        }

        // Verificar que el producto a actualizar exista
        let existing = ProductRepository::find_by_id(pool, dto.id)
            .await
            .map_err(|e| format!("Error al consultar producto: {}", e))?
            .ok_or_else(|| "El producto a actualizar no existe".to_string())?;

        // Si cambió el código, asegurar que el nuevo no esté duplicado
        if existing.code != dto.code.trim() {
            if let Ok(Some(_)) = ProductRepository::find_by_code(pool, dto.code.trim()).await {
                return Err(format!("El código {} ya está en uso por otro producto", dto.code));
            }
        }

        let updated = ProductRepository::update(pool, &dto)
            .await
            .map_err(|e| format!("Error al actualizar producto: {}", e))?;

        if !updated {
            return Err("No se pudo realizar la actualización".into());
        }

        Self::get_product_by_id(pool, dto.id).await
    }

    pub async fn delete_product(pool: &SqlitePool, id: i64) -> Result<(), String> {
        let deleted = ProductRepository::delete(pool, id)
            .await
            .map_err(|e| format!("Error al eliminar producto: {}", e))?;

        if !deleted {
            return Err(format!("No se encontró el producto con ID {} para eliminar", id));
        }

        Ok(())
    }
}