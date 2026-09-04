export interface MonthlyReportDetail {
  month: number;
  month_name: string;
  total_sales: number;
  profit: number;
  restocking: number;
}

export interface YearlyReport {
  year: number;
  months: MonthlyReportDetail[];
  total_sales: number;
  total_profit: number;
  total_restocking: number;
  total_purchases: number;
  total_expenses: number;
}
