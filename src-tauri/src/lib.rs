pub mod arca;
pub mod commands;
pub mod db;
pub mod models;
pub mod repositories;
pub mod services;

use arca::ArcaState;
use db::connection::init_database;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let handle = app.handle().clone();

            tauri::async_runtime::block_on(async move {
                let pool = init_database(&handle)
                    .await
                    .expect("Error al inicializar la base de datos");

                handle.manage(pool);

                let arca_state =
                    ArcaState::new().expect("Error al inicializar el estado ARCA");
                handle.manage(arca_state);
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // ARCA commands
            commands::arca_cmd::estado_config,
            commands::arca_cmd::wsaa_login,
            commands::arca_cmd::wsfe_ping,
            commands::arca_cmd::buscar_persona_arca,
            // Facturación commands
            commands::factura_cmd::emitir_factura,
            commands::factura_cmd::listar_facturas,
            commands::factura_cmd::get_factura,
            // Product commands
            commands::product_cmd::get_product_by_id,
            commands::product_cmd::search_products,
            commands::product_cmd::create_product,
            commands::product_cmd::update_product,
            commands::product_cmd::delete_product,
            // Supplier commands
            commands::supplier_cmd::get_supplier_by_id,
            commands::supplier_cmd::create_supplier,
            commands::supplier_cmd::update_supplier,
            commands::supplier_cmd::delete_supplier,
            commands::supplier_cmd::search_suppliers,
            // Category commands
            commands::category_cmd::get_category_by_id,
            commands::category_cmd::create_category,
            commands::category_cmd::update_category,
            commands::category_cmd::delete_category,
            // Purchase commands
            commands::purchase_cmd::get_purchase_by_id,
            commands::purchase_cmd::create_purchase,
            commands::purchase_cmd::update_purchase,
            commands::purchase_cmd::delete_purchase,
            commands::purchase_cmd::list_recent_purchases,
            // Sale commands
            commands::sale_cmd::get_sale_by_id,
            commands::sale_cmd::list_recent_sales,
            commands::sale_cmd::list_sales_by_date_range,
            commands::sale_cmd::create_daily_sale,
            commands::sale_cmd::create_detailed_sale,
            commands::sale_cmd::delete_sale,
            commands::sale_cmd::calc_product_sale_price,
            // Customer commands
            commands::customer_cmd::get_customer_by_id,
            commands::customer_cmd::get_customer_with_payments,
            commands::customer_cmd::search_customers,
            commands::customer_cmd::list_customers_with_balance,
            commands::customer_cmd::create_customer,
            commands::customer_cmd::update_customer,
            commands::customer_cmd::add_customer_payment,
            commands::customer_cmd::add_customer_debt,
            commands::customer_cmd::delete_customer,
            // Reminder / supplier debt commands
            commands::reminder_cmd::list_supplier_debts,
            commands::reminder_cmd::create_supplier_debt,
            commands::reminder_cmd::mark_supplier_debt_paid,
            commands::reminder_cmd::delete_supplier_debt,
            // Report commands
            commands::report_cmd::get_yearly_report,
            commands::report_cmd::get_available_report_years,
            // Presupuesto commands
            commands::presupuesto_cmd::crear_presupuesto,
            commands::presupuesto_cmd::listar_presupuestos,
            commands::presupuesto_cmd::get_presupuesto,
            commands::presupuesto_cmd::eliminar_presupuesto,
            // Gastos personales commands
            commands::gasto_personal_cmd::crear_gasto_personal,
            commands::gasto_personal_cmd::listar_gastos_personales,
            commands::gasto_personal_cmd::eliminar_gasto_personal,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
