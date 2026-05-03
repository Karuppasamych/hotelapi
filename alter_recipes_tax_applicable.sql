ALTER TABLE recipes ADD COLUMN tax_applicable TINYINT(1) DEFAULT 1 AFTER price;
