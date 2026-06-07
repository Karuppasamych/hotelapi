ALTER TABLE inventory ADD COLUMN prepared_stock DECIMAL(10,2) DEFAULT 0 AFTER quantity_available;
