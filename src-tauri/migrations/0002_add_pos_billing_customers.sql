-- 1. Crear tabla de Detalles de Ventas
CREATE TABLE IF NOT EXISTS sale_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price REAL NOT NULL,
    total_price REAL NOT NULL,
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- 2. Alterar tabla sales para soportar métodos de pago y ARCA/AFIP
ALTER TABLE sales ADD COLUMN payment_method TEXT NOT NULL DEFAULT 'EFECTIVO';
ALTER TABLE sales ADD COLUMN customer_id INTEGER REFERENCES customers(id);
ALTER TABLE sales ADD COLUMN is_facturada INTEGER NOT NULL DEFAULT 0;
ALTER TABLE sales ADD COLUMN invoice_type TEXT;
ALTER TABLE sales ADD COLUMN invoice_number TEXT;
ALTER TABLE sales ADD COLUMN cae TEXT;
ALTER TABLE sales ADD COLUMN cae_expiration TEXT;

-- 3. Crear tabla de Clientes y Cobros
CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    doc_type TEXT DEFAULT 'DNI',
    doc_number TEXT,
    phone TEXT,
    address TEXT,
    current_balance REAL DEFAULT 0.0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customer_payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    payment_method TEXT NOT NULL,
    note TEXT,
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- 4. Crear tabla de Reminders
CREATE TABLE IF NOT EXISTS reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    is_completed INTEGER NOT NULL DEFAULT 0,
    due_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);