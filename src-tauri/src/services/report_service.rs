use crate::models::report::{build_yearly_report, YearlyReport};
use crate::repositories::report_repo::ReportRepository;
use sqlx::SqlitePool;

pub struct ReportService;

impl ReportService {
    pub async fn get_yearly_report(pool: &SqlitePool, year: i32) -> Result<YearlyReport, String> {
        let rows = ReportRepository::monthly_sales_by_year(pool, year)
            .await
            .map_err(|e| format!("Error al generar reporte: {}", e))?;
        Ok(build_yearly_report(year, rows))
    }

    pub async fn get_available_years(pool: &SqlitePool) -> Result<Vec<i32>, String> {
        ReportRepository::available_years(pool)
            .await
            .map_err(|e| format!("Error al obtener años: {}", e))
    }
}
