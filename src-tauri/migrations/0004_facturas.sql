-- Facturación electrónica ARCA: comprobantes emitidos desde la pantalla
-- de facturación directa (Consumidor Final). Desacoplado de sales.

CREATE TABLE IF NOT EXISTS facturas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha TEXT NOT NULL,
    tipo INTEGER NOT NULL DEFAULT 11,
    punto_venta INTEGER NOT NULL DEFAULT 10,
    numero INTEGER NOT NULL,
    total REAL NOT NULL,
    cae TEXT,
    cae_expiration TEXT,
    resultado TEXT NOT NULL DEFAULT 'PENDIENTE',
    cliente_nombre TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(punto_venta, tipo, numero)
);

CREATE TABLE IF NOT EXISTS factura_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    factura_id INTEGER NOT NULL,
    descripcion TEXT NOT NULL,
    cantidad REAL NOT NULL DEFAULT 1,
    precio_unitario REAL NOT NULL,
    product_id INTEGER REFERENCES products(id),
    FOREIGN KEY (factura_id) REFERENCES facturas(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_facturas_fecha ON facturas(fecha DESC);
