import { Request, Response } from 'express';
import { pool } from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { logActivity } from '../utils/activityLogger';

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

    const { table_number, order_type, number_of_persons, customer_name, mobile_number, items, initiated_by } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, error: 'Items are required' });
    }

    const orderNumber = generateKOTNumber();

    const [result] = await connection.query<ResultSetHeader>(
      `INSERT INTO kitchen_orders (order_number, table_number, order_type, number_of_persons, customer_name, mobile_number, initiated_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [orderNumber, table_number || null, order_type || 'dine-in', number_of_persons || null, customer_name || null, mobile_number || null, initiated_by || null]
    );

    const orderId = result.insertId;

    for (const item of items) {
      await connection.query(
        'INSERT INTO kitchen_order_items (kitchen_order_id, item_name, quantity, category, notes) VALUES (?, ?, ?, ?, ?)',
        [orderId, item.name, item.quantity, item.category || null, item.notes || null]
      );
    }

    await connection.commit();
    await logActivity({ action: 'create_kot', category: 'kitchen', description: `KOT ${orderNumber} created - ${items.length} items`, user: initiated_by, metadata: { orderId, orderNumber, table_number, order_type, itemCount: items.length } });
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
    await logActivity({ action: 'update_kot_status', category: 'kitchen', description: `KOT #${id} status changed to ${status}`, metadata: { id, status } });
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
    await logActivity({ action: 'delete_kot', category: 'kitchen', description: `Kitchen order #${id} deleted`, metadata: { id } });
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
      // Get the kitchen_order_id before deleting the item
      const [itemRow] = await pool.query<RowDataPacket[]>(
        'SELECT kitchen_order_id FROM kitchen_order_items WHERE id = ?', [rows[0].id]
      );
      await pool.query('DELETE FROM kitchen_order_items WHERE id = ?', [rows[0].id]);
      // Check if the kitchen order has any remaining items
      if (itemRow.length > 0) {
        const orderId = itemRow[0].kitchen_order_id;
        const [remaining] = await pool.query<RowDataPacket[]>(
          'SELECT COUNT(*) as count FROM kitchen_order_items WHERE kitchen_order_id = ?', [orderId]
        );
        if (remaining[0].count === 0) {
          // No items left — delete the entire kitchen order
          await pool.query('DELETE FROM kitchen_orders WHERE id = ?', [orderId]);
        }
      }
    } else {
      await pool.query('UPDATE kitchen_order_items SET quantity = ? WHERE id = ?', [newQty, rows[0].id]);
    }
    res.json({ success: true, message: `Kitchen item quantity updated to ${newQty}` });
  } catch (error) {
    console.error('Error reducing kitchen item quantity:', error);
    res.status(500).json({ success: false, error: 'Error reducing quantity' });
  }
};

export const deletePendingByMobile = async (req: Request, res: Response) => {
  try {
    const { mobile_number } = req.body;
    if (!mobile_number) {
      return res.status(400).json({ success: false, error: 'mobile_number is required' });
    }
    const [result] = await pool.query<ResultSetHeader>(
      "DELETE FROM kitchen_orders WHERE mobile_number = ? AND status = 'pending'",
      [mobile_number]
    );
    res.json({ success: true, message: `${result.affectedRows} pending kitchen order(s) deleted` });
  } catch (error) {
    console.error('Error deleting pending kitchen orders:', error);
    res.status(500).json({ success: false, error: 'Error deleting pending orders' });
  }
};
