import { Response, NextFunction } from 'express';
import { dbUtils } from '../database/connection.js';
import { AuthRequest } from './auth.js';
import { Permission } from '../controllers/permissionsController.js';

// Check if user has a specific permission
export const checkPermission = (permission: Permission) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      // Admin users have all permissions
      if (req.user?.role === 'admin') {
        return next();
      }

      // Manager users have most permissions by default (except admin-only ones)
      if (req.user?.role === 'manager') {
        // Define admin-only permissions
        const adminOnlyPermissions = [
          'products.delete_all',
          'categories.delete_all',
          'reports.delete',
          'settings.edit'
        ];
        
        if (!adminOnlyPermissions.includes(permission)) {
          return next();
        }
      }

      // For cashier users, check explicit permissions
      if (req.user?.role === 'cashier') {
        const userPermission = await dbUtils.get(`
          SELECT * FROM user_permissions 
          WHERE user_id = ? AND permission = ? AND granted = 1
        `, [req.user.id, permission]);

        if (userPermission) {
          return next();
        }
      }

      // Permission denied
      console.log(`PERMISSION DENIED: User ${req.user?.username} (${req.user?.role}) tried to access ${permission}`);
      return res.status(403).json({ 
        message: 'Access denied: Insufficient permissions',
        required_permission: permission
      });

    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  };
};

// Check if user has any of the specified permissions
export const checkAnyPermission = (permissions: Permission[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      // Admin users have all permissions
      if (req.user?.role === 'admin') {
        return next();
      }

      // Manager users have most permissions by default
      if (req.user?.role === 'manager') {
        const adminOnlyPermissions = [
          'products.delete_all',
          'categories.delete_all',
          'reports.delete',
          'settings.edit'
        ];
        
        // If any permission is not admin-only, allow access
        const hasNonAdminPermission = permissions.some(p => !adminOnlyPermissions.includes(p));
        if (hasNonAdminPermission) {
          return next();
        }
      }

      // For cashier users, check if they have any of the required permissions
      if (req.user?.role === 'cashier') {
        const userPermissions = await dbUtils.all(`
          SELECT permission FROM user_permissions 
          WHERE user_id = ? AND permission IN (${permissions.map(() => '?').join(',')}) AND granted = 1
        `, [req.user.id, ...permissions]);

        if (userPermissions.length > 0) {
          return next();
        }
      }

      // Permission denied
      console.log(`PERMISSION DENIED: User ${req.user?.username} (${req.user?.role}) tried to access one of: ${permissions.join(', ')}`);
      return res.status(403).json({ 
        message: 'Access denied: Insufficient permissions',
        required_permissions: permissions
      });

    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  };
};

// Check if user has all of the specified permissions
export const checkAllPermissions = (permissions: Permission[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      // Admin users have all permissions
      if (req.user?.role === 'admin') {
        return next();
      }

      // Manager users have most permissions by default
      if (req.user?.role === 'manager') {
        const adminOnlyPermissions = [
          'products.delete_all',
          'categories.delete_all',
          'reports.delete',
          'settings.edit'
        ];
        
        // Check if all permissions are non-admin-only
        const allNonAdminPermissions = permissions.every(p => !adminOnlyPermissions.includes(p));
        if (allNonAdminPermissions) {
          return next();
        }
      }

      // For cashier users, check if they have all required permissions
      if (req.user?.role === 'cashier') {
        const userPermissions = await dbUtils.all(`
          SELECT permission FROM user_permissions 
          WHERE user_id = ? AND permission IN (${permissions.map(() => '?').join(',')}) AND granted = 1
        `, [req.user.id, ...permissions]);

        if (userPermissions.length === permissions.length) {
          return next();
        }
      }

      // Permission denied
      console.log(`PERMISSION DENIED: User ${req.user?.username} (${req.user?.role}) needs ALL permissions: ${permissions.join(', ')}`);
      return res.status(403).json({ 
        message: 'Access denied: Insufficient permissions',
        required_permissions: permissions,
        all_required: true
      });

    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  };
};

// Get user's permissions for frontend use
export const getUserPermissionsList = async (userId: number, role: string): Promise<Permission[]> => {
  try {
    // Admin users have all permissions
    if (role === 'admin') {
      return Object.keys({
        'pos.access': true,
        'pos.discount': true,
        'pos.refund': true,
        'pos.void': true,
        'products.view': true,
        'products.create': true,
        'products.edit': true,
        'products.delete': true,
        'products.delete_all': true,
        'categories.view': true,
        'categories.create': true,
        'categories.edit': true,
        'categories.delete': true,
        'categories.delete_all': true,
        'orders.view': true,
        'orders.create': true,
        'orders.edit': true,
        'orders.delete': true,
        'orders.print': true,
        'orders.download': true,
        'tables.view': true,
        'tables.create': true,
        'tables.edit': true,
        'tables.delete': true,
        'tables.reset': true,
        'tables.clear_orders': true,
        'customers.view': true,
        'customers.create': true,
        'customers.edit': true,
        'customers.delete': true,
        'payments.process': true,
        'payments.view_history': true,
        'reports.view': true,
        'reports.analytics': true,
        'reports.delete': true,
        'inventory.view': true,
        'inventory.adjust': true,
        'settings.view': true,
        'settings.edit': true,
      }) as Permission[];
    }

    // Manager users have most permissions
    if (role === 'manager') {
      return Object.keys({
        'pos.access': true,
        'pos.discount': true,
        'pos.refund': true,
        'pos.void': true,
        'products.view': true,
        'products.create': true,
        'products.edit': true,
        'products.delete': true,
        'categories.view': true,
        'categories.create': true,
        'categories.edit': true,
        'categories.delete': true,
        'orders.view': true,
        'orders.create': true,
        'orders.edit': true,
        'orders.delete': true,
        'orders.print': true,
        'orders.download': true,
        'tables.view': true,
        'tables.create': true,
        'tables.edit': true,
        'tables.delete': true,
        'tables.reset': true,
        'tables.clear_orders': true,
        'customers.view': true,
        'customers.create': true,
        'customers.edit': true,
        'customers.delete': true,
        'payments.process': true,
        'payments.view_history': true,
        'reports.view': true,
        'reports.analytics': true,
        'inventory.view': true,
        'inventory.adjust': true,
        'settings.view': true,
      }) as Permission[];
    }

    // For cashier users, get explicit permissions
    const userPermissions = await dbUtils.all(`
      SELECT permission FROM user_permissions 
      WHERE user_id = ? AND granted = 1
    `, [userId]);

    return userPermissions.map(p => p.permission as Permission);

  } catch (error) {
    console.error('Error getting user permissions list:', error);
    return [];
  }
};

// Simple role-based permission check (for admin-only routes)
export const requirePermission = (requiredRole: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (req.user.role !== requiredRole) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
};
