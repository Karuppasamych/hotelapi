import { Request, Response } from 'express';
import { pool } from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export const getAllCuisines = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM cuisines ORDER BY cuisine_name');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching cuisines', error });
  }
};

export const addCuisine = async (req: Request, res: Response) => {
  try {
    const { cuisine_name, cuisine_image } = req.body;
    const [result] = await pool.query<ResultSetHeader>(
      'INSERT INTO cuisines (cuisine_name, cuisine_image) VALUES (?, ?)',
      [cuisine_name, cuisine_image]
    );
    res.status(201).json({ id: result.insertId, cuisine_name, cuisine_image });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ message: 'Cuisine already exists' });
    } else {
      res.status(500).json({ message: 'Error adding cuisine', error });
    }
  }
};

export const updateCuisine = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { cuisine_name, cuisine_image } = req.body;
    await pool.query(
      'UPDATE cuisines SET cuisine_name = ?, cuisine_image = ? WHERE id = ?',
      [cuisine_name, cuisine_image, id]
    );
    res.json({ id, cuisine_name, cuisine_image });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ message: 'Cuisine name already exists' });
    } else {
      res.status(500).json({ message: 'Error updating cuisine', error });
    }
  }
};

export const deleteCuisine = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM cuisines WHERE id = ?', [id]);
    res.json({ message: 'Cuisine deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting cuisine', error });
  }
};
