INSERT INTO admin_settings (setting_key, setting_value) VALUES ('total_tables', '20')
ON DUPLICATE KEY UPDATE setting_value = setting_value;
