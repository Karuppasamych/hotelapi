-- Migration: Create manager_todo table
-- Date: 2026-04-01

CREATE TABLE IF NOT EXISTS manager_todo (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date DATE NOT NULL,
  ingredient_name VARCHAR(255) NOT NULL,
  ingredient_id INT DEFAULT NULL,
  total_quantity DECIMAL(10,3) NOT NULL DEFAULT 0,
  used_quantity DECIMAL(10,3) NOT NULL DEFAULT 0,
  remaining_quantity DECIMAL(10,3) NOT NULL DEFAULT 0,
  unit VARCHAR(50) NOT NULL,
  dish_name VARCHAR(255) DEFAULT NULL,
  status ENUM('active','completed','moved') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_date (date),
  INDEX idx_status (status),
  INDEX idx_ingredient (ingredient_id)
);
