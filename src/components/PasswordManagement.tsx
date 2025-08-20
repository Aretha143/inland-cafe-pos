import { useState, useEffect } from 'react';
import { Lock, User, Eye, EyeOff, Key, Shield } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import api from '../utils/api';

interface User {
  id: number;
  username: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
  last_login?: string;
}

export default function PasswordManagement() {
  const { user } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Admin password change state
  const [adminCurrentPassword, setAdminCurrentPassword] = useState('');
  const [adminNewPassword, setAdminNewPassword] = useState('');
  const [adminConfirmPassword, setAdminConfirmPassword] = useState('');
  const [showAdminCurrentPassword, setShowAdminCurrentPassword] = useState(false);
  const [showAdminNewPassword, setShowAdminNewPassword] = useState(false);
  
  // User password change state
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [newUserPassword, setNewUserPassword] = useState('');
  const [confirmUserPassword, setConfirmUserPassword] = useState('');
  const [showUserPassword, setShowUserPassword] = useState(false);

  useEffect(() => {
    if (user?.role === 'admin') {
      loadUsers();
    }
  }, [user]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/users');
      if (response.data) {
        setUsers(response.data);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeAdminPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (adminNewPassword !== adminConfirmPassword) {
      alert('New passwords do not match');
      return;
    }

    if (adminNewPassword.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }

    try {
      const response = await api.changeAdminPassword({
        currentPassword: adminCurrentPassword,
        newPassword: adminNewPassword
      });

      if (response.error) {
        alert('Failed to change admin password: ' + response.error);
      } else {
        alert('Admin password changed successfully!');
        setAdminCurrentPassword('');
        setAdminNewPassword('');
        setAdminConfirmPassword('');
      }
    } catch (error) {
      alert('Failed to change admin password');
    }
  };

  const handleChangeUserPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUserId) {
      alert('Please select a user');
      return;
    }

    if (newUserPassword !== confirmUserPassword) {
      alert('Passwords do not match');
      return;
    }

    if (newUserPassword.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }

    const selectedUser = users.find(u => u.id === selectedUserId);
    if (!selectedUser) {
      alert('User not found');
      return;
    }

    if (window.confirm(`Are you sure you want to change the password for ${selectedUser.username}?`)) {
      try {
        const response = await api.changeUserPassword({
          userId: selectedUserId,
          newPassword: newUserPassword
        });

        if (response.error) {
          alert('Failed to change user password: ' + response.error);
        } else {
          alert(`Password changed successfully for ${selectedUser.username}!`);
          setSelectedUserId(null);
          setNewUserPassword('');
          setConfirmUserPassword('');
        }
      } catch (error) {
        alert('Failed to change user password');
      }
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="text-center py-8">
        <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-500">Only administrators can access password management.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Change Admin Password */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center mb-6">
          <Shield className="w-6 h-6 text-blue-600 mr-3" />
          <h2 className="text-xl font-semibold text-gray-900">Change Admin Password</h2>
        </div>
        
        <form onSubmit={handleChangeAdminPassword} className="space-y-4">
          <div>
            <label htmlFor="adminCurrentPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showAdminCurrentPassword ? 'text' : 'password'}
                id="adminCurrentPassword"
                value={adminCurrentPassword}
                onChange={(e) => setAdminCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowAdminCurrentPassword(!showAdminCurrentPassword)}
              >
                {showAdminCurrentPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="adminNewPassword" className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <div className="relative">
              <input
                type={showAdminNewPassword ? 'text' : 'password'}
                id="adminNewPassword"
                value={adminNewPassword}
                onChange={(e) => setAdminNewPassword(e.target.value)}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                minLength={6}
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowAdminNewPassword(!showAdminNewPassword)}
              >
                {showAdminNewPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="adminConfirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              id="adminConfirmPassword"
              value={adminConfirmPassword}
              onChange={(e) => setAdminConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              minLength={6}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center"
          >
            <Lock className="w-4 h-4 mr-2" />
            Change Admin Password
          </button>
        </form>
      </div>

      {/* Change User Password */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center mb-6">
          <Key className="w-6 h-6 text-orange-600 mr-3" />
          <h2 className="text-xl font-semibold text-gray-900">Change User Password</h2>
        </div>

        <form onSubmit={handleChangeUserPassword} className="space-y-4">
          <div>
            <label htmlFor="selectUser" className="block text-sm font-medium text-gray-700 mb-1">
              Select User
            </label>
            <select
              id="selectUser"
              value={selectedUserId || ''}
              onChange={(e) => setSelectedUserId(e.target.value ? Number(e.target.value) : null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              required
            >
              <option value="">Choose a user...</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.full_name} (@{user.username}) - {user.role}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="newUserPassword" className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <div className="relative">
              <input
                type={showUserPassword ? 'text' : 'password'}
                id="newUserPassword"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                minLength={6}
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowUserPassword(!showUserPassword)}
              >
                {showUserPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirmUserPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              id="confirmUserPassword"
              value={confirmUserPassword}
              onChange={(e) => setConfirmUserPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              minLength={6}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 flex items-center justify-center"
          >
            <User className="w-4 h-4 mr-2" />
            Change User Password
          </button>
        </form>
      </div>

      {/* Users List */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center mb-6">
          <User className="w-6 h-6 text-green-600 mr-3" />
          <h2 className="text-xl font-semibold text-gray-900">System Users</h2>
        </div>

        {isLoading ? (
          <div className="text-center py-4">Loading users...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Login
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                        <div className="text-sm text-gray-500">@{user.username}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.role === 'admin' 
                          ? 'bg-purple-100 text-purple-800' 
                          : user.role === 'manager'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.last_login 
                        ? new Date(user.last_login).toLocaleDateString()
                        : 'Never'
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
