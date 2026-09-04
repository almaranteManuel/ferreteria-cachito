# ARCA_CONTEXT.md

Sistema de gestión/facturación para ferretería (Argentina).
App desktop offline-first: **Tauri 2 + Rust + SQLite (sqlx) + frontend React/TypeScript**.

Integración ARCA (ex AFIP) mediante **WSAA + WSFEv1**, únicamente en **HOMOLOGACIÓN**.
NO pasar a producción todavía.

> LEER ESTE ARCHIVO ANTES DE CUALQUIER CAMBIO. Resume todo el estado del
> proyecto para retomar el trabajo en cualquier sesión.

## 0. ENTORNO DE ESTA MÁQUINA (importante al retomar)

- Rust: `export PATH="$HOME/.cargo/bin:$PATH"` (instalado via rustup)
- Node 24: `export PATH="$HOME/.nvm/versions/node/v24.19.0/bin:$PATH"` (via nvm)
- Sin estos PATH, cargo/npm no se encuentran en la terminal.
- Build verificación rápida: `cargo test --lib` (en src-tauri) y `npm run build`.
- TODO el trabajo de las últimas sesiones está SIN COMMITEAR a git (revisar
  `git status`). Commitear solo cuando el dueño lo pida.

---

## 1. ESTADO ACTUAL (agosto 2026): INTEGRACIÓN COMPLETADA EN RUST

El flujo completo ya funciona con código Rust/Tauri contra homologación,
replicando la prueba manual original (sección 5 al final):

```
WSAA → TA → WSFEv1 → FECompUltimoAutorizado → FECAESolicitar → CAE ✅
```

Última emisión automática: Factura C nro 2, $100, Resultado A, CAE de 14 dígitos,
vto 20260901, sin observaciones.

## 2. ESTRUCTURA IMPLEMENTADA (`src-tauri/src/arca/`)

| Archivo | Responsabilidad |
|---|---|
| `mod.rs` | `ArcaState` (cliente HTTP + TA cacheado), margen renovación TA = 10 min |
| `config.rs` | `Ambiente` (homo activa / prod bloqueada), CUIT, PtoVta, validación cert↔clave |
| `error.rs` | `ArcaError` tipado: rechazos ARCA (código+mensaje), WAF, HTTP, XML |
| `xml.rs` | Builder LoginTicketRequest, extracción SOAP, errores/observaciones ARCA |
| `soap.rs` | POST SOAP genérico + detección de bloqueo WAF |
| `wsaa.rs` | Firma CMS (PKCS7 DER, SHA-256) + LoginCms + persistencia TA |
| `wsfe.rs` | FEDummy, FECompUltimoAutorizado, FECAESolicitar (Factura C tipo 11) |
| `models.rs` | Ta, FacturaCParams, CaeResultado. Token/sign JAMÁS salen al frontend |
| `testing.rs` | Helpers de tests (solo cfg(test)) |

Comandos Tauri registrados: `estado_config`, `wsaa_login`, `wsfe_ping`.
`ArcaState` se gestiona en `setup()` junto al pool SQLite.

## 3. TESTS

```bash
cd src-tauri
cargo test --lib arca::                 # 19 unitarios (sin red)
cargo test --lib arca:: -- --ignored    # 5 integración REAL contra homologación
```

Los ignorados son: CMS con credenciales reales, wsaa_login_real, fedummy_real,
comp_ultimo_autorizado_real, fe_cae_solicitar_factura_c_real (esta última EMITE un
comprobante y consume numeración).

## 4. DESCUBRIMIENTOS CRÍTICOS (¡no perder!)

1. **WAF**: enviar header `SOAPAction: ""` (vacío) dispara bloqueo HTML anti-bot en
   wswhomo. Nunca enviar SOAPAction vacío; usar None o acción real entre comillas.
2. **`<Cuit>` vs `<CUIT>`**: la documentación dice `<CUIT>` pero el servicio es
   case-sensitive y espera exactamente `<Cuit>` dentro de Auth. Con mayúsculas
   responde error 601 engañoso ("CUIT representada no incluida en Token").
3. El token/sign pueden llegar **partidos en varios eventos de texto XML**:
   el parser debe acumular (no sobrescribir) y limpiar whitespace.
4. Los errores llegan en dos formatos: `<errors><err><code>/<msg>` (docs) y
   `<Errors><Err><Code>/<Msg>` (real). Parser case-insensitive.
5. Las respuestas reales usan PascalCase (`AppServer`, `CbteNro`).
6. WSAA exige header SOAPAction para LoginCms (contrario al punto 1: ahí sí va).
7. Si el CMS ya tiene TA vigente, LoginCms responde fault
   "El CEE ya posee un TA valido..." — comportamiento normal.

## 5. DATOS FIJOS DE LA CUENTA (HOMOLOGACIÓN)

## 6. ARCHIVOS Y SEGURIDAD

- Credenciales activas: `~/.local/share/com.almar.cachito/arca/`
  - `certificado.pem`, `privada.key` (permisos 600), `config.json`, `TA_wsfe.xml`
