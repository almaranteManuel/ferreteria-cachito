use crate::models::reminder::{CreateReminderDto, CreateSupplierDebtDto, ReminderWithSupplier};
use sqlx::{SqlitePool, Result};

pub struct ReminderRepository;

impl ReminderRepository {
    // La DB real (seed Ventas.db + migraciones aplicadas) solo tiene:
    // id, description, completed, amount, supplier_id, reminder_type
    // No tiene title / is_completed / due_date / created_at.
    // Para no romper la DB ni migraciones, mapeamos:
    //  - title <-> description (el formulario usa "Descriptción" como título)
    //  - is_completed <-> completed
    //  - due_date / created_at -> NULL / '' como placeholders
    pub async fn list_all(pool: &SqlitePool) -> Result<Vec<ReminderWithSupplier>> {
        sqlx::query_as::<_, ReminderWithSupplier>(
            r#"
            SELECT r.id,
                   r.description AS title,
                   r.description,
                   CAST(r.completed AS INTEGER) AS is_completed,
                   NULL AS due_date,
                   CAST(r.amount AS REAL) AS amount,
                   r.supplier_id, s.name AS supplier_name,
                   r.reminder_type, '' AS created_at
            FROM reminders r
            LEFT JOIN suppliers s ON s.id = r.supplier_id
            ORDER BY r.completed ASC, r.id DESC
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
            SELECT r.id,
                   r.description AS title,
                   r.description,
                   CAST(r.completed AS INTEGER) AS is_completed,
                   NULL AS due_date,
                   CAST(r.amount AS REAL) AS amount,
                   r.supplier_id, s.name AS supplier_name,
                   r.reminder_type, '' AS created_at
            FROM reminders r
            LEFT JOIN suppliers s ON s.id = r.supplier_id
            WHERE r.reminder_type = 'SUPPLIER_DEBT' AND r.completed = 0
            ORDER BY r.id DESC
            "#,
        )
        .fetch_all(pool)
        .await
    }

    pub async fn create(pool: &SqlitePool, dto: &CreateReminderDto) -> Result<i64> {
        // description almacena title (+ description opcional concatenada)
        let merged = match &dto.description {
            Some(d) if !d.trim().is_empty() => format!("{} - {}", dto.title.trim(), d.trim()),
            _ => dto.title.trim().to_string(),
        };
        let result = sqlx::query(
            r#"
            INSERT INTO reminders (description, amount, supplier_id, reminder_type, completed)
            VALUES (?, CAST(? AS REAL), ?, ?, 0)
            "#,
        )
        .bind(merged)
        .bind(dto.amount)
        .bind(dto.supplier_id)
        .bind(&dto.reminder_type)
        .execute(pool)
        .await?;
        Ok(result.last_insert_rowid())
    }

    pub async fn create_supplier_debt(
        pool: &SqlitePool,
        dto: &CreateSupplierDebtDto,
    ) -> Result<i64> {
        let merged = match &dto.description {
            Some(d) if !d.trim().is_empty() => format!("{} - {}", dto.title.trim(), d.trim()),
            _ => dto.title.trim().to_string(),
        };
        let result = sqlx::query(
            r#"
            INSERT INTO reminders (description, amount, supplier_id, reminder_type, completed)
            VALUES (?, CAST(? AS REAL), ?, 'SUPPLIER_DEBT', 0)
            "#,
        )
        .bind(merged)
        .bind(dto.amount)
        .bind(dto.supplier_id)
        .execute(pool)
        .await?;
        Ok(result.last_insert_rowid())
    }

    pub async fn mark_completed(pool: &SqlitePool, id: i64) -> Result<bool> {
        let result = sqlx::query(
            "UPDATE reminders SET completed = 1 WHERE id = ?",
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
