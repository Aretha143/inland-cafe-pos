import { useAuthStore } from '../store/authStore';

export type Permission = 
  // POS Operations
  | 'pos.access'
  | 'pos.discount'
  | 'pos.refund'
  | 'pos.void'
  
  // Products Management
  | 'products.view'
  | 'products.create'
  | 'products.edit'
  | 'products.delete'
  | 'products.delete_all'
  
  // Categories Management
  | 'categories.view'
  | 'categories.create'
  | 'categories.edit'
  | 'categories.delete'
  | 'categories.delete_all'
  
  // Orders Management
  | 'orders.view'
  | 'orders.create'
  | 'orders.edit'
  | 'orders.delete'
  | 'orders.print'
  | 'orders.download'
  
  // Tables Management
  | 'tables.view'
  | 'tables.create'
  | 'tables.edit'
  | 'tables.delete'
  | 'tables.reset'
  | 'tables.clear_orders'
  
  // Customer Management
  | 'customers.view'
  | 'customers.create'
  | 'customers.edit'
  | 'customers.delete'
  
  // Payments
  | 'payments.process'
  | 'payments.view_history'
  
  // Reports & Analytics
  | 'reports.view'
  | 'reports.analytics'
  | 'reports.delete'
  
  // Inventory
  | 'inventory.view'
  | 'inventory.adjust'
  
  // System Settings
  | 'settings.view'
  | 'settings.edit';

export const usePermissions = () => {
  const { user } = useAuthStore();

  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;
    
    // Admin users have all permissions
    if (user.role === 'admin') return true;
    
    // Manager users have most permissions by default
    if (user.role === 'manager') {
      const adminOnlyPermissions: Permission[] = [
        'products.delete_all',
        'categories.delete_all',
        'reports.delete',
        'settings.edit'
      ];
      
      return !adminOnlyPermissions.includes(permission);
    }
    
    // For cashier users, check explicit permissions
    if (user.role === 'cashier') {
      return user.permissions?.includes(permission) || false;
    }
    
    return false;
  };

  const hasAnyPermission = (permissions: Permission[]): boolean => {
    return permissions.some(permission => hasPermission(permission));
  };

  const hasAllPermissions = (permissions: Permission[]): boolean => {
    return permissions.every(permission => hasPermission(permission));
  };

  const canAccessPOS = (): boolean => {
    return hasPermission('pos.access');
  };

  const canManageProducts = (): boolean => {
    return hasAnyPermission(['products.create', 'products.edit', 'products.delete']);
  };

  const canManageCategories = (): boolean => {
    return hasAnyPermission(['categories.create', 'categories.edit', 'categories.delete']);
  };

  const canManageOrders = (): boolean => {
    return hasAnyPermission(['orders.create', 'orders.edit', 'orders.delete']);
  };

  const canManageTables = (): boolean => {
    return hasAnyPermission(['tables.create', 'tables.edit', 'tables.delete', 'tables.reset']);
  };

  const canViewReports = (): boolean => {
    return hasPermission('reports.view');
  };

  const canProcessPayments = (): boolean => {
    return hasPermission('payments.process');
  };

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccessPOS,
    canManageProducts,
    canManageCategories,
    canManageOrders,
    canManageTables,
    canViewReports,
    canProcessPayments,
    userRole: user?.role || null,
    isAdmin: user?.role === 'admin',
    isManager: user?.role === 'manager',
    isCashier: user?.role === 'cashier',
  };
};
