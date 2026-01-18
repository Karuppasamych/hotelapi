import { Request, Response } from 'express';
import { pool } from '../config/database';
import { RowDataPacket } from 'mysql2';

interface InventoryRow extends RowDataPacket {
  id: string;
  product_code: string;
  name: string;
  category: string;
  quantity_available: number;
  unit: string;
  price: number;
  minimum_stock: number;
}

export const getAllInventory = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.execute<InventoryRow[]>(`
      SELECT 
        id,
        product_code,
        name,
        category,
        quantity_available,
        unit,
        price,
        minimum_stock
      FROM inventory
      WHERE product_code IS NOT NULL
      ORDER BY name
    `);
    
    res.json(rows);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
};

export const getInventoryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute<InventoryRow[]>(
      'SELECT * FROM inventory WHERE id = ?',
      [id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching inventory item:', error);
    res.status(500).json({ error: 'Failed to fetch item' });
  }
};

export const addInventoryItem = async (req: Request, res: Response) => {
  try {
    const { product_code, name, category, quantity, quantity_available, unit, price, minimum_stock } = req.body;
    const quantityValue = quantity_available || quantity;
    
    console.log('Adding inventory item:', { product_code, name, category, quantityValue, unit, price, minimum_stock });
    
    const [result] = await pool.execute(
      'INSERT INTO inventory (product_code, name, category, quantity_available, unit, price, minimum_stock) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [product_code, name, category, quantityValue, unit, price, minimum_stock]
    );
    
    const insertId = (result as any).insertId;
    const [newItem] = await pool.execute<InventoryRow[]>(
      'SELECT *, quantity_available as quantity FROM inventory WHERE id = ?',
      [insertId]
    );
    
    res.status(201).json(newItem[0]);
  } catch (error) {
    console.error('Error adding inventory item:', error);
    res.status(500).json({ error: 'Failed to add item', details: (error as Error).message });
  }
};

export const updateInventoryItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { product_code, name, category, quantity, quantity_available, unit, price, minimum_stock } = req.body;
    const quantityValue = quantity_available || quantity;
    
    await pool.execute(
      'UPDATE inventory SET product_code = ?, name = ?, category = ?, quantity_available = ?, unit = ?, price = ?, minimum_stock = ? WHERE id = ?',
      [product_code, name, category, quantityValue, unit, price, minimum_stock, id]
    );
    
    const [updatedItem] = await pool.execute<InventoryRow[]>(
      'SELECT * FROM inventory WHERE id = ?',
      [id]
    );
    
    res.json(updatedItem[0]);
  } catch (error) {
    console.error('Error updating inventory item:', error);
    res.status(500).json({ error: 'Failed to update item' });
  }
};

export const deleteInventoryItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    await pool.execute('DELETE FROM inventory WHERE id = ?', [id]);
    
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
};

export const getInventoryByCategory = async (req: Request, res: Response) => {
  try {
    const { category } = req.params;
    const [rows] = await pool.execute<InventoryRow[]>(
      'SELECT * FROM inventory WHERE category = ? ORDER BY name',
      [category]
    );
    
    res.json(rows);
  } catch (error) {
    console.error('Error fetching inventory by category:', error);
    res.status(500).json({ error: 'Failed to fetch items by category' });
  }
};

export const getLowStockItems = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.execute<InventoryRow[]>(
      'SELECT *, quantity_available as quantity FROM inventory WHERE quantity_available <= minimum_stock AND product_code IS NOT NULL ORDER BY name'
    );
    
    res.json(rows);
  } catch (error) {
    console.error('Error fetching low stock items:', error);
    res.status(500).json({ error: 'Failed to fetch low stock items' });
  }
};

export const searchInventoryItems = async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    const searchTerm = `%${q}%`;
    const [rows] = await pool.execute<InventoryRow[]>(
      'SELECT * FROM inventory WHERE name LIKE ? OR product_code LIKE ? OR category LIKE ? ORDER BY name',
      [searchTerm, searchTerm, searchTerm]
    );
    
    res.json(rows);
  } catch (error) {
    console.error('Error searching inventory items:', error);
    res.status(500).json({ error: 'Failed to search items' });
  }
};