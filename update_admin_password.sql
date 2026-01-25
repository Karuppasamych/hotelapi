-- Update admin user password
USE myapp_hotelstaging; 

-- Delete existing admin user if exists
DELETE FROM users WHERE username = 'admin';

-- Insert admin user with properly hashed password
-- Username: admin
-- Password: admin123
INSERT INTO users (username, password, name, role) VALUES 
('admin', '$2a$10$veqbBN7fJ5Xh3cchuHaTnuVtBUaHmnDSX6fS.2/b6zsx.LOOB0weW', 'Admin User', 'admin');

-- Verify the user was created
SELECT id, username, name, role FROM users WHERE username = 'admin';
