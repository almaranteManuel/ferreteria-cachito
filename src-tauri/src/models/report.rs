use serde::Serialize;

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct MonthlyReport {
    pub month: i64,
    pub total_sales: f64,
}

#[derive(Debug, Serialize)]
pub struct MonthlyReportDetail {
    pub month: i32,
    pub month_name: String,
    pub total_sales: f64,
    pub profit: f64,
    pub restocking: f64,
}

#[derive(Debug, Serialize)]
pub struct YearlyReport {
    pub year: i32,
    pub months: Vec<MonthlyReportDetail>,
    pub total_sales: f64,
    pub total_profit: f64,
    pub total_restocking: f64,
}

const MONTH_NAMES: [&str; 12] = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

pub fn build_yearly_report(year: i32, rows: Vec<MonthlyReport>) -> YearlyReport {
    let mut months = Vec::with_capacity(12);
    let mut total_sales = 0.0;

    for m in 1..=12 {
        let row = rows.iter().find(|r| r.month == m as i64);
        let sales = row.map(|r| r.total_sales).unwrap_or(0.0);
        total_sales += sales;
        months.push(MonthlyReportDetail {
            month: m,
            month_name: MONTH_NAMES[m as usize - 1].to_string(),
            profit: sales * 0.4,
            restocking: sales * 0.6,
            total_sales: sales,
        });
    }

    YearlyReport {
        year,
        total_profit: total_sales * 0.4,
        total_restocking: total_sales * 0.6,
        total_sales,
        months,
    }
}
