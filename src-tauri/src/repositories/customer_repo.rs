use crate::models::customer::{CreateCustomerDto, Customer, UpdateCustomerDto};
use sqlx::{SqlitePool, Result};

pub struct CustomerRepository;

impl CustomerRepository {
    pub async fn find_by_id(pool: &SqlitePool, id: i64) -> Result<Option<Customer>> {
        sqlx::query_as::<_, Customer>(
            r#"
            SELECT id, name, doc_type, doc_number, phone, address,
                   CAST(current_balance AS REAL) AS current_balance,
                   created_at, updated_at
            FROM customers WHERE id = ?
            "#,
        )
        .bind(id)
        .fetch_optional(pool)
        .await
    }

    pub async fn search(pool: &SqlitePool, query: &str) -> Result<Vec<Customer>> {
        let pattern = format!("%{}%", query);
        sqlx::query_as::<_, Customer>(
            r#"
            SELECT id, name, doc_type, doc_number, phone, address,
                   CAST(current_balance AS REAL) AS current_balance,
                   created_at, updated_at
            FROM customers
            WHERE name LIKE ? OR doc_number LIKE ? OR phone LIKE ?
            ORDER BY name ASC
            LIMIT 50
            "#,
        )
        .bind(&pattern)
        .bind(&pattern)
        .bind(&pattern)
        .fetch_all(pool)
        .await
    }

    pub async fn list_with_balance(pool: &SqlitePool) -> Result<Vec<Customer>> {
        sqlx::query_as::<_, Customer>(
            r#"
            SELECT id, name, doc_type, doc_number, phone, address,
                   CAST(current_balance AS REAL) AS current_balance,
                   created_at, updated_at
            FROM customers
            WHERE current_balance > 0
            ORDER BY current_balance DESC
            "#,
        )
        .fetch_all(pool)
        .await
    }

    pub async fn create(pool: &SqlitePool, dto: &CreateCustomerDto) -> Result<i64> {
        let result = sqlx::query(
            r#"
            INSERT INTO customers (name, doc_type, doc_number, phone, address, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            "#,
        )
        .bind(&dto.name)
        .bind(&dto.doc_type)
        .bind(&dto.doc_number)
        .bind(&dto.phone)
        .bind(&dto.address)
        .execute(pool)
        .await?;
        Ok(result.last_insert_rowid())
    }

    pub async fn update(pool: &SqlitePool, dto: &UpdateCustomerDto) -> Result<bool> {
        let result = sqlx::query(
            r#"
            UPDATE customers
            SET name = ?, doc_type = ?, doc_number = ?, phone = ?, address = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            "#,
        )
        .bind(&dto.name)
        .bind(&dto.doc_type)
        .bind(&dto.doc_number)
        .bind(&dto.phone)
        .bind(&dto.address)
        .bind(dto.id)
        .execute(pool)
        .await?;
        Ok(result.rows_affected() > 0)
    }

    pub async fn adjust_balance(
        tx: &mut sqlx::Transaction<'_, sqlx::Sqlite>,
        customer_id: i64,
        delta: f64,
    ) -> Result<()> {
        sqlx::query(
            r#"
            UPDATE customers
            SET current_balance = CAST(current_balance AS REAL) + CAST(? AS REAL),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            "#,
        )
        .bind(delta)
        .bind(customer_id)
        .execute(&mut **tx)
        .await?;
        Ok(())
    }

    pub async fn delete(pool: &SqlitePool, id: i64) -> Result<bool> {
        let result = sqlx::query("DELETE FROM customers WHERE id = ?")
            .bind(id)
            .execute(pool)
            .await?;
        Ok(result.rows_affected() > 0)
    }
}
