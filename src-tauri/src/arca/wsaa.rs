use crate::arca::config::ArcaPaths;
use crate::arca::error::{ArcaError, ArcaResult};
use crate::arca::models::Ta;
use crate::arca::soap::SoapClient;
use openssl::pkcs7::{Pkcs7, Pkcs7Flags};
use openssl::pkey::PKey;
use openssl::stack::Stack;
use openssl::x509::X509;
use std::fs;
use std::path::Path;

/// Firma `contenido` como PKCS#7/CMS signedData DER con contenido embebido
/// (equivalente a: openssl smime -sign -binary -nodetach -outform DER).
/// Es exactamente el formato que WSAA espera en LoginCms.
pub fn firmar_cms(cert_pem: &[u8], clave_pem: &[u8], contenido: &[u8]) -> ArcaResult<Vec<u8>> {
    let cert = X509::from_pem(cert_pem)
        .map_err(|e| ArcaError::Credenciales(format!("certificado.pem inválido: {e}")))?;
    let clave = PKey::private_key_from_pem(clave_pem)
        .map_err(|e| ArcaError::Credenciales(format!("privada.key inválida: {e}")))?;

    let cadena = Stack::<X509>::new()?;

    let pkcs7 = Pkcs7::sign(&cert, &clave, &cadena, contenido, Pkcs7Flags::BINARY)?;

    Ok(pkcs7.to_der()?)
}

/// Flujo WSAA completo: LTR → CMS → LoginCms → TA parseado.
pub async fn obtener_ta(
    cliente: &SoapClient,
    url_wsaa: &str,
    paths: &ArcaPaths,
    service: &str,
) -> ArcaResult<Ta> {
    let cert_pem = fs::read(&paths.certificado)?;
    let clave_pem = fs::read(&paths.clave_privada)?;

    let ltr = crate::arca::xml::build_login_ticket_request(service)?;
    let cms = firmar_cms(&cert_pem, &clave_pem, ltr.as_bytes())?;

    let ta_xml = cliente.login_cms(url_wsaa, &cms).await?;
    let ta = Ta::parse_login_ticket_response(&ta_xml)?;

    guardar_ta(paths, service, &ta_xml)?;
    Ok(ta)
}

/// Guarda el loginTicketResponse en disco (contiene token/sign:
/// queda en app_data_dir con permisos del usuario, nunca en el repo).
pub fn guardar_ta(paths: &ArcaPaths, service: &str, ta_xml: &str) -> ArcaResult<()> {
    fs::write(ta_path_de(paths, service), ta_xml)?;
    Ok(())
}

fn ta_path_de(paths: &ArcaPaths, service: &str) -> std::path::PathBuf {
    // Un archivo de TA por servicio (TA_wsfe.xml, TA_ws_sr_padron_a5.xml...).
    paths.dir_arca.join(format!("TA_{service}.xml"))
}

/// Carga un TA previamente persistido, si existe y es válido.
pub fn cargar_ta(paths: &ArcaPaths, service: &str) -> Option<Ta> {
    let ruta = ta_path_de(paths, service);
    if !ruta.exists() {
        return None;
    }
    let xml = fs::read_to_string(&ruta).ok()?;
    match Ta::parse_login_ticket_response(&xml) {
        Ok(ta) => Some(ta),
        Err(_) => {
            // TA corrupto: lo borramos para forzar renovación limpia.
            let _ = fs::remove_file(ruta);
            None
        }
    }
}

