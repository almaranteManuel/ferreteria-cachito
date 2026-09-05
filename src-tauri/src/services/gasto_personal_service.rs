use crate::models::gasto_personal::{CATEGORIAS_VALIDAS, CreateGastoPersonalDto, GastoPersonal};
use crate::repositories::gasto_personal_repo::GastoPersonalRepository;
use sqlx::SqlitePool;

pub struct GastoPersonalService;

impl GastoPersonalService {
    fn validar(dto: &CreateGastoPersonalDto) -> Result<(), String> {
        if dto.fecha.trim().is_empty() {
            return Err("La fecha es obligatoria".into());
        }
        if dto.descripcion.trim().is_empty() {
            return Err("La descripción es obligatoria".into());
        }
        if dto.monto <= 0.0 {
            return Err("El monto debe ser mayor a cero".into());
        }
        if !CATEGORIAS_VALIDAS.contains(&dto.categoria.trim()) {
            return Err(format!("Categoría inválida: {}", dto.categoria));
        }
        Ok(())
    }

    pub async fn crear(pool: &SqlitePool, dto: CreateGastoPersonalDto) -> Result<GastoPersonal, String> {
        Self::validar(&dto)?;
        let id = GastoPersonalRepository::create(pool, &dto)
            .await
            .map_err(|e| format!("Error al guardar gasto: {}", e))?;
        GastoPersonalRepository::find_by_id(pool, id)
            .await
            .map_err(|e| e.to_string())?
            .ok_or_else(|| "Gasto creado pero no encontrado".to_string())
    }

    pub async fn listar(pool: &SqlitePool, limit: i64) -> Result<Vec<GastoPersonal>, String> {
        GastoPersonalRepository::list_recent(pool, limit)
            .await
            .map_err(|e| format!("Error al listar gastos: {}", e))
    }

    pub async fn listar_por_rango(
        pool: &SqlitePool,
        start: &str,
        end: &str,
    ) -> Result<Vec<GastoPersonal>, String> {
        GastoPersonalRepository::list_by_date_range(pool, start, end)
            .await
            .map_err(|e| format!("Error al listar gastos por rango de fechas: {}", e))
    }

    pub async fn eliminar(pool: &SqlitePool, id: i64) -> Result<(), String> {
        let ok = GastoPersonalRepository::delete(pool, id)
            .await
            .map_err(|e| format!("Error al eliminar gasto: {}", e))?;
        if !ok {
            return Err(format!("Gasto {} no encontrado", id));
        }
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::gasto_personal::CreateGastoPersonalDto;

    #[test]
    fn valida_campos() {
        let dto = CreateGastoPersonalDto { fecha: "".into(), monto: 100.0, descripcion: "x".into(), categoria: "IMPUESTO".into() };
        assert!(GastoPersonalService::validar(&dto).is_err());
        let dto = CreateGastoPersonalDto { fecha: "2026-09-03".into(), monto: 0.0, descripcion: "x".into(), categoria: "IMPUESTO".into() };
        assert!(GastoPersonalService::validar(&dto).is_err());
        let dto = CreateGastoPersonalDto { fecha: "2026-09-03".into(), monto: 100.0, descripcion: "".into(), categoria: "IMPUESTO".into() };
        assert!(GastoPersonalService::validar(&dto).is_err());
        let dto = CreateGastoPersonalDto { fecha: "2026-09-03".into(), monto: 100.0, descripcion: "x".into(), categoria: "INVALIDA".into() };
        assert!(GastoPersonalService::validar(&dto).is_err());
        let dto = CreateGastoPersonalDto { fecha: "2026-09-03".into(), monto: 100.0, descripcion: "luz".into(), categoria: "OTRO".into() };
        assert!(GastoPersonalService::validar(&dto).is_ok());
    }
}
