use crate::arca::error::{ArcaError, ArcaResult};
use chrono::{Duration, Local};
use quick_xml::events::Event;
use quick_xml::Reader;

/// Extrae y desescapa el texto de un elemento simple (sin hijos) del XML.
/// Ej: <loginCmsReturn>&lt;loginTicketResponse...&lt;/loginCmsReturn>
pub fn extraer_texto_elemento(xml: &str, nombre_tag: &str) -> ArcaResult<String> {
    let mut reader = Reader::from_str(xml);
    reader.config_mut().trim_text(false);

    let mut dentro = false;
    let mut buffer = String::new();

    loop {
        match reader.read_event().map_err(|e| ArcaError::Xml(format!("SOAP ilegible: {e}")))? {
            Event::Start(e) if e.name().as_ref() == nombre_tag.as_bytes() => {
                dentro = true;
                buffer.clear();
            }
            Event::Text(t) if dentro => {
                let texto = t
                    .unescape()
                    .map_err(|e| ArcaError::Xml(format!("entidad inválida en {nombre_tag}: {e}")))?;
                buffer.push_str(&texto);
            }
            Event::CData(t) if dentro => {
                buffer.push_str(&String::from_utf8_lossy(t.as_ref()));
            }
            Event::End(e) if e.name().as_ref() == nombre_tag.as_bytes() && dentro => {
                return Ok(buffer);
            }
            Event::Eof => {
                return Err(ArcaError::Xml(format!(
                    "No se encontró el elemento <{nombre_tag}> en la respuesta"
                )))
            }
            _ => {}
        }
    }
}

/// Extrae un mensaje de fault SOAP si lo hay.
pub fn extraer_fault(xml: &str) -> Option<String> {
    extraer_texto_elemento(xml, "faultstring").ok()
}

/// Busca <errors><err><code>N</code><msg>M</msg></err></errors>
/// y devuelve el primer par (código, mensaje).
pub fn extraer_primer_error(xml: &str) -> Option<(i64, String)> {
    let mut reader = Reader::from_str(xml);
    reader.config_mut().trim_text(true);

    let mut dentro_err = false;
    let mut tag_actual: Option<String> = None;
    let mut codigo: Option<i64> = None;
    let mut mensaje: Option<String> = None;

    loop {
        match reader.read_event().ok()? {
            Event::Start(e) => {
                let nombre = String::from_utf8_lossy(&e.name().as_ref().to_ascii_lowercase())
                    .into_owned();
                match nombre.as_str() {
                    "err" => dentro_err = true,
                    "code" if dentro_err => tag_actual = Some(nombre),
                    "msg" if dentro_err => tag_actual = Some(nombre),
                    _ => {}
                }
            }
            Event::Text(t) => {
                if let Some(tag) = &tag_actual {
                    let texto = t.unescape().ok()?.into_owned();
                    match tag.as_str() {
                        "code" => codigo = texto.trim().parse().ok(),
                        "msg" => mensaje = Some(texto),
                        _ => {}
                    }
                }
            }
            Event::End(e) => {
                let nombre =
                    String::from_utf8_lossy(&e.name().as_ref().to_ascii_lowercase()).into_owned();
                if nombre == "err" && codigo.is_some() {
                    break;
                }
                tag_actual = None;
            }
            Event::Eof => break,
            _ => {}
        }
    }

    codigo.map(|c| (c, mensaje.unwrap_or_default()))
}

/// Extrae todas las observaciones <obs><code>N</code><msg>M</msg></obs>
/// (case-insensitive, como extraer_primer_error).
pub fn extraer_observaciones(xml: &str) -> Vec<(i64, String)> {
    let mut reader = Reader::from_str(xml);
    reader.config_mut().trim_text(true);

    let mut dentro_obs = false;
    let mut tag_actual: Option<String> = None;
    let mut actual: (Option<i64>, Option<String>) = (None, None);
    let mut salida = Vec::new();

    loop {
        match reader.read_event() {
            Ok(Event::Start(e)) => {
                let nombre =
                    String::from_utf8_lossy(&e.name().as_ref().to_ascii_lowercase()).into_owned();
                match nombre.as_str() {
                    "obs" => {
                        dentro_obs = true;
                        actual = (None, None);
                    }
                    "code" if dentro_obs => tag_actual = Some(nombre),
                    "msg" if dentro_obs => tag_actual = Some(nombre),
                    _ => {}
                }
            }
            Ok(Event::Text(t)) => {
                if let Some(tag) = &tag_actual {
                    if let Ok(texto) = t.unescape() {
                        match tag.as_str() {
                            "code" => actual.0 = texto.trim().parse().ok(),
                            "msg" => actual.1 = Some(texto.into_owned()),
                            _ => {}
                        }
                    }
                }
            }
            Ok(Event::End(e)) => {
                let nombre = String::from_utf8_lossy(&e.name().as_ref().to_ascii_lowercase())
                    .into_owned();
                if nombre == "obs" {
                    dentro_obs = false;
                    if let Some(c) = actual.0 {
                        salida.push((c, actual.1.take().unwrap_or_default()));
                    }
                }
                tag_actual = None;
            }
            Ok(Event::Eof) => break,
            _ => {}
        }
    }

    salida
}

