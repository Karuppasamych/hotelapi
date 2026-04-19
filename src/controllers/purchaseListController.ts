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

    // Check if same item already exists in purchase list with pending status for same date
    const [pendingItems] = await connection.query<RowDataPacket[]>(
      "SELECT id, quantity FROM purchase_list WHERE LOWER(item_name) = LOWER(?) AND date = ? AND status = 'pending'",
      [item_name, date]
    );

    let resultId: number;
    if (pendingItems.length > 0) {
      // Update existing pending item - add to quantity
      const newQty = parseFloat(pendingItems[0].quantity) + quantity;
      await connection.query(
        'UPDATE purchase_list SET quantity = ?, in_stock = ?, required = ? WHERE id = ?',
        [newQty, inStock, newQty > inStock ? newQty : 0, pendingItems[0].id]
      );
      resultId = pendingItems[0].id;
    } else {
      // Insert new purchase list item
      const [result] = await connection.query<ResultSetHeader>(
        'INSERT INTO purchase_list (item_name, quantity, unit, in_stock, required, inventory_id, date) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [item_name, quantity, unit, inStock, required, inventoryId, date]
      );
      resultId = result.insertId;
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      data: {
        id: resultId,
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
      `SELECT pl.*, COALESCE(i.category, 'Uncategorized') as category 
       FROM purchase_list pl 
       LEFT JOIN inventory i ON pl.inventory_id = i.id 
       WHERE pl.date = ? ORDER BY pl.created_at DESC`,
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
      `SELECT pl.*, COALESCE(i.category, 'Uncategorized') as category 
       FROM purchase_list pl 
       LEFT JOIN inventory i ON pl.inventory_id = i.id 
       ORDER BY pl.date DESC, pl.created_at DESC`
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching purchase list:', error);
    res.status(500).json({ success: false, error: 'Error fetching purchase list' });
  }
};

export const updatePurchaseItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { item_name, quantity, unit } = req.body;
    if (!item_name || quantity == null || !unit) {
      return res.status(400).json({ success: false, error: 'item_name, quantity, and unit are required' });
    }
    // Recalculate in_stock from inventory
    const [inv] = await pool.query<RowDataPacket[]>(
      'SELECT quantity_available FROM inventory WHERE LOWER(name) = LOWER(?)',
      [item_name]
    );
    const inStock = inv.length > 0 ? parseFloat(inv[0].quantity_available) || 0 : 0;
    const required = quantity > inStock ? quantity : 0;

    await pool.query(
      'UPDATE purchase_list SET item_name = ?, quantity = ?, unit = ?, in_stock = ?, required = ? WHERE id = ?',
      [item_name, quantity, unit, inStock, required, id]
    );
    res.json({ success: true, message: 'Purchase item updated' });
  } catch (error) {
    console.error('Error updating purchase item:', error);
    res.status(500).json({ success: false, error: 'Error updating purchase item' });
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

export const updatePurchaseStatus = async (req: Request, res: Response) => {
  try {
    const { ids, status } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, error: 'ids array is required' });
    }
    const placeholders = ids.map(() => '?').join(',');
    await pool.query(
      `UPDATE purchase_list SET status = ? WHERE id IN (${placeholders})`,
      [status || 'purchased', ...ids]
    );
    res.json({ success: true, message: `${ids.length} item(s) updated` });
  } catch (error) {
    console.error('Error updating purchase status:', error);
    res.status(500).json({ success: false, error: 'Error updating status' });
  }
};
