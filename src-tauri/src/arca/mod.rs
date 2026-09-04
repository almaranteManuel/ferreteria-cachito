pub mod config;
pub mod error;
pub mod models;
pub mod padron;
pub mod soap;
pub mod wsaa;
pub mod wsfe;
pub mod xml;

#[cfg(test)]
pub mod testing;

use crate::arca::config::ArcaPaths;
use crate::arca::models::Ta;
use std::collections::HashMap;

/// Margen antes de la expiración del TA para considerar renovar.
pub const MARGEN_TA_MINUTOS: i64 = 10;

/// Estado ARCA gestionado por Tauri junto al pool SQLite.
/// Mantiene un cliente HTTP reutilizable y un TA cacheado por servicio
/// (wsfe, ws_sr_padron_a5, ...).
pub struct ArcaState {
    pub cliente: soap::SoapClient,
    tas: tokio::sync::Mutex<HashMap<String, Ta>>,
}

impl ArcaState {
    pub fn new() -> error::ArcaResult<Self> {
        Ok(Self {
            cliente: soap::SoapClient::new(std::time::Duration::from_secs(30))?,
            tas: tokio::sync::Mutex::new(HashMap::new()),
        })
    }

    /// Devuelve un TA vigente para el servicio pedido:
    /// memoria → disco → renovación contra WSAA.
    pub async fn ta_valido(
        &self,
        paths: &ArcaPaths,
        url_wsaa: &str,
        service: &str,
    ) -> error::ArcaResult<Ta> {
        let mut guard = self.tas.lock().await;

        if let Some(ta) = guard.get(service) {
            if ta.esta_vigente(MARGEN_TA_MINUTOS) {
                return Ok(ta.clone());
            }
        }

        if let Some(ta) = wsaa::cargar_ta(paths, service) {
            if ta.esta_vigente(MARGEN_TA_MINUTOS) {
                guard.insert(service.to_string(), ta.clone());
                return Ok(ta);
            }
        }

        let ta = wsaa::obtener_ta(&self.cliente, url_wsaa, paths, service).await?;
        guard.insert(service.to_string(), ta.clone());
        Ok(ta)
    }
}
