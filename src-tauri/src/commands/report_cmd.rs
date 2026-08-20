use crate::models::report::YearlyReport;
use crate::services::report_service::ReportService;
use sqlx::SqlitePool;
use tauri::State;

#[tauri::command]
pub async fn get_yearly_report(
    pool: State<'_, SqlitePool>,
    year: i32,
) -> Result<YearlyReport, String> {
    ReportService::get_yearly_report(pool.inner(), year).await
}

#[tauri::command]
pub async fn get_available_report_years(
    pool: State<'_, SqlitePool>,
) -> Result<Vec<i32>, String> {
    ReportService::get_available_years(pool.inner()).await
}
