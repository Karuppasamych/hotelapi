-- Add meal_time column to confirmed_menus
ALTER TABLE confirmed_menus ADD COLUMN meal_time VARCHAR(30) DEFAULT 'lunch' AFTER date;

-- Drop unique date constraint to allow multiple meal times per date
ALTER TABLE confirmed_menus DROP INDEX unique_date;
