use crate::models::customer::{
    AddCustomerDebtDto, CreateCustomerDto, Customer, CustomerWithPayments, UpdateCustomerDto,
};
use crate::models::customer_payment::CreateCustomerPaymentDto;
use crate::services::customer_service::CustomerService;
use sqlx::SqlitePool;
use tauri::State;

#[tauri::command]
pub async fn get_customer_by_id(
    pool: State<'_, SqlitePool>,
    id: i64,
) -> Result<Customer, String> {
    CustomerService::get_by_id(pool.inner(), id).await
}

#[tauri::command]
pub async fn get_customer_with_payments(
    pool: State<'_, SqlitePool>,
    id: i64,
) -> Result<CustomerWithPayments, String> {
    CustomerService::get_with_payments(pool.inner(), id).await
}

#[tauri::command]
pub async fn search_customers(
    pool: State<'_, SqlitePool>,
    query: String,
) -> Result<Vec<Customer>, String> {
    CustomerService::search(pool.inner(), &query).await
}

#[tauri::command]
pub async fn list_customers_with_balance(
    pool: State<'_, SqlitePool>,
) -> Result<Vec<Customer>, String> {
    CustomerService::list_with_balance(pool.inner()).await
}

#[tauri::command]
pub async fn create_customer(
    pool: State<'_, SqlitePool>,
    dto: CreateCustomerDto,
) -> Result<Customer, String> {
    CustomerService::create(pool.inner(), dto).await
}

#[tauri::command]
pub async fn update_customer(
    pool: State<'_, SqlitePool>,
    dto: UpdateCustomerDto,
) -> Result<Customer, String> {
    CustomerService::update(pool.inner(), dto).await
}

#[tauri::command]
pub async fn add_customer_payment(
    pool: State<'_, SqlitePool>,
    dto: CreateCustomerPaymentDto,
) -> Result<CustomerWithPayments, String> {
    CustomerService::add_payment(pool.inner(), dto).await
}

#[tauri::command]
pub async fn add_customer_debt(
    pool: State<'_, SqlitePool>,
    dto: AddCustomerDebtDto,
) -> Result<CustomerWithPayments, String> {
    CustomerService::add_debt(pool.inner(), dto).await
}

#[tauri::command]
pub async fn delete_customer(
    pool: State<'_, SqlitePool>,
    id: i64,
) -> Result<(), String> {
    CustomerService::delete(pool.inner(), id).await
}
