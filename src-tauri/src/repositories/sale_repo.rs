use crate::models::sale::{CreateDailySaleDto, Sale, SaleItemDetail};
use sqlx::{SqlitePool, Result};

pub struct SaleRepository;

impl SaleRepository {
    const SALE_SELECT: &'static str = r#"
        SELECT id, date, CAST(totalAmount AS REAL) AS total_amount,
               payment_method, customer_id, sale_type,
               CAST(is_facturada AS INTEGER) AS is_facturada,
               invoice_type, invoice_number, cae, cae_expiration,
               created_at, updated_at
        FROM sales
    "#;

    pub async fn find_by_id(pool: &SqlitePool, id: i64) -> Result<Option<Sale>> {
        let query = format!("{} WHERE id = ?", Self::SALE_SELECT);
        sqlx::query_as::<_, Sale>(&query)
            .bind(id)
            .fetch_optional(pool)
            .await
    }

    pub async fn list_recent(pool: &SqlitePool, limit: i64) -> Result<Vec<Sale>> {
        let query = format!(
            "{} ORDER BY date DESC, id DESC LIMIT ?",
            Self::SALE_SELECT
        );
        sqlx::query_as::<_, Sale>(&query)
            .bind(limit)
            .fetch_all(pool)
            .await
    }

    pub async fn list_by_date_range(
        pool: &SqlitePool,
        start: &str,
        end: &str,
    ) -> Result<Vec<Sale>> {
        let query = format!(
            "{} WHERE date >= ? AND date <= ? ORDER BY date DESC, id DESC",
            Self::SALE_SELECT
        );
        sqlx::query_as::<_, Sale>(&query)
            .bind(start)
            .bind(end)
            .fetch_all(pool)
            .await
    }

    pub async fn list_by_year(pool: &SqlitePool, year: i32) -> Result<Vec<Sale>> {
        let pattern = format!("{}%", year);
        let query = format!(
            "{} WHERE date LIKE ? ORDER BY date DESC, id DESC",
            Self::SALE_SELECT
        );
        sqlx::query_as::<_, Sale>(&query)
            .bind(pattern)
            .fetch_all(pool)
            .await
    }

    pub async fn create_daily(
        tx: &mut sqlx::Transaction<'_, sqlx::Sqlite>,
        dto: &CreateDailySaleDto,
    ) -> Result<i64> {
        let result = sqlx::query(
            r#"
            INSERT INTO sales (date, totalAmount, payment_method, sale_type, created_at, updated_at)
            VALUES (?, CAST(? AS REAL), ?, 'TOTAL_DIA', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            "#,
        )
        .bind(&dto.date)
        .bind(dto.total_amount)
        .bind(&dto.payment_method)
        .execute(&mut **tx)
        .await?;

        Ok(result.last_insert_rowid())
    }

    pub async fn create_detailed_header(
        tx: &mut sqlx::Transaction<'_, sqlx::Sqlite>,
        date: &str,
        total_amount: f64,
        payment_method: &str,
        customer_id: Option<i64>,
    ) -> Result<i64> {
        let result = sqlx::query(
            r#"
            INSERT INTO sales (date, totalAmount, payment_method, customer_id, sale_type, created_at, updated_at)
            VALUES (?, CAST(? AS REAL), ?, ?, 'DETALLADA', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            "#,
        )
        .bind(date)
        .bind(total_amount)
        .bind(payment_method)
        .bind(customer_id)
        .execute(&mut **tx)
        .await?;

        Ok(result.last_insert_rowid())
    }

    pub async fn insert_item(
        tx: &mut sqlx::Transaction<'_, sqlx::Sqlite>,
        sale_id: i64,
        product_id: i64,
        quantity: i64,
        unit_price: f64,
    ) -> Result<()> {
        let total_price = unit_price * quantity as f64;
        sqlx::query(
            r#"
            INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, total_price)
            VALUES (?, ?, ?, CAST(? AS REAL), CAST(? AS REAL))
            "#,
        )
        .bind(sale_id)
        .bind(product_id)
        .bind(quantity)
        .bind(unit_price)
        .bind(total_price)
        .execute(&mut **tx)
        .await?;
        Ok(())
    }

    pub async fn find_items_by_sale_id(
        pool: &SqlitePool,
        sale_id: i64,
    ) -> Result<Vec<SaleItemDetail>> {
        sqlx::query_as::<_, SaleItemDetail>(
            r#"
            SELECT si.id, si.sale_id, si.product_id,
                   p.code AS product_code, p.description AS product_description,
                   si.quantity, CAST(si.unit_price AS REAL) AS unit_price,
                   CAST(si.total_price AS REAL) AS total_price
            FROM sale_items si
            JOIN products p ON p.id = si.product_id
            WHERE si.sale_id = ?
            ORDER BY si.id ASC
            "#,
        )
        .bind(sale_id)
        .fetch_all(pool)
        .await
    }

    pub async fn delete(pool: &SqlitePool, id: i64) -> Result<bool> {
        let result = sqlx::query("DELETE FROM sales WHERE id = ?")
            .bind(id)
            .execute(pool)
            .await?;
        Ok(result.rows_affected() > 0)
    }
}
