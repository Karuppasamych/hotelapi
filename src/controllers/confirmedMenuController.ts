import { Request, Response } from 'express';
import { pool } from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export const createConfirmedMenu = async (req: Request, res: Response) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    const { date, dishes } = req.body;
    
    // Insert confirmed menu
    const [result] = await connection.query<ResultSetHeader>(
      'INSERT INTO confirmed_menus (date) VALUES (?)',
      [date]
    );
    
    const menuId = result.insertId;
    
    // Insert dishes
    if (dishes && dishes.length > 0) {
      for (const dish of dishes) {
        await connection.query(
          'INSERT INTO confirmed_menu_dishes (menu_id, dish_id, servings) VALUES (?, ?, ?)',
          [menuId, dish.dish_id, dish.servings]
        );
      }
    }
    
    await connection.commit();
    res.status(201).json({ success: true, data: { id: menuId }, message: 'Menu confirmed successfully' });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ success: false, error: 'Error confirming menu' });
  } finally {
    connection.release();
  }
};

export const getAllConfirmedMenus = async (req: Request, res: Response) => {
  try {
    const [menus] = await pool.query<RowDataPacket[]>(`
      SELECT id, date, created_at as timestamp 
      FROM confirmed_menus 
      ORDER BY date DESC
    `);
    
    const menusWithDishes = [];
    
    for (const menu of menus) {
      const [dishes] = await pool.query<RowDataPacket[]>(`
        SELECT cmd.servings, r.id, r.name, r.category, r.servings as default_servings, c.cuisine_name as cuisine
        FROM confirmed_menu_dishes cmd
        JOIN recipes r ON cmd.dish_id = r.id
        LEFT JOIN cuisines c ON r.cuisine_id = c.id
        WHERE cmd.menu_id = ?
      `, [menu.id]);
      
      const dishesWithIngredients = [];
      
      for (const dish of dishes) {
        const [ingredients] = await pool.query<RowDataPacket[]>(
          'SELECT ri.ingredient_name as name, ri.quantity, ri.unit, i.id as ingredient_id FROM recipe_ingredients ri LEFT JOIN inventory i ON ri.ingredient_name = i.name WHERE ri.recipe_id = ?',
          [dish.id]
        );
        
        const [instructions] = await pool.query<RowDataPacket[]>(
          'SELECT instruction FROM recipe_instructions WHERE recipe_id = ? ORDER BY step_number',
          [dish.id]
        );
        
        dishesWithIngredients.push({
          dish: {
            id: dish.id.toString(),
            name: dish.name,
            category: dish.category,
            cuisine: dish.cuisine || 'Other',
            servings: dish.default_servings,
            ingredients: ingredients.map((ing: any) => ({
              ingredientId: ing.ingredient_id?.toString() || '0',
              amount: parseFloat(ing.quantity) || 0,
              ingredientName: ing.name,
              unit: ing.unit
            })),
            instructions: instructions.map((i: any) => i.instruction)
          },
          servings: dish.servings
        });
      }
      
      menusWithDishes.push({
        id: menu.id.toString(),
        date: new Date(menu.date).toISOString().split('T')[0],
        timestamp: new Date(menu.timestamp).getTime(),
        dishes: dishesWithIngredients
      });
    }
    
    res.json({ success: true, data: menusWithDishes });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error fetching confirmed menus' });
  }
};

export const getConfirmedMenuByDate = async (req: Request, res: Response) => {
  try {
    const { date } = req.params;
    
    const [menus] = await pool.query<RowDataPacket[]>(
      'SELECT id, date, created_at as timestamp FROM confirmed_menus WHERE date = ?',
      [date]
    );
    
    if (menus.length === 0) {
      return res.status(404).json({ success: false, error: 'Menu not found' });
    }
    
    const menu = menus[0];
    const [dishes] = await pool.query<RowDataPacket[]>(`
      SELECT cmd.servings, r.id, r.name, r.category, r.servings as default_servings, c.cuisine_name as cuisine
      FROM confirmed_menu_dishes cmd
      JOIN recipes r ON cmd.dish_id = r.id
      LEFT JOIN cuisines c ON r.cuisine_id = c.id
      WHERE cmd.menu_id = ?
    `, [menu.id]);
    
    res.json({ success: true, data: { ...menu, dishes } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error fetching menu' });
  }
};

export const updateConfirmedMenu = async (req: Request, res: Response) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    const { id } = req.params;
    const { dishes } = req.body;
    
    // Delete old dishes
    await connection.query('DELETE FROM confirmed_menu_dishes WHERE menu_id = ?', [id]);
    
    // Insert new dishes
    if (dishes && dishes.length > 0) {
      for (const dish of dishes) {
        await connection.query(
          'INSERT INTO confirmed_menu_dishes (menu_id, dish_id, servings) VALUES (?, ?, ?)',
          [id, dish.dish_id, dish.servings]
        );
      }
    }
    
    await connection.commit();
    res.json({ success: true, message: 'Menu updated successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Update menu error:', error);
    res.status(500).json({ success: false, error: 'Error updating menu' });
  } finally {
    connection.release();
  }
};

export const deleteConfirmedMenu = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM confirmed_menus WHERE id = ?', [id]);
    res.json({ success: true, message: 'Menu deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error deleting menu' });
  }
};
