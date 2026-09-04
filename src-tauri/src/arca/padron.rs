use crate::arca::error::{ArcaError, ArcaResult};
use crate::arca::models::Ta;
use crate::arca::soap::SoapClient;

/// Servicio de consulta Padrón Alcance 5 (datos del contribuyente).
pub const NS_PADRON_A5: &str = "http://a5.soap.ws.server.puc.sr/";
pub const SERVICIO_PADRON_A5: &str = "ws_sr_padron_a5";

#[derive(Debug, Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PersonaArca {
    pub cuit: u64,
    pub denominacion: String,
    /// FISICA | JURIDICA
    pub tipo_persona: String,
    /// ACTIVO | INACTIVO | etc.
    pub estado: String,
    /// CondicionIVAReceptorId para WSFEv1: 1 inscripto, 4 exento, 6 monotributo, 5 CF.
    pub condicion_iva_receptor_id: u8,
    pub condicion_iva_desc: String,
    pub domicilio: Option<String>,
}

fn envelope(body_interno: &str) -> String {
    format!(
        r#"<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:a5="{ns}">
    <soapenv:Header/>
    <soapenv:Body>{body}</soapenv:Body>
</soapenv:Envelope>"#,
        ns = NS_PADRON_A5,
        body = body_interno
    )
}

fn extraer(cuerpo: &str, tag: &str) -> ArcaResult<String> {
    crate::arca::xml::extraer_texto_elemento(cuerpo, tag)
}

/// getPersona del Padrón A5: datos de constancia de inscripción.
pub async fn buscar_persona(
    cliente: &SoapClient,
    url_padron: &str,
    ta: &Ta,
    cuit_emisor: u64,
    cuit_buscado: u64,
) -> ArcaResult<PersonaArca> {
    if cuit_buscado < 10_000_000_0 || cuit_buscado > 99_999_999_999 {
        return Err(ArcaError::Config(format!("CUIT inválido: {cuit_buscado}")));
    }

    let env = envelope(&format!(
        r#"<a5:getPersona>
    <token>{token}</token>
    <sign>{sign}</sign>
    <cuitRepresentada>{emisor}</cuitRepresentada>
    <idPersona>{buscado}</idPersona>
</a5:getPersona>"#,
        token = ta.token,
        sign = ta.sign,
        emisor = cuit_emisor,
        buscado = cuit_buscado
    ));

    let cuerpo = cliente.post(url_padron, &env, None).await?;
    chequear_errores_padron(&cuerpo)?;

    parsear_persona(cuit_buscado, &cuerpo)
}

/// El padrón reporta errores como <errors><err><code>/<msg>
/// o <errorConstancia><error><code>/<msg>.
fn chequear_errores_padron(cuerpo: &str) -> ArcaResult<()> {
    if let Some((codigo, mensaje)) = crate::arca::xml::extraer_primer_error(cuerpo) {
        return Err(ArcaError::RechazoArca { codigo, mensaje });
    }
    Ok(())
}

fn parsear_persona(cuit_buscado: u64, cuerpo: &str) -> ArcaResult<PersonaArca> {
    // Si no hay bloque datosGenerales, ARCA devolvió persona inexistente.
    let denominacion_raw = match extraer(cuerpo, "denominacion") {
        Ok(d) => d,
        Err(_) => match extraer(cuerpo, "apellido") {
            Ok(a) => a,
            Err(_) => {
                return Err(ArcaError::RechazoArca {
                    codigo: 0,
                    mensaje: format!(
                        "ARCA no devuelve datos para el CUIT {cuit_buscado} (¿existe?)"
                    ),
                })
            }
        },
    };
    let denominacion = denominacion_raw.trim().to_string();

    let estado = extraer(cuerpo, "estadoClave")
        .or_else(|_| extraer(cuerpo, "estado"))
        .map(|s| s.trim().to_uppercase())
        .unwrap_or_default();

    let tipo_persona = extraer(cuerpo, "tipoPersona")
        .map(|s| s.trim().to_uppercase())
        .unwrap_or_default();

    let domicilio = construir_domicilio(cuerpo);

    // Condición frente al IVA / receptor:
    // - Bloque datosMonotributo presente (sin errorMonotributo) → 6
    // - IVA exento → 4
    // - Resto con categoría conocida → 1 (inscripto)
    // - Sin datos determinables → 5 (consumidor final)
    let es_monotributo =
        cuerpo.contains("datosMonotributo") && !cuerpo.contains("errorMonotributo");
    let cat_iva = extraer(cuerpo, "categoriaIVA")
        .or_else(|_| extraer(cuerpo, "impIva"))
        .map(|s| s.trim().to_uppercase())
        .unwrap_or_default();

    let (cond_id, cond_desc) = if es_monotributo {
        (6u8, "Responsable Monotributo".to_string())
    } else if cat_iva.contains("EX") || cat_iva.contains("EXENTO") {
        (4u8, "IVA Sujeto Exento".to_string())
    } else if !cat_iva.is_empty() {
        (1u8, "IVA Responsable Inscripto".to_string())
    } else {
        (5u8, "Consumidor Final".to_string())
    };

    Ok(PersonaArca {
        cuit: cuit_buscado,
        denominacion,
        tipo_persona,
        estado,
        condicion_iva_receptor_id: cond_id,
        condicion_iva_desc: cond_desc,
        domicilio,
    })
}

fn construir_domicilio(cuerpo: &str) -> Option<String> {
    let direccion = extraer(cuerpo, "direccion")
        .ok()
        .map(|s| s.trim().to_string())?;

    let mut partes = vec![direccion];
    for tag in ["localidad", "descripcionProvincia", "codPostal"] {
        if let Ok(v) = extraer(cuerpo, tag) {
            let v = v.trim().to_string();
            if !v.is_empty() {
                partes.push(v);
            }
        }
    }
    Some(partes.join(" · "))
}

