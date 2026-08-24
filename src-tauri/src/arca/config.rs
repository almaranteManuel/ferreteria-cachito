use crate::arca::error::{ArcaError, ArcaResult};
use openssl::pkey::{PKey, Private};
use openssl::x509::X509;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Ambiente {
    Homologacion,
    Produccion,
}

impl Ambiente {
    pub fn as_str(&self) -> &'static str {
        match self {
            Ambiente::Homologacion => "homologacion",
            Ambiente::Produccion => "produccion",
        }
    }

    pub fn wsaa_url(&self) -> ArcaResult<&'static str> {
        match self {
            Ambiente::Homologacion => Ok("https://wsaahomo.afip.gov.ar/ws/services/LoginCms"),
            Ambiente::Produccion => Err(ArcaError::Config(
                "Producción no habilitada todavía: falta migración explícita".into(),
            )),
        }
    }

    pub fn wsfe_url(&self) -> ArcaResult<&'static str> {
        match self {
            Ambiente::Homologacion => Ok("https://wswhomo.afip.gov.ar/wsfev1/service.asmx"),
            Ambiente::Produccion => Err(ArcaError::Config(
                "Producción no habilitada todavía: falta migración explícita".into(),
            )),
        }
    }
}

impl std::fmt::Display for Ambiente {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(self.as_str())
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(default)]
pub struct ArcaConfig {
    pub cuit: u64,
    pub punto_venta: u32,
    pub ambiente: Ambiente,
}

impl Default for ArcaConfig {
    fn default() -> Self {
        Self {
            cuit: 20_375_625_491,
            punto_venta: 10,
            ambiente: Ambiente::Homologacion,
        }
    }
}

#[derive(Debug, Clone)]
pub struct ArcaPaths {
    pub dir_arca: PathBuf,
    pub config_json: PathBuf,
    pub certificado: PathBuf,
    pub clave_privada: PathBuf,
}

pub fn paths_from_base(base: &std::path::Path) -> ArcaResult<ArcaPaths> {
    let dir = base.join("arca");

    fs::create_dir_all(&dir)?;

    Ok(ArcaPaths {
        dir_arca: dir.clone(),
        config_json: dir.join("config.json"),
        certificado: dir.join("certificado.pem"),
        clave_privada: dir.join("privada.key"),
    })
}

pub fn paths(app: &AppHandle) -> ArcaResult<ArcaPaths> {
    let base = app
        .path()
        .app_data_dir()
        .map_err(|e| ArcaError::Config(format!("No se pudo resolver app_data_dir: {e}")))?;
    paths_from_base(&base)
}

pub fn load_or_create_from_base(base: &std::path::Path) -> ArcaResult<ArcaConfig> {
    let p = paths_from_base(base)?;
    if !p.config_json.exists() {
        let cfg = ArcaConfig::default();
        save_to_paths(&p, &cfg)?;
        return Ok(cfg);
    }

    let raw = fs::read_to_string(&p.config_json)?;
    serde_json::from_str(&raw)
        .map_err(|e| ArcaError::Config(format!("config.json inválido: {e}")))
}

pub fn load_or_create(app: &AppHandle) -> ArcaResult<ArcaConfig> {
    load_or_create_from_base(
        &app.path()
            .app_data_dir()
            .map_err(|e| ArcaError::Config(format!("No se pudo resolver app_data_dir: {e}")))?,
    )
}

pub fn save_to_paths(p: &ArcaPaths, cfg: &ArcaConfig) -> ArcaResult<()> {
    let json = serde_json::to_string_pretty(cfg)
        .map_err(|e| ArcaError::Config(format!("No se pudo serializar la config: {e}")))?;
    fs::write(&p.config_json, json)?;
    Ok(())
}

