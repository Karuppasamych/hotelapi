-- Hotel Biryani Management System Database Schema (MySQL)

-- Create database
CREATE DATABASE hotel_biryani_db;
USE hotel_biryani_db;

-- Recipes table
CREATE TABLE recipes (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(255) NOT NULL,
    type ENUM('chicken', 'mutton', 'veg') NOT NULL,
    base_quantity DECIMAL(10,2) NOT NULL DEFAULT 1.00,
    preparation_time INT NOT NULL, -- minutes
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Ingredients table (master list)
CREATE TABLE ingredients (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(255) NOT NULL UNIQUE,
    unit VARCHAR(50) NOT NULL, -- kg, grams, liters, pieces
    cost_per_unit DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Recipe ingredients junction table
CREATE TABLE recipe_ingredients (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    recipe_id VARCHAR(36),
    ingredient_id VARCHAR(36),
    quantity DECIMAL(10,3) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
    FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE,
    UNIQUE KEY unique_recipe_ingredient (recipe_id, ingredient_id)
);

-- Inventory table
CREATE TABLE inventory (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    recipe_id VARCHAR(36),
    quantity_available DECIMAL(10,2) NOT NULL DEFAULT 0,
    last_prepared TIMESTAMP NULL,
    expiry_date TIMESTAMP NULL,
    status ENUM('available', 'low_stock', 'out_of_stock') DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
    UNIQUE KEY unique_recipe_inventory (recipe_id)
);

-- Sales table
CREATE TABLE sales (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    recipe_id VARCHAR(36),
    quantity_sold DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    customer_info TEXT,
    sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
);

-- Stock updates table
CREATE TABLE stock_updates (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    recipe_id VARCHAR(36),
    quantity_sold DECIMAL(10,2) NOT NULL,
    sale_price DECIMAL(10,2) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_recipes_type ON recipes(type);
CREATE INDEX idx_sales_recipe_id ON sales(recipe_id);
CREATE INDEX idx_sales_date ON sales(sale_date);
CREATE INDEX idx_inventory_recipe_id ON inventory(recipe_id);
CREATE INDEX idx_inventory_status ON inventory(status);