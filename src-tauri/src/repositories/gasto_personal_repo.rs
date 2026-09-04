use crate::models::gasto_personal::{CreateGastoPersonalDto, GastoPersonal};
use sqlx::{Result, SqlitePool};

pub struct GastoPersonalRepository;

impl GastoPersonalRepository {
    pub async fn list_recent(pool: &SqlitePool, limit: i64) -> Result<Vec<GastoPersonal>> {
        sqlx::query_as::<_, GastoPersonal>(
            "SELECT id, fecha, CAST(monto AS REAL) AS monto, descripcion, categoria, created_at
             FROM gastos_personales ORDER BY fecha DESC, id DESC LIMIT ?",
        )
        .bind(limit)
        .fetch_all(pool)
        .await
    }

    pub async fn total_by_year(pool: &SqlitePool, year: i32) -> Result<f64> {
        let pattern = format!("{}%", year);
        let total: Option<f64> = sqlx::query_scalar(
            "SELECT SUM(CAST(monto AS REAL)) FROM gastos_personales WHERE fecha LIKE ?",
        )
        .bind(pattern)
        .fetch_one(pool)
        .await?;
        Ok(total.unwrap_or(0.0))
    }

    pub async fn create(pool: &SqlitePool, dto: &CreateGastoPersonalDto) -> Result<i64> {
        let result = sqlx::query(
            "INSERT INTO gastos_personales (fecha, monto, descripcion, categoria) VALUES (?, CAST(? AS REAL), ?, ?)",
        )
        .bind(&dto.fecha)
        .bind(dto.monto)
        .bind(dto.descripcion.trim())
        .bind(dto.categoria.trim())
        .execute(pool)
        .await?;
        Ok(result.last_insert_rowid())
    }

    pub async fn find_by_id(pool: &SqlitePool, id: i64) -> Result<Option<GastoPersonal>> {
        sqlx::query_as::<_, GastoPersonal>(
            "SELECT id, fecha, CAST(monto AS REAL) AS monto, descripcion, categoria, created_at FROM gastos_personales WHERE id = ?",
        )
        .bind(id)
        .fetch_optional(pool)
        .await
    }

    pub async fn delete(pool: &SqlitePool, id: i64) -> Result<bool> {
        let res = sqlx::query("DELETE FROM gastos_personales WHERE id = ?")
            .bind(id)
            .execute(pool)
            .await?;
        Ok(res.rows_affected() > 0)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::gasto_personal::CreateGastoPersonalDto;
    use sqlx::sqlite::{SqliteConnectOptions, SqlitePoolOptions};
    use std::str::FromStr;

    async fn pool_mem() -> SqlitePool {
        let opts = SqliteConnectOptions::from_str("sqlite::memory:")
            .unwrap()
            .create_if_missing(true)
            .foreign_keys(true);
        let pool = SqlitePoolOptions::new().max_connections(1).connect_with(opts).await.unwrap();
        sqlx::migrate!("./migrations").run(&pool).await.unwrap();
        pool
    }

    #[tokio::test]
    async fn crea_lista_total_elimina() {
        let pool = pool_mem().await;
        let dto = CreateGastoPersonalDto {
            fecha: "2026-09-03".into(),
            monto: 15000.0,
            descripcion: "Impuesto municipal".into(),
            categoria: "IMPUESTO".into(),
        };
        let id = GastoPersonalRepository::create(&pool, &dto).await.unwrap();
        let found = GastoPersonalRepository::find_by_id(&pool, id).await.unwrap().unwrap();
        assert_eq!(found.monto, 15000.0);
        assert_eq!(found.categoria, "IMPUESTO");
        assert_eq!(GastoPersonalRepository::total_by_year(&pool, 2026).await.unwrap(), 15000.0);
        assert!(GastoPersonalRepository::delete(&pool, id).await.unwrap());
        assert!(GastoPersonalRepository::find_by_id(&pool, id).await.unwrap().is_none());
    }
}
