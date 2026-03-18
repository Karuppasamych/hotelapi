import { Request, Response } from 'express';
import { pool } from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export const createPurchaseItem = async (req: Request, res: Response) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { item_name, quantity, unit, date } = req.body;

    // Check if item exists in inventory
    const [existing] = await connection.query<RowDataPacket[]>(
      'SELECT id, quantity_available, unit FROM inventory WHERE LOWER(name) = LOWER(?)',
      [item_name]
    );

    let inventoryId: number | null = null;
    let inStock = 0;

    if (existing.length > 0) {
      // Item exists in inventory
      inventoryId = existing[0].id;
      inStock = parseFloat(existing[0].quantity_available) || 0;
    } else {
      // New item - insert into inventory
      const [invResult] = await connection.query<ResultSetHeader>(
        'INSERT INTO inventory (product_code, name, category, quantity_available, unit, price, minimum_stock) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [`PUR-${Date.now()}`, item_name, 'Purchase', 0, unit, 0, 0]
      );
      inventoryId = invResult.insertId;
      inStock = 0;
    }

    const required = quantity > inStock ? quantity : 0;

    // Insert into purchase_list
    const [result] = await connection.query<ResultSetHeader>(
      'INSERT INTO purchase_list (item_name, quantity, unit, in_stock, required, inventory_id, date) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [item_name, quantity, unit, inStock, required, inventoryId, date]
    );

    await connection.commit();

    res.status(201).json({
      success: true,
      data: {
        id: result.insertId,
        item_name,
        quantity,
        unit,
        in_stock: inStock,
        required,
        inventory_id: inventoryId,
        date,
        is_new_item: existing.length === 0
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating purchase item:', error);
    res.status(500).json({ success: false, error: 'Error creating purchase item' });
  } finally {
    connection.release();
  }
};

export const getPurchaseListByDate = async (req: Request, res: Response) => {
  try {
    const { date } = req.params;
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM purchase_list WHERE date = ? ORDER BY created_at DESC',
      [date]
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching purchase list:', error);
    res.status(500).json({ success: false, error: 'Error fetching purchase list' });
  }
};

export const getAllPurchaseList = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM purchase_list ORDER BY date DESC, created_at DESC'
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching purchase list:', error);
    res.status(500).json({ success: false, error: 'Error fetching purchase list' });
  }
};

export const deletePurchaseItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM purchase_list WHERE id = ?', [id]);
    res.json({ success: true, message: 'Purchase item deleted' });
  } catch (error) {
    console.error('Error deleting purchase item:', error);
    res.status(500).json({ success: false, error: 'Error deleting purchase item' });
  }
};
