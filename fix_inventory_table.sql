-- Fix inventory table structure for raw materials
USE myapp_hotelstaging;

-- Create a new inventory table with correct structure
DROP TABLE IF EXISTS inventory_backup;
CREATE TABLE inventory_backup AS SELECT * FROM inventory;

DROP TABLE IF EXISTS inventory;

CREATE TABLE inventory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    quantity_available DECIMAL(10,2) NOT NULL DEFAULT 0,
    unit VARCHAR(20) NOT NULL,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    minimum_stock DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert sample data
INSERT INTO inventory (product_code, name, category, quantity_available, unit, price, minimum_stock) VALUES
('MPH001', 'Tomatoes', 'Vegetables', 25.00, 'kg', 50.00, 10.00),
('MPH002', 'Rice', 'Grains', 50.00, 'kg', 60.00, 20.00);