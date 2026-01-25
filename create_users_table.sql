-- Create users table for authentication
USE myapp_hotelstaging; 

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role ENUM('admin', 'manager', 'staff') DEFAULT 'staff',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default admin user
-- Username: admin
-- Password: admin123
INSERT INTO users (username, password, name, role) VALUES 
('admin', '$2a$10$KTclMluJj5Uo52Hb7z3a5eLHf5QNXNu82WLaETB3mc56r3ufuXR5e', 'Admin User', 'admin');
