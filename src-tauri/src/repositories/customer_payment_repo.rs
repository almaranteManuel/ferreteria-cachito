use crate::models::customer_payment::{CreateCustomerPaymentDto, CustomerPayment};
use sqlx::{SqlitePool, Result};

pub struct CustomerPaymentRepository;

impl CustomerPaymentRepository {
    pub async fn list_by_customer(
        pool: &SqlitePool,
        customer_id: i64,
    ) -> Result<Vec<CustomerPayment>> {
        sqlx::query_as::<_, CustomerPayment>(
            r#"
            SELECT id, customer_id, CAST(amount AS REAL) AS amount,
                   payment_method, note, date, transaction_type
            FROM customer_payments
            WHERE customer_id = ?
            ORDER BY date DESC, id DESC
            "#,
        )
        .bind(customer_id)
        .fetch_all(pool)
        .await
    }

    pub async fn insert_payment(
        tx: &mut sqlx::Transaction<'_, sqlx::Sqlite>,
        dto: &CreateCustomerPaymentDto,
    ) -> Result<i64> {
        let result = sqlx::query(
            r#"
            INSERT INTO customer_payments (customer_id, amount, payment_method, note, transaction_type)
            VALUES (?, CAST(? AS REAL), ?, ?, 'PAGO')
            "#,
        )
        .bind(dto.customer_id)
        .bind(dto.amount)
        .bind(&dto.payment_method)
        .bind(&dto.note)
        .execute(&mut **tx)
        .await?;
        Ok(result.last_insert_rowid())
    }

    pub async fn insert_debt(
        tx: &mut sqlx::Transaction<'_, sqlx::Sqlite>,
        customer_id: i64,
        amount: f64,
        note: Option<&str>,
    ) -> Result<i64> {
        let result = sqlx::query(
            r#"
            INSERT INTO customer_payments (customer_id, amount, payment_method, note, transaction_type)
            VALUES (?, CAST(? AS REAL), 'FIADO', ?, 'DEUDA')
            "#,
        )
        .bind(customer_id)
        .bind(amount)
        .bind(note)
        .execute(&mut **tx)
        .await?;
        Ok(result.last_insert_rowid())
    }
}
