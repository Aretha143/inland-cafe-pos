const { dbUtils } = require('../database/connection');

// Check if user has a specific permission
const checkPermission = (permission) => {
  return async (req, res, next) => {
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
const checkAnyPermission = (permissions) => {
  return async (req, res, next) => {
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

// Require a specific permission
const requirePermission = (permission) => {
  return checkPermission(permission);
};

// Require any of the specified permissions
const requireAnyPermission = (permissions) => {
  return checkAnyPermission(permissions);
};

// Require all of the specified permissions
const requireAllPermissions = (permissions) => {
  return async (req, res, next) => {
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
        
        // Check if all required permissions are not admin-only
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
      console.log(`PERMISSION DENIED: User ${req.user?.username} (${req.user?.role}) tried to access all of: ${permissions.join(', ')}`);
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

module.exports = {
  checkPermission,
  checkAnyPermission,
  requirePermission,
  requireAnyPermission,
  requireAllPermissions
};