pub fn borrar_ta_si_existe(ruta: &Path) {
    let _ = fs::remove_file(ruta);
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::arca::testing::{dir_test, generar_clave, self_signed_para};
    use std::fs;
    use std::process::Command;

    /// Verifica el CMS con el binario openssl del sistema (misma herramienta
    /// usada en la prueba manual) extrayendo el contenido embebido y
    /// comprobando la firma contra el XML original.
    #[test]
    fn cms_roundtrip_con_openssl_cli() {
        let base = dir_test("cms");
        let clave = generar_clave();
        let cert = self_signed_para("test-cms", &clave);

        let ltr = crate::arca::xml::build_login_ticket_request("wsfe").unwrap();
        let cms = firmar_cms(&cert.to_pem().unwrap(), &clave.private_key_to_pem_pkcs8().unwrap(), ltr.as_bytes())
            .expect("la firma debe funcionar");

        assert!(Pkcs7::from_der(&cms).is_ok());

        let ruta_xml = base.join("ltr.xml");
        let ruta_cms = base.join("cms.der");
        let ruta_out = base.join("extraido.xml");
        fs::write(&ruta_xml, &ltr).unwrap();
        fs::write(&ruta_cms, &cms).unwrap();

        let salida = Command::new("openssl")
            .args([
                "cms",
                "-verify",
                "-inform",
                "DER",
                "-noverify",
                "-in",
                ruta_cms.to_str().unwrap(),
                "-out",
                ruta_out.to_str().unwrap(),
            ])
            .output()
            .expect("debe poder ejecutar openssl");

        assert!(
            salida.status.success(),
            "openssl cms -verify falló: {}",
            String::from_utf8_lossy(&salida.stderr)
        );

        let extraido = fs::read_to_string(&ruta_out).unwrap();
        assert_eq!(extraido, ltr);
    }

    #[test]
    fn firma_rechaza_clave_que_no_corresponde_al_cert() {
        let clave_cert = generar_clave();
        let clave_firma = generar_clave();
        let cert = self_signed_para("mismatch", &clave_cert);

        let resultado = firmar_cms(
            &cert.to_pem().unwrap(),
            &clave_firma.private_key_to_pem_pkcs8().unwrap(),
            b"contenido",
        );

        assert!(
            resultado.is_err(),
            "PKCS7_sign debe rechazar una clave que no corresponde al certificado"
        );
    }

    /// Smoke test con credenciales reales de homologación.
    /// Se ignora por defecto; se corre con: cargo test --lib arca::wsaa -- --ignored
    /// Escribe el CMS generado en /tmp/opencode para inspección manual.
    #[test]
    #[ignore]
    fn cms_con_credenciales_reales_de_homologacion() {
        let home = std::env::var("HOME").expect("HOME no definido");
        let creds_dir = std::path::PathBuf::from(home)
            .join(".local/share/com.almar.cachito/arca");
        if !creds_dir.join("certificado.pem").exists() {
            eprintln!("sin credenciales reales en {creds_dir:?}; se omite");
            return;
        }

        let cert_pem = fs::read(creds_dir.join("certificado.pem")).unwrap();
        let clave_pem = fs::read(creds_dir.join("privada.key")).unwrap();
        let ltr = crate::arca::xml::build_login_ticket_request("wsfe").unwrap();

        let cms =
            firmar_cms(&cert_pem, &clave_pem, ltr.as_bytes()).expect("firma real debe funcionar");

        let out_dir = std::path::PathBuf::from("/tmp/opencode");
        fs::create_dir_all(&out_dir).unwrap();
        fs::write(out_dir.join("arca-ltr.xml"), &ltr).unwrap();
        fs::write(out_dir.join("arca-nuestro.cms"), &cms).unwrap();

        println!("CMS real generado en {}/arca-nuestro.cms", out_dir.display());
    }

    /// Integración real contra WSAA de homologación (misma prueba manual).
    /// Se ignora por defecto: cargo test --lib arca::wsaa -- --ignored
    /// NO imprime token/sign; solo verifica vigencia del TA.
    #[tokio::test]
    #[ignore]
    async fn wsaa_login_real_homologacion() {
        let home = std::env::var("HOME").expect("HOME no definido");
        let creds = std::path::PathBuf::from(home).join(".local/share/com.almar.cachito/arca");
        if !creds.join("certificado.pem").exists() {
            eprintln!("sin credenciales reales; se omite");
            return;
        }

        let paths = ArcaPaths {
            dir_arca: creds.clone(),
            config_json: creds.join("config.json"),
            certificado: creds.join("certificado.pem"),
            clave_privada: creds.join("privada.key"),
        };

        let cliente = SoapClient::new(std::time::Duration::from_secs(30)).unwrap();
        let ta = obtener_ta(&cliente, "https://wsaahomo.afip.gov.ar/ws/services/LoginCms", &paths, "wsfe")
            .await
            .expect("WSAA homologación debe responder OK");

        // El TA dura ~12 horas (720 minutos)
        let minutos = ta.minutos_restantes();
        assert!(
            (600..=720).contains(&minutos),
            "vigencia inesperada: {minutos} minutos"
        );

        // Persistencia roundtrip
        let ta_disco = cargar_ta(&paths, "wsfe").expect("TA recién guardado debe cargarse");
        assert_eq!(ta_disco.expiration_time, ta.expiration_time);

        println!(
            "TA OK: expira en {} minutos ({}), sin exponer credenciales",
            minutos, ta.expiration_time
        );
    }
}
