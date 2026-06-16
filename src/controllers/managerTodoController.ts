import { Request, Response } from 'express';
import { pool } from '../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { logActivity } from '../utils/activityLogger';

// Add ingredients to Manager ToDo when menu is confirmed in Calculator
export const addFromConfirmedMenu = async (req: Request, res: Response) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { date, items } = req.body;
    // items: [{ ingredient_name, ingredient_id, quantity, unit, dish_name }]

    if (!date || !items || items.length === 0) {
      return res.status(400).json({ success: false, error: 'date and items are required' });
    }

    for (const item of items) {
      // Check if same ingredient for same date and dish already exists
      const [existing] = await connection.query<RowDataPacket[]>(
        'SELECT id, total_quantity, remaining_quantity FROM manager_todo WHERE date = ? AND ingredient_name = ? AND dish_name = ? AND status = "active"',
        [date, item.ingredient_name, item.dish_name || null]
      );

      if (existing.length > 0) {
        // Update existing - add to quantities
        const newTotal = parseFloat(existing[0].total_quantity) + parseFloat(item.quantity);
        const newRemaining = parseFloat(existing[0].remaining_quantity) + parseFloat(item.quantity);
        await connection.query(
          'UPDATE manager_todo SET total_quantity = ?, remaining_quantity = ?, original_total = ? WHERE id = ?',
          [newTotal, newRemaining, newTotal, existing[0].id]
        );
      } else {
        // Insert new
        await connection.query<ResultSetHeader>(
          'INSERT INTO manager_todo (date, ingredient_name, ingredient_id, total_quantity, used_quantity, remaining_quantity, unit, dish_name, original_total, reduced_from_inventory) VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?, 0)',
          [date, item.ingredient_name, item.ingredient_id || null, item.quantity, item.quantity, item.unit, item.dish_name || null, item.quantity]
        );
      }
    }

    await connection.commit();
    await logActivity({ action: 'add_todo_from_menu', category: 'manager_todo', description: `Added ${items.length} ingredients for ${date}`, metadata: { date, itemCount: items.length } });
    res.status(201).json({ success: true, message: 'Items added to Manager ToDo' });
  } catch (error) {
    await connection.rollback();
    console.error('Error adding to manager todo:', error);
    res.status(500).json({ success: false, error: 'Error adding items' });
  } finally {
    connection.release();
  }
};

// Get Manager ToDo items by date
export const getByDate = async (req: Request, res: Response) => {
  try {
    const { date } = req.params;
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM manager_todo WHERE date = ? ORDER BY dish_name, ingredient_name',
      [date]
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching manager todo:', error);
    res.status(500).json({ success: false, error: 'Error fetching items' });
  }
};

