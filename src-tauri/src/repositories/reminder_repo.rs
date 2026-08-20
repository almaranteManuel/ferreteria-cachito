use crate::models::reminder::{CreateReminderDto, CreateSupplierDebtDto, ReminderWithSupplier};
use sqlx::{SqlitePool, Result};

pub struct ReminderRepository;

impl ReminderRepository {
    pub async fn list_all(pool: &SqlitePool) -> Result<Vec<ReminderWithSupplier>> {
        sqlx::query_as::<_, ReminderWithSupplier>(
            r#"
            SELECT r.id, r.title, r.description,
                   CAST(r.is_completed AS INTEGER) AS is_completed,
                   r.due_date, CAST(r.amount AS REAL) AS amount,
                   r.supplier_id, s.name AS supplier_name,
                   r.reminder_type, r.created_at
            FROM reminders r
            LEFT JOIN suppliers s ON s.id = r.supplier_id
            ORDER BY r.is_completed ASC, r.due_date ASC, r.id DESC
            "#,
        )
        .fetch_all(pool)
        .await
    }

    pub async fn list_pending_supplier_debts(
        pool: &SqlitePool,
    ) -> Result<Vec<ReminderWithSupplier>> {
        sqlx::query_as::<_, ReminderWithSupplier>(
            r#"
            SELECT r.id, r.title, r.description,
                   CAST(r.is_completed AS INTEGER) AS is_completed,
                   r.due_date, CAST(r.amount AS REAL) AS amount,
                   r.supplier_id, s.name AS supplier_name,
                   r.reminder_type, r.created_at
            FROM reminders r
            LEFT JOIN suppliers s ON s.id = r.supplier_id
            WHERE r.reminder_type = 'SUPPLIER_DEBT' AND r.is_completed = 0
            ORDER BY r.due_date ASC, r.id DESC
            "#,
        )
        .fetch_all(pool)
        .await
    }

    pub async fn create(pool: &SqlitePool, dto: &CreateReminderDto) -> Result<i64> {
        let result = sqlx::query(
            r#"
            INSERT INTO reminders (title, description, amount, supplier_id, reminder_type, due_date)
            VALUES (?, ?, CAST(? AS REAL), ?, ?, ?)
            "#,
        )
        .bind(&dto.title)
        .bind(&dto.description)
        .bind(dto.amount)
        .bind(dto.supplier_id)
        .bind(&dto.reminder_type)
        .bind(&dto.due_date)
        .execute(pool)
        .await?;
        Ok(result.last_insert_rowid())
    }

    pub async fn create_supplier_debt(
        pool: &SqlitePool,
        dto: &CreateSupplierDebtDto,
    ) -> Result<i64> {
        let result = sqlx::query(
            r#"
            INSERT INTO reminders (title, description, amount, supplier_id, reminder_type, due_date)
            VALUES (?, ?, CAST(? AS REAL), ?, 'SUPPLIER_DEBT', ?)
            "#,
        )
        .bind(&dto.title)
        .bind(&dto.description)
        .bind(dto.amount)
        .bind(dto.supplier_id)
        .bind(&dto.due_date)
        .execute(pool)
        .await?;
        Ok(result.last_insert_rowid())
    }

    pub async fn mark_completed(pool: &SqlitePool, id: i64) -> Result<bool> {
        let result = sqlx::query(
            "UPDATE reminders SET is_completed = 1 WHERE id = ?",
        )
        .bind(id)
        .execute(pool)
        .await?;
        Ok(result.rows_affected() > 0)
    }

    pub async fn delete(pool: &SqlitePool, id: i64) -> Result<bool> {
        let result = sqlx::query("DELETE FROM reminders WHERE id = ?")
            .bind(id)
            .execute(pool)
            .await?;
        Ok(result.rows_affected() > 0)
    }
}
