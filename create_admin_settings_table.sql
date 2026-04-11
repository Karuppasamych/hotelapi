CREATE TABLE IF NOT EXISTS admin_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(50) NOT NULL UNIQUE,
  setting_value VARCHAR(100) NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Default values
INSERT INTO admin_settings (setting_key, setting_value) VALUES 
  ('service_charge_enabled', 'true'),
  ('service_charge_percent', '5'),
  ('cgst_percent', '2.5'),
  ('sgst_percent', '2.5')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);
