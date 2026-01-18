-- Step 1: Create database and user (Run as MySQL root user)
CREATE DATABASE IF NOT EXISTS hotel_biryani_db;

-- Create a user for the application (optional, or use root)
CREATE USER IF NOT EXISTS 'hotel_user'@'localhost' IDENTIFIED BY 'hotel123';
GRANT ALL PRIVILEGES ON hotel_biryani_db.* TO 'hotel_user'@'localhost';
FLUSH PRIVILEGES;

-- Step 2: Use the database
USE hotel_biryani_db;

-- Step 3: Create tables
CREATE TABLE ingredients (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    cost_per_unit DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE recipes (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type ENUM('chicken', 'mutton', 'veg') NOT NULL,
    base_quantity DECIMAL(5,2) NOT NULL DEFAULT 1.00,
    preparation_time INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE recipe_ingredients (
    recipe_id VARCHAR(50),
    ingredient_id VARCHAR(50),
    quantity DECIMAL(8,3) NOT NULL,
    PRIMARY KEY (recipe_id, ingredient_id),
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
    FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE
);

CREATE TABLE inventory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    recipe_id VARCHAR(50) NOT NULL,
    quantity_available DECIMAL(8,2) NOT NULL DEFAULT 0,
    last_prepared TIMESTAMP NULL,
    expiry_date TIMESTAMP NULL,
    status ENUM('available', 'low_stock', 'out_of_stock') DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
);

CREATE TABLE sales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    recipe_id VARCHAR(50) NOT NULL,
    quantity_sold DECIMAL(8,2) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    customer_info VARCHAR(255) NULL,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id)
);

-- Step 4: Insert sample data
INSERT INTO ingredients (id, name, unit, cost_per_unit) VALUES
('ing-1', 'Basmati Rice', 'kg', 120.00),
('ing-2', 'Chicken', 'kg', 280.00),
('ing-3', 'Mutton', 'kg', 450.00),
('ing-4', 'Onions', 'kg', 40.00),
('ing-5', 'Yogurt', 'kg', 60.00),
('ing-6', 'Spices Mix', 'kg', 800.00),
('ing-7', 'Vegetables Mix', 'kg', 80.00),
('ing-8', 'Ghee', 'kg', 500.00);

INSERT INTO recipes (id, name, type, base_quantity, preparation_time) VALUES
('rec-1', 'Chicken Biryani', 'chicken', 1.00, 90),
('rec-2', 'Mutton Biryani', 'mutton', 1.00, 120),
('rec-3', 'Veg Biryani', 'veg', 1.00, 60);

INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity) VALUES
-- Chicken Biryani
('rec-1', 'ing-1', 0.500),
('rec-1', 'ing-2', 0.600),
('rec-1', 'ing-4', 0.200),
('rec-1', 'ing-5', 0.100),
('rec-1', 'ing-6', 0.050),
('rec-1', 'ing-8', 0.050),

-- Mutton Biryani
('rec-2', 'ing-1', 0.500),
('rec-2', 'ing-3', 0.600),
('rec-2', 'ing-4', 0.200),
('rec-2', 'ing-5', 0.100),
('rec-2', 'ing-6', 0.050),
('rec-2', 'ing-8', 0.050),

-- Veg Biryani
('rec-3', 'ing-1', 0.500),
('rec-3', 'ing-7', 0.400),
('rec-3', 'ing-4', 0.150),
('rec-3', 'ing-5', 0.080),
('rec-3', 'ing-6', 0.040),
('rec-3', 'ing-8', 0.040);

INSERT INTO inventory (recipe_id, quantity_available, status) VALUES
('rec-1', 5.00, 'available'),
('rec-2', 3.00, 'low_stock'),
('rec-3', 4.00, 'available');