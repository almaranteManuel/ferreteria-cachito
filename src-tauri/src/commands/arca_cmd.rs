use crate::arca::config::{self, EstadoCredenciales};
use crate::arca::ArcaState;
use serde::Serialize;
use tauri::{AppHandle, State};

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EstadoArca {
    pub ambiente: String,
    pub cuit: u64,
    pub punto_venta: u32,
    pub dir_arca: String,
    pub credenciales: Option<EstadoCredenciales>,
    pub mensaje: Option<String>,
}

/// Info del TA segura para el frontend: jamás incluye token/sign.
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TaInfo {
    pub generation_time: String,
    pub expiration_time: String,
    pub minutos_restantes: i64,
}

#[tauri::command]
pub async fn estado_config(app: AppHandle) -> Result<EstadoArca, String> {
    let cfg = config::load_or_create(&app).map_err(|e| e.to_string())?;
    let paths = config::paths(&app).map_err(|e| e.to_string())?;

    let (credenciales, mensaje) = match config::verificar_credenciales(&app) {
        Ok(c) => (Some(c), None),
        Err(e) => (None, Some(e.to_string())),
    };

    Ok(EstadoArca {
        ambiente: cfg.ambiente.as_str().to_string(),
        cuit: cfg.cuit,
        punto_venta: cfg.punto_venta,
        dir_arca: paths.dir_arca.display().to_string(),
        credenciales,
        mensaje,
    })
}

#[tauri::command]
pub async fn wsaa_login(app: AppHandle, arca: State<'_, ArcaState>) -> Result<TaInfo, String> {
    let cfg = config::load_or_create(&app).map_err(|e| e.to_string())?;
    let paths = config::paths(&app).map_err(|e| e.to_string())?;
    let url_wsaa = cfg.ambiente.wsaa_url().map_err(|e| e.to_string())?;

    let ta = arca
        .ta_valido(&paths, url_wsaa, "wsfe")
        .await
        .map_err(|e| e.to_string())?;

    Ok(TaInfo {
        generation_time: ta.generation_time.to_rfc3339(),
        expiration_time: ta.expiration_time.to_rfc3339(),
        minutos_restantes: ta.minutos_restantes(),
    })
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WsfePing {
    pub app_server: String,
    pub auth_server: String,
    pub db_server: String,
}

#[tauri::command]
pub async fn wsfe_ping(app: AppHandle) -> Result<WsfePing, String> {
    let cfg = config::load_or_create(&app).map_err(|e| e.to_string())?;
    let url_wsfe = cfg.ambiente.wsfe_url().map_err(|e| e.to_string())?;

    let cliente = crate::arca::soap::SoapClient::new(std::time::Duration::from_secs(30))
        .map_err(|e| e.to_string())?;
    let estado = crate::arca::wsfe::fedummy(&cliente, url_wsfe)
        .await
        .map_err(|e| e.to_string())?;

    Ok(WsfePing {
        app_server: estado.app_server,
        auth_server: estado.auth_server,
        db_server: estado.db_server,
    })
}
