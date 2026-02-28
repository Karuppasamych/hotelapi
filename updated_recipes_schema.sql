-- ALTER TABLE statements for existing recipe tables

-- Modify recipe_ingredients table
ALTER TABLE recipe_ingredients 
  MODIFY COLUMN quantity DECIMAL(10,2) NOT NULL,
  ADD COLUMN unit VARCHAR(50) AFTER quantity;
