import { Response } from 'express';
import { dbUtils } from '../database/connection';
import { AuthRequest } from '../middleware/auth';

// Define all available permissions in the system
export const AVAILABLE_PERMISSIONS = {
  // POS Operations
  'pos.access': 'Access POS System',
  'pos.discount': 'Apply Discounts',
  'pos.refund': 'Process Refunds',
  'pos.void': 'Void Orders',
  
  // Products Management
  'products.view': 'View Products',
  'products.create': 'Create Products',
  'products.edit': 'Edit Products',
  'products.delete': 'Delete Products',
  'products.delete_all': 'Delete All Products',
  
  // Categories Management
  'categories.view': 'View Categories',
  'categories.create': 'Create Categories',
  'categories.edit': 'Edit Categories',
  'categories.delete': 'Delete Categories',
  'categories.delete_all': 'Delete All Categories',
  
  // Orders Management
  'orders.view': 'View Orders',
  'orders.create': 'Create Orders',
  'orders.edit': 'Edit Orders',
  'orders.delete': 'Delete Orders',
  'orders.print': 'Print Orders/Receipts',
  'orders.download': 'Download Orders/Receipts',
  
  // Tables Management
  'tables.view': 'View Tables',
  'tables.create': 'Create Tables',
  'tables.edit': 'Edit Tables',
  'tables.delete': 'Delete Tables',
  'tables.reset': 'Reset Tables',
  'tables.clear_orders': 'Clear Table Orders',
  
  // Customer Management
  'customers.view': 'View Customers',
  'customers.create': 'Create Customers',
  'customers.edit': 'Edit Customers',
  'customers.delete': 'Delete Customers',
  
  // Payments
  'payments.process': 'Process Payments',
  'payments.view_history': 'View Payment History',
  
  // Reports & Analytics
  'reports.view': 'View Reports',
  'reports.analytics': 'View Analytics',
  'reports.delete': 'Delete Reports',
  
  // Inventory
  'inventory.view': 'View Inventory',
  'inventory.adjust': 'Adjust Inventory',
  
  // System Settings
  'settings.view': 'View Settings',
  'settings.edit': 'Edit Settings',
} as const;

export type Permission = keyof typeof AVAILABLE_PERMISSIONS;

