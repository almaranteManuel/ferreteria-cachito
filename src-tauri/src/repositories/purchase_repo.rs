use crate::models::purchase::{Purchase, CreatePurchaseDto, UpdatePurchaseDto};
use sqlx::{SqlitePool, Result};

pub struct PurchaseRepository;

impl PurchaseRepository {
    pub async fn find_by_id(pool: &SqlitePool, id: i64) -> Result<Option<Purchase>> {
        let purchase = sqlx::query_as::<_, Purchase>(
            "SELECT
                id,
                date,
                totalAmount AS total_amount,
                supplier_id,
                invoice_number,
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

    pub async fn create(pool: &SqlitePool, dto: &CreatePurchaseDto) -> Result<i64> {
        let result = sqlx::query(
            "INSERT INTO purchases (date, totalAmount, supplier_id, invoice_number) VALUES (?, ?, ?, ?)",
        )
        .bind(&dto.date)
        .bind(dto.total_amount)
        .bind(dto.supplier_id)
        .bind(&dto.invoice_number)
        .execute(pool)
        .await?;

        Ok(result.last_insert_rowid())
    }

    pub async fn update(pool: &SqlitePool, dto: &UpdatePurchaseDto) -> Result<()> {
        sqlx::query(
            "UPDATE purchases SET date = ?, totalAmount = ?, supplier_id = ?, invoice_number = ? WHERE id = ?",
        )
        .bind(&dto.date)
        .bind(dto.total_amount)
        .bind(dto.supplier_id)
        .bind(&dto.invoice_number)
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