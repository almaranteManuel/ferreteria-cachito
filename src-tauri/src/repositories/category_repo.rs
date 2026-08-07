use crate::models::category::{Category, CreateCategoryDto, UpdateCategoryDto};
use sqlx::{SqlitePool, Result};

pub struct CategoryRepository;

impl CategoryRepository {
    /// Obtiene una categoría por su ID
    pub async fn find_by_id(pool: &SqlitePool, id: i64) -> Result<Option<Category>> {
        sqlx::query_as::<_, Category>(
            r#"
            SELECT id, name, created_at, updated_at
            FROM categories
            WHERE id = ?
            "#,
        )
        .bind(id)
        .fetch_optional(pool)
        .await
    }

    /// Inserta una nueva categoría
    pub async fn create(pool: &SqlitePool, dto: &CreateCategoryDto) -> Result<i64> {
        let result = sqlx::query(
            r#"
            INSERT INTO categories (name, created_at, updated_at)
            VALUES (?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            "#,
        )
        .bind(&dto.name)
        .execute(pool)
        .await?;

        Ok(result.last_insert_rowid())
    }

    /// Actualiza una categoría existente
    pub async fn update(pool: &SqlitePool, dto: &UpdateCategoryDto) -> Result<()> {
        sqlx::query(
            r#"
            UPDATE categories
            SET name = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            "#,
        )
        .bind(&dto.name)
        .bind(dto.id)
        .execute(pool)
        .await?;

        Ok(())
    }

    /// Elimina una categoría por su ID
    pub async fn delete(pool: &SqlitePool, id: i64) -> Result<()> {
        sqlx::query(
            r#"
            DELETE FROM categories
            WHERE id = ?
            "#,
        )
        .bind(id)
        .execute(pool)
        .await?;

        Ok(())
    }
}