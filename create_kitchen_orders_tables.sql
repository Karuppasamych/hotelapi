-- Kitchen Orders table
CREATE TABLE IF NOT EXISTS kitchen_orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_number VARCHAR(20) NOT NULL,
  table_number VARCHAR(20),
  order_type ENUM('dine-in', 'parcel') DEFAULT 'dine-in',
  number_of_persons VARCHAR(10),
  customer_name VARCHAR(100),
  mobile_number VARCHAR(15),
  status ENUM('pending', 'preparing', 'ready', 'served') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Kitchen Order Items table
CREATE TABLE IF NOT EXISTS kitchen_order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  kitchen_order_id INT NOT NULL,
  item_name VARCHAR(255) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  category VARCHAR(100),
  notes VARCHAR(255),
  FOREIGN KEY (kitchen_order_id) REFERENCES kitchen_orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
