use crate::models::presupuesto::{
    CreatePresupuestoDto, Presupuesto, PresupuestoItem, PresupuestoWithItems,
};
use sqlx::{Result, SqlitePool};

pub struct PresupuestoRepository;

impl PresupuestoRepository {
    const SELECT: &'static str = r#"
        SELECT id, fecha, cliente_nombre,
               CAST(total AS REAL) AS total, created_at
        FROM presupuestos
    "#;

    pub async fn find_by_id(pool: &SqlitePool, id: i64) -> Result<Option<Presupuesto>> {
        let query = format!("{} WHERE id = ?", Self::SELECT);
        sqlx::query_as::<_, Presupuesto>(&query)
            .bind(id)
            .fetch_optional(pool)
            .await
    }

    pub async fn list_recent(pool: &SqlitePool, limit: i64) -> Result<Vec<Presupuesto>> {
        let query = format!("{} ORDER BY fecha DESC, id DESC LIMIT ?", Self::SELECT);
        sqlx::query_as::<_, Presupuesto>(&query)
            .bind(limit)
            .fetch_all(pool)
            .await
    }

    pub async fn find_items(pool: &SqlitePool, presupuesto_id: i64) -> Result<Vec<PresupuestoItem>> {
        sqlx::query_as::<_, PresupuestoItem>(
            r#"
            SELECT id, presupuesto_id, descripcion,
                   CAST(cantidad AS REAL) AS cantidad,
                   CAST(precio_unitario AS REAL) AS precio_unitario,
                   product_id, code
            FROM presupuesto_items
            WHERE presupuesto_id = ?
            ORDER BY id
            "#,
        )
        .bind(presupuesto_id)
        .fetch_all(pool)
        .await
    }

    pub async fn with_items(
        pool: &SqlitePool,
        presupuesto: Presupuesto,
    ) -> Result<PresupuestoWithItems> {
        let items = Self::find_items(pool, presupuesto.id).await?;
        Ok(PresupuestoWithItems {
            presupuesto,
            items,
        })
    }

    pub async fn create_with_items(
        pool: &SqlitePool,
        dto: &CreatePresupuestoDto,
        total: f64,
    ) -> Result<i64> {
        let mut tx = pool.begin().await?;

        let result = sqlx::query(
            r#"
            INSERT INTO presupuestos (fecha, cliente_nombre, total, created_at)
            VALUES (?, ?, CAST(? AS REAL), CURRENT_TIMESTAMP)
            "#,
        )
        .bind(&dto.fecha)
        .bind(&dto.cliente_nombre)
        .bind(total)
        .execute(&mut *tx)
        .await?;

        let presupuesto_id = result.last_insert_rowid();

        for item in &dto.items {
            sqlx::query(
                r#"
                INSERT INTO presupuesto_items
                    (presupuesto_id, descripcion, cantidad, precio_unitario, product_id, code)
                VALUES (?, ?, CAST(? AS REAL), CAST(? AS REAL), ?, ?)
                "#,
            )
            .bind(presupuesto_id)
            .bind(item.descripcion.trim())
            .bind(item.cantidad)
            .bind(item.precio_unitario)
            .bind(item.product_id)
            .bind(&item.code)
            .execute(&mut *tx)
            .await?;
        }

        tx.commit().await?;
        Ok(presupuesto_id)
    }

    pub async fn delete(pool: &SqlitePool, id: i64) -> Result<bool> {
        let result = sqlx::query("DELETE FROM presupuestos WHERE id = ?")
            .bind(id)
            .execute(pool)
            .await?;
        Ok(result.rows_affected() > 0)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::presupuesto::{CreatePresupuestoDto, CreatePresupuestoItemDto};
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

    fn dto_ejemplo() -> CreatePresupuestoDto {
        CreatePresupuestoDto {
            fecha: "2026-09-03".into(),
            cliente_nombre: Some("Juan Pérez".into()),
            items: vec![
                CreatePresupuestoItemDto {
                    descripcion: "Tornillo T2".into(),
                    cantidad: 10.0,
                    precio_unitario: 150.0,
                    product_id: None,
                    code: Some("T2-001".into()),
                },
                CreatePresupuestoItemDto {
                    descripcion: "Concepto libre - flete".into(),
                    cantidad: 1.0,
                    precio_unitario: 5000.0,
                    product_id: None,
                    code: None,
                },
            ],
        }
    }

    #[tokio::test]
    async fn crea_y_recupera() {
        let pool = pool_mem().await;
        let dto = dto_ejemplo();
        let total = 6500.0;
        let id = PresupuestoRepository::create_with_items(&pool, &dto, total)
            .await
            .expect("debe insertar");
        let p = PresupuestoRepository::find_by_id(&pool, id)
            .await
            .unwrap()
            .expect("debe existir");
        assert_eq!(p.fecha, "2026-09-03");
        assert_eq!(p.cliente_nombre.as_deref(), Some("Juan Pérez"));
        assert!((p.total - 6500.0).abs() < 0.01);

        let full = PresupuestoRepository::with_items(&pool, p).await.unwrap();
        assert_eq!(full.items.len(), 2);
        assert_eq!(full.items[0].descripcion, "Tornillo T2");
        assert_eq!(full.items[1].code, None);
    }

    #[tokio::test]
    async fn lista_recientes_ordenados() {
        let pool = pool_mem().await;
        for fecha in ["2026-09-01", "2026-09-03", "2026-09-02"] {
            let dto = CreatePresupuestoDto {
                fecha: fecha.into(),
                cliente_nombre: None,
                items: vec![CreatePresupuestoItemDto {
                    descripcion: "x".into(),
                    cantidad: 1.0,
                    precio_unitario: 100.0,
                    product_id: None,
                    code: None,
                }],
            };
            PresupuestoRepository::create_with_items(&pool, &dto, 100.0)
                .await
                .unwrap();
        }
        let list = PresupuestoRepository::list_recent(&pool, 10).await.unwrap();
        assert_eq!(list.len(), 3);
        assert_eq!(list[0].fecha, "2026-09-03");
    }

    #[tokio::test]
    async fn eliminar() {
        let pool = pool_mem().await;
        let dto = dto_ejemplo();
        let id = PresupuestoRepository::create_with_items(&pool, &dto, 6500.0)
            .await
            .unwrap();
        assert!(PresupuestoRepository::delete(&pool, id).await.unwrap());
        assert!(PresupuestoRepository::find_by_id(&pool, id)
            .await
            .unwrap()
            .is_none());
    }
}
