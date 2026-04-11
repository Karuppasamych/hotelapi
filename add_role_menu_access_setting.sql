INSERT INTO admin_settings (setting_key, setting_value) VALUES 
  ('role_menu_access', '{"admin":["dashboard","inventory","recipes","calculator","billing","purchases","orders","kitchen","users","admin"],"manager":["dashboard","inventory","recipes","calculator","billing","purchases","orders","kitchen"],"stock_manager":["inventory","purchases"],"staff":["billing","orders","kitchen"],"kitchen_staff":["recipes","calculator","kitchen"]}')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);
