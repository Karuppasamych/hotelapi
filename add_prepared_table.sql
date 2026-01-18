-- Add new table for tracking daily prepared biryani
USE hotel_biryani_db;

CREATE TABLE daily_prepared_biryani (
    id INT AUTO_INCREMENT PRIMARY KEY,
    recipe_id VARCHAR(50) NOT NULL,
    quantity_prepared DECIMAL(8,2) NOT NULL,
    preparation_cost DECIMAL(10,2) NOT NULL,
    prepared_date DATE NOT NULL,
    prepared_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('prepared', 'partially_sold', 'sold_out') DEFAULT 'prepared',
    remaining_quantity DECIMAL(8,2) NOT NULL,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id),
    UNIQUE KEY unique_recipe_date (recipe_id, prepared_date)
);