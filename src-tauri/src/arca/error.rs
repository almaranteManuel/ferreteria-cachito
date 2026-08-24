use thiserror::Error;

#[derive(Debug, Error)]
pub enum ArcaError {
    #[error("Error de E/S: {0}")]
    Io(#[from] std::io::Error),

    #[error("Error criptográfico (OpenSSL): {0}")]
    OpenSsl(#[from] openssl::error::ErrorStack),

    #[error("Error HTTP: {0}")]
    Http(#[from] reqwest::Error),

    #[error("Servicio ARCA respondió HTTP {codigo}")]
    HttpEstado { codigo: u16 },

    #[error("ARCA bloqueó la consulta (página de desafío del WAF). Reintentá en unos segundos")]
    WafBloqueo,

    #[error("Error de configuración ARCA: {0}")]
    Config(String),

    #[error("Problema con el certificado o la clave privada: {0}")]
    Credenciales(String),

    #[error("Error procesando XML: {0}")]
    Xml(String),

    #[error("ARCA rechazó la operación (código {codigo}): {mensaje}")]
    RechazoArca { codigo: i64, mensaje: String },

    #[error("El Ticket de Acceso está vencido")]
    TaVencido,

    #[error("{0}")]
    Otro(String),
}

pub type ArcaResult<T> = Result<T, ArcaError>;
