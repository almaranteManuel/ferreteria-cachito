-- Factura a receptor identificado (CUIT) vía Padrón A5.

ALTER TABLE facturas ADD COLUMN cliente_cuit TEXT;
ALTER TABLE facturas ADD COLUMN condicion_iva_receptor_id INTEGER;