- Origen/respaldo: `~/arca-testing/` (archivos de la prueba manual original)
- La clave privada y token/sign NUNCA se muestran, loguean ni commitean.
  Verificar por longitudes/huellas públicas o booleanos.
- El TA dura ~12 h; se cachea en memoria + disco y se renueva solo.
- Esta PC es SOLO desarrollo/pruebas: el programa de producción se instalará
  en otra máquina (ahí irá certificado de producción cuando corresponda).

## 7. ENTORNO DE DESARROLLO (Debian)

- Rust via rustup (~/.cargo/bin), OpenSSL 3.5.6 sistema
- Requiere paquetes: pkg-config, libssl-dev, build-essential, libwebkit2gtk-4.1-dev,
  libgtk-3-dev, libayatana-appindicator3-dev, librsvg2-dev, libxdo-dev
- Crates agregados: openssl 0.10, reqwest 0.12 (native-tls), quick-xml 0.36

## 8. PASO 9: PANTALLA DE FACTURACIÓN — CODIFICADO, FALTA PROBAR

Implementado y compilando (backend 30 tests OK offline, frontend tsc+vite verde):

- **Backend**: migración `0004_facturas.sql` (tablas facturas/factura_items,
  desacopladas de sales), `models/factura.rs`, `factura_repo.rs` (numeración
  local por pto/tipo con UNIQUE), `services/facturacion_service.rs`
  (validación → número = max(ARCA, local)+1 → FECAESolicitar → guardar solo
  si A/O; rechazo muestra observaciones y no guarda), comandos `emitir_factura`,
  `listar_facturas`, `get_factura`.
- **Frontend**: pestaña "Facturación" (tab 'billing'), buscador de productos +
  concepto libre con cantidad decimal, carrito editable, **diálogo de
  confirmación antes de emitir**, diálogo post-emisión con **vista previa**
  del comprobante y botón "Imprimir factura" (no imprime si no se toca).
- **Impresión**: HTML/CSS + window.print(), A4, logo placeholder en
  `src/assets/puerto-logo.png`, CSS @media
  print aísla `.factura-print-area`. Datos emisor en
  `features/facturacion/types/index.ts` (DATOS_EMISOR, editables).
- Decisión del dueño: NO descuenta stock (solo registro fiscal), papel A4.

## 8b. CLIENTE POR CUIT (PADRÓN A5)

- `arca/padron.rs`: getPersona contra personaServiceA5 (homo:
  awshomo.afip.gov.ar/sr-padron/webservices/personaServiceA5, ns
  http://a5.soap.ws.server.puc.sr/, servicio WSAA: ws_sr_padron_a5).
  Mapeo condición IVA→CondicionIVAReceptorId: monotributo→6,
  exento→4, inscripto→1, sin datos→5.
- TA ahora multi-servicio (HashMap en ArcaState, archivos TA_{servicio}.xml).
- Comando `buscar_persona_arca(cuit)`.
- Factura con receptor identificado: builder FECAE acepta doc_tipo/doc_nro/
  condicion_iva_receptor_id dinámicos; migración `0005_factura_receptor.sql`
  agrega cliente_cuit + condicion_iva_receptor_id a facturas. El servicio exige
  condición válida si se manda CUIT; sin CUIT queda CF (99/0/5).
- UI: tarjeta Cliente con toggle Consumidor Final ↔ CUIT específico; búsqueda
  autocompleta denominación/domicilio/condición; bloquea emitir hasta buscar;
  avisa si ARCA informa estado != ACTIVO. La vista impresa muestra el cliente.

**Pendiente de esta etapa:**
- Primera emisión REAL desde la app en homologación (aún no se corrió;
  también está el test ignorado `fe_cae_solicitar_factura_c_real_homologacion`).
- Verificar impresión física en la impresora A4.
- Migrar a producción cuando el dueño lo decida (ver reglas).

## 9. REGLAS PERMANENTES

1. No regenerar certificado/CSR ni crear puntos de venta nuevos.
2. Producción deshabilitada hasta decisión explícita (requiere cert propio).
3. No exponer token/sign/clave privada en logs, respuestas o código.
4. Avanzar paso a paso verificando cada etapa contra homologación.
5. El objetivo final es facturar desde la app Tauri real, no scripts.

---

### HISTORIAL RESUMIDO DE LA PRUEBA MANUAL ORIGINAL (por si hay que comparar)

- Se probó todo a mano desde ~/arca-testing con OpenSSL/curl/xmllint (sin Python).
- Errores resueltos entonces: xml.expirationTime.expired (fechas del LTR),
  error 10246 por CondicionIVAReceptorId faltante (campo obligatorio RG 5616),
  y confusión CondicionIvaReceptorId vs CondicionIVAReceptorId (con IVA mayúsculas).
- Primer CAE manual: Factura C nro 1, pto 10, $100 → A, CAE 86340784845266, vto 20260901.
- Endpoints homo: wsaahomo.afip.gov.ar/ws/services/LoginCms ·
  wswhomo.afip.gov.ar/wsfev1/service.asmx
