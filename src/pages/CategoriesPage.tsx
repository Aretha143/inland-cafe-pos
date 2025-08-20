import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Package, Palette, AlertTriangle } from 'lucide-react';
import { Category } from '../types';
import CategoryModal from '../components/CategoryModal';
import api from '../utils/api';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setIsLoading(true);
    try {
      // Include all categories (active and inactive) for management
      const response = await api.getCategories(true);
      if (response.data) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCategory = () => {
    setEditingCategory(null);
    setShowCategoryModal(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setShowCategoryModal(true);
  };

  const handleDeleteCategory = async (category: Category) => {
    if (window.confirm(`Are you sure you want to delete the category "${category.name}"?\n\nNote: You can only delete categories that don't have any products.`)) {
      try {
        const response = await api.deleteCategory(category.id);
        if (response.error) {
          alert(response.error);
        } else {
          loadCategories(); // Refresh the list
        }
      } catch (error) {
        alert('Failed to delete category');
      }
    }
  };

  const handleDeleteAllCategories = async () => {
    const confirmMessage = `⚠️ DELETE ALL CATEGORIES WARNING ⚠️

Are you sure you want to DELETE ALL CATEGORIES?

This action will:
• Delete ALL categories from your system
• Remove category assignments from ALL products
• Products will become uncategorized but remain active
• Reset category ID counter to 1

This action CANNOT be undone!

Type "DELETE ALL" to confirm:`;

    const confirmation = prompt(confirmMessage);
    if (confirmation !== 'DELETE ALL') {
      return;
    }

    try {
      const response = await api.deleteAllCategories();
      if (response.error) {
        alert('Failed to delete all categories: ' + response.error);
      } else {
        alert('All categories have been deleted successfully!');
        loadCategories(); // Refresh the list
      }
    } catch (error) {
      alert('Failed to delete all categories');
    }
  };

  const handleCategorySaved = () => {
    loadCategories(); // Refresh the list
    setShowCategoryModal(false);
    setEditingCategory(null);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-600">Manage your product categories</p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={handleAddCategory}
            className="btn btn-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Category</span>
          </button>
          <button 
            onClick={handleDeleteAllCategories}
            className="btn btn-danger flex items-center space-x-2"
            title="Delete All Categories (Admin Only)"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Delete All</span>
          </button>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {categories.map((category) => (
          <div key={category.id} className="card hover:shadow-md transition-shadow">
            <div className="card-body">
              <div className="flex items-center justify-between mb-3">
                <div
                  className="w-6 h-6 rounded-full flex-shrink-0"
                  style={{ backgroundColor: category.color }}
                ></div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEditCategory(category)}
                    className="text-indigo-600 hover:text-indigo-700 p-1"
                    title="Edit Category"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(category)}
                    className="text-red-600 hover:text-red-700 p-1"
                    title="Delete Category"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {category.name}
              </h3>
              
              {category.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {category.description}
                </p>
              )}
              
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center">
                  <Package className="w-4 h-4 mr-1" />
                  <span>Products: {(category as any).active_product_count || 0}</span>
                </div>
                <div className="flex items-center">
                  <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                    category.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {category.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {categories.length === 0 && (
        <div className="text-center py-12">
          <Palette className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Categories Found</h3>
          <p className="text-gray-500 mb-4">Get started by creating your first category</p>
          <button 
            onClick={handleAddCategory}
            className="btn btn-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add First Category
          </button>
        </div>
      )}

      {/* Category Modal */}
      <CategoryModal
        isOpen={showCategoryModal}
        onClose={() => {
          setShowCategoryModal(false);
          setEditingCategory(null);
        }}
        onSave={handleCategorySaved}
        category={editingCategory}
      />
    </div>
  );
}
