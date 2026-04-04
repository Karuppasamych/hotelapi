CREATE TABLE IF NOT EXISTS saved_orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  mobile_number VARCHAR(15),
  customer_name VARCHAR(100),
  order_type ENUM('dine-in', 'parcel') DEFAULT 'dine-in',
  table_number VARCHAR(20),
  number_of_persons VARCHAR(10),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS saved_order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  saved_order_id INT NOT NULL,
  item_name VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  quantity INT NOT NULL DEFAULT 1,
  category VARCHAR(100),
  FOREIGN KEY (saved_order_id) REFERENCES saved_orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
