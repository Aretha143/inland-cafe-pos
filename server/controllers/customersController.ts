import { Response } from 'express';
import { dbUtils } from '../database/connection.js';
import { AuthRequest } from '../middleware/auth.js';

export const getCustomers = async (req: AuthRequest, res: Response) => {
  try {
    const { search, membership_type, limit = 50 } = req.query;
    
    let query = `
      SELECT c.*, 
             COUNT(DISTINCT o.id) as total_orders,
             COALESCE(SUM(o.final_amount), 0) as lifetime_value
      FROM customers c
      LEFT JOIN orders o ON c.id = o.customer_id
    `;
    
    const conditions = [];
    const params = [];

    if (search) {
      conditions.push('(c.name LIKE ? OR c.phone LIKE ? OR c.email LIKE ?)');
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }

    if (membership_type) {
      conditions.push('c.membership_type = ?');
      params.push(membership_type);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' GROUP BY c.id ORDER BY c.created_at DESC LIMIT ?';
    params.push(Number(limit));

    const customers = await dbUtils.all(query, params);
    res.json(customers);
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getCustomerById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const customer = await dbUtils.get(`
      SELECT c.*, 
             COUNT(DISTINCT o.id) as total_orders,
             COALESCE(SUM(o.final_amount), 0) as lifetime_value,
             MAX(o.created_at) as last_order_date
      FROM customers c
      LEFT JOIN orders o ON c.id = o.customer_id
      WHERE c.id = ?
      GROUP BY c.id
    `, [id]);

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Get recent orders
    const recentOrders = await dbUtils.all(`
      SELECT o.*, COUNT(oi.id) as item_count
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.customer_id = ?
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT 10
    `, [id]);

    customer.recent_orders = recentOrders;

    res.json(customer);
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createCustomer = async (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      email,
      phone,
      address,
      membership_type = 'regular',
      date_of_birth,
      anniversary_date
    } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ message: 'Name and phone are required' });
    }

    // Check if customer with this phone already exists
    const existingCustomer = await dbUtils.get(
      'SELECT id FROM customers WHERE phone = ?',
      [phone]
    );

    if (existingCustomer) {
      return res.status(400).json({ message: 'Customer with this phone number already exists' });
    }

    const result = await dbUtils.run(`
      INSERT INTO customers 
      (name, email, phone, address, membership_type, date_of_birth, anniversary_date) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [name, email || null, phone, address || null, membership_type, date_of_birth || null, anniversary_date || null]);

    const newCustomer = await dbUtils.get(
      'SELECT * FROM customers WHERE id = ?',
      [result.lastID]
    );

    res.status(201).json(newCustomer);
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateCustomer = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      phone,
      address,
      membership_type,
      date_of_birth,
      anniversary_date
    } = req.body;

    // Check if customer exists
    const existingCustomer = await dbUtils.get(
      'SELECT * FROM customers WHERE id = ?',
      [id]
    );

    if (!existingCustomer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Check if phone conflicts with another customer
    if (phone && phone !== existingCustomer.phone) {
      const phoneConflict = await dbUtils.get(
        'SELECT id FROM customers WHERE phone = ? AND id != ?',
        [phone, id]
      );

      if (phoneConflict) {
        return res.status(400).json({ message: 'Customer with this phone number already exists' });
      }
    }

    await dbUtils.run(`
      UPDATE customers 
      SET name = COALESCE(?, name),
          email = COALESCE(?, email),
          phone = COALESCE(?, phone),
          address = COALESCE(?, address),
          membership_type = COALESCE(?, membership_type),
          date_of_birth = COALESCE(?, date_of_birth),
          anniversary_date = COALESCE(?, anniversary_date)
      WHERE id = ?
    `, [name, email, phone, address, membership_type, date_of_birth, anniversary_date, id]);

    const updatedCustomer = await dbUtils.get(
      'SELECT * FROM customers WHERE id = ?',
      [id]
    );

    res.json(updatedCustomer);
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteCustomer = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if customer exists
    const customer = await dbUtils.get(
      'SELECT * FROM customers WHERE id = ?',
      [id]
    );

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Check if customer has orders
    const orderCount = await dbUtils.get(
      'SELECT COUNT(*) as count FROM orders WHERE customer_id = ?',
      [id]
    );

    if (orderCount.count > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete customer with existing orders. Customer data will be retained for record keeping.' 
      });
    }

    await dbUtils.run('DELETE FROM customers WHERE id = ?', [id]);

    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateLoyaltyPoints = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { points, type, description } = req.body;

    if (!points || !type) {
      return res.status(400).json({ message: 'Points and type are required' });
    }

    const customer = await dbUtils.get(
      'SELECT * FROM customers WHERE id = ?',
      [id]
    );

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    let newPoints = customer.loyalty_points;

    if (type === 'earn' || type === 'bonus') {
      newPoints += points;
    } else if (type === 'redeem') {
      newPoints = Math.max(0, newPoints - points);
    }

    // Update customer points
    await dbUtils.run(
      'UPDATE customers SET loyalty_points = ? WHERE id = ?',
      [newPoints, id]
    );

    // Record loyalty transaction
    await dbUtils.run(`
      INSERT INTO loyalty_transactions 
      (customer_id, points_earned, points_redeemed, transaction_type, description)
      VALUES (?, ?, ?, ?, ?)
    `, [
      id,
      type === 'earn' || type === 'bonus' ? points : 0,
      type === 'redeem' ? points : 0,
      type,
      description || null
    ]);

    const updatedCustomer = await dbUtils.get(
      'SELECT * FROM customers WHERE id = ?',
      [id]
    );

    res.json(updatedCustomer);
  } catch (error) {
    console.error('Update loyalty points error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getMembershipStats = async (req: AuthRequest, res: Response) => {
  try {
    const stats = await dbUtils.all(`
      SELECT 
        membership_type,
        COUNT(*) as count,
        AVG(loyalty_points) as avg_points,
        SUM(total_spent) as total_spent
      FROM customers 
      GROUP BY membership_type
      ORDER BY 
        CASE membership_type 
          WHEN 'platinum' THEN 1 
          WHEN 'gold' THEN 2 
          WHEN 'silver' THEN 3 
          ELSE 4 
        END
    `);

    res.json(stats);
  } catch (error) {
    console.error('Get membership stats error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
