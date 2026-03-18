CREATE TABLE IF NOT EXISTS bills (
  id INT AUTO_INCREMENT PRIMARY KEY,
  bill_number VARCHAR(50) NOT NULL UNIQUE,
  customer_name VARCHAR(255) DEFAULT 'Customer',
  mobile_number VARCHAR(15) NOT NULL,
  order_type ENUM('dine-in', 'parcel') NOT NULL DEFAULT 'dine-in',
  table_number VARCHAR(10) DEFAULT NULL,
  number_of_persons VARCHAR(10) DEFAULT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  service_charge DECIMAL(10,2) NOT NULL DEFAULT 0,
  cgst DECIMAL(10,2) NOT NULL DEFAULT 0,
  sgst DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_method ENUM('cash', 'card', 'upi') NOT NULL,
  transaction_id VARCHAR(100) DEFAULT NULL,
  amount_paid DECIMAL(10,2) NOT NULL,
  change_returned DECIMAL(10,2) DEFAULT 0,
  status ENUM('completed', 'cancelled', 'refunded') DEFAULT 'completed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bill_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  bill_id INT NOT NULL,
  item_name VARCHAR(255) NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE
);
