import { Request, Response } from 'express';
import { dbUtils } from '../database/connection.js';
import { AuthRequest } from '../middleware/auth.js';

export const getTables = async (req: AuthRequest, res: Response) => {
  try {
    const tables = await dbUtils.all('SELECT * FROM tables ORDER BY table_number', []);
    res.json({ data: tables });
  } catch (error) {
    console.error('Error fetching tables:', error);
    res.status(500).json({ error: 'Failed to fetch tables' });
  }
};

export const getTableById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const table = await dbUtils.get('SELECT * FROM tables WHERE id = ?', [id]);
    
    if (!table) {
      return res.status(404).json({ error: 'Table not found' });
    }
    
    res.json({ data: table });
  } catch (error) {
    console.error('Error fetching table:', error);
    res.status(500).json({ error: 'Failed to fetch table' });
  }
};

export const createTable = async (req: AuthRequest, res: Response) => {
  try {
    const { table_number, table_name, capacity, location } = req.body;
    
    if (!table_number) {
      return res.status(400).json({ error: 'Table number is required' });
    }
    
    // Check if table number already exists
    const existingTable = await dbUtils.get(
      'SELECT id FROM tables WHERE table_number = ?',
      [table_number]
    );
    
    if (existingTable) {
      return res.status(400).json({ error: 'Table number already exists' });
    }
    
    const result = await dbUtils.run(
      `INSERT INTO tables (table_number, table_name, capacity, location, status)
       VALUES (?, ?, ?, ?, 'available')`,
      [table_number, table_name || null, capacity || 4, location || null]
    );
    
    const newTable = await dbUtils.get(
      'SELECT * FROM tables WHERE id = ?',
      [result.lastID]
    );
    
    res.status(201).json({ data: newTable });
  } catch (error) {
    console.error('Error creating table:', error);
    res.status(500).json({ error: 'Failed to create table' });
  }
};

export const updateTable = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { table_number, table_name, capacity, location, status } = req.body;
    
    // Check if table exists
    const existingTable = await dbUtils.get(
      'SELECT * FROM tables WHERE id = ?',
      [id]
    );
    
    if (!existingTable) {
      return res.status(404).json({ error: 'Table not found' });
    }
    
    // If updating table_number, check for duplicates
    if (table_number && table_number !== existingTable.table_number) {
      const duplicateTable = await dbUtils.get(
        'SELECT id FROM tables WHERE table_number = ? AND id != ?',
        [table_number, id]
      );
      
      if (duplicateTable) {
        return res.status(400).json({ error: 'Table number already exists' });
      }
    }
    
    await dbUtils.run(
      `UPDATE tables 
       SET table_number = COALESCE(?, table_number),
           table_name = ?,
           capacity = COALESCE(?, capacity),
           location = ?,
           status = COALESCE(?, status)
       WHERE id = ?`,
      [table_number, table_name, capacity, location, status, id]
    );
    
    const updatedTable = await dbUtils.get(
      'SELECT * FROM tables WHERE id = ?',
      [id]
    );
    
    res.json({ data: updatedTable });
  } catch (error) {
    console.error('Error updating table:', error);
    res.status(500).json({ error: 'Failed to update table' });
  }
};

export const deleteTable = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check if table exists
    const existingTable = await dbUtils.get(
      'SELECT * FROM tables WHERE id = ?',
      [id]
    );
    
    if (!existingTable) {
      return res.status(404).json({ error: 'Table not found' });
    }
    
    // Check if table has active orders
    if (existingTable.current_order_id) {
      return res.status(400).json({ 
        error: 'Cannot delete table with active orders. Please complete or cancel the order first.' 
      });
    }
    
    await dbUtils.run('DELETE FROM tables WHERE id = ?', [id]);
    
    res.json({ message: 'Table deleted successfully' });
  } catch (error) {
    console.error('Error deleting table:', error);
    res.status(500).json({ error: 'Failed to delete table' });
  }
};

export const updateTableStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, order_id } = req.body;
    
    // Check if table exists
    const existingTable = await dbUtils.get(
      'SELECT * FROM tables WHERE id = ?',
      [id]
    );
    
    if (!existingTable) {
      return res.status(404).json({ error: 'Table not found' });
    }
    
    await dbUtils.run(
      `UPDATE tables 
       SET status = ?, current_order_id = ?
       WHERE id = ?`,
      [status, order_id || null, id]
    );
    
    const updatedTable = await dbUtils.get(
      'SELECT * FROM tables WHERE id = ?',
      [id]
    );
    
    res.json({ data: updatedTable });
  } catch (error) {
    console.error('Error updating table status:', error);
    res.status(500).json({ error: 'Failed to update table status' });
  }
};

export const getAvailableTables = async (req: AuthRequest, res: Response) => {
  try {
    const tables = await dbUtils.all(
      "SELECT * FROM tables WHERE status = 'available' ORDER BY table_number"
    );
    
    res.json({ data: tables });
  } catch (error) {
    console.error('Error fetching available tables:', error);
    res.status(500).json({ error: 'Failed to fetch available tables' });
  }
};
