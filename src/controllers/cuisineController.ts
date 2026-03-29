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
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { id } = req.params;

    // Get all recipes under this cuisine
    const [recipes] = await connection.query<RowDataPacket[]>(
      'SELECT id FROM recipes WHERE cuisine_id = ?',
      [id]
    );

    // Restore inventory for each recipe's ingredients
    for (const recipe of recipes) {
      const [ingredients] = await connection.query<RowDataPacket[]>(
        'SELECT ingredient_name, quantity, unit FROM recipe_ingredients WHERE recipe_id = ?',
        [recipe.id]
      );
      for (const ing of ingredients) {
        const [items] = await connection.query<RowDataPacket[]>(
          'SELECT id, quantity_available, unit FROM inventory WHERE LOWER(TRIM(name)) = LOWER(TRIM(?))',
          [ing.ingredient_name]
        );
        if (items.length > 0) {
          const item = items[0];
          const recipeQty = parseFloat(ing.quantity) || 0;
          const recipeUnit = (ing.unit || '').toLowerCase();
          const invUnit = (item.unit || '').toLowerCase();
          let convertedQty = recipeQty;
          if (recipeUnit === 'g' && invUnit === 'kg') convertedQty = recipeQty / 1000;
          else if (recipeUnit === 'kg' && invUnit === 'g') convertedQty = recipeQty * 1000;
          else if (recipeUnit === 'ml' && invUnit === 'l') convertedQty = recipeQty / 1000;
          else if (recipeUnit === 'l' && invUnit === 'ml') convertedQty = recipeQty * 1000;
          await connection.query(
            'UPDATE inventory SET quantity_available = quantity_available + ? WHERE id = ?',
            [convertedQty, item.id]
          );
        }
      }
    }

    await connection.query('DELETE FROM cuisines WHERE id = ?', [id]);
    await connection.commit();
    res.json({ message: 'Cuisine deleted successfully' });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ message: 'Error deleting cuisine', error });
  } finally {
    connection.release();
  }
};
