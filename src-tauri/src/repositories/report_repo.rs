use crate::models::report::MonthlyReport;
use sqlx::{SqlitePool, Result};

pub struct ReportRepository;

impl ReportRepository {
    pub async fn monthly_sales_by_year(
        pool: &SqlitePool,
        year: i32,
    ) -> Result<Vec<MonthlyReport>> {
        let pattern = format!("{}%", year);
        sqlx::query_as::<_, MonthlyReport>(
            r#"
            SELECT CAST(strftime('%m', date) AS INTEGER) AS month,
                   CAST(SUM(total_amount) AS REAL) AS total_sales
            FROM sales
            WHERE date LIKE ?
            GROUP BY month
            ORDER BY month ASC
            "#,
        )
        .bind(pattern)
        .fetch_all(pool)
        .await
    }

    pub async fn available_years(pool: &SqlitePool) -> Result<Vec<i32>> {
        let rows: Vec<(String,)> = sqlx::query_as(
            r#"
            SELECT DISTINCT strftime('%Y', date) AS year
            FROM sales
            WHERE date IS NOT NULL AND date != ''
            ORDER BY year DESC
            "#,
        )
        .fetch_all(pool)
        .await?;

        Ok(rows
            .into_iter()
            .filter_map(|(y,)| y.parse::<i32>().ok())
            .collect())
    }
}
