ALTER TABLE manager_todo ADD COLUMN original_total DECIMAL(10,2) DEFAULT NULL;
ALTER TABLE manager_todo ADD COLUMN reduced_from_inventory DECIMAL(10,2) DEFAULT 0;

-- Set original_total to current total_quantity for existing rows
UPDATE manager_todo SET original_total = total_quantity WHERE original_total IS NULL;
