-- Tipo de venta: TOTAL_DIA (solo monto) o DETALLADA (con ítems)
ALTER TABLE sales ADD COLUMN sale_type TEXT NOT NULL DEFAULT 'DETALLADA';

-- Recordatorios / deudas con proveedores
ALTER TABLE reminders ADD COLUMN amount REAL;
ALTER TABLE reminders ADD COLUMN supplier_id INTEGER REFERENCES suppliers(id);
ALTER TABLE reminders ADD COLUMN reminder_type TEXT NOT NULL DEFAULT 'GENERAL';

-- Tipo de movimiento en cuenta corriente
ALTER TABLE customer_payments ADD COLUMN transaction_type TEXT NOT NULL DEFAULT 'PAGO';
