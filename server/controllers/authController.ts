import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { dbUtils } from '../database/connection.js';
import { generateToken, AuthRequest } from '../middleware/auth.js';
import { getUserPermissionsList } from '../middleware/permissions.js';

export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // Find user
    const user = await dbUtils.get(
      'SELECT * FROM users WHERE username = ? AND is_active = 1',
      [username]
    );

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const passwordValid = await bcrypt.compare(password, user.password_hash);
    if (!passwordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Update last login
    await dbUtils.run(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
      [user.id]
    );

    // Generate token
    const token = generateToken(user.id);

    // Return user data (without password)
    const { password_hash, ...userWithoutPassword } = user;
    
    res.json({
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getCurrentUser = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const user = await dbUtils.get(
      'SELECT id, username, email, role, full_name, is_active, last_login, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    // Get user permissions
    const permissions = await getUserPermissionsList(user.id, user.role);

    res.json({ 
      user: {
        ...user,
        permissions
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Get current user with password
    const user = await dbUtils.get(
      'SELECT * FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const passwordValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!passwordValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await dbUtils.run(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [newPasswordHash, req.user.id]
    );

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Admin-only functions to manage user passwords

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
      'UPDATE users SET password_hash = ? WHERE id = ?',
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

export const changeAdminPassword = async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    console.log('ADMIN: Changing admin password...');
    console.log('ADMIN: Requested by:', req.user?.username);

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Get current user with password
    const user = await dbUtils.get(
      'SELECT * FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const passwordValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!passwordValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await dbUtils.run(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [newPasswordHash, req.user.id]
    );

    console.log(`ADMIN: Admin password changed successfully for: ${req.user.username}`);

    res.json({ 
      message: 'Admin password changed successfully',
      success: true
    });
  } catch (error) {
    console.error('ADMIN: Change admin password error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
