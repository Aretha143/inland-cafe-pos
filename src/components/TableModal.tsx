import { useState, useEffect } from 'react';
import { X, Save, MapPin, Users } from 'lucide-react';
import { Table } from '../types';
import api from '../utils/api';

interface TableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  table?: Table | null;
}

const tableLocations = [
  { value: 'indoor', label: 'Indoor' },
  { value: 'outdoor', label: 'Outdoor' },
  { value: 'private', label: 'Private Room' },
  { value: 'bar', label: 'Bar Area' },
  { value: 'terrace', label: 'Terrace' }
];

export default function TableModal({ isOpen, onClose, onSave, table }: TableModalProps) {
  const [formData, setFormData] = useState({
    table_number: '',
    table_name: '',
    capacity: 4,
    location: 'indoor'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (table) {
      setFormData({
        table_number: table.table_number,
        table_name: table.table_name || '',
        capacity: table.capacity,
        location: table.location || 'indoor'
      });
    } else {
      setFormData({
        table_number: '',
        table_name: '',
        capacity: 4,
        location: 'indoor'
      });
    }
    setError('');
  }, [table, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.table_number.trim()) {
      setError('Table number is required');
      return;
    }

    if (formData.capacity < 1 || formData.capacity > 20) {
      setError('Capacity must be between 1 and 20');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      let response;
      if (table) {
        response = await api.updateTable(table.id, formData);
      } else {
        response = await api.createTable(formData);
      }

      if (response.error) {
        setError(response.error);
      } else {
        onSave();
        onClose();
      }
    } catch (error) {
      setError('Failed to save table');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'capacity' ? parseInt(value) || 1 : value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={onClose}></div>
        
        <div className="relative bg-white rounded-lg max-w-md w-full">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">
              {table ? 'Edit Table' : 'Add New Table'}
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

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Table Number *
              </label>
              <input
                type="text"
                name="table_number"
                value={formData.table_number}
                onChange={handleInputChange}
                className="input"
                required
                placeholder="e.g., T01, A1, 5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Table Name
              </label>
              <input
                type="text"
                name="table_name"
                value={formData.table_name}
                onChange={handleInputChange}
                className="input"
                placeholder="e.g., Window Table, Corner Booth"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  Capacity *
                </div>
              </label>
              <input
                type="number"
                name="capacity"
                value={formData.capacity}
                onChange={handleInputChange}
                className="input"
                min="1"
                max="20"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-2" />
                  Location
                </div>
              </label>
              <select
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="input"
              >
                {tableLocations.map((location) => (
                  <option key={location.value} value={location.value}>
                    {location.label}
                  </option>
                ))}
              </select>
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
                <span>{isSubmitting ? 'Saving...' : 'Save Table'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
