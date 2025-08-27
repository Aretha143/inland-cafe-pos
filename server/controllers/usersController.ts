import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { dbUtils } from '../database/connection';
import { AuthRequest } from '../middleware/auth';

// Get all users (admin only)
export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    console.log('ADMIN: Getting all users list...');
    console.log('ADMIN: Requested by:', req.user?.role);
    
    const users = await dbUtils.all(`
      SELECT id, username, email, full_name, role, is_active, created_at, last_login
      FROM users
      ORDER BY role, username
    `);

    res.json(users);
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Create new user (admin only)
export const createUser = async (req: AuthRequest, res: Response) => {
  try {
    const { username, email, password, full_name, role = 'cashier' } = req.body;
    
    console.log('ADMIN: Creating new user...');
    console.log('ADMIN: Requested by:', req.user?.role);
    console.log('ADMIN: New user data:', { username, email, full_name, role });

    // Validation
    if (!username || !email || !password || !full_name) {
      return res.status(400).json({ 
        message: 'Username, email, password, and full name are required' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        message: 'Password must be at least 6 characters long' 
      });
    }

    // Valid roles
    const validRoles = ['admin', 'manager', 'cashier'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ 
        message: 'Invalid role. Must be admin, manager, or cashier' 
      });
    }

    // Check if username already exists
    const existingUser = await dbUtils.get(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUser) {
      return res.status(409).json({ 
        message: 'Username or email already exists' 
      });
    }

    // Hash password
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Create user
    const result = await dbUtils.run(`
      INSERT INTO users (username, email, password_hash, full_name, role, is_active)
      VALUES (?, ?, ?, ?, ?, 1)
    `, [username, email, password_hash, full_name, role]);

    // Get the created user
    const newUser = await dbUtils.get(`
      SELECT id, username, email, full_name, role, is_active, created_at
      FROM users WHERE id = ?
    `, [result.lastID]);

    console.log(`ADMIN: User created successfully: ${username} (${role})`);

    res.status(201).json({
      message: 'User created successfully',
      user: newUser
    });
  } catch (error) {
    console.error('ADMIN: Create user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update user (admin only)
export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { username, email, full_name, role, is_active } = req.body;
    
    console.log('ADMIN: Updating user...');
    console.log('ADMIN: Requested by:', req.user?.role);
    console.log('ADMIN: Target user ID:', id);

    // Validation
    if (!username || !email || !full_name) {
      return res.status(400).json({ 
        message: 'Username, email, and full name are required' 
      });
    }

    // Valid roles
    const validRoles = ['admin', 'manager', 'cashier'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ 
        message: 'Invalid role. Must be admin, manager, or cashier' 
      });
    }

    // Check if user exists
    const existingUser = await dbUtils.get(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );

    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if username/email is taken by another user
    const duplicateUser = await dbUtils.get(
      'SELECT id FROM users WHERE (username = ? OR email = ?) AND id != ?',
      [username, email, id]
    );

    if (duplicateUser) {
      return res.status(409).json({ 
        message: 'Username or email already exists' 
      });
    }

    // Prevent admin from deactivating themselves
    if (req.user?.id === parseInt(id) && is_active === false) {
      return res.status(400).json({ 
        message: 'You cannot deactivate your own account' 
      });
    }

    // Update user
    await dbUtils.run(`
      UPDATE users 
      SET username = ?, email = ?, full_name = ?, role = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [username, email, full_name, role || existingUser.role, is_active !== undefined ? is_active : existingUser.is_active, id]);

    // Get updated user
    const updatedUser = await dbUtils.get(`
      SELECT id, username, email, full_name, role, is_active, created_at, updated_at
      FROM users WHERE id = ?
    `, [id]);

    console.log(`ADMIN: User updated successfully: ${username}`);

    res.json({
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('ADMIN: Update user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete user (admin only)
export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    console.log('ADMIN: Deleting user...');
    console.log('ADMIN: Requested by:', req.user?.role);
    console.log('ADMIN: Target user ID:', id);

    // Check if user exists
    const existingUser = await dbUtils.get(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );

    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent admin from deleting themselves
    if (req.user?.id === parseInt(id)) {
      return res.status(400).json({ 
        message: 'You cannot delete your own account' 
      });
    }

    // Check if this is the last admin
    if (existingUser.role === 'admin') {
      const adminCount = await dbUtils.get(
        'SELECT COUNT(*) as count FROM users WHERE role = "admin" AND is_active = 1'
      );
      
      if (adminCount.count <= 1) {
        return res.status(400).json({ 
          message: 'Cannot delete the last admin user' 
        });
      }
    }

    // Delete user (this will also delete related permissions due to CASCADE)
    await dbUtils.run('DELETE FROM users WHERE id = ?', [id]);

    console.log(`ADMIN: User deleted successfully: ${existingUser.username}`);

    res.json({
      message: `User ${existingUser.username} deleted successfully`
    });
  } catch (error) {
    console.error('ADMIN: Delete user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Change user password (admin only)
export const changeUserPassword = async (req: AuthRequest, res: Response) => {
  try {
    const { userId, newPassword } = req.body;
    
    console.log('ADMIN: Changing user password...');
    console.log('ADMIN: Requested by:', req.user?.role);
    console.log('ADMIN: Target user ID:', userId);

    if (!userId || !newPassword) {
      return res.status(400).json({ message: 'User ID and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Check if target user exists
    const targetUser = await dbUtils.get(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );

    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await dbUtils.run(
      'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newPasswordHash, userId]
    );

    console.log(`ADMIN: Password changed successfully for user: ${targetUser.username}`);

    res.json({ 
      message: `Password changed successfully for user: ${targetUser.username}`,
      success: true
    });
  } catch (error) {
    console.error('ADMIN: Change user password error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Toggle user active status (admin only)
export const toggleUserStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    console.log('ADMIN: Toggling user status...');
    console.log('ADMIN: Requested by:', req.user?.role);
    console.log('ADMIN: Target user ID:', id);

    // Check if user exists
    const existingUser = await dbUtils.get(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );

    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent admin from deactivating themselves
    if (req.user?.id === parseInt(id) && existingUser.is_active) {
      return res.status(400).json({ 
        message: 'You cannot deactivate your own account' 
      });
    }

    // Toggle status
    const newStatus = !existingUser.is_active;
    await dbUtils.run(
      'UPDATE users SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newStatus, id]
    );

    console.log(`ADMIN: User status changed: ${existingUser.username} - ${newStatus ? 'activated' : 'deactivated'}`);

    res.json({
      message: `User ${existingUser.username} ${newStatus ? 'activated' : 'deactivated'} successfully`,
      is_active: newStatus
    });
  } catch (error) {
    console.error('ADMIN: Toggle user status error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
