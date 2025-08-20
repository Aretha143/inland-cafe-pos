import { useState, useEffect } from 'react';
import { Shield, User, Check, X, Save, RefreshCw, AlertCircle, Info } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import api from '../utils/api';

interface User {
  id: number;
  username: string;
  full_name: string;
  role: string;
  is_active: boolean;
}

interface Permission {
  permission: string;
  granted: boolean;
  inherited: boolean;
  description: string;
  granted_by?: string;
  granted_at?: string;
}

interface PermissionCategory {
  key: string;
  description: string;
  category: string;
}

interface AvailablePermissions {
  [category: string]: PermissionCategory[];
}

export default function PermissionsManagement() {
  const { user } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userPermissions, setUserPermissions] = useState<Permission[]>([]);
  const [availablePermissions, setAvailablePermissions] = useState<AvailablePermissions>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user?.role === 'admin') {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [usersResponse, permissionsResponse] = await Promise.all([
        api.get('/users'),
        api.getAvailablePermissions()
      ]);
      
      if (usersResponse.data) {
        const nonAdminUsers = usersResponse.data.filter((u: User) => u.role !== 'admin');
        setUsers(nonAdminUsers);
        if (nonAdminUsers.length > 0 && !selectedUser) {
          setSelectedUser(nonAdminUsers[0]);
        }
      }
      
      if (permissionsResponse.data?.permissions) {
        setAvailablePermissions(permissionsResponse.data.permissions);
        // Expand all categories by default
        setExpandedCategories(new Set(Object.keys(permissionsResponse.data.permissions)));
      }
    } catch (error) {
      console.error('Failed to load permissions data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserPermissions = async (userId: number) => {
    try {
      const response = await api.getUserPermissions(userId);
      if (response.data?.permissions) {
        setUserPermissions(response.data.permissions);
        setHasChanges(false);
      }
    } catch (error) {
      console.error('Failed to load user permissions:', error);
    }
  };

  useEffect(() => {
    if (selectedUser) {
      loadUserPermissions(selectedUser.id);
    }
  }, [selectedUser]);

  const handleUserSelect = (user: User) => {
    if (hasChanges) {
      if (!window.confirm('You have unsaved changes. Are you sure you want to switch users?')) {
        return;
      }
    }
    setSelectedUser(user);
    setHasChanges(false);
  };

  const togglePermission = (permission: string) => {
    setUserPermissions(prev => 
      prev.map(p => 
        p.permission === permission 
          ? { ...p, granted: !p.granted }
          : p
      )
    );
    setHasChanges(true);
  };

  const toggleCategory = (category: string) => {
    const categoryPermissions = availablePermissions[category] || [];
    const allGranted = categoryPermissions.every(p => 
      userPermissions.find(up => up.permission === p.key)?.granted
    );
    
    setUserPermissions(prev => 
      prev.map(p => {
        const isInCategory = categoryPermissions.some(cp => cp.key === p.permission);
        return isInCategory ? { ...p, granted: !allGranted } : p;
      })
    );
    setHasChanges(true);
  };

  const handleSavePermissions = async () => {
    if (!selectedUser) return;
    
    setSaving(true);
    try {
      const permissionsToSave = userPermissions.map(p => ({
        permission: p.permission,
        granted: p.granted
      }));
      
      const response = await api.updateUserPermissions(selectedUser.id, permissionsToSave);
      
      if (response.error) {
        alert('Failed to save permissions: ' + response.error);
      } else {
        alert('Permissions saved successfully!');
        setHasChanges(false);
        // Reload to get updated data
        await loadUserPermissions(selectedUser.id);
      }
    } catch (error) {
      alert('Failed to save permissions');
    } finally {
      setSaving(false);
    }
  };

  const toggleCategoryExpanded = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  if (user?.role !== 'admin') {
    return (
      <div className="text-center py-8">
        <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-500">Only administrators can manage user permissions.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <RefreshCw className="w-8 h-8 text-blue-600 mx-auto mb-4 animate-spin" />
        <p className="text-gray-600">Loading permissions data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Shield className="w-6 h-6 text-purple-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">User Permissions Management</h2>
          </div>
          {hasChanges && (
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-orange-600">
                <AlertCircle className="w-4 h-4 mr-2" />
                <span className="text-sm">Unsaved changes</span>
              </div>
              <button
                onClick={handleSavePermissions}
                disabled={isSaving}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center disabled:opacity-50"
              >
                {isSaving ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Changes
              </button>
            </div>
          )}
        </div>

        {/* User Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select User to Manage
          </label>
          <select
            value={selectedUser?.id || ''}
            onChange={(e) => {
              const user = users.find(u => u.id === Number(e.target.value));
              if (user) handleUserSelect(user);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="">Choose a user...</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.full_name} (@{user.username}) - {user.role}
                {!user.is_active && ' (Inactive)'}
              </option>
            ))}
          </select>
        </div>

        {selectedUser && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex items-center">
              <Info className="w-5 h-5 text-blue-600 mr-2" />
              <div>
                <p className="text-sm font-medium text-blue-900">
                  Managing permissions for: <strong>{selectedUser.full_name}</strong>
                </p>
                <p className="text-xs text-blue-700">
                  Role: {selectedUser.role} | Username: @{selectedUser.username}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Permissions Grid */}
      {selectedUser && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Permissions</h3>
          
          <div className="space-y-6">
            {Object.entries(availablePermissions).map(([category, permissions]) => {
              const isExpanded = expandedCategories.has(category);
              const categoryPermissions = permissions.map(p => 
                userPermissions.find(up => up.permission === p.key)
              ).filter(Boolean) as Permission[];
              
              const grantedCount = categoryPermissions.filter(p => p.granted).length;
              const totalCount = categoryPermissions.length;
              
              return (
                <div key={category} className="border border-gray-200 rounded-lg">
                  <div 
                    className="bg-gray-50 px-4 py-3 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => toggleCategoryExpanded(category)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <h4 className="text-md font-medium text-gray-900 capitalize">
                          {category} Permissions
                        </h4>
                        <span className="ml-2 text-sm text-gray-500">
                          ({grantedCount}/{totalCount} granted)
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleCategory(category);
                          }}
                          className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200 transition-colors"
                        >
                          Toggle All
                        </button>
                        <span className="text-gray-400">
                          {isExpanded ? '−' : '+'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className="p-4 space-y-3">
                      {permissions.map((availablePerm) => {
                        const userPerm = userPermissions.find(p => p.permission === availablePerm.key);
                        if (!userPerm) return null;
                        
                        return (
                          <div key={availablePerm.key} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                            <div className="flex-1">
                              <div className="flex items-center">
                                <h5 className="text-sm font-medium text-gray-900">
                                  {availablePerm.description}
                                </h5>
                                {userPerm.inherited && (
                                  <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                    Inherited
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                {availablePerm.key}
                                {userPerm.granted_by && (
                                  <span className="ml-2">
                                    • Granted by: {userPerm.granted_by}
                                  </span>
                                )}
                              </p>
                            </div>
                            
                            <button
                              onClick={() => togglePermission(availablePerm.key)}
                              disabled={userPerm.inherited}
                              className={`ml-4 p-2 rounded-md transition-colors ${
                                userPerm.granted
                                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                  : 'bg-red-100 text-red-700 hover:bg-red-200'
                              } ${userPerm.inherited ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                              {userPerm.granted ? (
                                <Check className="w-4 h-4" />
                              ) : (
                                <X className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
