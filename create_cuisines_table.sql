CREATE TABLE IF NOT EXISTS cuisines (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cuisine_name VARCHAR(100) NOT NULL UNIQUE,
  cuisine_image LONGTEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default cuisines
INSERT INTO cuisines (cuisine_name, cuisine_image) VALUES
('Indian', 'https://images.unsplash.com/photo-1567337710282-00832b415979?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjBjdXJyeSUyMGZvb2R8ZW58MXx8fHwxNzY4MTA0MDg1fDA&ixlib=rb-4.1.0&q=80&w=400'),
ON DUPLICATE KEY UPDATE cuisine_name=cuisine_name;
