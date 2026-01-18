-- Alter existing inventory table to add new columns for raw materials management
USE hotel_biryani_db;

-- Add columns one by one (ignore errors if column exists)
ALTER TABLE inventory ADD COLUMN product_code VARCHAR(20) UNIQUE;
ALTER TABLE inventory ADD COLUMN name VARCHAR(255);
ALTER TABLE inventory ADD COLUMN category VARCHAR(100);
ALTER TABLE inventory ADD COLUMN unit VARCHAR(20);
ALTER TABLE inventory ADD COLUMN price DECIMAL(10,2) DEFAULT 0;
ALTER TABLE inventory ADD COLUMN minimum_stock DECIMAL(10,2) DEFAULT 0;

-- Update existing columns to match requirements
ALTER TABLE inventory 
MODIFY COLUMN quantity_available DECIMAL(10,2) NOT NULL DEFAULT 0;

-- Create indexes (ignore errors if index exists)
CREATE INDEX idx_inventory_product_code ON inventory(product_code);
CREATE INDEX idx_inventory_name ON inventory(name);
CREATE INDEX idx_inventory_category ON inventory(category);

-- Note: Run each ALTER statement individually and ignore duplicate column errors