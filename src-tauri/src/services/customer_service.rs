use crate::models::customer::{
    AddCustomerDebtDto, CreateCustomerDto, Customer, CustomerWithPayments, UpdateCustomerDto,
};
use crate::models::customer_payment::CreateCustomerPaymentDto;
use crate::repositories::customer_payment_repo::CustomerPaymentRepository;
use crate::repositories::customer_repo::CustomerRepository;
use sqlx::SqlitePool;

pub struct CustomerService;

impl CustomerService {
    pub async fn get_by_id(pool: &SqlitePool, id: i64) -> Result<Customer, String> {
        CustomerRepository::find_by_id(pool, id)
            .await
            .map_err(|e| format!("Error al obtener cliente: {}", e))?
            .ok_or_else(|| format!("Cliente con ID {} no encontrado", id))
    }

    pub async fn get_with_payments(
        pool: &SqlitePool,
        id: i64,
    ) -> Result<CustomerWithPayments, String> {
        let customer = Self::get_by_id(pool, id).await?;
        let payments = CustomerPaymentRepository::list_by_customer(pool, id)
            .await
            .map_err(|e| format!("Error al obtener movimientos: {}", e))?;
        Ok(CustomerWithPayments { customer, payments })
    }

    pub async fn search(pool: &SqlitePool, query: &str) -> Result<Vec<Customer>, String> {
        let clean = query.trim();
        if clean.is_empty() {
            return CustomerRepository::search(pool, "%")
                .await
                .map_err(|e| format!("Error al listar clientes: {}", e));
        }
        CustomerRepository::search(pool, clean)
            .await
            .map_err(|e| format!("Error al buscar clientes: {}", e))
    }

    pub async fn list_with_balance(pool: &SqlitePool) -> Result<Vec<Customer>, String> {
        CustomerRepository::list_with_balance(pool)
            .await
            .map_err(|e| format!("Error al listar deudores: {}", e))
    }

    pub async fn create(pool: &SqlitePool, dto: CreateCustomerDto) -> Result<Customer, String> {
        if dto.name.trim().is_empty() {
            return Err("El nombre del cliente es obligatorio".into());
        }
        let id = CustomerRepository::create(pool, &dto)
            .await
            .map_err(|e| format!("Error al crear cliente: {}", e))?;
        Self::get_by_id(pool, id).await
    }

    pub async fn update(pool: &SqlitePool, dto: UpdateCustomerDto) -> Result<Customer, String> {
        let updated = CustomerRepository::update(pool, &dto)
            .await
            .map_err(|e| format!("Error al actualizar cliente: {}", e))?;
        if !updated {
            return Err("Cliente no encontrado".into());
        }
        Self::get_by_id(pool, dto.id).await
    }

    pub async fn add_payment(
        pool: &SqlitePool,
        dto: CreateCustomerPaymentDto,
    ) -> Result<CustomerWithPayments, String> {
        if dto.amount <= 0.0 {
            return Err("El monto del pago debe ser mayor a cero".into());
        }

        let customer = Self::get_by_id(pool, dto.customer_id).await?;
        if dto.amount > customer.current_balance {
            return Err(format!(
                "El pago (${:.2}) supera la deuda (${:.2})",
                dto.amount, customer.current_balance
            ));
        }

        let mut tx = pool
            .begin()
            .await
            .map_err(|e| format!("Error al iniciar transacción: {}", e))?;

        CustomerPaymentRepository::insert_payment(&mut tx, &dto)
            .await
            .map_err(|e| format!("Error al registrar pago: {}", e))?;

        CustomerRepository::adjust_balance(&mut tx, dto.customer_id, -dto.amount)
            .await
            .map_err(|e| format!("Error al actualizar saldo: {}", e))?;

        tx.commit()
            .await
            .map_err(|e| format!("Error al confirmar pago: {}", e))?;

        Self::get_with_payments(pool, dto.customer_id).await
    }

    pub async fn add_debt(
        pool: &SqlitePool,
        dto: AddCustomerDebtDto,
    ) -> Result<CustomerWithPayments, String> {
        if dto.amount <= 0.0 {
            return Err("El monto de la deuda debe ser mayor a cero".into());
        }

        let mut tx = pool
            .begin()
            .await
            .map_err(|e| format!("Error al iniciar transacción: {}", e))?;

        CustomerPaymentRepository::insert_debt(
            &mut tx,
            dto.customer_id,
            dto.amount,
            dto.note.as_deref(),
        )
        .await
        .map_err(|e| format!("Error al registrar deuda: {}", e))?;

        CustomerRepository::adjust_balance(&mut tx, dto.customer_id, dto.amount)
            .await
            .map_err(|e| format!("Error al actualizar saldo: {}", e))?;

        tx.commit()
            .await
            .map_err(|e| format!("Error al confirmar deuda: {}", e))?;

        Self::get_with_payments(pool, dto.customer_id).await
    }

    pub async fn delete(pool: &SqlitePool, id: i64) -> Result<(), String> {
        let deleted = CustomerRepository::delete(pool, id)
            .await
            .map_err(|e| format!("Error al eliminar cliente: {}", e))?;
        if !deleted {
            return Err(format!("Cliente con ID {} no encontrado", id));
        }
        Ok(())
    }
}
