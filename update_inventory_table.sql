-- Modify inventory table to include direct fields
USE hotel_biryani_db;

-- Drop existing inventory table
DROP TABLE IF EXISTS inventory;

-- Create new inventory table with direct fields
CREATE TABLE inventory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    quantity_available DECIMAL(8,2) NOT NULL DEFAULT 0,
    price_per_unit DECIMAL(10,2) NOT NULL,
    status ENUM('available', 'low_stock', 'out_of_stock') DEFAULT 'available',
    last_prepared TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert sample data
INSERT INTO inventory (name, unit, quantity_available, price_per_unit, status) VALUES
('Chicken Biryani', 'kg', 5.00, 250.00, 'available'),
('Mutton Biryani', 'kg', 3.00, 350.00, 'low_stock'),
('Veg Biryani', 'kg', 4.00, 180.00, 'available');