pub fn save(app: &AppHandle, cfg: &ArcaConfig) -> ArcaResult<()> {
    save_to_paths(&paths(app)?, cfg)
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EstadoCredenciales {
    pub existe_certificado: bool,
    pub existe_clave: bool,
    pub par_valido: bool,
    pub cert_cn: Option<String>,
}

fn leer_y_parsear_certificado(ruta: &PathBuf) -> ArcaResult<X509> {
    let bytes = fs::read(ruta)?;
    X509::from_pem(&bytes).map_err(|e| {
        ArcaError::Credenciales(format!("certificado.pem no es un PEM válido: {e}"))
    })
}

fn leer_y_parsear_clave(ruta: &PathBuf) -> ArcaResult<PKey<Private>> {
    let bytes = fs::read(ruta)?;
    PKey::private_key_from_pem(&bytes)
        .map_err(|e| ArcaError::Credenciales(format!("privada.key inválida: {e}")))
}

/// Compara la clave pública del certificado con la de la clave privada.
/// No expone ningún secreto: solo devuelve un booleano y el CN.
pub fn verificar_credenciales(app: &AppHandle) -> ArcaResult<EstadoCredenciales> {
    verificar_credenciales_en_paths(&paths(app)?)
}

pub fn verificar_credenciales_en_paths(p: &ArcaPaths) -> ArcaResult<EstadoCredenciales> {
    let existe_certificado = p.certificado.exists();
    let existe_clave = p.clave_privada.exists();

    if !existe_certificado || !existe_clave {
        return Ok(EstadoCredenciales {
            existe_certificado,
            existe_clave,
            par_valido: false,
            cert_cn: None,
        });
    }

    let cert = leer_y_parsear_certificado(&p.certificado)?;
    let clave = leer_y_parsear_clave(&p.clave_privada)?;

    let pub_cert = cert.public_key()?.public_key_to_der()?;
    let pub_clave = clave.public_key_to_der()?;

    let cert_cn = cert
        .subject_name()
        .entries_by_nid(openssl::nid::Nid::COMMONNAME)
        .next()
        .and_then(|e| std::str::from_utf8(e.data().as_slice()).ok())
        .map(|s| s.to_string());

    Ok(EstadoCredenciales {
        existe_certificado: true,
        existe_clave: true,
        par_valido: pub_cert == pub_clave,
        cert_cn,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::arca::testing::{dir_test, generar_clave, self_signed_para};

    fn escribir_par(dir: &ArcaPaths, cn: &str) {
        let clave = generar_clave();
        let cert = self_signed_para(cn, &clave);
        fs::write(&dir.certificado, cert.to_pem().unwrap()).unwrap();
        fs::write(&dir.clave_privada, clave.private_key_to_pem_pkcs8().unwrap()).unwrap();
    }

    #[test]
    fn config_default_se_crea_y_carga() {
        let base = dir_test("config");
        assert!(!base.join("arca").join("config.json").exists());

        let cfg = load_or_create_from_base(&base).expect("debe crear config default");
        assert_eq!(cfg.cuit, 20_375_625_491);
        assert_eq!(cfg.punto_venta, 10);
        assert_eq!(cfg.ambiente, Ambiente::Homologacion);

        let cfg2 = load_or_create_from_base(&base).expect("debe recargar");
        assert_eq!(cfg2.cuit, cfg.cuit);
    }

    #[test]
    fn par_cert_clave_valido_se_detecta() {
        let base = dir_test("par-ok");
        let paths = paths_from_base(&base).unwrap();
        escribir_par(&paths, "test-par-ok");

        let estado = verificar_credenciales_en_paths(&paths).unwrap();
        assert!(estado.existe_certificado && estado.existe_clave);
        assert!(estado.par_valido);
        assert_eq!(estado.cert_cn.as_deref(), Some("test-par-ok"));
    }

    #[test]
    fn par_mezclado_no_valida() {
        let base_a = dir_test("par-a");
        let base_b = dir_test("par-b");

        let pa = paths_from_base(&base_a).unwrap();
        let pb = paths_from_base(&base_b).unwrap();
        escribir_par(&pa, "test-a");
        escribir_par(&pb, "test-b");

        let mezclado = ArcaPaths {
            certificado: pa.certificado.clone(),
            clave_privada: pb.clave_privada.clone(),
            ..pa.clone()
        };

        let estado = verificar_credenciales_en_paths(&mezclado).unwrap();
        assert!(!estado.par_valido);
    }
}
