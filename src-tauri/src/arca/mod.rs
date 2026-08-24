pub mod config;
pub mod error;
pub mod models;
pub mod soap;
pub mod wsaa;
pub mod wsfe;
pub mod xml;

#[cfg(test)]
pub mod testing;

use crate::arca::config::ArcaPaths;
use crate::arca::models::Ta;

/// Margen antes de la expiración del TA para considerar renovar.
pub const MARGEN_TA_MINUTOS: i64 = 10;

/// Estado ARCA gestionado por Tauri junto al pool SQLite.
/// Mantiene un cliente HTTP reutilizable y el TA cacheado.
pub struct ArcaState {
    pub cliente: soap::SoapClient,
    ta: tokio::sync::Mutex<Option<Ta>>,
}

impl ArcaState {
    pub fn new() -> error::ArcaResult<Self> {
        Ok(Self {
            cliente: soap::SoapClient::new(std::time::Duration::from_secs(30))?,
            ta: tokio::sync::Mutex::new(None),
        })
    }

    /// Devuelve un TA vigente: memoria → disco → renovación contra WSAA.
    pub async fn ta_valido(
        &self,
        paths: &ArcaPaths,
        url_wsaa: &str,
        service: &str,
    ) -> error::ArcaResult<Ta> {
        let mut guard = self.ta.lock().await;

        if let Some(ta) = guard.as_ref() {
            if ta.esta_vigente(MARGEN_TA_MINUTOS) {
                return Ok(ta.clone());
            }
        }

        if let Some(ta) = wsaa::cargar_ta(paths) {
            if ta.esta_vigente(MARGEN_TA_MINUTOS) {
                *guard = Some(ta.clone());
                return Ok(ta);
            }
        }

        let ta = wsaa::obtener_ta(&self.cliente, url_wsaa, paths, service).await?;
        *guard = Some(ta.clone());
        Ok(ta)
    }
}