// Get all available permissions
export const getAvailablePermissions = async (req: AuthRequest, res: Response) => {
  try {
    console.log('PERMISSIONS: Getting available permissions...');
    console.log('PERMISSIONS: Requested by:', req.user?.role);

    const permissions = Object.entries(AVAILABLE_PERMISSIONS).map(([key, description]) => ({
      key,
      description,
      category: key.split('.')[0] // Extract category from permission key
    }));

    // Group permissions by category
    const grouped = permissions.reduce((acc, perm) => {
      if (!acc[perm.category]) {
        acc[perm.category] = [];
      }
      acc[perm.category].push(perm);
      return acc;
    }, {} as Record<string, typeof permissions>);

    res.json({
      success: true,
      permissions: grouped,
      total: permissions.length
    });
  } catch (error) {
    console.error('PERMISSIONS: Error getting available permissions:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get user permissions
export const getUserPermissions = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    
    console.log('PERMISSIONS: Getting user permissions...');
    console.log('PERMISSIONS: Requested by:', req.user?.role);
    console.log('PERMISSIONS: For user ID:', userId);

    // Get user info
    const user = await dbUtils.get('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Admins have all permissions by default
    if (user.role === 'admin') {
      const allPermissions = Object.keys(AVAILABLE_PERMISSIONS).map(permission => ({
        permission,
        granted: true,
        inherited: true, // Admin permissions are inherited from role
        description: AVAILABLE_PERMISSIONS[permission as Permission]
      }));
      
      return res.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          full_name: user.full_name,
          role: user.role
        },
        permissions: allPermissions
      });
    }

    // Get explicit permissions for non-admin users
    const userPermissions = await dbUtils.all(`
      SELECT up.permission, up.granted, up.created_at,
             u.username as granted_by_username
      FROM user_permissions up
      LEFT JOIN users u ON up.granted_by = u.id
      WHERE up.user_id = ?
      ORDER BY up.permission
    `, [userId]);

    // Create a map of granted permissions
    const grantedPermissions = new Set(
      userPermissions.filter(p => p.granted).map(p => p.permission)
    );

    // Return all available permissions with granted status
    const allPermissions = Object.keys(AVAILABLE_PERMISSIONS).map(permission => {
      const userPerm = userPermissions.find(p => p.permission === permission);
      return {
        permission,
        granted: grantedPermissions.has(permission),
        inherited: false,
        description: AVAILABLE_PERMISSIONS[permission as Permission],
        granted_by: userPerm?.granted_by_username || null,
        granted_at: userPerm?.created_at || null
      };
    });

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role
      },
      permissions: allPermissions
    });

  } catch (error) {
    console.error('PERMISSIONS: Error getting user permissions:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update user permissions
export const updateUserPermissions = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { permissions } = req.body;
    
    console.log('PERMISSIONS: Updating user permissions...');
    console.log('PERMISSIONS: Requested by:', req.user?.role, req.user?.username);
    console.log('PERMISSIONS: For user ID:', userId);
    console.log('PERMISSIONS: New permissions:', permissions);

    if (!Array.isArray(permissions)) {
      return res.status(400).json({ message: 'Permissions must be an array' });
    }

    // Get target user
    const targetUser = await dbUtils.get('SELECT * FROM users WHERE id = ?', [userId]);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Cannot modify admin permissions
    if (targetUser.role === 'admin') {
      return res.status(400).json({ message: 'Cannot modify admin permissions' });
    }

    // Validate permissions
    const validPermissions = permissions.filter(p => 
      p.permission && 
      AVAILABLE_PERMISSIONS.hasOwnProperty(p.permission) &&
      typeof p.granted === 'boolean'
    );

    if (validPermissions.length !== permissions.length) {
      return res.status(400).json({ message: 'Invalid permissions provided' });
    }

    // Update permissions in a transaction
    await dbUtils.transaction([
      async () => {
        // Delete existing permissions for this user
        await dbUtils.run('DELETE FROM user_permissions WHERE user_id = ?', [userId]);
        
        // Insert new permissions
        for (const perm of validPermissions) {
          if (perm.granted) { // Only insert granted permissions
            await dbUtils.run(`
              INSERT INTO user_permissions (user_id, permission, granted, granted_by)
              VALUES (?, ?, ?, ?)
            `, [userId, perm.permission, 1, req.user?.id]);
          }
        }
      }
    ]);

    console.log(`PERMISSIONS: Successfully updated permissions for user: ${targetUser.username}`);

    res.json({
      success: true,
      message: `Permissions updated successfully for ${targetUser.username}`,
      updated_permissions: validPermissions.filter(p => p.granted).length
    });

  } catch (error) {
    console.error('PERMISSIONS: Error updating user permissions:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Grant specific permission to user
export const grantPermission = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { permission } = req.body;
    
    console.log('PERMISSIONS: Granting permission...');
    console.log('PERMISSIONS: Requested by:', req.user?.role, req.user?.username);
    console.log('PERMISSIONS: For user ID:', userId);
    console.log('PERMISSIONS: Permission:', permission);

    if (!permission || !AVAILABLE_PERMISSIONS.hasOwnProperty(permission)) {
      return res.status(400).json({ message: 'Invalid permission' });
    }

    // Get target user
    const targetUser = await dbUtils.get('SELECT * FROM users WHERE id = ?', [userId]);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (targetUser.role === 'admin') {
      return res.status(400).json({ message: 'Admin users have all permissions by default' });
    }

    // Insert or update permission
    await dbUtils.run(`
      INSERT OR REPLACE INTO user_permissions (user_id, permission, granted, granted_by)
      VALUES (?, ?, ?, ?)
    `, [userId, permission, 1, req.user?.id]);

    console.log(`PERMISSIONS: Granted ${permission} to ${targetUser.username}`);

    res.json({
      success: true,
      message: `Permission "${AVAILABLE_PERMISSIONS[permission as Permission]}" granted to ${targetUser.username}`
    });

  } catch (error) {
    console.error('PERMISSIONS: Error granting permission:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Revoke specific permission from user
export const revokePermission = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { permission } = req.body;
    
    console.log('PERMISSIONS: Revoking permission...');
    console.log('PERMISSIONS: Requested by:', req.user?.role, req.user?.username);
    console.log('PERMISSIONS: For user ID:', userId);
    console.log('PERMISSIONS: Permission:', permission);

    if (!permission || !AVAILABLE_PERMISSIONS.hasOwnProperty(permission)) {
      return res.status(400).json({ message: 'Invalid permission' });
    }

    // Get target user
    const targetUser = await dbUtils.get('SELECT * FROM users WHERE id = ?', [userId]);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (targetUser.role === 'admin') {
      return res.status(400).json({ message: 'Cannot revoke permissions from admin users' });
    }

    // Delete permission
    const result = await dbUtils.run(`
      DELETE FROM user_permissions 
      WHERE user_id = ? AND permission = ?
    `, [userId, permission]);

    console.log(`PERMISSIONS: Revoked ${permission} from ${targetUser.username}`);

    res.json({
      success: true,
      message: `Permission "${AVAILABLE_PERMISSIONS[permission as Permission]}" revoked from ${targetUser.username}`,
      affected: result.changes
    });

  } catch (error) {
    console.error('PERMISSIONS: Error revoking permission:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