// Get consolidated view (grouped by ingredient) for a date
export const getConsolidatedByDate = async (req: Request, res: Response) => {
  try {
    const { date } = req.params;
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT ingredient_name, ingredient_id, unit,
        SUM(total_quantity) as total_quantity,
        SUM(used_quantity) as used_quantity,
        SUM(remaining_quantity) as remaining_quantity,
        SUM(COALESCE(original_total, total_quantity)) as original_total,
        SUM(COALESCE(reduced_from_inventory, 0)) as reduced_from_inventory,
        GROUP_CONCAT(DISTINCT dish_name SEPARATOR ', ') as dishes,
        MIN(status) as status
       FROM manager_todo WHERE date = ? AND status IN ('active', 'moved', 'completed')
       GROUP BY ingredient_name, ingredient_id, unit
       ORDER BY ingredient_name`,
      [date]
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching consolidated todo:', error);
    res.status(500).json({ success: false, error: 'Error fetching items' });
  }
};

// Deduct ingredients when bill is paid (called from billing)
export const deductOnBillPaid = async (req: Request, res: Response) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { date, items } = req.body;
    // items: [{ ingredient_name, quantity, unit }]

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, error: 'items are required' });
    }

    const todoDate = date || new Date().toISOString().split('T')[0];

    for (const item of items) {
      // Find active todo items for this ingredient on this date
      const [rows] = await connection.query<RowDataPacket[]>(
        'SELECT id, remaining_quantity FROM manager_todo WHERE date = ? AND ingredient_name = ? AND status = "active" AND remaining_quantity > 0 ORDER BY id',
        [todoDate, item.ingredient_name]
      );

      let qtyToDeduct = parseFloat(item.quantity);

      for (const row of rows) {
        if (qtyToDeduct <= 0) break;
        const available = parseFloat(row.remaining_quantity);
        const deduct = Math.min(available, qtyToDeduct);
        const newRemaining = available - deduct;
        const newUsed = parseFloat(row.remaining_quantity) - newRemaining;

        await connection.query(
          'UPDATE manager_todo SET used_quantity = used_quantity + ?, remaining_quantity = ? WHERE id = ?',
          [deduct, newRemaining, row.id]
        );

        // Mark as completed if fully used
        if (newRemaining <= 0) {
          await connection.query('UPDATE manager_todo SET status = "completed" WHERE id = ?', [row.id]);
        }

        qtyToDeduct -= deduct;
      }
    }

    await connection.commit();
    res.json({ success: true, message: 'Ingredients deducted from Manager ToDo' });
  } catch (error) {
    await connection.rollback();
    console.error('Error deducting from manager todo:', error);
    res.status(500).json({ success: false, error: 'Error deducting items' });
  } finally {
    connection.release();
  }
};

// Move remaining item - adds back to inventory (split between available and prepared stock)
export const moveToInventory = async (req: Request, res: Response) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { id } = req.params;
    const { to_available, to_prepared, selected_unit } = req.body;

    const [rows] = await connection.query<RowDataPacket[]>(
      'SELECT * FROM manager_todo WHERE id = ? AND status = "active"', [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Item not found or already moved' });
    }

    const item = rows[0];
    const reducedFromInv = parseFloat(item.reduced_from_inventory) || 0;
    const used = parseFloat(item.used_quantity) || 0;
    const remaining = reducedFromInv - used;

    if (remaining <= 0) {
      return res.status(400).json({ success: false, error: 'No remaining quantity to move' });
    }

    // to_available = how much to add to quantity_available
    // to_prepared = how much to add to prepared_stock
    const addToAvailable = to_available != null ? parseFloat(to_available) : remaining;
    const addToPrepared = to_prepared != null ? parseFloat(to_prepared) : 0;

    if (addToAvailable + addToPrepared > remaining + 0.01) {
      return res.status(400).json({ success: false, error: 'Split quantities exceed remaining' });
    }

    // Find inventory item
    let inventoryId = item.ingredient_id;
    if (!inventoryId) {
      const [inv] = await connection.query<RowDataPacket[]>(
        'SELECT id FROM inventory WHERE LOWER(name) = LOWER(?)', [item.ingredient_name]
      );
      if (inv.length > 0) inventoryId = inv[0].id;
    }

    if (inventoryId) {
      // Get inventory unit for conversion
      const [invRows] = await connection.query<RowDataPacket[]>(
        'SELECT unit FROM inventory WHERE id = ?', [inventoryId]
      );
      const invUnit = (invRows.length > 0 ? invRows[0].unit : '').toLowerCase();
      const enteredUnit = (selected_unit || item.unit || '').toLowerCase();
      const convert = (val: number) => {
        if (enteredUnit === 'g' && invUnit === 'kg') return val / 1000;
        if (enteredUnit === 'kg' && invUnit === 'g') return val * 1000;
        if (enteredUnit === 'ml' && invUnit === 'l') return val / 1000;
        if (enteredUnit === 'l' && invUnit === 'ml') return val * 1000;
        return val;
      };

      if (addToAvailable > 0) {
        await connection.query(
          'UPDATE inventory SET quantity_available = quantity_available + ? WHERE id = ?',
          [convert(addToAvailable), inventoryId]
        );
      }
      if (addToPrepared > 0) {
        await connection.query(
          'UPDATE inventory SET prepared_stock = COALESCE(prepared_stock, 0) + ? WHERE id = ?',
          [convert(addToPrepared), inventoryId]
        );
      }
    }

    // Mark as moved
    await connection.query('UPDATE manager_todo SET status = "moved" WHERE id = ?', [id]);

    await connection.commit();
    await logActivity({ action: 'move_to_inventory', category: 'manager_todo', description: `Moved ${item.ingredient_name}: ${addToAvailable} to available, ${addToPrepared} to prepared`, metadata: { id, ingredient: item.ingredient_name, toAvailable: addToAvailable, toPrepared: addToPrepared } });
    res.json({ success: true, message: `${item.ingredient_name}: ${addToAvailable} ${item.unit} to available, ${addToPrepared} ${item.unit} to prepared stock` });
  } catch (error) {
    await connection.rollback();
    console.error('Error moving to inventory:', error);
    res.status(500).json({ success: false, error: 'Error moving to inventory' });
  } finally {
    connection.release();
  }
};

// Bulk move all remaining items - adds back to inventory (available stock)
export const bulkMoveToInventory = async (req: Request, res: Response) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { date } = req.body;

    const [rows] = await connection.query<RowDataPacket[]>(
      'SELECT * FROM manager_todo WHERE date = ? AND status = "active" AND remaining_quantity > 0',
      [date]
    );

    let movedCount = 0;
    for (const item of rows) {
      const remaining = parseFloat(item.remaining_quantity);
      if (remaining <= 0) continue;

      let inventoryId = item.ingredient_id;
      if (!inventoryId) {
        const [inv] = await connection.query<RowDataPacket[]>(
          'SELECT id FROM inventory WHERE LOWER(name) = LOWER(?)', [item.ingredient_name]
        );
        if (inv.length > 0) inventoryId = inv[0].id;
      }

      if (inventoryId) {
        const [invRows] = await connection.query<RowDataPacket[]>(
          'SELECT unit FROM inventory WHERE id = ?', [inventoryId]
        );
        const invUnit = (invRows.length > 0 ? invRows[0].unit : '').toLowerCase();
        const todoUnit = (item.unit || '').toLowerCase();
        let converted = remaining;
        if (todoUnit === 'g' && invUnit === 'kg') converted = remaining / 1000;
        else if (todoUnit === 'kg' && invUnit === 'g') converted = remaining * 1000;
        else if (todoUnit === 'ml' && invUnit === 'l') converted = remaining / 1000;
        else if (todoUnit === 'l' && invUnit === 'ml') converted = remaining * 1000;

        await connection.query(
          'UPDATE inventory SET quantity_available = quantity_available + ? WHERE id = ?',
          [converted, inventoryId]
        );
      }

      await connection.query('UPDATE manager_todo SET status = "moved" WHERE id = ?', [item.id]);
      movedCount++;
    }

    await connection.commit();
    await logActivity({ action: 'bulk_move_to_inventory', category: 'manager_todo', description: `Bulk moved ${movedCount} items to available stock`, metadata: { date, movedCount } });
    res.json({ success: true, message: `${movedCount} item(s) added to available stock in inventory` });
  } catch (error) {
    await connection.rollback();
    console.error('Error bulk moving to inventory:', error);
    res.status(500).json({ success: false, error: 'Error moving items' });
  } finally {
    connection.release();
  }
};

// Bulk move selected items - adds back to inventory (available stock)
export const bulkMoveSelectedToInventory = async (req: Request, res: Response) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, error: 'ids array is required' });
    }

    let movedCount = 0;
    for (const id of ids) {
      const [rows] = await connection.query<RowDataPacket[]>(
        'SELECT * FROM manager_todo WHERE id = ? AND status = "active" AND remaining_quantity > 0', [id]
      );
      if (rows.length === 0) continue;
      const item = rows[0];
      const remaining = parseFloat(item.remaining_quantity);

      let inventoryId = item.ingredient_id;
      if (!inventoryId) {
        const [inv] = await connection.query<RowDataPacket[]>(
          'SELECT id FROM inventory WHERE LOWER(name) = LOWER(?)', [item.ingredient_name]
        );
        if (inv.length > 0) inventoryId = inv[0].id;
      }

      if (inventoryId) {
        const [invRows] = await connection.query<RowDataPacket[]>(
          'SELECT unit FROM inventory WHERE id = ?', [inventoryId]
        );
        const invUnit = (invRows.length > 0 ? invRows[0].unit : '').toLowerCase();
        const todoUnit = (item.unit || '').toLowerCase();
        let converted = remaining;
        if (todoUnit === 'g' && invUnit === 'kg') converted = remaining / 1000;
        else if (todoUnit === 'kg' && invUnit === 'g') converted = remaining * 1000;
        else if (todoUnit === 'ml' && invUnit === 'l') converted = remaining / 1000;
        else if (todoUnit === 'l' && invUnit === 'ml') converted = remaining * 1000;

        await connection.query(
          'UPDATE inventory SET quantity_available = quantity_available + ? WHERE id = ?',
          [converted, inventoryId]
        );
      }

      await connection.query('UPDATE manager_todo SET status = "moved" WHERE id = ?', [id]);
      movedCount++;
    }

    await connection.commit();
    await logActivity({ action: 'bulk_move_selected', category: 'manager_todo', description: `Moved ${movedCount} selected items to available stock`, metadata: { ids, movedCount } });
    res.json({ success: true, message: `${movedCount} item(s) added to available stock in inventory` });
  } catch (error) {
    await connection.rollback();
    console.error('Error bulk moving selected to inventory:', error);
    res.status(500).json({ success: false, error: 'Error moving items' });
  } finally {
    connection.release();
  }
};

// Update total quantity of a todo item (adjusts remaining and inventory)
export const updateTotalQuantity = async (req: Request, res: Response) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { id } = req.params;
    const { new_total } = req.body;

    if (new_total == null || new_total < 0) {
      return res.status(400).json({ success: false, error: 'Valid new_total is required' });
    }

    const [rows] = await connection.query<RowDataPacket[]>(
      'SELECT * FROM manager_todo WHERE id = ?', [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }

    const item = rows[0];
    const oldTotal = parseFloat(item.total_quantity);
    const used = parseFloat(item.used_quantity);
    const newTotal = parseFloat(new_total);
    const diff = oldTotal - newTotal; // positive = reduced, negative = increased

    if (newTotal < used) {
      return res.status(400).json({ success: false, error: `Cannot set total below used quantity (${used.toFixed(2)})` });
    }

    const newRemaining = newTotal - used;

    // Update manager_todo
    await connection.query(
      'UPDATE manager_todo SET total_quantity = ?, remaining_quantity = ? WHERE id = ?',
      [newTotal, newRemaining, id]
    );

    // If total was reduced, add the difference back to inventory
    if (diff > 0 && item.ingredient_id) {
      await connection.query(
        'UPDATE inventory SET quantity_available = quantity_available + ? WHERE id = ?',
        [diff, item.ingredient_id]
      );
    } else if (diff > 0) {
      const [inv] = await connection.query<RowDataPacket[]>(
        'SELECT id FROM inventory WHERE LOWER(name) = LOWER(?)', [item.ingredient_name]
      );
      if (inv.length > 0) {
        await connection.query(
          'UPDATE inventory SET quantity_available = quantity_available + ? WHERE id = ?',
          [diff, inv[0].id]
        );
      }
    }
    // If total was increased, deduct the difference from inventory
    if (diff < 0 && item.ingredient_id) {
      await connection.query(
        'UPDATE inventory SET quantity_available = GREATEST(0, quantity_available - ?) WHERE id = ?',
        [Math.abs(diff), item.ingredient_id]
      );
    } else if (diff < 0) {
      const [inv] = await connection.query<RowDataPacket[]>(
        'SELECT id FROM inventory WHERE LOWER(name) = LOWER(?)', [item.ingredient_name]
      );
      if (inv.length > 0) {
        await connection.query(
          'UPDATE inventory SET quantity_available = GREATEST(0, quantity_available - ?) WHERE id = ?',
          [Math.abs(diff), inv[0].id]
        );
      }
    }

    await connection.commit();
    await logActivity({ action: 'update_todo_quantity', category: 'manager_todo', description: `Updated ${item.ingredient_name} total: ${oldTotal} → ${newTotal}`, metadata: { id, ingredient: item.ingredient_name, oldTotal, newTotal } });
    res.json({ success: true, message: `Total updated from ${oldTotal.toFixed(2)} to ${newTotal.toFixed(2)}` });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating total quantity:', error);
    res.status(500).json({ success: false, error: 'Error updating total' });
  } finally {
    connection.release();
  }
};

// Update reduced_from_inventory directly (reduces from inventory)
export const updateReducedFromInventory = async (req: Request, res: Response) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { id } = req.params;
    const { new_reduced } = req.body;

    if (new_reduced == null || new_reduced < 0) {
      return res.status(400).json({ success: false, error: 'Valid new_reduced is required' });
    }

    const [rows] = await connection.query<RowDataPacket[]>(
      'SELECT * FROM manager_todo WHERE id = ?', [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }

    const item = rows[0];
    const oldReduced = parseFloat(item.reduced_from_inventory) || 0;
    const newReduced = parseFloat(new_reduced);
    const diff = newReduced - oldReduced; // positive = more reduction needed, negative = revert

    if (diff === 0) {
      await connection.commit();
      return res.json({ success: true, message: 'No change' });
    }

    // Update reduced_from_inventory
    await connection.query(
      'UPDATE manager_todo SET reduced_from_inventory = ? WHERE id = ?',
      [newReduced, id]
    );

    // Also update total_quantity and remaining_quantity accordingly
    const oldTotal = parseFloat(item.total_quantity);
    const used = parseFloat(item.used_quantity);
    const newTotal = oldTotal - diff;
    const newRemaining = newTotal - used;

    if (newTotal < used) {
      await connection.rollback();
      return res.status(400).json({ success: false, error: `Cannot reduce below used quantity (${used.toFixed(2)})` });
    }

    await connection.query(
      'UPDATE manager_todo SET total_quantity = ?, remaining_quantity = ? WHERE id = ?',
      [newTotal, newRemaining, id]
    );

    // Update inventory
    let inventoryId = item.ingredient_id;
    if (!inventoryId) {
      const [inv] = await connection.query<RowDataPacket[]>(
        'SELECT id FROM inventory WHERE LOWER(name) = LOWER(?)', [item.ingredient_name]
      );
      if (inv.length > 0) inventoryId = inv[0].id;
    }

    if (inventoryId && diff > 0) {
      // Get inventory unit for conversion
      const [invRows] = await connection.query<RowDataPacket[]>(
        'SELECT unit FROM inventory WHERE id = ?', [inventoryId]
      );
      const invUnit = (invRows.length > 0 ? invRows[0].unit : '').toLowerCase();
      const todoUnit = (item.unit || '').toLowerCase();
      let convertedDiff = diff;
      if (todoUnit === 'g' && invUnit === 'kg') convertedDiff = diff / 1000;
      else if (todoUnit === 'kg' && invUnit === 'g') convertedDiff = diff * 1000;
      else if (todoUnit === 'ml' && invUnit === 'l') convertedDiff = diff / 1000;
      else if (todoUnit === 'l' && invUnit === 'ml') convertedDiff = diff * 1000;

      // More reduction → deduct from inventory
      await connection.query(
        'UPDATE inventory SET quantity_available = GREATEST(0, quantity_available - ?) WHERE id = ?',
        [convertedDiff, inventoryId]
      );
    } else if (inventoryId && diff < 0) {
      // Get inventory unit for conversion
      const [invRows] = await connection.query<RowDataPacket[]>(
        'SELECT unit FROM inventory WHERE id = ?', [inventoryId]
      );
      const invUnit = (invRows.length > 0 ? invRows[0].unit : '').toLowerCase();
      const todoUnit = (item.unit || '').toLowerCase();
      let convertedDiff = Math.abs(diff);
      if (todoUnit === 'g' && invUnit === 'kg') convertedDiff = Math.abs(diff) / 1000;
      else if (todoUnit === 'kg' && invUnit === 'g') convertedDiff = Math.abs(diff) * 1000;
      else if (todoUnit === 'ml' && invUnit === 'l') convertedDiff = Math.abs(diff) / 1000;
      else if (todoUnit === 'l' && invUnit === 'ml') convertedDiff = Math.abs(diff) * 1000;

      // Reverting reduction → add back to inventory
      await connection.query(
        'UPDATE inventory SET quantity_available = quantity_available + ? WHERE id = ?',
        [convertedDiff, inventoryId]
      );
    }

    await connection.commit();
    await logActivity({ action: 'update_reduced_from_inventory', category: 'manager_todo', description: `${item.ingredient_name}: reduced from inventory ${oldReduced} → ${newReduced}`, metadata: { id, ingredient: item.ingredient_name, oldReduced, newReduced, diff } });
    res.json({ success: true, message: `${item.ingredient_name}: ${diff > 0 ? '-' : '+'}${Math.abs(diff).toFixed(2)} ${item.unit} ${diff > 0 ? 'deducted from' : 'returned to'} inventory (Total reduced: ${newReduced.toFixed(2)})` });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating reduced from inventory:', error);
    res.status(500).json({ success: false, error: 'Error updating' });
  } finally {
    connection.release();
  }
};

// Bulk move from inventory - deducts suggested quantity from inventory
export const bulkMoveFromInventory = async (req: Request, res: Response) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { date, ids } = req.body;

    const todoDate = date || new Date().toISOString().split('T')[0];
    let query = 'SELECT * FROM manager_todo WHERE date = ? AND status = "active"';
    const params: any[] = [todoDate];

    if (ids && Array.isArray(ids) && ids.length > 0) {
      query += ` AND id IN (${ids.map(() => '?').join(',')})`;
      params.push(...ids);
    }

    const [rows] = await connection.query<RowDataPacket[]>(query, params);

    let deductedCount = 0;
    for (const item of rows) {
      const originalTotal = parseFloat(item.original_total || item.total_quantity) || 0;
      const currentReduced = parseFloat(item.reduced_from_inventory) || 0;

      if (currentReduced >= originalTotal) continue; // already fully deducted

      const toDeduct = originalTotal - currentReduced; // only deduct what hasn't been deducted yet

      let inventoryId = item.ingredient_id;
      if (!inventoryId) {
        const [inv] = await connection.query<RowDataPacket[]>(
          'SELECT id FROM inventory WHERE LOWER(name) = LOWER(?)', [item.ingredient_name]
        );
        if (inv.length > 0) inventoryId = inv[0].id;
      }

      if (inventoryId) {
        // Get inventory unit for conversion
        const [invRows] = await connection.query<RowDataPacket[]>(
          'SELECT unit FROM inventory WHERE id = ?', [inventoryId]
        );
        const invUnit = (invRows.length > 0 ? invRows[0].unit : '').toLowerCase();
        const todoUnit = (item.unit || '').toLowerCase();
        let converted = toDeduct;
        if (todoUnit === 'g' && invUnit === 'kg') converted = toDeduct / 1000;
        else if (todoUnit === 'kg' && invUnit === 'g') converted = toDeduct * 1000;
        else if (todoUnit === 'ml' && invUnit === 'l') converted = toDeduct / 1000;
        else if (todoUnit === 'l' && invUnit === 'ml') converted = toDeduct * 1000;

        await connection.query(
          'UPDATE inventory SET quantity_available = GREATEST(0, quantity_available - ?) WHERE id = ?',
          [converted, inventoryId]
        );
      }

      // Update reduced_from_inventory to original_total
      await connection.query(
        'UPDATE manager_todo SET reduced_from_inventory = ? WHERE id = ?',
        [originalTotal, item.id]
      );

      deductedCount++;
    }

    await connection.commit();
    await logActivity({ action: 'bulk_move_from_inventory', category: 'manager_todo', description: `Deducted suggested qty for ${deductedCount} items from inventory`, metadata: { date: todoDate, deductedCount, ids } });
    res.json({ success: true, message: `${deductedCount} item(s) - suggested quantities deducted from inventory` });
  } catch (error) {
    await connection.rollback();
    console.error('Error bulk moving from inventory:', error);
    res.status(500).json({ success: false, error: 'Error deducting from inventory' });
  } finally {
    connection.release();
  }
};

// Delete a todo item
export const deleteTodoItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM manager_todo WHERE id = ?', [id]);
    await logActivity({ action: 'delete_todo', category: 'manager_todo', description: `Deleted todo item #${id}`, metadata: { id } });
    res.json({ success: true, message: 'Item deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error deleting item' });
  }
};
