ALTER TABLE kitchen_orders ADD COLUMN initiated_by VARCHAR(100) AFTER mobile_number;
ALTER TABLE bills ADD COLUMN initiated_by VARCHAR(100) AFTER change_returned;
