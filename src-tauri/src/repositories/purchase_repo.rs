use crate::models::purchase::{Purchase, CreatePurchaseDto, UpdatePurchaseDto};
use sqlx::{SqlitePool, Result};

pub struct PurchaseRepository;

impl PurchaseRepository {
    pub async fn find_by_id(pool: &SqlitePool, id: i64) -> Result<Option<Purchase>> {
        let purchase = sqlx::query_as::<_, Purchase>(
            "SELECT
                id,
                date,
                CAST(totalAmount AS REAL) AS total_amount,
                supplier_id,
                created_at,
                updated_at
            FROM purchases
            WHERE id = ?",
        )
        .bind(id)
        .fetch_optional(pool)
        .await?;

        Ok(purchase)
    }

    pub async fn list_recent(pool: &SqlitePool, limit: i64) -> Result<Vec<Purchase>> {
        sqlx::query_as::<_, Purchase>(
            "SELECT id, date, CAST(totalAmount AS REAL) AS total_amount, supplier_id, created_at, updated_at
             FROM purchases ORDER BY date DESC, id DESC LIMIT ?",
        )
        .bind(limit)
        .fetch_all(pool)
        .await
    }

    pub async fn total_by_year(pool: &SqlitePool, year: i32) -> Result<f64> {
        let pattern = format!("{}%", year);
        let total: Option<f64> = sqlx::query_scalar(
            "SELECT SUM(CAST(totalAmount AS REAL)) FROM purchases WHERE date LIKE ?",
        )
        .bind(pattern)
        .fetch_one(pool)
        .await?;
        Ok(total.unwrap_or(0.0))
    }

    pub async fn create(pool: &SqlitePool, dto: &CreatePurchaseDto) -> Result<i64> {
        let result = sqlx::query(
            "INSERT INTO purchases (date, totalAmount, supplier_id) VALUES (?, CAST(? AS REAL), ?)",
        )
        .bind(&dto.date)
        .bind(dto.total_amount)
        .bind(dto.supplier_id)
        .execute(pool)
        .await?;

        Ok(result.last_insert_rowid())
    }

    pub async fn update(pool: &SqlitePool, dto: &UpdatePurchaseDto) -> Result<()> {
        sqlx::query(
            "UPDATE purchases SET date = ?, totalAmount = CAST(? AS REAL), supplier_id = ? WHERE id = ?",
        )
        .bind(&dto.date)
        .bind(dto.total_amount)
        .bind(dto.supplier_id)
        .bind(dto.id)
        .execute(pool)
        .await?;

        Ok(())
    }

    pub async fn delete(pool: &SqlitePool, id: i64) -> Result<()> {
        sqlx::query("DELETE FROM purchases WHERE id = ?")
            .bind(id)
            .execute(pool)
            .await?;

        Ok(())
    }
}