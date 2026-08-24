use crate::arca::models::FacturaCParams;
use crate::arca::{config, wsfe, ArcaState};
use crate::models::factura::{CreateFacturaDto, Factura, FacturaWithItems};
use crate::repositories::factura_repo::FacturaRepository;
use chrono::Local;
use sqlx::SqlitePool;
use tauri::AppHandle;

/// Tipo comprobante fijo de esta etapa: Factura C.
pub const TIPO_FACTURA_C: i64 = 11;

pub struct FacturacionService;

impl FacturacionService {
    fn validar_dto(dto: &CreateFacturaDto) -> Result<(), String> {
        if dto.items.is_empty() {
            return Err("La factura debe tener al menos un ítem".into());
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
            return Err("El total de la factura debe ser mayor a cero".into());
        }

        Ok(())
    }

    fn calcular_total(dto: &CreateFacturaDto) -> f64 {
        dto.items
            .iter()
            .map(|i| i.cantidad * i.precio_unitario)
            .sum()
    }

    /// Emite una Factura C a Consumidor Final contra ARCA y la persiste.
    pub async fn emitir_factura_c(
        pool: &SqlitePool,
        arca: &ArcaState,
        app: &AppHandle,
        dto: CreateFacturaDto,
    ) -> Result<FacturaWithItems, String> {
        Self::validar_dto(&dto)?;

        let cfg = config::load_or_create(app).map_err(|e| e.to_string())?;
        let paths = config::paths(app).map_err(|e| e.to_string())?;
        let url_wsaa = cfg.ambiente.wsaa_url().map_err(|e| e.to_string())?;
        let url_wsfe = cfg.ambiente.wsfe_url().map_err(|e| e.to_string())?;

        let ta = arca
            .ta_valido(&paths, url_wsaa, "wsfe")
            .await
            .map_err(|e| e.to_string())?;

        let punto_venta = cfg.punto_venta as i64;

        // Numeración: preferir lo que dice ARCA; si falla, numeración local.
        // Siempre mayor entre ambos para evitar colisiones locales.
        let max_local =
            FacturaRepository::max_numero(pool, punto_venta, TIPO_FACTURA_C)
                .await
                .map_err(|e| format!("Error consultando numeración local: {}", e))?;

        let numero = match wsfe::comp_ultimo_autorizado(
            &arca.cliente,
            url_wsfe,
            &ta,
            cfg.cuit,
            punto_venta as u32,
            TIPO_FACTURA_C as u16,
        )
        .await
        {
            Ok(ultimo) => std::cmp::max(ultimo.cbte_nro, max_local) + 1,
            Err(_) => max_local + 1,
        };

        let hoy = Local::now();
        let params = FacturaCParams {
            pto_vta: punto_venta as u32,
            numero,
            imp_total: Self::calcular_total(&dto),
            imp_neto: Self::calcular_total(&dto),
            fecha: hoy.format("%Y%m%d").to_string(),
        };

        let respuesta = wsfe::fe_cae_solicitar_factura_c(
            &arca.cliente,
            url_wsfe,
            &ta,
            cfg.cuit,
            &params,
        )
        .await
        .map_err(|e| e.to_string())?;

        if !respuesta.aprobado() {
            let obs: Vec<String> = respuesta
                .observaciones
                .iter()
                .map(|(c, m)| format!("{c}: {m}"))
                .collect();
            return Err(format!(
                "ARCA rechazó la factura (Resultado {}). {}",
                respuesta.resultado,
                obs.join(" | ")
            ));
        }

        let cae = respuesta.cae.as_deref().unwrap_or("");
        let vto = respuesta.cae_fch_vto.as_deref().unwrap_or("");

        let id = FacturaRepository::create_with_items(
            pool,
            &hoy.format("%Y-%m-%d").to_string(),
            punto_venta,
            TIPO_FACTURA_C,
            respuesta.cbte_desde,
            params.imp_total,
            Some(cae),
            Some(vto),
            &respuesta.resultado,
            &dto,
        )
        .await
        .map_err(|e| format!("CAE obtenido pero falló el guardado local: {}", e))?;

        let factura = FacturaRepository::find_by_id(pool, id)
            .await
            .map_err(|e| e.to_string())?
            .ok_or_else(|| "Factura guardada pero no encontrada".to_string())?;

        FacturaRepository::with_items(pool, factura)
            .await
            .map_err(|e| e.to_string())
    }

    pub async fn listar(
        pool: &SqlitePool,
        limit: i64,
    ) -> Result<Vec<Factura>, String> {
        FacturaRepository::list_recent(pool, limit)
            .await
            .map_err(|e| format!("Error al listar facturas: {}", e))
    }

    pub async fn obtener(
        pool: &SqlitePool,
        id: i64,
    ) -> Result<FacturaWithItems, String> {
        let factura = FacturaRepository::find_by_id(pool, id)
            .await
            .map_err(|e| format!("Error al obtener factura: {}", e))?
            .ok_or_else(|| format!("Factura {} no encontrada", id))?;

        FacturaRepository::with_items(pool, factura)
            .await
            .map_err(|e| format!("Error al obtener ítems: {}", e))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::factura::CreateFacturaItemDto;

    fn item(descripcion: &str, cantidad: f64, precio: f64) -> CreateFacturaItemDto {
        CreateFacturaItemDto {
            descripcion: descripcion.into(),
            cantidad,
            precio_unitario: precio,
            product_id: None,
        }
    }

    #[test]
    fn valida_items_vacios() {
        let dto = CreateFacturaDto {
            items: vec![],
            cliente_nombre: None,
        };
        assert!(FacturacionService::validar_dto(&dto).is_err());
    }

    #[test]
    fn valida_descripcion_vacia() {
        let dto = CreateFacturaDto {
            items: vec![item("   ", 1.0, 100.0)],
            cliente_nombre: None,
        };
        assert!(FacturacionService::validar_dto(&dto).is_err());
    }

    #[test]
    fn valida_cantidad_y_precio() {
        let dto = CreateFacturaDto {
            items: vec![item("Tornillos", 0.0, 100.0)],
            cliente_nombre: None,
        };
        assert!(FacturacionService::validar_dto(&dto).is_err());

        let dto = CreateFacturaDto {
            items: vec![item("Tornillos", 2.0, -5.0)],
            cliente_nombre: None,
        };
        assert!(FacturacionService::validar_dto(&dto).is_err());

        let dto = CreateFacturaDto {
            items: vec![item("Tornillos", 3.0, 0.0)],
            cliente_nombre: None,
        };
        assert!(FacturacionService::validar_dto(&dto).is_err());
    }

    #[test]
    fn acepta_items_validos_y_calcula_total() {
        let dto = CreateFacturaDto {
            items: vec![item("Tornillos", 10.0, 2.5), item("Cable x metro", 2.5, 500.0)],
            cliente_nombre: None,
        };
        assert!(FacturacionService::validar_dto(&dto).is_ok());
        let total = FacturacionService::calcular_total(&dto);
        assert!((total - 1275.0).abs() < 0.001);
    }
}
