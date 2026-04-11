import { Request, Response } from 'express';
import { pool } from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

const generateKOTNumber = (): string => {
  const now = new Date();
  const dateStr = now.toISOString().slice(2, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `KOT-${dateStr}${random}`;
};

export const createKitchenOrder = async (req: Request, res: Response) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { table_number, order_type, number_of_persons, customer_name, mobile_number, items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, error: 'Items are required' });
    }

    const orderNumber = generateKOTNumber();

    const [result] = await connection.query<ResultSetHeader>(
      `INSERT INTO kitchen_orders (order_number, table_number, order_type, number_of_persons, customer_name, mobile_number) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [orderNumber, table_number || null, order_type || 'dine-in', number_of_persons || null, customer_name || null, mobile_number || null]
    );

    const orderId = result.insertId;

    for (const item of items) {
      await connection.query(
        'INSERT INTO kitchen_order_items (kitchen_order_id, item_name, quantity, category, notes) VALUES (?, ?, ?, ?, ?)',
        [orderId, item.name, item.quantity, item.category || null, item.notes || null]
      );
    }

    await connection.commit();
    res.status(201).json({ success: true, data: { id: orderId, orderNumber }, message: 'KOT created successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating kitchen order:', error);
    res.status(500).json({ success: false, error: 'Error creating kitchen order' });
  } finally {
    connection.release();
  }
};

export const getAllKitchenOrders = async (req: Request, res: Response) => {
  try {
    const [orders] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM kitchen_orders ORDER BY created_at DESC'
    );

    const ordersWithItems = [];
    for (const order of orders) {
      const [items] = await pool.query<RowDataPacket[]>(
        'SELECT * FROM kitchen_order_items WHERE kitchen_order_id = ?',
        [order.id]
      );
      ordersWithItems.push({ ...order, items });
    }

    res.json({ success: true, data: ordersWithItems });
  } catch (error) {
    console.error('Error fetching kitchen orders:', error);
    res.status(500).json({ success: false, error: 'Error fetching kitchen orders' });
  }
};

export const getTodayKitchenOrders = async (req: Request, res: Response) => {
  try {
    const [orders] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM kitchen_orders WHERE DATE(created_at) = CURDATE() ORDER BY created_at DESC'
    );

    const ordersWithItems = [];
    for (const order of orders) {
      const [items] = await pool.query<RowDataPacket[]>(
        'SELECT * FROM kitchen_order_items WHERE kitchen_order_id = ?',
        [order.id]
      );
      ordersWithItems.push({ ...order, items });
    }

    res.json({ success: true, data: ordersWithItems });
  } catch (error) {
    console.error('Error fetching today kitchen orders:', error);
    res.status(500).json({ success: false, error: 'Error fetching kitchen orders' });
  }
};

export const updateKitchenOrderStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ['pending', 'preparing', 'ready', 'served', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }
    await pool.query('UPDATE kitchen_orders SET status = ? WHERE id = ?', [status, id]);
    res.json({ success: true, message: 'Status updated' });
  } catch (error) {
    console.error('Error updating kitchen order status:', error);
    res.status(500).json({ success: false, error: 'Error updating status' });
  }
};

export const deleteKitchenOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM kitchen_orders WHERE id = ?', [id]);
    res.json({ success: true, message: 'Kitchen order deleted' });
  } catch (error) {
    console.error('Error deleting kitchen order:', error);
    res.status(500).json({ success: false, error: 'Error deleting kitchen order' });
  }
};

export const reduceItemQuantity = async (req: Request, res: Response) => {
  try {
    const { item_name, quantity } = req.body;
    if (!item_name || !quantity) {
      return res.status(400).json({ success: false, error: 'item_name and quantity are required' });
    }
    // Find the latest kitchen order item matching the name
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT koi.id, koi.quantity FROM kitchen_order_items koi
       JOIN kitchen_orders ko ON koi.kitchen_order_id = ko.id
       WHERE koi.item_name = ? AND koi.quantity > 0
       ORDER BY ko.created_at DESC LIMIT 1`,
      [item_name]
    );
    if (rows.length === 0) {
      return res.json({ success: true, message: 'No matching kitchen order item found' });
    }
    const newQty = Math.max(0, rows[0].quantity - quantity);
    if (newQty === 0) {
      await pool.query('DELETE FROM kitchen_order_items WHERE id = ?', [rows[0].id]);
    } else {
      await pool.query('UPDATE kitchen_order_items SET quantity = ? WHERE id = ?', [newQty, rows[0].id]);
    }
    res.json({ success: true, message: `Kitchen item quantity updated to ${newQty}` });
  } catch (error) {
    console.error('Error reducing kitchen item quantity:', error);
    res.status(500).json({ success: false, error: 'Error reducing quantity' });
  }
};
