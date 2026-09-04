use crate::models::factura::{CreateFacturaDto, Factura, FacturaItem, FacturaWithItems};
use sqlx::{Result, SqlitePool};

pub struct FacturaRepository;

impl FacturaRepository {
    const FACTURA_SELECT: &'static str = r#"
        SELECT id, fecha, tipo, punto_venta, numero,
               CAST(total AS REAL) AS total, cae, cae_expiration,
               resultado, cliente_nombre, cliente_cuit,
               condicion_iva_receptor_id, created_at
        FROM facturas
    "#;

    pub async fn find_by_id(pool: &SqlitePool, id: i64) -> Result<Option<Factura>> {
        let query = format!("{} WHERE id = ?", Self::FACTURA_SELECT);
        sqlx::query_as::<_, Factura>(&query)
            .bind(id)
            .fetch_optional(pool)
            .await
    }

    pub async fn list_recent(pool: &SqlitePool, limit: i64) -> Result<Vec<Factura>> {
        let query = format!(
            "{} ORDER BY fecha DESC, numero DESC LIMIT ?",
            Self::FACTURA_SELECT
        );
        sqlx::query_as::<_, Factura>(&query)
            .bind(limit)
            .fetch_all(pool)
            .await
    }

    pub async fn find_items(pool: &SqlitePool, factura_id: i64) -> Result<Vec<FacturaItem>> {
        sqlx::query_as::<_, FacturaItem>(
            r#"
            SELECT id, factura_id, descripcion,
                   CAST(cantidad AS REAL) AS cantidad,
                   CAST(precio_unitario AS REAL) AS precio_unitario,
                   product_id
            FROM factura_items
            WHERE factura_id = ?
            ORDER BY id
            "#,
        )
        .bind(factura_id)
        .fetch_all(pool)
        .await
    }

    pub async fn with_items(
        pool: &SqlitePool,
        factura: Factura,
    ) -> Result<FacturaWithItems> {
        let items = Self::find_items(pool, factura.id).await?;
        Ok(FacturaWithItems { factura, items })
    }

    /// Último número usado localmente para (pto_vta, tipo). 0 si no hay.
    pub async fn max_numero(
        pool: &SqlitePool,
        punto_venta: i64,
        tipo: i64,
    ) -> Result<i64> {
        let max: Option<i64> = sqlx::query_scalar(
            "SELECT MAX(numero) FROM facturas WHERE punto_venta = ? AND tipo = ?",
        )
        .bind(punto_venta)
        .bind(tipo)
        .fetch_one(pool)
        .await?;
        Ok(max.unwrap_or(0))
    }

