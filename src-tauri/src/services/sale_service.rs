use crate::models::sale::{
    calc_sale_price, CreateDailySaleDto, CreateDetailedSaleDto, Sale, SaleWithItems,
};
use crate::repositories::customer_repo::CustomerRepository;
use crate::repositories::product_repo::ProductRepository;
use crate::repositories::sale_repo::SaleRepository;
use sqlx::SqlitePool;

struct ResolvedItem {
    product_id: i64,
    quantity: i64,
    unit_price: f64,
}

pub struct SaleService;

impl SaleService {
    pub async fn get_sale_by_id(pool: &SqlitePool, id: i64) -> Result<SaleWithItems, String> {
        let sale = SaleRepository::find_by_id(pool, id)
            .await
            .map_err(|e| format!("Error al obtener venta: {}", e))?
            .ok_or_else(|| format!("Venta con ID {} no encontrada", id))?;

        let items = SaleRepository::find_items_by_sale_id(pool, id)
            .await
            .map_err(|e| format!("Error al obtener ítems: {}", e))?;

        Ok(SaleWithItems { sale, items })
    }

    pub async fn list_recent_sales(pool: &SqlitePool, limit: i64) -> Result<Vec<Sale>, String> {
        SaleRepository::list_recent(pool, limit)
            .await
            .map_err(|e| format!("Error al listar ventas: {}", e))
    }

    pub async fn create_daily_sale(
        pool: &SqlitePool,
        dto: CreateDailySaleDto,
    ) -> Result<Sale, String> {
        if dto.total_amount <= 0.0 {
            return Err("El monto debe ser mayor a cero".into());
        }
        if dto.date.trim().is_empty() {
            return Err("La fecha es obligatoria".into());
        }

        let mut tx = pool
            .begin()
            .await
            .map_err(|e| format!("Error al iniciar transacción: {}", e))?;

        let id = SaleRepository::create_daily(&mut tx, &dto)
            .await
            .map_err(|e| format!("Error al registrar venta: {}", e))?;

        tx.commit()
            .await
            .map_err(|e| format!("Error al confirmar venta: {}", e))?;

        SaleRepository::find_by_id(pool, id)
            .await
            .map_err(|e| format!("Error al obtener venta: {}", e))?
            .ok_or_else(|| "Venta creada pero no encontrada".into())
    }

    pub async fn create_detailed_sale(
        pool: &SqlitePool,
        dto: CreateDetailedSaleDto,
    ) -> Result<SaleWithItems, String> {
        if dto.items.is_empty() {
            return Err("La venta debe tener al menos un producto".into());
        }
        if dto.date.trim().is_empty() {
            return Err("La fecha es obligatoria".into());
        }

        if dto.payment_method == "CUENTA_CORRIENTE" && dto.customer_id.is_none() {
            return Err("Seleccioná un cliente para venta en cuenta corriente".into());
        }

        let mut resolved_items = Vec::with_capacity(dto.items.len());
        let mut total_amount = 0.0;

        for item in &dto.items {
            if item.quantity <= 0 {
                return Err("La cantidad debe ser mayor a cero".into());
            }

            let product = ProductRepository::find_by_id(pool, item.product_id)
                .await
                .map_err(|e| format!("Error al consultar producto: {}", e))?
                .ok_or_else(|| format!("Producto {} no encontrado", item.product_id))?;

            let unit_price = item.unit_price.unwrap_or_else(|| {
                calc_sale_price(product.price, product.variant)
            });

            if unit_price <= 0.0 {
                return Err(format!(
                    "Precio inválido para el producto {}",
                    product.description
                ));
            }

            if product.stock < item.quantity {
                return Err(format!(
                    "Stock insuficiente para '{}'. Disponible: {}",
                    product.description, product.stock
                ));
            }

            total_amount += unit_price * item.quantity as f64;
            resolved_items.push(ResolvedItem {
                product_id: item.product_id,
                quantity: item.quantity,
                unit_price,
            });
        }

        let mut tx = pool
            .begin()
            .await
            .map_err(|e| format!("Error al iniciar transacción: {}", e))?;

        let sale_id = SaleRepository::create_detailed_header(
            &mut tx,
            &dto.date,
            total_amount,
            &dto.payment_method,
            dto.customer_id,
        )
        .await
        .map_err(|e| format!("Error al crear venta: {}", e))?;

        for item in &resolved_items {
            let updated =
                ProductRepository::decrement_stock(&mut tx, item.product_id, item.quantity)
                    .await
                    .map_err(|e| format!("Error al actualizar stock: {}", e))?;

            if !updated {
                return Err("Stock insuficiente al confirmar la venta".into());
            }

            SaleRepository::insert_item(
                &mut tx,
                sale_id,
                item.product_id,
                item.quantity,
                item.unit_price,
            )
            .await
            .map_err(|e| format!("Error al insertar ítem: {}", e))?;
        }

        if dto.payment_method == "CUENTA_CORRIENTE" {
            if let Some(customer_id) = dto.customer_id {
                CustomerRepository::adjust_balance(&mut tx, customer_id, total_amount)
                    .await
                    .map_err(|e| format!("Error al actualizar cuenta corriente: {}", e))?;
            }
        }

        tx.commit()
            .await
            .map_err(|e| format!("Error al confirmar venta: {}", e))?;

        Self::get_sale_by_id(pool, sale_id).await
    }

    pub async fn delete_sale(pool: &SqlitePool, id: i64) -> Result<(), String> {
        let deleted = SaleRepository::delete(pool, id)
            .await
            .map_err(|e| format!("Error al eliminar venta: {}", e))?;

        if !deleted {
            return Err(format!("Venta con ID {} no encontrada", id));
        }
        Ok(())
    }
}
