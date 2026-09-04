-- Gastos personales e impuestos (separados de compras a proveedores)
CREATE TABLE IF NOT EXISTS gastos_personales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha TEXT NOT NULL,
    monto REAL NOT NULL,
    descripcion TEXT NOT NULL,
    categoria TEXT NOT NULL DEFAULT 'OTRO',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_gastos_personales_fecha ON gastos_personales(fecha DESC, id DESC);