    /// Inserta factura + ítems en una transacción y devuelve el id.
    #[allow(clippy::too_many_arguments)]
    pub async fn create_with_items(
        pool: &SqlitePool,
        fecha: &str,
        punto_venta: i64,
        tipo: i64,
        numero: i64,
        total: f64,
        cae: Option<&str>,
        cae_expiration: Option<&str>,
        resultado: &str,
        dto: &CreateFacturaDto,
    ) -> Result<i64> {
        let mut tx = pool.begin().await?;

        let result = sqlx::query(
            r#"
            INSERT INTO facturas
                (fecha, tipo, punto_venta, numero, total,
                 cae, cae_expiration, resultado, cliente_nombre,
                 cliente_cuit, condicion_iva_receptor_id, created_at)
            VALUES (?, ?, ?, ?, CAST(? AS REAL), ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            "#,
        )
        .bind(fecha)
        .bind(tipo)
        .bind(punto_venta)
        .bind(numero)
        .bind(total)
        .bind(cae)
        .bind(cae_expiration)
        .bind(resultado)
        .bind(&dto.cliente_nombre)
        .bind(dto.cliente_cuit.map(|c| c.to_string()))
        .bind(dto.condicion_iva_receptor_id.map(|c| c as i64))
        .execute(&mut *tx)
        .await?;

        let factura_id = result.last_insert_rowid();

        for item in &dto.items {
            sqlx::query(
                r#"
                INSERT INTO factura_items
                    (factura_id, descripcion, cantidad, precio_unitario, product_id)
                VALUES (?, ?, CAST(? AS REAL), CAST(? AS REAL), ?)
                "#,
            )
            .bind(factura_id)
            .bind(&item.descripcion)
            .bind(item.cantidad)
            .bind(item.precio_unitario)
            .bind(item.product_id)
            .execute(&mut *tx)
            .await?;
        }

        tx.commit().await?;
        Ok(factura_id)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::factura::CreateFacturaItemDto;
    use sqlx::sqlite::{SqliteConnectOptions, SqlitePoolOptions};
    use std::str::FromStr;

    async fn pool_mem() -> SqlitePool {
        let opts = SqliteConnectOptions::from_str("sqlite::memory:")
            .unwrap()
            .create_if_missing(true)
            .foreign_keys(true);
        let pool = SqlitePoolOptions::new()
            .max_connections(1)
            .connect_with(opts)
            .await
            .unwrap();
        sqlx::migrate!("./migrations").run(&pool).await.unwrap();
        pool
    }

    fn dto_ejemplo() -> CreateFacturaDto {
        CreateFacturaDto {
            cliente_nombre: None,
            cliente_cuit: None,
            condicion_iva_receptor_id: None,
            items: vec![
                CreateFacturaItemDto {
                    descripcion: "Tornillo autoperforante".into(),
                    cantidad: 10.0,
                    precio_unitario: 2.5,
                    product_id: None,
                },
                CreateFacturaItemDto {
                    descripcion: "Cable x metro".into(),
                    cantidad: 2.5,
                    precio_unitario: 500.0,
                    product_id: None,
                },
            ],
        }
    }

    #[tokio::test]
    async fn numeracion_local_arranca_en_cero() {
        let pool = pool_mem().await;
        assert_eq!(FacturaRepository::max_numero(&pool, 10, 11).await.unwrap(), 0);
    }

    #[tokio::test]
    async fn crea_recupera_y_numeriza() {
        let pool = pool_mem().await;
        let dto = dto_ejemplo();

        let id = FacturaRepository::create_with_items(
            &pool,
            "2026-08-22",
            10,
            11,
            1,
            1275.0,
            Some("12345678901234"),
            Some("20260901"),
            "A",
            &dto,
        )
        .await
        .expect("debe insertar");

        let factura = FacturaRepository::find_by_id(&pool, id)
            .await
            .unwrap()
            .expect("debe existir");
        assert_eq!(factura.numero, 1);
        assert_eq!(factura.punto_venta, 10);
        assert_eq!(factura.tipo, 11);
        assert_eq!(factura.cae.as_deref(), Some("12345678901234"));
        assert_eq!(factura.resultado, "A");
        assert!((factura.total - 1275.0).abs() < 0.001);

        let completa = FacturaRepository::with_items(&pool, factura).await.unwrap();
        assert_eq!(completa.items.len(), 2);
        assert_eq!(completa.items[0].descripcion, "Tornillo autoperforante");
        assert_eq!(completa.items[1].cantidad, 2.5);

        assert_eq!(
            FacturaRepository::max_numero(&pool, 10, 11).await.unwrap(),
            1
        );
        // Otro pto/tipo no comparte numeración
        assert_eq!(
            FacturaRepository::max_numero(&pool, 10, 1).await.unwrap(),
            0
        );
    }

    #[tokio::test]
    async fn numero_duplicado_rechazado() {
        let pool = pool_mem().await;
        let dto = dto_ejemplo();

        FacturaRepository::create_with_items(
            &pool, "2026-08-22", 10, 11, 1, 100.0, None, None, "A", &dto,
        )
        .await
        .unwrap();

        let segunda = FacturaRepository::create_with_items(
            &pool, "2026-08-22", 10, 11, 1, 100.0, None, None, "A", &dto,
        )
        .await;

        assert!(segunda.is_err(), "el UNIQUE(punto_venta,tipo,numero) debe frenar duplicados");
    }
}
