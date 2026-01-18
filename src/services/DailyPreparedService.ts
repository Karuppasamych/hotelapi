import { pool } from '../config/database';
import { DailyPreparedBiryani, PreparedBiryaniRequest } from '../models/DailyPrepared';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface PreparedRow extends RowDataPacket {
  id: number;
  recipe_id: string;
  quantity_prepared: number;
  preparation_cost: number;
  prepared_date: string;
  prepared_time: Date;
  status: 'prepared' | 'partially_sold' | 'sold_out';
  remaining_quantity: number;
}

export class DailyPreparedService {
  
  // Add prepared biryani for the day
  async addPreparedBiryani(data: PreparedBiryaniRequest): Promise<DailyPreparedBiryani> {
    const today = new Date().toISOString().split('T')[0];
    
    const [result] = await pool.execute<ResultSetHeader>(`
      INSERT INTO daily_prepared_biryani 
      (recipe_id, quantity_prepared, preparation_cost, prepared_date, remaining_quantity)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
      quantity_prepared = quantity_prepared + VALUES(quantity_prepared),
      preparation_cost = preparation_cost + VALUES(preparation_cost),
      remaining_quantity = remaining_quantity + VALUES(remaining_quantity)
    `, [data.recipe_id, data.quantity_prepared, data.preparation_cost, today, data.quantity_prepared]);

    // Update inventory
    await this.updateInventory(data.recipe_id, data.quantity_prepared);
    
    return this.getPreparedById(result.insertId);
  }

  // Get prepared biryani by ID
  private async getPreparedById(id: number): Promise<DailyPreparedBiryani> {
    const [rows] = await pool.execute<PreparedRow[]>(`
      SELECT * FROM daily_prepared_biryani WHERE id = ?
    `, [id]);
    
    return rows[0];
  }

  // Get today's prepared biryani
  async getTodaysPrepared(): Promise<DailyPreparedBiryani[]> {
    const today = new Date().toISOString().split('T')[0];
    
    const [rows] = await pool.execute<PreparedRow[]>(`
      SELECT 
        dpb.*,
        r.name as recipe_name
      FROM daily_prepared_biryani dpb
      JOIN recipes r ON dpb.recipe_id = r.id
      WHERE dpb.prepared_date = ?
      ORDER BY dpb.prepared_time DESC
    `, [today]);
    
    return rows;
  }

  // Update inventory when biryani is prepared
  private async updateInventory(recipeId: string, quantity: number): Promise<void> {
    await pool.execute(`
      INSERT INTO inventory (recipe_id, quantity_available, status, last_prepared)
      VALUES (?, ?, 'available', NOW())
      ON DUPLICATE KEY UPDATE
      quantity_available = quantity_available + VALUES(quantity_available),
      last_prepared = NOW(),
      status = CASE 
        WHEN quantity_available + VALUES(quantity_available) > 2 THEN 'available'
        WHEN quantity_available + VALUES(quantity_available) > 0 THEN 'low_stock'
        ELSE 'out_of_stock'
      END
    `, [recipeId, quantity]);
  }

  // Sell biryani and update both tables
  async sellBiryani(recipeId: string, quantitySold: number, unitPrice: number): Promise<boolean> {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const today = new Date().toISOString().split('T')[0];
      
      // Check if enough quantity available in today's preparation
      const [preparedRows] = await connection.execute<PreparedRow[]>(`
        SELECT * FROM daily_prepared_biryani 
        WHERE recipe_id = ? AND prepared_date = ? AND remaining_quantity >= ?
      `, [recipeId, today, quantitySold]);
      
      if (preparedRows.length === 0) {
        throw new Error('Insufficient prepared biryani available');
      }
      
      // Update daily prepared biryani
      await connection.execute(`
        UPDATE daily_prepared_biryani 
        SET remaining_quantity = remaining_quantity - ?,
            status = CASE 
              WHEN remaining_quantity - ? = 0 THEN 'sold_out'
              ELSE 'partially_sold'
            END
        WHERE recipe_id = ? AND prepared_date = ?
      `, [quantitySold, quantitySold, recipeId, today]);
      
      // Update inventory
      await connection.execute(`
        UPDATE inventory 
        SET quantity_available = quantity_available - ?,
            status = CASE 
              WHEN quantity_available - ? = 0 THEN 'out_of_stock'
              WHEN quantity_available - ? <= 2 THEN 'low_stock'
              ELSE 'available'
            END
        WHERE recipe_id = ?
      `, [quantitySold, quantitySold, quantitySold, recipeId]);
      
      // Record sale
      await connection.execute(`
        INSERT INTO sales (recipe_id, quantity_sold, unit_price, total_amount)
        VALUES (?, ?, ?, ?)
      `, [recipeId, quantitySold, unitPrice, quantitySold * unitPrice]);
      
      await connection.commit();
      return true;
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}