-- Add inventory_items table for raw materials inventory management
-- This table matches the InventoryItem interface from the frontend

USE hotel_biryani_db;

-- Create inventory_items table for raw materials
CREATE TABLE inventory_items (
    id VARCHAR(50) PRIMARY KEY,
    product_code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
    unit VARCHAR(20) NOT NULL,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    minimum_stock DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_inventory_items_category ON inventory_items(category);
CREATE INDEX idx_inventory_items_product_code ON inventory_items(product_code);
CREATE INDEX idx_inventory_items_name ON inventory_items(name);
CREATE INDEX idx_inventory_items_stock_level ON inventory_items(quantity, minimum_stock);

-- Insert sample data matching INITIAL_INVENTORY from frontend
INSERT INTO inventory_items (id, product_code, name, category, quantity, unit, price, minimum_stock) VALUES
('1', 'MPH001', 'Tomatoes', 'Vegetables', 25.00, 'kg', 3.50, 10.00),
('2', 'MPH002', 'Rice', 'Grains', 50.00, 'kg', 2.20, 20.00),
('3', 'MPH003', 'Milk', 'Dairy', 8.00, 'L', 4.50, 15.00),
('4', 'MPH004', 'Chicken Breast', 'Meat', 12.00, 'kg', 8.99, 5.00),
('5', 'MPH005', 'Olive Oil', 'Condiments', 0.00, 'L', 12.50, 3.00),
('6', 'MPH006', 'Potatoes', 'Vegetables', 18.00, 'kg', 1.80, 15.00),
('7', 'MPH007', 'Onions', 'Vegetables', 30.00, 'kg', 2.50, 15.00),
('8', 'MPH008', 'Basmati Rice', 'Grains', 40.00, 'kg', 5.80, 25.00),
('9', 'MPH009', 'Paneer', 'Dairy', 6.00, 'kg', 12.00, 8.00),
('10', 'MPH010', 'Mutton', 'Meat', 15.00, 'kg', 18.50, 10.00),
('11', 'MPH011', 'Ghee', 'Dairy', 10.00, 'L', 15.00, 5.00),
('12', 'MPH012', 'Turmeric Powder', 'Spices', 2.00, 'kg', 8.50, 3.00),
('13', 'MPH013', 'Chili Powder', 'Spices', 4.00, 'kg', 7.20, 3.00),
('14', 'MPH014', 'Coriander Leaves', 'Vegetables', 3.00, 'kg', 4.00, 5.00),
('15', 'MPH015', 'Wheat Flour', 'Grains', 35.00, 'kg', 3.20, 20.00),
('16', 'MPH016', 'Coconut Oil', 'Condiments', 8.00, 'L', 10.00, 5.00);