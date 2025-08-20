import { useState } from 'react';
import { Shield, Settings, Key, Users } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import PasswordManagement from '../components/PasswordManagement';
import PermissionsManagement from '../components/PermissionsManagement';
import UserManagement from '../components/UserManagement';

type AdminSection = 'password' | 'permissions' | 'users' | 'settings';

export default function AdminPage() {
  const { user } = useAuthStore();
  const [activeSection, setActiveSection] = useState<AdminSection>('password');

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">Only administrators can access this page.</p>
        </div>
      </div>
    );
  }

  const sections = [
    {
      id: 'password' as AdminSection,
      name: 'Password Management',
      icon: Key,
      description: 'Change admin and user passwords'
    },
    {
      id: 'permissions' as AdminSection,
      name: 'User Permissions',
      icon: Shield,
      description: 'Manage user permissions and access control'
    },
    {
      id: 'users' as AdminSection,
      name: 'User Management',
      icon: Users,
      description: 'Manage system users and their access'
    },
    {
      id: 'settings' as AdminSection,
      name: 'System Settings',
      icon: Settings,
      description: 'Configure system settings (Coming Soon)'
    }
  ];

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center mb-2">
          <Shield className="w-8 h-8 text-blue-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
        </div>
        <p className="text-gray-600">Administrative tools and system management</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Admin Tools</h2>
            <nav className="space-y-2">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      activeSection === section.id
                        ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center">
                      <Icon className="w-5 h-5 mr-3" />
                      <div>
                        <div className="font-medium">{section.name}</div>
                        <div className="text-xs text-gray-500">{section.description}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {activeSection === 'password' && <PasswordManagement />}
          
          {activeSection === 'permissions' && <PermissionsManagement />}
          
          {activeSection === 'users' && <UserManagement />}
          
          {activeSection === 'settings' && (
            <div className="bg-white shadow rounded-lg p-8 text-center">
              <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">System Settings</h3>
              <p className="text-gray-600 mb-4">System configuration options coming soon!</p>
              <p className="text-sm text-gray-500">
                This will include system preferences, backup settings, and more.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
