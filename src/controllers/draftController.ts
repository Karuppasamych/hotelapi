import { Request, Response } from 'express';
import { pool } from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export const createSavedOrder = async (req: Request, res: Response) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { mobile_number, customer_name, order_type, table_number, number_of_persons, items } = req.body;

    const [result] = await connection.query<ResultSetHeader>(
      'INSERT INTO saved_orders (mobile_number, customer_name, order_type, table_number, number_of_persons) VALUES (?, ?, ?, ?, ?)',
      [mobile_number || null, customer_name || null, order_type || 'dine-in', table_number || null, number_of_persons || null]
    );
    const orderId = result.insertId;

    if (items && items.length > 0) {
      for (const item of items) {
        await connection.query(
          'INSERT INTO saved_order_items (saved_order_id, item_name, price, quantity, category) VALUES (?, ?, ?, ?, ?)',
          [orderId, item.name, item.price, item.quantity, item.category || null]
        );
      }
    }

    await connection.commit();
    res.status(201).json({ success: true, data: { id: orderId } });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating saved order:', error);
    res.status(500).json({ success: false, error: 'Error creating saved order' });
  } finally {
    connection.release();
  }
};

export const getAllSavedOrders = async (req: Request, res: Response) => {
  try {
    const [orders] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM saved_orders ORDER BY created_at DESC'
    );
    const result = [];
    for (const order of orders) {
      const [items] = await pool.query<RowDataPacket[]>(
        'SELECT * FROM saved_order_items WHERE saved_order_id = ?',
        [order.id]
      );
      result.push({
        id: String(order.id),
        mobileNumber: order.mobile_number || '',
        customerName: order.customer_name || '',
        orderType: order.order_type || 'dine-in',
        tableNumber: order.table_number || '',
        numberOfPersons: order.number_of_persons || '',
        timestamp: order.created_at,
        orders: items.map(item => ({
          id: String(item.id),
          name: item.item_name,
          price: parseFloat(item.price),
          quantity: item.quantity,
          category: item.category || 'General',
        })),
      });
    }
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error fetching saved orders:', error);
    res.status(500).json({ success: false, error: 'Error fetching saved orders' });
  }
};

export const deleteSavedOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM saved_orders WHERE id = ?', [id]);
    res.json({ success: true, message: 'Saved order deleted' });
  } catch (error) {
    console.error('Error deleting saved order:', error);
    res.status(500).json({ success: false, error: 'Error deleting saved order' });
  }
};

export const updateSavedOrder = async (req: Request, res: Response) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { id } = req.params;
    const { mobile_number, customer_name, order_type, table_number, number_of_persons, items } = req.body;

    await connection.query(
      'UPDATE saved_orders SET mobile_number = ?, customer_name = ?, order_type = ?, table_number = ?, number_of_persons = ? WHERE id = ?',
      [mobile_number || null, customer_name || null, order_type || 'dine-in', table_number || null, number_of_persons || null, id]
    );

    // Delete old items and insert new
    await connection.query('DELETE FROM saved_order_items WHERE saved_order_id = ?', [id]);
    if (items && items.length > 0) {
      for (const item of items) {
        await connection.query(
          'INSERT INTO saved_order_items (saved_order_id, item_name, price, quantity, category) VALUES (?, ?, ?, ?, ?)',
          [id, item.name, item.price, item.quantity, item.category || null]
        );
      }
    }

    await connection.commit();
    res.json({ success: true, message: 'Saved order updated' });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating saved order:', error);
    res.status(500).json({ success: false, error: 'Error updating saved order' });
  } finally {
    connection.release();
  }
};