/// Genera el XML de LoginTicketRequest (WSAA), equivalente al que se probó
/// manualmente: uniqueId = epoch segundos, fechas con offset local.
pub fn build_login_ticket_request(service: &str) -> ArcaResult<String> {
    let service = service.trim();
    if service.is_empty() || !service.chars().all(|c| c.is_ascii_alphanumeric()) {
        return Err(ArcaError::Config(format!(
            "Nombre de servicio inválido para LoginTicketRequest: '{service}'"
        )));
    }

    let now = Local::now();
    let expiration = now + Duration::seconds(3600);

    Ok(format!(
        r#"<?xml version="1.0" encoding="UTF-8"?>
<loginTicketRequest version="1.0">
    <header>
        <uniqueId>{unique_id}</uniqueId>
        <generationTime>{generation}</generationTime>
        <expirationTime>{expiration}</expirationTime>
    </header>
    <service>{service}</service>
</loginTicketRequest>"#,
        unique_id = now.timestamp(),
        generation = format_fecha(now),
        expiration = format_fecha(expiration),
    ))
}

fn format_fecha(t: chrono::DateTime<Local>) -> String {
    t.format("%Y-%m-%dT%H:%M:%S%.3f%:z").to_string()
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::{SystemTime, UNIX_EPOCH};

    #[test]
    fn ltr_contiene_campos_obligatorios() {
        let xml = build_login_ticket_request("wsfe").unwrap();
        assert!(xml.starts_with("<?xml"));
        assert!(xml.contains("<loginTicketRequest version=\"1.0\">"));
        assert!(xml.contains("<service>wsfe</service>"));

        let epoch_actual = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs() as i64;

        let start = xml.find("<uniqueId>").unwrap() + "<uniqueId>".len();
        let end = xml[start..].find("</uniqueId>").unwrap() + start;
        let unique_id: i64 = xml[start..end].parse().unwrap();
        assert!((epoch_actual - unique_id).abs() < 60);
    }

    #[test]
    fn ltr_fechas_con_offset_y_una_hora_de_vida() {
        let xml = build_login_ticket_request("wsfe").unwrap();

        let gen_start = xml.find("<generationTime>").unwrap() + "<generationTime>".len();
        let gen_end = xml[gen_start..].find("</generationTime>").unwrap() + gen_start;
        let generation =
            chrono::DateTime::parse_from_rfc3339(&xml[gen_start..gen_end])
                .expect("generationTime debe ser RFC3339");

        let exp_start = xml.find("<expirationTime>").unwrap() + "<expirationTime>".len();
        let exp_end = xml[exp_start..].find("</expirationTime>").unwrap() + exp_start;
        let expiration =
            chrono::DateTime::parse_from_rfc3339(&xml[exp_start..exp_end])
                .expect("expirationTime debe ser RFC3339");

        let delta = expiration - generation;
        assert_eq!(delta.num_minutes(), 60);
        assert!(delta.num_milliseconds() % 1000 == 0);
    }

    #[test]
    fn ltr_rechaza_service_invalido() {
        assert!(build_login_ticket_request("").is_err());
        assert!(build_login_ticket_request("ws fe").is_err());
        assert!(build_login_ticket_request("<x/>").is_err());
    }

    #[test]
    fn extrae_login_cms_return_escapado() {
        let soap = r#"<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
            <soap:Body>
                <loginCmsResponse xmlns="http://wsaa.view.sua.dvadac.desein.afip.gov">
                    <loginCmsReturn>&lt;loginTicketResponse version="1.0"&gt;&lt;credentials&gt;&lt;token&gt;ABC+123=&lt;/token&gt;&lt;sign&gt;XYZ&lt;/sign&gt;&lt;/credentials&gt;&lt;/loginTicketResponse&gt;</loginCmsReturn>
                </loginCmsResponse>
            </soap:Body>
        </soap:Envelope>"#;

        let ta = extraer_texto_elemento(soap, "loginCmsReturn").unwrap();
        assert!(ta.starts_with("<loginTicketResponse version=\"1.0\">"));
        assert!(ta.contains("<token>ABC+123=</token>"));
        assert!(ta.contains("<sign>XYZ</sign>"));
    }

    #[test]
    fn fault_soap_se_detecta() {
        let soap = r#"<soap:Envelope><soap:Body><soap:Fault><faultcode>soap:Client</faultcode><faultstring>xml.expirationTime.expired</faultstring></soap:Fault></soap:Body></soap:Envelope>"#;
        assert_eq!(
            extraer_fault(soap).as_deref(),
            Some("xml.expirationTime.expired")
        );
    }

    #[test]
    fn elemento_ausente_da_error_claro() {
        assert!(extraer_texto_elemento("<a><b>x</b></a>", "loginCmsReturn").is_err());
    }

    #[test]
    fn extrae_error_arca_10246() {
        let xml = r#"<FECompUltimoAutorizadoResponse>
            <FECompUltimoAutorizadoResult>
                <errors>
                    <err>
                        <code>10246</code>
                        <msg>Campo Condicion Frente al IVA del receptor es obligatorio</msg>
                    </err>
                </errors>
            </FECompUltimoAutorizadoResult>
        </FECompUltimoAutorizadoResponse>"#;

        let (codigo, mensaje) = extraer_primer_error(xml).expect("debe detectar el error");
        assert_eq!(codigo, 10246);
        assert!(mensaje.contains("Condicion"));
    }

    #[test]
    fn extrae_error_pascalcase_como_wswhomo_real() {
        let xml = r#"<FECompUltimoAutorizadoResult><PtoVta>0</PtoVta><Errors><Err><Code>601</Code><Msg>CUIT representada no incluida en Token</Msg></Err></Errors></FECompUltimoAutorizadoResult>"#;
        let (codigo, mensaje) = extraer_primer_error(xml).expect("debe detectar el error");
        assert_eq!(codigo, 601);
        assert_eq!(mensaje, "CUIT representada no incluida en Token");
    }

    #[test]
    fn sin_errors_devuelve_none() {
        assert!(extraer_primer_error("<a><b>ok</b></a>").is_none());
        // <err> sin code no debe colgar ni inventar código
        assert!(extraer_primer_error("<errors><err><msg>solo msg</msg></err></errors>").is_none());
    }
}
