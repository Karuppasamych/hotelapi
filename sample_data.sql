-- Sample data for Hotel Biryani Management System

USE hotel_biryani_db;

-- Insert ingredients
INSERT INTO ingredients (id, name, unit, cost_per_unit) VALUES
('ing-1', 'Basmati Rice', 'kg', 120.00),
('ing-2', 'Chicken', 'kg', 280.00),
('ing-3', 'Mutton', 'kg', 450.00),
('ing-4', 'Onions', 'kg', 40.00),
('ing-5', 'Yogurt', 'kg', 60.00),
('ing-6', 'Spices Mix', 'kg', 800.00),
('ing-7', 'Vegetables Mix', 'kg', 80.00),
('ing-8', 'Ghee', 'kg', 500.00);

-- Insert recipes
INSERT INTO recipes (id, name, type, base_quantity, preparation_time) VALUES
('rec-1', 'Chicken Biryani', 'chicken', 1.00, 90),
('rec-2', 'Mutton Biryani', 'mutton', 1.00, 120),
('rec-3', 'Veg Biryani', 'veg', 1.00, 60);

-- Insert recipe ingredients
INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity) VALUES
-- Chicken Biryani
('rec-1', 'ing-1', 0.500), -- Basmati Rice
('rec-1', 'ing-2', 0.600), -- Chicken
('rec-1', 'ing-4', 0.200), -- Onions
('rec-1', 'ing-5', 0.100), -- Yogurt
('rec-1', 'ing-6', 0.050), -- Spices Mix
('rec-1', 'ing-8', 0.050), -- Ghee

-- Mutton Biryani
('rec-2', 'ing-1', 0.500), -- Basmati Rice
('rec-2', 'ing-3', 0.600), -- Mutton
('rec-2', 'ing-4', 0.200), -- Onions
('rec-2', 'ing-5', 0.100), -- Yogurt
('rec-2', 'ing-6', 0.050), -- Spices Mix
('rec-2', 'ing-8', 0.050), -- Ghee

-- Veg Biryani
('rec-3', 'ing-1', 0.500), -- Basmati Rice
('rec-3', 'ing-7', 0.400), -- Vegetables Mix
('rec-3', 'ing-4', 0.150), -- Onions
('rec-3', 'ing-5', 0.080), -- Yogurt
('rec-3', 'ing-6', 0.040), -- Spices Mix
('rec-3', 'ing-8', 0.040); -- Ghee

-- Insert initial inventory
INSERT INTO inventory (recipe_id, quantity_available, status) VALUES
('rec-1', 5.00, 'available'),
('rec-2', 3.00, 'low_stock'),
('rec-3', 4.00, 'available');