-- Migration: Create inventory_categories table
-- Date: 2026-04-01

CREATE TABLE IF NOT EXISTS inventory_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed default categories
INSERT IGNORE INTO inventory_categories (name) VALUES
  ('Vegetables'), ('Fruits'), ('Dairy'), ('Meat'), ('Grains'),
  ('Beverages'), ('Snacks'), ('Condiments'), ('Spices'), ('Oils'),
  ('Pulses'), ('Flour'), ('Purchase'), ('Other');
