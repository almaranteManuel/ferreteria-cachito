use crate::arca::error::{ArcaError, ArcaResult};
use chrono::{DateTime, FixedOffset, Local};
use quick_xml::events::Event;
use quick_xml::Reader;

/// Ticket de Acceso de WSAA. El token y el sign NUNCA deben loguearse
/// ni enviarse al frontend.
#[derive(Debug, Clone)]
pub struct Ta {
    pub token: String,
    pub sign: String,
    pub generation_time: DateTime<FixedOffset>,
    pub expiration_time: DateTime<FixedOffset>,
}

fn err_xml(contexto: &str) -> impl Fn(quick_xml::Error) -> ArcaError + '_ {
    move |e| ArcaError::Xml(format!("{contexto}: {e}"))
}

impl Ta {
    /// Parsea el contenido de loginTicketResponse (el TA en XML plano,
    /// ya desescapado del SOAP).
    pub fn parse_login_ticket_response(xml: &str) -> ArcaResult<Ta> {
        let mut reader = Reader::from_str(xml);
        reader.config_mut().trim_text(true);

        let mut tag_actual: Option<String> = None;
        let mut token: Option<String> = None;
        let mut sign: Option<String> = None;
        let mut generation: Option<String> = None;
        let mut expiration: Option<String> = None;

        loop {
            match reader.read_event().map_err(err_xml("TA ilegible"))? {
                Event::Start(e) => {
                    tag_actual =
                        Some(String::from_utf8_lossy(e.name().as_ref()).into_owned());
                }
                Event::Text(t) => {
                    if let Some(tag) = &tag_actual {
                        let texto = t.unescape().map_err(err_xml("entidad inválida"))?.into_owned();
                        // Acumular: el token/sign pueden llegar partidos en
                        // varios eventos de texto.
                        match tag.as_str() {
                            "token" => token.get_or_insert_with(String::new).push_str(&texto),
                            "sign" => sign.get_or_insert_with(String::new).push_str(&texto),
                            "generationTime" => generation = Some(texto),
                            "expirationTime" => expiration = Some(texto),
                            _ => {}
                        }
                    }
                }
                Event::End(_) => tag_actual = None,
                Event::Eof => break,
                _ => {}
            }
        }

        let token = token.ok_or_else(|| ArcaError::Xml("TA sin <token>".into()))?;
        let sign = sign.ok_or_else(|| ArcaError::Xml("TA sin <sign>".into()))?;

        // El token/sign no deben contener saltos de línea ni espacios.
        let token: String = token.chars().filter(|c| !c.is_whitespace()).collect();
        let sign: String = sign.chars().filter(|c| !c.is_whitespace()).collect();

        if token.is_empty() || sign.is_empty() {
            return Err(ArcaError::Xml("token o sign vacíos en el TA".into()));
        }
        let generation = generation.ok_or_else(|| ArcaError::Xml("TA sin <generationTime>".into()))?;
        let expiration = expiration.ok_or_else(|| ArcaError::Xml("TA sin <expirationTime>".into()))?;

        Ok(Ta {
            token,
            sign,
            generation_time: DateTime::parse_from_rfc3339(&generation)
                .map_err(|e| ArcaError::Xml(format!("generationTime inválido '{generation}': {e}")))?,
            expiration_time: DateTime::parse_from_rfc3339(&expiration)
                .map_err(|e| ArcaError::Xml(format!("expirationTime inválido '{expiration}': {e}")))?,
        })
    }

    pub fn minutos_restantes(&self) -> i64 {
        (self.expiration_time - Local::now().fixed_offset()).num_minutes()
    }

    pub fn esta_vigente(&self, margen_minutos: i64) -> bool {
        self.minutos_restantes() > margen_minutos
    }
}

/// Datos para una Factura C de homologación (réplica de la prueba manual).
#[derive(Debug, Clone)]
pub struct FacturaCParams {
    pub pto_vta: u32,
    pub numero: i64,
    pub imp_total: f64,
    pub imp_neto: f64,
    /// YYYYMMDD
    pub fecha: String,
}

/// Resultado de FECAESolicitar para un comprobante.
#[derive(Debug, Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CaeResultado {
    /// "A" aprobado, "O" con observaciones, "R" rechazado
    pub resultado: String,
    pub cbte_desde: i64,
    pub cbte_hasta: i64,
    pub cae: Option<String>,
    pub cae_fch_vto: Option<String>,
    pub observaciones: Vec<(i64, String)>,
}

impl CaeResultado {
    pub fn aprobado(&self) -> bool {
        self.resultado == "A" || self.resultado == "O"
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const TA_EJEMPLO: &str = r#"<loginTicketResponse version="1.0">
        <header>
            <uniqueId>123</uniqueId>
            <generationTime>2026-08-22T21:11:38.766-03:00</generationTime>
            <expirationTime>2026-08-23T09:11:38.766-03:00</expirationTime>
        </header>
        <credentials>
            <token>TOKEN_SECRETO</token>
            <sign>SIGN_SECRETO</sign>
        </credentials>
    </loginTicketResponse>"#;

    #[test]
    fn parsea_ta_del_contexto_manual() {
        let ta = Ta::parse_login_ticket_response(TA_EJEMPLO).unwrap();
        assert_eq!(ta.token, "TOKEN_SECRETO");
        assert_eq!(ta.sign, "SIGN_SECRETO");
        assert_eq!(ta.generation_time.format("%Y-%m-%dT%H:%M").to_string(), "2026-08-22T21:11");
        assert_eq!(ta.expiration_time.format("%Y-%m-%dT%H:%M").to_string(), "2026-08-23T09:11");
        // 12 horas entre generación y expiración
        assert_eq!((ta.expiration_time - ta.generation_time).num_hours(), 12);
    }

    #[test]
    fn vigencia_con_margen() {
        use chrono::{Duration, TimeZone};

        let ahora = Local::now().fixed_offset();
        let mk = |mins: i64| Ta {
            token: "t".into(),
            sign: "s".into(),
            generation_time: ahora - Duration::hours(1),
            expiration_time: ahora + Duration::minutes(mins),
        };

        assert!(mk(120).esta_vigente(10), "vence en 2h: vigente con margen 10m");
        assert!(!mk(5).esta_vigente(10), "vence en 5m: NO vigente con margen 10m");
        assert!(mk(5).esta_vigente(1), "vence en 5m: sí vigente con margen 1m");
        assert_eq!(
            Local.timestamp_opt(0, 0).unwrap().fixed_offset().timestamp(),
            0
        );
    }

    #[test]
    fn rechaza_ta_incompleto() {
        let r = Ta::parse_login_ticket_response("<loginTicketResponse><header></header></loginTicketResponse>");
        assert!(r.is_err());
    }
}
