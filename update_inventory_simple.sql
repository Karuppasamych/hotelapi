-- Remove last_prepared and status columns from inventory table
USE hotel_biryani_db;

-- Drop existing inventory table
DROP TABLE IF EXISTS inventory;

-- Create new inventory table without last_prepared and status
CREATE TABLE inventory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    quantity_available DECIMAL(8,2) NOT NULL DEFAULT 0,
    price_per_unit DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert sample data
INSERT INTO inventory (name, unit, quantity_available, price_per_unit) VALUES
('Chicken Biryani', 'kg', 5.00, 250.00),
('Mutton Biryani', 'kg', 3.00, 350.00),
('Veg Biryani', 'kg', 4.00, 180.00);