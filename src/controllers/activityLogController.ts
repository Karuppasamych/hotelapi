import { Request, Response } from 'express';
import { pool } from '../config/database';
import { RowDataPacket } from 'mysql2';

export const getActivityLogs = async (req: Request, res: Response) => {
  try {
    const { category, limit = 100, offset = 0, date } = req.query;

    let query = 'SELECT * FROM activity_logs';
    const params: any[] = [];
    const conditions: string[] = [];

    if (category) {
      conditions.push('category = ?');
      params.push(category);
    }
    if (date) {
      conditions.push('DATE(created_at) = ?');
      params.push(date);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));

    const [rows] = await pool.query<RowDataPacket[]>(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM activity_logs';
    if (conditions.length > 0) {
      countQuery += ' WHERE ' + conditions.join(' AND ');
    }
    const [countRows] = await pool.query<RowDataPacket[]>(countQuery, params.slice(0, conditions.length));

    res.json({ success: true, data: rows, total: countRows[0].total });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    res.status(500).json({ success: false, error: 'Error fetching activity logs' });
  }
};
