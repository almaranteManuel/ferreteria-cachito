use crate::models::supplier::{CreateSupplierDto, Supplier, UpdateSupplierDto};
use sqlx::{SqlitePool, Result};

pub struct SupplierRepository;

impl SupplierRepository {
    /// Obtiene un proveedor por su ID
    pub async fn find_by_id(pool: &SqlitePool, id: i64) -> Result<Option<Supplier>> {
        sqlx::query_as::<_, Supplier>(
            r#"
            SELECT id, name, email, phone, address, created_at, updated_at
            FROM suppliers
            WHERE id = ?
            "#,
        )
        .bind(id)
        .fetch_optional(pool)
        .await
    }

    /// Búsqueda flexible por nombre (estilo buscador de mostrador)
    pub async fn search_by_name(pool: &SqlitePool, query: &str) -> Result<Vec<Supplier>> {
        let pattern = format!("%{}%", query);
        sqlx::query_as::<_, Supplier>(
            r#"
            SELECT id, name, email, phone, address, created_at, updated_at
            FROM suppliers
            WHERE name LIKE ?
            ORDER BY name ASC
            LIMIT 50
            "#,
        )
        .bind(&pattern)
        .fetch_all(pool)
        .await
    }

    /// Inserta un nuevo proveedor
    pub async fn create(pool: &SqlitePool, dto: &CreateSupplierDto) -> Result<i64> {
        let result = sqlx::query(
            r#"
            INSERT INTO suppliers (name, email, phone, address, created_at, updated_at)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            "#,
        )
        .bind(&dto.name)
        .bind(&dto.email)
        .bind(&dto.phone)
        .bind(&dto.address)
        .execute(pool)
        .await?;

        Ok(result.last_insert_rowid())
    }

    /// Actualiza un proveedor existente
    pub async fn update(pool: &SqlitePool, dto: &UpdateSupplierDto) -> Result<()> {
        sqlx::query(
            r#"
            UPDATE suppliers
            SET name = ?, email = ?, phone = ?, address = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            "#,
        )
        .bind(&dto.name)
        .bind(&dto.email)
        .bind(&dto.phone)
        .bind(&dto.address)
        .bind(dto.id)
        .execute(pool)
        .await?;
        Ok(())
    }

    /// Elimina un proveedor por su ID
    pub async fn delete(pool: &SqlitePool, id: i64) -> Result<()> {
        sqlx::query(
            r#"
            DELETE FROM suppliers
            WHERE id = ?
            "#,
        )
        .bind(id)
        .execute(pool)
        .await?;
        Ok(())
    }
}