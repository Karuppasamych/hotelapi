-- Create recipes table
CREATE TABLE IF NOT EXISTS recipes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  cuisine_id INT NOT NULL,
  description TEXT,
  prep_time VARCHAR(50),
  cook_time VARCHAR(50),
  servings VARCHAR(50),
  difficulty VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (cuisine_id) REFERENCES cuisines(id) ON DELETE CASCADE
);

-- Create recipe_ingredients table (for many-to-many relationship)
CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  recipe_id INT NOT NULL,
  ingredient_name VARCHAR(255) NOT NULL,
  quantity VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
);

-- Create recipe_instructions table (to maintain order of steps)
CREATE TABLE IF NOT EXISTS recipe_instructions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  recipe_id INT NOT NULL,
  step_number INT NOT NULL,
  instruction TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
);

-- Insert sample Chicken Biryani recipe
INSERT INTO recipes (name, category, cuisine_id, description, prep_time, cook_time, servings, difficulty) 
VALUES (
  'Chicken Biryani',
  'Main Course',
  (SELECT id FROM cuisines WHERE cuisine_name = 'Indian' LIMIT 1),
  'Aromatic basmati rice layered with tender chicken and fragrant spices',
  '30 mins',
  '45 mins',
  '4 people',
  'Medium'
);

-- Get the last inserted recipe id
SET @recipe_id = LAST_INSERT_ID();

-- Insert ingredients for Chicken Biryani
INSERT INTO recipe_ingredients (recipe_id, ingredient_name, quantity) VALUES
(@recipe_id, 'Basmati Rice', '150g'),
(@recipe_id, 'Chicken (with bone)', '200g'),
(@recipe_id, 'Onions (sliced)', '1 medium'),
(@recipe_id, 'Tomatoes (chopped)', '1 medium'),
(@recipe_id, 'Yogurt', '3 tbsp'),
(@recipe_id, 'Ginger-Garlic Paste', '1 tbsp'),
(@recipe_id, 'Biryani Masala', '1.5 tsp'),
(@recipe_id, 'Turmeric Powder', '1/4 tsp'),
(@recipe_id, 'Red Chili Powder', '1/2 tsp'),
(@recipe_id, 'Fresh Mint Leaves', '1 tbsp'),
(@recipe_id, 'Fresh Coriander Leaves', '1 tbsp'),
(@recipe_id, 'Ghee/Oil', '2 tbsp'),
(@recipe_id, 'Salt', 'to taste'),
(@recipe_id, 'Saffron strands', '8-10 strands'),
(@recipe_id, 'Warm Milk', '2 tbsp');

-- Insert instructions for Chicken Biryani
INSERT INTO recipe_instructions (recipe_id, step_number, instruction) VALUES
(@recipe_id, 1, 'Soak basmati rice in water for 30 minutes, then drain.'),
(@recipe_id, 2, 'Marinate chicken pieces with yogurt, ginger-garlic paste, biryani masala, turmeric, chili powder, and salt for 20 minutes.'),
(@recipe_id, 3, 'Heat ghee in a heavy-bottomed pan and fry sliced onions until golden brown. Remove half for garnishing.'),
(@recipe_id, 4, 'Add marinated chicken to the pan and cook for 5-7 minutes until partially cooked.'),
(@recipe_id, 5, 'Add chopped tomatoes, mint, and coriander leaves. Cook for another 5 minutes.'),
(@recipe_id, 6, 'In a separate pot, boil water with salt and cook rice until 70% done. Drain immediately.'),
(@recipe_id, 7, 'Soak saffron in warm milk. Layer the partially cooked rice over the chicken mixture.'),
(@recipe_id, 8, 'Drizzle saffron milk and fried onions on top. Cover with a tight lid.'),
(@recipe_id, 9, 'Cook on high heat for 3 minutes, then reduce to low and cook for 20 minutes (dum).'),
(@recipe_id, 10, 'Turn off heat and let it rest for 5 minutes before opening. Gently mix and serve hot.');
