import { useState, useEffect } from 'react';
import { X, Save, User, Mail, Phone, MapPin, Star } from 'lucide-react';
import { Customer } from '../types';
import api from '../utils/api';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (customer: Customer) => void;
  customer?: Customer | null;
}

export default function CustomerModal({ isOpen, onClose, onSave, customer }: CustomerModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    membership_type: 'regular' as 'regular' | 'silver' | 'gold' | 'platinum',
    date_of_birth: '',
    anniversary_date: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        address: customer.address || '',
        membership_type: (customer as any).membership_type || 'regular',
        date_of_birth: (customer as any).date_of_birth || '',
        anniversary_date: (customer as any).anniversary_date || ''
      });
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        address: '',
        membership_type: 'regular',
        date_of_birth: '',
        anniversary_date: ''
      });
    }
    setError('');
  }, [customer, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      setError('Name and phone number are required');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      let response;
      if (customer) {
        response = await api.updateCustomer(customer.id, formData);
      } else {
        response = await api.createCustomer(formData);
      }

      if (response.error) {
        setError(response.error);
      } else {
        onSave(response.data);
        onClose();
      }
    } catch (error) {
      setError('Failed to save customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getMembershipBenefits = (type: string) => {
    switch (type) {
      case 'silver':
        return { discount: 5, color: 'bg-gray-100 text-gray-800', points: '2x points' };
      case 'gold':
        return { discount: 10, color: 'bg-yellow-100 text-yellow-800', points: '3x points' };
      case 'platinum':
        return { discount: 15, color: 'bg-purple-100 text-purple-800', points: '5x points' };
      default:
        return { discount: 0, color: 'bg-blue-100 text-blue-800', points: '1x points' };
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={onClose}></div>
        
        <div className="relative bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">
              {customer ? 'Edit Customer' : 'Add New Customer'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border-b border-red-200">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Basic Information */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                <User className="w-4 h-4 mr-2" />
                Basic Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="input"
                    required
                    placeholder="+977 98-xxxxxxxx"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="input"
                    placeholder="customer@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleInputChange}
                    className="input"
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                <MapPin className="w-4 h-4 mr-2" />
                Address Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="input resize-none"
                    rows={2}
                    placeholder="Street, City, State, PIN Code"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Anniversary Date
                  </label>
                  <input
                    type="date"
                    name="anniversary_date"
                    value={formData.anniversary_date}
                    onChange={handleInputChange}
                    className="input"
                  />
                </div>
              </div>
            </div>

            {/* Membership */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                <Star className="w-4 h-4 mr-2" />
                Membership Details
              </h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Membership Type
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {['regular', 'silver', 'gold', 'platinum'].map((type) => {
                    const benefits = getMembershipBenefits(type);
                    return (
                      <label
                        key={type}
                        className={`relative border rounded-lg p-3 cursor-pointer hover:bg-gray-50 ${
                          formData.membership_type === type ? 'border-cafe-500 bg-cafe-50' : 'border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="membership_type"
                          value={type}
                          checked={formData.membership_type === type}
                          onChange={handleInputChange}
                          className="sr-only"
                        />
                        <div className="text-center">
                          <div className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${benefits.color}`}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </div>
                          <div className="mt-2 text-xs text-gray-600">
                            {benefits.discount > 0 && (
                              <div>{benefits.discount}% discount</div>
                            )}
                            <div>{benefits.points}</div>
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>{isSubmitting ? 'Saving...' : 'Save Customer'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
