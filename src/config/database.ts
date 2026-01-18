import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'hotel_biryani_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

export const pool = mysql.createPool(dbConfig);

export const connectDB = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ MySQL Connected Successfully');
    connection.release();
  } catch (error) {
    console.error('❌ MySQL Connection Failed:', error);
    process.exit(1);
  }
};