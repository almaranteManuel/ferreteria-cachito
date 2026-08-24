use crate::arca::error::{ArcaError, ArcaResult};
use crate::arca::models::Ta;
use crate::arca::soap::SoapClient;

pub const NS_WSFE: &str = "http://ar.gov.afip.dif.FEV1/";

fn envelope(body_interno: &str) -> String {
    format!(
        r#"<?xml version="1.0" encoding="UTF-8"?>
<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/">
    <SOAP-ENV:Header/>
    <SOAP-ENV:Body>{body}</SOAP-ENV:Body>
</SOAP-ENV:Envelope>"#,
        body = body_interno
    )
}

/// Bloque <Auth> obligatorio en todas las llamadas autenticadas de WSFEv1.
/// IMPORTANTE: ARCA homologación espera exactamente <Cuit> (no <CUIT>
/// como dice la documentación); con mayúsculas responde error 601.
pub fn auth_xml(ta: &Ta, cuit: u64) -> String {
    format!(
        r#"<Auth>
    <Token>{token}</Token>
    <Sign>{sign}</Sign>
    <Cuit>{cuit}</Cuit>
</Auth>"#,
        token = ta.token,
        sign = ta.sign,
        cuit = cuit
    )
}

#[derive(Debug, Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DummyEstado {
    pub app_server: String,
    pub auth_server: String,
    pub db_server: String,
}

