use crate::models::presupuesto::{CreatePresupuestoDto, Presupuesto, PresupuestoWithItems};
use crate::repositories::presupuesto_repo::PresupuestoRepository;
use sqlx::SqlitePool;

pub struct PresupuestoService;

impl PresupuestoService {
    fn validar_dto(dto: &CreatePresupuestoDto) -> Result<(), String> {
        if dto.fecha.trim().is_empty() {
            return Err("La fecha es obligatoria".into());
        }
        // Valida formato YYYY-MM-DD simple
        if dto.fecha.len() != 10 || dto.fecha.chars().nth(4) != Some('-') {
            return Err("Fecha inválida, use YYYY-MM-DD".into());
        }
        if dto.items.is_empty() {
            return Err("El presupuesto debe tener al menos un ítem".into());
        }
        let mut total = 0.0;
        for item in &dto.items {
            if item.descripcion.trim().is_empty() {
                return Err("Todo ítem necesita una descripción".into());
            }
            if item.cantidad <= 0.0 {
                return Err(format!(
                    "Cantidad inválida para '{}': debe ser mayor a cero",
                    item.descripcion.trim()
                ));
            }
            if item.precio_unitario < 0.0 {
                return Err(format!(
                    "Precio inválido para '{}': no puede ser negativo",
                    item.descripcion.trim()
                ));
            }
            total += item.cantidad * item.precio_unitario;
        }
        if total <= 0.0 {
            return Err("El total debe ser mayor a cero".into());
        }
        Ok(())
    }

    fn calcular_total(dto: &CreatePresupuestoDto) -> f64 {
        dto.items
            .iter()
            .map(|i| i.cantidad * i.precio_unitario)
            .sum()
    }

    pub async fn crear(
        pool: &SqlitePool,
        dto: CreatePresupuestoDto,
    ) -> Result<PresupuestoWithItems, String> {
        Self::validar_dto(&dto)?;
        let total = Self::calcular_total(&dto);
        let id = PresupuestoRepository::create_with_items(pool, &dto, total)
            .await
            .map_err(|e| format!("Error al guardar presupuesto: {}", e))?;
        let presupuesto = PresupuestoRepository::find_by_id(pool, id)
            .await
            .map_err(|e| e.to_string())?
            .ok_or_else(|| "Presupuesto guardado pero no encontrado".to_string())?;
        PresupuestoRepository::with_items(pool, presupuesto)
            .await
            .map_err(|e| e.to_string())
    }

    pub async fn listar(pool: &SqlitePool, limit: i64) -> Result<Vec<Presupuesto>, String> {
        PresupuestoRepository::list_recent(pool, limit)
            .await
            .map_err(|e| format!("Error al listar presupuestos: {}", e))
    }

    pub async fn obtener(pool: &SqlitePool, id: i64) -> Result<PresupuestoWithItems, String> {
        let p = PresupuestoRepository::find_by_id(pool, id)
            .await
            .map_err(|e| format!("Error al obtener presupuesto: {}", e))?
            .ok_or_else(|| format!("Presupuesto {} no encontrado", id))?;
        PresupuestoRepository::with_items(pool, p)
            .await
            .map_err(|e| format!("Error al obtener ítems: {}", e))
    }

    pub async fn eliminar(pool: &SqlitePool, id: i64) -> Result<(), String> {
        let deleted = PresupuestoRepository::delete(pool, id)
            .await
            .map_err(|e| format!("Error al eliminar presupuesto: {}", e))?;
        if !deleted {
            return Err(format!("Presupuesto {} no encontrado", id));
        }
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::presupuesto::CreatePresupuestoItemDto;

    fn item(desc: &str, cant: f64, precio: f64) -> CreatePresupuestoItemDto {
        CreatePresupuestoItemDto {
            descripcion: desc.into(),
            cantidad: cant,
            precio_unitario: precio,
            product_id: None,
            code: None,
        }
    }

    #[test]
    fn valida_items_vacios() {
        let dto = CreatePresupuestoDto {
            fecha: "2026-09-03".into(),
            cliente_nombre: None,
            items: vec![],
        };
        assert!(PresupuestoService::validar_dto(&dto).is_err());
    }

    #[test]
    fn valida_descripcion_vacia() {
        let dto = CreatePresupuestoDto {
            fecha: "2026-09-03".into(),
            cliente_nombre: None,
            items: vec![item("   ", 1.0, 100.0)],
        };
        assert!(PresupuestoService::validar_dto(&dto).is_err());
    }

    #[test]
    fn valida_cantidad_y_precio() {
        let dto = CreatePresupuestoDto {
            fecha: "2026-09-03".into(),
            cliente_nombre: None,
            items: vec![item("Tornillos", 0.0, 100.0)],
        };
        assert!(PresupuestoService::validar_dto(&dto).is_err());

        let dto = CreatePresupuestoDto {
            fecha: "2026-09-03".into(),
            cliente_nombre: None,
            items: vec![item("Tornillos", 2.0, -5.0)],
        };
        assert!(PresupuestoService::validar_dto(&dto).is_err());
    }

    #[test]
    fn acepta_items_validos() {
        let dto = CreatePresupuestoDto {
            fecha: "2026-09-03".into(),
            cliente_nombre: Some("Cliente".into()),
            items: vec![item("A", 2.0, 500.0), item("B", 1.0, 100.0)],
        };
        assert!(PresupuestoService::validar_dto(&dto).is_ok());
        assert!((PresupuestoService::calcular_total(&dto) - 1100.0).abs() < 0.01);
    }
}
