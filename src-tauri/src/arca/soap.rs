use crate::arca::error::{ArcaError, ArcaResult};
use crate::arca::xml::{extraer_fault, extraer_texto_elemento};
use openssl::base64;
use std::time::Duration;

const NS_WSAA: &str = "http://wsaa.view.sua.dvadac.desein.afip.gov";

pub struct SoapClient {
    http: reqwest::Client,
}

impl SoapClient {
    pub fn new(timeout: Duration) -> ArcaResult<Self> {
        let http = reqwest::Client::builder()
            .timeout(timeout)
            .build()?;
        Ok(Self { http })
    }

    /// POST SOAP genérico con manejo de faults HTTP/SOAP.
    /// `soap_action`: Some(acción) o None. Un SOAPAction vacío ("") dispara
    /// el bloqueo del WAF en wswhomo, así que nunca se envía vacío.
    pub async fn post(&self, url: &str, envelope: &str, soap_action: Option<&str>) -> ArcaResult<String> {
        let mut pedido = self
            .http
            .post(url)
            .header("Content-Type", "text/xml; charset=utf-8")
            .body(envelope.to_owned());

        if let Some(accion) = soap_action {
            pedido = pedido.header("SOAPAction", accion);
        }

        let respuesta = pedido.send().await?;

        let status = respuesta.status();
        let cuerpo = respuesta.text().await?;

        if !status.is_success() {
            if let Some(fault) = extraer_fault(&cuerpo) {
                return Err(ArcaError::RechazoArca {
                    codigo: status.as_u16() as i64,
                    mensaje: fault,
                });
            }
            return Err(ArcaError::HttpEstado {
                codigo: status.as_u16(),
            });
        }

        if let Some(fault) = extraer_fault(&cuerpo) {
            return Err(ArcaError::RechazoArca {
                codigo: 0,
                mensaje: fault,
            });
        }

        Self::validar_cuerpo_soap(&cuerpo)?;

        Ok(cuerpo)
    }

    fn validar_cuerpo_soap(cuerpo: &str) -> ArcaResult<()> {
        // El WAF de ARCA a veces responde con una página HTML de desafío
        // (<title> con número aleatorio). Lo detectamos y avisamos claro.
        if cuerpo.trim_start().starts_with("<html") || !cuerpo.contains("Envelope") {
            return Err(ArcaError::WafBloqueo);
        }
        Ok(())
    }

    /// LoginCms: envía el CMS en base64 y devuelve el loginTicketResponse
    /// (XML plano, ya desescapado del sobre SOAP).
    pub async fn login_cms(&self, url_wsaa: &str, cms_der: &[u8]) -> ArcaResult<String> {
        let cms_b64 = base64::encode_block(cms_der);
        let envelope = format!(
            r#"<?xml version="1.0" encoding="UTF-8"?>
<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ns1="{ns}">
    <SOAP-ENV:Body>
        <ns1:loginCms>
            <in0>{cms}</in0>
        </ns1:loginCms>
    </SOAP-ENV:Body>
</SOAP-ENV:Envelope>"#,
            ns = NS_WSAA,
            cms = cms_b64
        );

        let cuerpo = self.post(url_wsaa, &envelope, Some("\"http://wsaa.view.sua.dvadac.desein.afip.gov/loginCms\"")).await?;

        extraer_texto_elemento(&cuerpo, "loginCmsReturn")
    }
}
