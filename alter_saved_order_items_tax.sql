ALTER TABLE saved_order_items ADD COLUMN tax_applicable TINYINT(1) DEFAULT 1 AFTER category;
