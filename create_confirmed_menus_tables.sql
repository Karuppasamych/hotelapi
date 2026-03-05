-- Create confirmed_menus table
CREATE TABLE IF NOT EXISTS confirmed_menus (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create confirmed_menu_dishes table
CREATE TABLE IF NOT EXISTS confirmed_menu_dishes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  menu_id INT NOT NULL,
  dish_id INT NOT NULL,
  servings INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (menu_id) REFERENCES confirmed_menus(id) ON DELETE CASCADE,
  FOREIGN KEY (dish_id) REFERENCES recipes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create indexes for better performance
CREATE INDEX idx_menu_date ON confirmed_menus(date);
CREATE INDEX idx_menu_dishes_menu_id ON confirmed_menu_dishes(menu_id);
CREATE INDEX idx_menu_dishes_dish_id ON confirmed_menu_dishes(dish_id);
