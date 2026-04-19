-- Migration: Add stock_manager and kitchen_staff to users role ENUM
-- Date: 2026-04-01
-- Reason: UI has 5 roles but DB only had 3 (admin, manager, staff)

ALTER TABLE users MODIFY COLUMN role ENUM('admin','manager','stock_manager','staff','kitchen_staff') DEFAULT 'staff';