/// FEDummy: ping sin autenticación. Devuelve el estado de los servidores.
pub async fn fedummy(cliente: &SoapClient, url_wsfe: &str) -> ArcaResult<DummyEstado> {
    let env = envelope(&format!(r#"<FEDummy xmlns="{ns}"/>"#, ns = NS_WSFE));
    let cuerpo = cliente.post(url_wsfe, &env, None).await?;

    let parsear = || -> ArcaResult<DummyEstado> {
        Ok(DummyEstado {
            app_server: crate::arca::xml::extraer_texto_elemento(&cuerpo, "AppServer")
                .or_else(|_| crate::arca::xml::extraer_texto_elemento(&cuerpo, "appServer"))?,
            auth_server: crate::arca::xml::extraer_texto_elemento(&cuerpo, "AuthServer")
                .or_else(|_| crate::arca::xml::extraer_texto_elemento(&cuerpo, "authServer"))?,
            db_server: crate::arca::xml::extraer_texto_elemento(&cuerpo, "DbServer")
                .or_else(|_| crate::arca::xml::extraer_texto_elemento(&cuerpo, "dbServer"))?,
        })
    };

    match parsear() {
        Ok(estado) => Ok(estado),
        Err(e) => {
            let muestra: String = cuerpo.chars().take(400).collect();
            Err(ArcaError::Xml(format!(
                "{e} · respuesta del servidor: {muestra}"
            )))
        }
    }
}

#[derive(Debug, Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CompUltimoAutorizado {
    pub pto_vta: u32,
    pub cbte_tipo: u16,
    pub cbte_nro: i64,
}

fn chequear_errores_arca(cuerpo: &str) -> ArcaResult<()> {
    if let Some((codigo, mensaje)) = crate::arca::xml::extraer_primer_error(cuerpo) {
        return Err(ArcaError::RechazoArca { codigo, mensaje });
    }
    Ok(())
}

/// FECompUltimoAutorizado: último número autorizado para un pto de venta/tipo.
pub async fn comp_ultimo_autorizado(
    cliente: &SoapClient,
    url_wsfe: &str,
    ta: &Ta,
    cuit: u64,
    pto_vta: u32,
    cbte_tipo: u16,
) -> ArcaResult<CompUltimoAutorizado> {
    let env = envelope(&format!(
        r#"<FECompUltimoAutorizado xmlns="{ns}">{auth}<PtoVta>{pto}</PtoVta><CbteTipo>{tipo}</CbteTipo></FECompUltimoAutorizado>"#,
        ns = NS_WSFE,
        auth = auth_xml(ta, cuit),
        pto = pto_vta,
        tipo = cbte_tipo
    ));

    let cuerpo = cliente.post(url_wsfe, &env, None).await?;
    chequear_errores_arca(&cuerpo)?;

    let parse_num = |tag: &str| -> ArcaResult<i64> {
        let texto = crate::arca::xml::extraer_texto_elemento(&cuerpo, tag)?;
        texto
            .trim()
            .parse::<i64>()
            .map_err(|e| ArcaError::Xml(format!("{tag} inválido ('{texto}'): {e}")))
    };

    Ok(CompUltimoAutorizado {
        cbte_nro: parse_num("CbteNro")?,
        cbte_tipo: parse_num("CbteTipo")? as u16,
        pto_vta: parse_num("PtoVta")? as u32,
    })
}

/// Construye el envelope de FECAESolicitar para una Factura C,
/// replicando la estructura del request manual que obtuvo CAE.
/// Usa prefijos ar: y <Cuit> (no <CUIT>).
pub fn build_fe_cae_solicitar_factura_c(
    ta: &Ta,
    cuit: u64,
    p: &crate::arca::models::FacturaCParams,
) -> String {
    format!(
        r#"<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ar="{ns}">
    <soapenv:Header/>
    <soapenv:Body>
        <ar:FECAESolicitar>
            <ar:Auth>
                <ar:Token>{token}</ar:Token>
                <ar:Sign>{sign}</ar:Sign>
                <ar:Cuit>{cuit}</ar:Cuit>
            </ar:Auth>
            <ar:FeCAEReq>
                <ar:FeCabReq>
                    <ar:CantReg>1</ar:CantReg>
                    <ar:PtoVta>{pto}</ar:PtoVta>
                    <ar:CbteTipo>11</ar:CbteTipo>
                </ar:FeCabReq>
                <ar:FeDetReq>
                    <ar:FECAEDetRequest>
                        <ar:Concepto>1</ar:Concepto>
                        <ar:DocTipo>99</ar:DocTipo>
                        <ar:DocNro>0</ar:DocNro>
                        <ar:CbteDesde>{nro}</ar:CbteDesde>
                        <ar:CbteHasta>{nro}</ar:CbteHasta>
                        <ar:CbteFch>{fecha}</ar:CbteFch>
                        <ar:ImpTotal>{total:.2}</ar:ImpTotal>
                        <ar:ImpTotConc>0.00</ar:ImpTotConc>
                        <ar:ImpNeto>{neto:.2}</ar:ImpNeto>
                        <ar:ImpOpEx>0.00</ar:ImpOpEx>
                        <ar:ImpIVA>0.00</ar:ImpIVA>
                        <ar:ImpTrib>0.00</ar:ImpTrib>
                        <ar:MonId>PES</ar:MonId>
                        <ar:MonCotiz>1.00</ar:MonCotiz>
                        <ar:CondicionIVAReceptorId>5</ar:CondicionIVAReceptorId>
                    </ar:FECAEDetRequest>
                </ar:FeDetReq>
            </ar:FeCAEReq>
        </ar:FECAESolicitar>
    </soapenv:Body>
</soapenv:Envelope>"#,
        ns = NS_WSFE,
        token = ta.token,
        sign = ta.sign,
        cuit = cuit,
        pto = p.pto_vta,
        nro = p.numero,
        fecha = p.fecha,
        total = p.imp_total,
        neto = p.imp_neto
    )
}

/// FECAESolicitar para una Factura C (tipo 11) a Consumidor Final.
pub async fn fe_cae_solicitar_factura_c(
    cliente: &SoapClient,
    url_wsfe: &str,
    ta: &Ta,
    cuit: u64,
    p: &crate::arca::models::FacturaCParams,
) -> crate::arca::error::ArcaResult<crate::arca::models::CaeResultado> {
    use crate::arca::error::ArcaError;
    use crate::arca::models::CaeResultado;

    let env = build_fe_cae_solicitar_factura_c(ta, cuit, p);
    let cuerpo = cliente.post(url_wsfe, &env, None).await?;
    chequear_errores_arca(&cuerpo)?;

    let extraer = |tag: &str| crate::arca::xml::extraer_texto_elemento(&cuerpo, tag);

    let resultado = extraer("Resultado")?.trim().to_string();
    let cbte_desde = extraer("CbteDesde")?
        .trim()
        .parse()
        .map_err(|e| ArcaError::Xml(format!("CbteDesde inválido: {e}")))?;
    let cbte_hasta = extraer("CbteHasta")?
        .trim()
        .parse()
        .map_err(|e| ArcaError::Xml(format!("CbteHasta inválido: {e}")))?;

    let cae = extraer("CAE").ok().map(|v| v.trim().to_string());
    let cae_fch_vto = extraer("CAEFchVto").ok().map(|v| v.trim().to_string());

    if !resultado.is_empty() && cae.is_none() && resultado != "R" {
        return Err(ArcaError::Xml(format!(
            "Respuesta sin CAE y sin rechazo explícito (Resultado={resultado})"
        )));
    }

    Ok(CaeResultado {
        resultado,
        cbte_desde,
        cbte_hasta,
        cae,
        cae_fch_vto,
        observaciones: crate::arca::xml::extraer_observaciones(&cuerpo),
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn auth_contiene_cuit_y_credenciales() {
        let ta = Ta {
            token: "T".into(),
            sign: "S".into(),
            generation_time: chrono::Local::now().fixed_offset(),
            expiration_time: chrono::Local::now().fixed_offset(),
        };
        let a = auth_xml(&ta, 20375625491);
        assert!(a.contains("<Token>T</Token>"));
        assert!(a.contains("<Sign>S</Sign>"));
        assert!(!a.contains("<CUIT>"), "el elemento debe ser Cuit, no CUIT");
        assert!(a.contains("<Cuit>20375625491</Cuit>"));
    }

    #[test]
    fn parsea_respuesta_fedummy_ok() {
        let respuesta = r#"<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
            <soap:Body><FEDummyResponse xmlns="http://ar.gov.afip.dif.FEV1/">
                <appServer>OK</appServer><authServer>OK</authServer><dbServer>OK</dbServer>
            </FEDummyResponse></soap:Body>
        </soap:Envelope>"#;

        let estado = DummyEstado {
            app_server: crate::arca::xml::extraer_texto_elemento(respuesta, "appServer").unwrap(),
            auth_server: crate::arca::xml::extraer_texto_elemento(respuesta, "authServer").unwrap(),
            db_server: crate::arca::xml::extraer_texto_elemento(respuesta, "dbServer").unwrap(),
        };
        assert_eq!(estado.app_server, "OK");
        assert_eq!(estado.auth_server, "OK");
        assert_eq!(estado.db_server, "OK");
    }

    /// Ping real contra WSFEv1 homologación. Ignorado por defecto:
    /// cargo test --lib arca::wsfe -- --ignored
    #[tokio::test]
    #[ignore]
    async fn fedummy_real_homologacion() {
        let cliente =
            SoapClient::new(std::time::Duration::from_secs(30)).expect("cliente HTTP");
        let estado = fedummy(
            &cliente,
            "https://wswhomo.afip.gov.ar/wsfev1/service.asmx",
        )
        .await
        .expect("FEDummy homologación");

        println!("AppServer={} AuthServer={} DbServer={}", estado.app_server, estado.auth_server, estado.db_server);
        assert_eq!(estado.app_server, "OK");
        assert_eq!(estado.auth_server, "OK");
        assert_eq!(estado.db_server, "OK");
    }

    /// FECompUltimoAutorizado real (pto 10, tipo 11). Ignorado por defecto.
    #[tokio::test]
    #[ignore]
    async fn comp_ultimo_autorizado_real_homologacion() {
        use crate::arca::{config::ArcaPaths, ArcaState};

        let home = std::env::var("HOME").unwrap();
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

        let state = ArcaState::new().unwrap();
        let ta = state
            .ta_valido(&paths, "https://wsaahomo.afip.gov.ar/ws/services/LoginCms", "wsfe")
            .await
            .expect("TA válido");

        let cliente = SoapClient::new(std::time::Duration::from_secs(30)).unwrap();

        let r = comp_ultimo_autorizado(
            &cliente,
            "https://wswhomo.afip.gov.ar/wsfev1/service.asmx",
            &ta,
            20_375_625_491,
            10,
            11,
        )
        .await
        .expect("consulta de último comprobante");

        println!(
            "Último autorizado: pto={} tipo={} nro={}",
            r.pto_vta, r.cbte_tipo, r.cbte_nro
        );
        assert_eq!(r.pto_vta, 10);
        assert_eq!(r.cbte_tipo, 11);
        assert!(r.cbte_nro >= 1, "ya emitimos el comprobante 1 en homologación");
    }

    /// Emite una Factura C real de homologación ($100, consumidor final),
    /// réplica de la prueba manual. Consume el próximo número disponible.
    /// Ignorado por defecto: cargo test --lib arca::wsfe -- --ignored
    #[tokio::test]
    #[ignore]
    async fn fe_cae_solicitar_factura_c_real_homologacion() {
        use crate::arca::{config::ArcaPaths, models::FacturaCParams, ArcaState};

        let home = std::env::var("HOME").unwrap();
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

        let state = ArcaState::new().unwrap();
        let ta = state
            .ta_valido(&paths, "https://wsaahomo.afip.gov.ar/ws/services/LoginCms", "wsfe")
            .await
            .expect("TA válido");

        let cliente = SoapClient::new(std::time::Duration::from_secs(30)).unwrap();
        let url = "https://wswhomo.afip.gov.ar/wsfev1/service.asmx";

        let ultimo = comp_ultimo_autorizado(&cliente, url, &ta, 20_375_625_491, 10, 11)
            .await
            .expect("último autorizado");
        let numero = ultimo.cbte_nro + 1;
        println!("Emitiendo comprobante número {numero}");

        let params = FacturaCParams {
            pto_vta: 10,
            numero,
            imp_total: 100.0,
            imp_neto: 100.0,
            fecha: chrono::Local::now().format("%Y%m%d").to_string(),
        };

        let cae = fe_cae_solicitar_factura_c(&cliente, url, &ta, 20_375_625_491, &params)
            .await
            .expect("FECAESolicitar");

        println!(
            "Resultado={} Cbte={}-{} CAE={:?} Vto={:?} Obs={:?}",
            cae.resultado,
            cae.cbte_desde,
            cae.cbte_hasta,
            cae.cae.as_deref().map(|c| c.len()),
            cae.cae_fch_vto,
            cae.observaciones
        );

        assert_eq!(cae.resultado, "A", "esperábamos aprobación");
        let cae_valor = cae.cae.expect("CAE presente");
        assert_eq!(cae_valor.len(), 14, "el CAE tiene 14 dígitos");
        assert!(cae.cae_fch_vto.as_deref().map(|v| v.len() == 8).unwrap_or(false));
    }
}