#[cfg(test)]
mod tests {
    use super::*;

    const RESPUESTA_MONOTRIBUTISTA: &str = r#"<?xml version="1.0"?>
<ns2:getPersonaResponse xmlns:ns2="http://a5.soap.ws.server.puc.sr/">
    <personaReturn>
        <metadata/>
        <datosGenerales>
            <tipoPersona>FISICA</tipoPersona>
            <tipoDoc>96</tipoDoc>
            <numeroDoc>12345678</numeroDoc>
            <estadoClave>ACTIVO</estadoClave>
            <apellido>PEREZ</apellido>
            <dependencia>
                <codPostal>3100</codPostal>
                <descripcionProvincia>ENTRE RIOS</descripcionProvincia>
            </dependencia>
            <domicilioFiscal>
                <direccion>AV SARMIENTO 123</direccion>
                <localidad>PARANA</localidad>
            </domicilioFiscal>
        </datosGenerales>
        <datosMonotributo>
            <estadoMonotributo>ACTIVO</estadoMonotributo>
            <fechaPeriodo>2026-08-01</fechaPeriodo>
        </datosMonotributo>
    </personaReturn>
</ns2:getPersonaResponse>"#;

    #[test]
    fn parsea_monotributista_activo() {
        let p = parsear_persona(20375625491, RESPUESTA_MONOTRIBUTISTA).unwrap();
        assert_eq!(p.denominacion, "PEREZ");
        assert_eq!(p.estado, "ACTIVO");
        assert_eq!(p.tipo_persona, "FISICA");
        assert_eq!(p.condicion_iva_receptor_id, 6);
        assert_eq!(p.condicion_iva_desc, "Responsable Monotributo");
        assert!(p.domicilio.as_deref().unwrap_or("").contains("PARANA"));
    }

    #[test]
    fn parsea_inscripto_sin_monotributo() {
        let xml = r#"<getPersonaResponse><personaReturn><datosGenerales>
            <tipoPersona>JURIDICA</tipoPersona><estadoClave>ACTIVO</estadoClave>
            <denominacion>SACIF SA</denominacion>
            </datosGenerales><datosRegimenGeneral>
            <impuesto><idImpuesto>30</idImpuesto><descripcionImpuesto>IVA</descripcionImpuesto></impuesto>
            <categoriaIVA>AC</categoriaIVA>
            </datosRegimenGeneral></personaReturn></getPersonaResponse>"#;
        let p = parsear_persona(30500000001, xml).unwrap();
        assert_eq!(p.denominacion, "SACIF SA");
        assert_eq!(p.condicion_iva_receptor_id, 1);
    }

    #[test]
    fn persona_ausente_da_error_claro() {
        let r = parsear_persona(20999999995, "<getPersonaResponse><personaReturn/></getPersonaResponse>");
        assert!(r.is_err());
    }

    #[test]
    fn rechaza_cuit_fuera_de_rango() {
        let ta = Ta {
            token: "t".into(),
            sign: "s".into(),
            generation_time: chrono::Local::now().fixed_offset(),
            expiration_time: chrono::Local::now().fixed_offset(),
        };
        let cliente = SoapClient::new(std::time::Duration::from_secs(5)).unwrap();
        let rt = tokio::runtime::Runtime::new().unwrap();
        let r = rt.block_on(buscar_persona(
            &cliente,
            "https://invalido",
            &ta,
            20375625491,
            12,
        ));
        assert!(r.is_err());
    }

    /// Consulta real al Padrón A5 homologación (solo lectura).
    /// Uso: CUIT_TEST=20375625491 cargo test --lib arca::padron -- --ignored
    /// Sin CUIT_TEST usa un CUIT clásico de pruebas.
    #[tokio::test]
    #[ignore]
    async fn padron_buscar_real_homologacion() {
        use crate::arca::{config::ArcaPaths, ArcaState};

        let home = std::env::var("HOME").unwrap();
        let creds = std::path::PathBuf::from(home).join(".local/share/com.almar.cachito/arca");
        if !creds.join("certificado.pem").exists() {
            eprintln!("sin credenciales reales; se omite");
            return;
        }

        let cuit_buscado: u64 = std::env::var("CUIT_TEST")
            .ok()
            .and_then(|c| c.replace(|ch: char| !ch.is_ascii_digit(), "").parse().ok())
            .unwrap_or(20_267_565_393);

        let paths = ArcaPaths {
            dir_arca: creds.clone(),
            config_json: creds.join("config.json"),
            certificado: creds.join("certificado.pem"),
            clave_privada: creds.join("privada.key"),
        };

        let state = ArcaState::new().unwrap();
        let ta = state
            .ta_valido(&paths, "https://wsaahomo.afip.gov.ar/ws/services/LoginCms", SERVICIO_PADRON_A5)
            .await
            .expect("TA para padron");

        let cliente = SoapClient::new(std::time::Duration::from_secs(30)).unwrap();
        match buscar_persona(
            &cliente,
            "https://awshomo.afip.gov.ar/sr-padron/webservices/personaServiceA5",
            &ta,
            20_375_625_491,
            cuit_buscado,
        )
        .await
        {
            Ok(p) => println!(
                "ENCONTRADA: {} · CUIT {} · {} · estado {} · cond {} ({})",
                p.denominacion, p.cuit, p.tipo_persona, p.estado,
                p.condicion_iva_receptor_id, p.condicion_iva_desc
            ),
            Err(e) => println!("RESULTADO PARA {cuit_buscado}: {e}"),
        }
    }
}
