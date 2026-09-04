// Encargada única y exclusivamente de la interacción directa con SQLite.

use crate::models::product::{CreateProductDto, Product, UpdateProductDto};
use sqlx::{SqlitePool, Result};

pub struct ProductRepository;

impl ProductRepository {
    /// Obtiene un producto por su ID
    pub async fn find_by_id(pool: &SqlitePool, id: i64) -> Result<Option<Product>> {
        sqlx::query_as::<_, Product>(
            r#"
            SELECT id, code, description, CAST(price AS REAL) AS price, own_price, CAST(variant AS REAL) AS variant, category_id, stock, created_at, updated_at
            FROM products
            WHERE id = ?
            "#,
        )
        .bind(id)
        .fetch_optional(pool)
        .await
    }

    /// Obtiene un producto por su código exacto (útil para el lector de código de barras)
    pub async fn find_by_code(pool: &SqlitePool, code: &str) -> Result<Option<Product>> {
        sqlx::query_as::<_, Product>(
            r#"
            SELECT id, code, description, CAST(price AS REAL) AS price, own_price, CAST(variant AS REAL) AS variant, category_id, stock, created_at, updated_at
            FROM products
            WHERE code = ?
            "#,
        )
        .bind(code)
        .fetch_optional(pool)
        .await
    }

    /// Búsqueda flexible por código o descripción (estilo buscador de mostrador)
    pub async fn search_by_code_or_name(pool: &SqlitePool, query: &str) -> Result<Vec<Product>> {
        let pattern = format!("%{}%", query);
        sqlx::query_as::<_, Product>(
            r#"
            SELECT id, code, description, CAST(price AS REAL) AS price, own_price, CAST(variant AS REAL) AS variant, category_id, stock, created_at, updated_at
            FROM products
            WHERE code LIKE ? OR description LIKE ?
            ORDER BY description ASC
            LIMIT 50
            "#,
        )
        .bind(&pattern)
        .bind(&pattern)
        .fetch_all(pool)
        .await
    }

    /// Inserta un nuevo producto
    pub async fn create(pool: &SqlitePool, dto: &CreateProductDto) -> Result<i64> {
        let result = sqlx::query(
            r#"
            INSERT INTO products (code, description, price, own_price, variant, category_id, stock, created_at, updated_at)
            VALUES (?, ?, CAST(? AS REAL), ?, CAST(? AS REAL), ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            "#,
        )
        .bind(&dto.code)
        .bind(&dto.description)
        .bind(dto.price)
        .bind(&dto.own_price)
        .bind(&dto.variant)
        .bind(dto.category_id)
        .bind(dto.stock)
        .execute(pool)
        .await?;

        Ok(result.last_insert_rowid())
    }

    /// Actualiza los datos de un producto
    pub async fn update(pool: &SqlitePool, dto: &UpdateProductDto) -> Result<bool> {
        let result = sqlx::query(
            r#"
            UPDATE products
            SET code = ?, description = ?, price = CAST(? AS REAL), own_price = ?, variant = CAST(? AS REAL), category_id = ?, stock = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            "#,
        )
        .bind(&dto.code)
        .bind(&dto.description)
        .bind(dto.price)
        .bind(&dto.own_price)
        .bind(&dto.variant)
        .bind(dto.category_id)
        .bind(dto.stock)
        .bind(dto.id)
        .execute(pool)
        .await?;

        Ok(result.rows_affected() > 0)
    }

    /// Decrementa stock dentro de una transacción
    pub async fn decrement_stock(
        tx: &mut sqlx::Transaction<'_, sqlx::Sqlite>,
        product_id: i64,
        quantity: i64,
    ) -> Result<bool> {
        let result = sqlx::query(
            r#"
            UPDATE products
            SET stock = stock - ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND stock >= ?
            "#,
        )
        .bind(quantity)
        .bind(product_id)
        .bind(quantity)
        .execute(&mut **tx)
        .await?;
        Ok(result.rows_affected() > 0)
    }

    /// Elimina un producto por su ID
    pub async fn delete(pool: &SqlitePool, id: i64) -> Result<bool> {
        let result = sqlx::query("DELETE FROM products WHERE id = ?")
            .bind(id)
            .execute(pool)
            .await?;

        Ok(result.rows_affected() > 0)
    }
}