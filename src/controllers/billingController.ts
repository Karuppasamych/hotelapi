import { Request, Response } from 'express';
import { pool } from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

const CGST_RATE = 0.025;
const SGST_RATE = 0.025;
const SERVICE_CHARGE_RATE = 0.05;

const generateBillNumber = (): string => {
  const prefix = 'MPH';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `${prefix}-${timestamp}${random}`;
};

export const createBill = async (req: Request, res: Response) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const {
      customerName,
      mobileNumber,
      orderType,
      tableNumber,
      numberOfPersons,
      orders,
      paymentMethod,
      transactionId,
      amountPaid
    } = req.body;

    if (!mobileNumber || !orders || orders.length === 0 || !paymentMethod || amountPaid === undefined) {
      return res.status(400).json({ error: 'Missing required fields: mobileNumber, orders, paymentMethod, amountPaid' });
    }

    const subtotal = orders.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
    const serviceCharge = parseFloat((subtotal * SERVICE_CHARGE_RATE).toFixed(2));
    const cgst = parseFloat((subtotal * CGST_RATE).toFixed(2));
    const sgst = parseFloat((subtotal * SGST_RATE).toFixed(2));
    const totalAmount = parseFloat((subtotal + serviceCharge + cgst + sgst).toFixed(2));
    const changeReturned = paymentMethod === 'cash' ? Math.max(0, parseFloat((amountPaid - totalAmount).toFixed(2))) : 0;

    const billNumber = generateBillNumber();

    const [billResult] = await connection.query<ResultSetHeader>(
      `INSERT INTO bills (bill_number, customer_name, mobile_number, order_type, table_number, number_of_persons, 
        subtotal, service_charge, cgst, sgst, total_amount, payment_method, transaction_id, amount_paid, change_returned)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        billNumber,
        customerName || 'Customer',
        mobileNumber,
        orderType || 'dine-in',
        tableNumber || null,
        numberOfPersons || null,
        subtotal,
        serviceCharge,
        cgst,
        sgst,
        totalAmount,
        paymentMethod,
        transactionId || null,
        amountPaid,
        changeReturned
      ]
    );

    const billId = billResult.insertId;

    for (const item of orders) {
      await connection.query(
        'INSERT INTO bill_items (bill_id, item_name, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?)',
        [billId, item.name, item.quantity, item.price, parseFloat((item.price * item.quantity).toFixed(2))]
      );
    }

    await connection.commit();

    res.status(201).json({
      id: billId,
      billNumber,
      totalAmount,
      changeReturned,
      message: 'Bill created successfully'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating bill:', error);
    res.status(500).json({ error: 'Failed to create bill', details: (error as Error).message });
  } finally {
    connection.release();
  }
};

export const getAllBills = async (req: Request, res: Response) => {
  try {
    const [bills] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM bills ORDER BY created_at DESC'
    );
    const [items] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM bill_items ORDER BY id'
    );
    const itemsByBill = items.reduce((acc: any, item: any) => {
      if (!acc[item.bill_id]) acc[item.bill_id] = [];
      acc[item.bill_id].push(item);
      return acc;
    }, {});
    const billsWithItems = bills.map((bill: any) => ({
      ...bill,
      items: itemsByBill[bill.id] || []
    }));
    res.json(billsWithItems);
  } catch (error) {
    console.error('Error fetching bills:', error);
    res.status(500).json({ error: 'Failed to fetch bills' });
  }
};

export const getBillById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const [bills] = await pool.query<RowDataPacket[]>('SELECT * FROM bills WHERE id = ?', [id]);

    if (bills.length === 0) {
      return res.status(404).json({ error: 'Bill not found' });
    }

    const [items] = await pool.query<RowDataPacket[]>('SELECT * FROM bill_items WHERE bill_id = ?', [id]);

    res.json({ ...bills[0], items });
  } catch (error) {
    console.error('Error fetching bill:', error);
    res.status(500).json({ error: 'Failed to fetch bill' });
  }
};

export const getBillsByDate = async (req: Request, res: Response) => {
  try {
    const { date } = req.params;
    const [bills] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM bills WHERE DATE(created_at) = ? ORDER BY created_at DESC',
      [date]
    );
    res.json(bills);
  } catch (error) {
    console.error('Error fetching bills by date:', error);
    res.status(500).json({ error: 'Failed to fetch bills' });
  }
};
