use crate::models::report::{build_yearly_report, with_totals_purchases_expenses, YearlyReport};
use crate::repositories::report_repo::ReportRepository;
use sqlx::SqlitePool;

pub struct ReportService;

impl ReportService {
    pub async fn get_yearly_report(pool: &SqlitePool, year: i32) -> Result<YearlyReport, String> {
        let rows = ReportRepository::monthly_sales_by_year(pool, year)
            .await
            .map_err(|e| format!("Error al generar reporte: {}", e))?;
        let report = build_yearly_report(year, rows);
        let total_purchases = ReportRepository::total_purchases_by_year(pool, year)
            .await
            .map_err(|e| format!("Error al calcular compras: {}", e))?;
        let total_expenses = ReportRepository::total_expenses_by_year(pool, year)
            .await
            .map_err(|e| format!("Error al calcular gastos: {}", e))?;
        Ok(with_totals_purchases_expenses(
            report,
            total_purchases,
            total_expenses,
        ))
    }

    pub async fn get_available_years(pool: &SqlitePool) -> Result<Vec<i32>, String> {
        ReportRepository::available_years(pool)
            .await
            .map_err(|e| format!("Error al obtener años: {}", e))
    }
}
