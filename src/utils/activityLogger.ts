import { pool } from '../config/database';

export type ActivityCategory =
  | 'auth'
  | 'billing'
  | 'inventory'
  | 'manager_todo'
  | 'kitchen'
  | 'admin'
  | 'draft'
  | 'recipe'
  | 'menu';

interface LogParams {
  action: string;
  category: ActivityCategory;
  description?: string;
  user?: string;
  metadata?: Record<string, any>;
}

export const logActivity = async ({ action, category, description, user, metadata }: LogParams) => {
  try {
    await pool.execute(
      'INSERT INTO activity_logs (action, category, description, user, metadata) VALUES (?, ?, ?, ?, ?)',
      [action, category, description || null, user || null, metadata ? JSON.stringify(metadata) : null]
    );
  } catch (error) {
    console.error('Activity log error:', error);
  }
};
