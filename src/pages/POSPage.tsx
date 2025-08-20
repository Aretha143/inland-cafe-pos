import { useState, useEffect } from 'react';
import { Plus, Minus, Trash2, ShoppingCart, CreditCard, Banknote, Smartphone, User, UserPlus, Users } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { Product, Category, PaymentMethod, Customer, Table } from '../types';
import { formatAmount } from '../utils/currency';
import CustomerModal from '../components/CustomerModal';
import api from '../utils/api';

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);

  const {
    items,
    subtotal,
    total,
    discount,
    discountType,
    paymentMethod,
    tableNumber,
    notes,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    setDiscount,
    setPaymentMethod,
    setTableNumber,
    setNotes,
    getItemCount
  } = useCartStore();

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [productsRes, categoriesRes, customersRes, tablesRes] = await Promise.all([
        api.getProducts({ active_only: true }),
        api.getCategories(),
        api.getCustomers({ limit: 100 }),
        api.getTables({ status: 'available' })
      ]);

      if (productsRes.data) setProducts(productsRes.data);
      if (categoriesRes.data) setCategories(categoriesRes.data);
      if (customersRes.data) setCustomers(customersRes.data);
      if (tablesRes.data && tablesRes.data.data) {
        setTables(tablesRes.data.data || []);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getMembershipDiscount = (customer: Customer | null) => {
    if (!customer) return 0;
    const membershipType = (customer as any).membership_type || 'regular';
    switch (membershipType) {
      case 'silver': return 5;
      case 'gold': return 10;
      case 'platinum': return 15;
      default: return 0;
    }
  };

  const calculateAutomaticDiscount = () => {
    const membershipDiscountPercent = getMembershipDiscount(selectedCustomer);
    if (membershipDiscountPercent > 0) {
      const membershipDiscount = subtotal * (membershipDiscountPercent / 100);
      return Math.max(membershipDiscount, discount);
    }
    return discount;
  };

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerSearch('');
    
    // Apply membership discount automatically
    const membershipDiscountPercent = getMembershipDiscount(customer);
    if (membershipDiscountPercent > 0) {
      setDiscount(membershipDiscountPercent, 'percentage');
    }
  };

  const handleCustomerSaved = (customer: Customer) => {
    setCustomers(prev => [...prev, customer]);
    setSelectedCustomer(customer);
    setShowCustomerModal(false);
  };

  const filteredProducts = products.filter(product => {
    const matchesCategory = !selectedCategory || product.category_id === selectedCategory;
    const matchesSearch = !searchTerm || 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleProcessOrder = async () => {
    if (items.length === 0) return;

    setIsProcessingOrder(true);
    try {
      const finalDiscount = calculateAutomaticDiscount();
      const orderData = {
        customer_id: selectedCustomer?.id,
        items: items.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity,
          notes: item.notes || undefined
        })),
        payment_method: paymentMethod,
        discount_amount: discountType === 'percentage' 
          ? subtotal * (discount / 100)
          : discount,
        table_number: selectedTable?.table_number || tableNumber || undefined,
        table_id: selectedTable?.id || undefined,
        order_type: 'dine_in',
        notes: notes || undefined
      };

      const response = await api.createOrder(orderData);

      if (response.data) {
        clearCart();
        alert('Order processed successfully!');
        // Reload products to update stock
        loadInitialData();
      } else {
        alert(response.error || 'Failed to process order');
      }
    } catch (error) {
      console.error('Order processing error:', error);
      alert('Failed to process order');
    } finally {
      setIsProcessingOrder(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const paymentMethods: { value: PaymentMethod; label: string; icon: React.ReactNode }[] = [
    { value: 'cash', label: 'Cash', icon: <Banknote className="w-4 h-4" /> },
    { value: 'card', label: 'Card', icon: <CreditCard className="w-4 h-4" /> },
    { value: 'mobile', label: 'Mobile', icon: <Smartphone className="w-4 h-4" /> },
  ];

  return (
    <div className="h-full flex">
      {/* Products Section */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Point of Sale</h1>
          
          {/* Search */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input w-full max-w-md"
            />
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === null
                  ? 'bg-cafe-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-cafe-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                style={{
                  backgroundColor: selectedCategory === category.id ? category.color : undefined,
                }}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="card cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => addItem(product)}
            >
              <div className="card-body p-4">
                {product.image_url && (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-24 object-cover rounded-md mb-2"
                  />
                )}
                <h3 className="font-medium text-gray-900 text-sm mb-1 line-clamp-2">
                  {product.name}
                </h3>
                <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                  {product.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-cafe-600">
                    {formatAmount(product.price)}
                  </span>
                  <span className="text-xs text-gray-500">
                    Stock: {product.stock_quantity}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No products found</p>
          </div>
        )}
      </div>

      {/* Cart Section */}
      <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Cart</h2>
            <div className="flex items-center space-x-2">
              <ShoppingCart className="w-5 h-5 text-gray-500" />
              <span className="text-sm text-gray-500">{getItemCount()} items</span>
            </div>
          </div>
          
          {/* Customer Selection */}
          <div className="mt-3">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Customer</label>
              <button
                onClick={() => setShowCustomerModal(true)}
                className="text-xs text-cafe-600 hover:text-cafe-700 flex items-center"
              >
                <UserPlus className="w-3 h-3 mr-1" />
                Add New
              </button>
            </div>
            {selectedCustomer ? (
              <div className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded">
                <div className="flex items-center">
                  <User className="w-4 h-4 text-green-600 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-green-900">{selectedCustomer.name}</p>
                    <p className="text-xs text-green-600">
                      {(selectedCustomer as any).membership_type?.charAt(0).toUpperCase() + 
                       (selectedCustomer as any).membership_type?.slice(1)} Member
                      {getMembershipDiscount(selectedCustomer) > 0 && 
                        ` (${getMembershipDiscount(selectedCustomer)}% discount)`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedCustomer(null);
                    setDiscount(0, 'fixed');
                  }}
                  className="text-green-600 hover:text-green-700"
                >
                  ×
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search customers by name or phone..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="input text-sm"
                />
                {customerSearch && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-40 overflow-y-auto">
                    {customers
                      .filter(customer => 
                        customer.name?.toLowerCase().includes(customerSearch.toLowerCase()) ||
                        customer.phone?.includes(customerSearch)
                      )
                      .slice(0, 5)
                      .map(customer => (
                        <button
                          key={customer.id}
                          onClick={() => handleCustomerSelect(customer)}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                        >
                          <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                          <div className="text-xs text-gray-500">{customer.phone}</div>
                        </button>
                      ))
                    }
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Table Selection */}
          <div className="mt-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Table (Optional)
            </label>
            <select
              value={selectedTable?.id || ''}
              onChange={(e) => {
                const tableId = parseInt(e.target.value);
                const table = tables.find(t => t.id === tableId);
                setSelectedTable(table || null);
                setTableNumber(table?.table_number || '');
              }}
              className="input text-sm"
            >
              <option value="">No table selected</option>
              {tables.map((table) => (
                <option key={table.id} value={table.id}>
                  {table.table_number} - {table.table_name || 'Unnamed'} (Capacity: {table.capacity})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-auto p-4">
          {items.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Cart is empty</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.product.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 text-sm">
                        {item.product.name}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {formatAmount(item.product.price)} each
                      </p>
                    </div>
                    <button
                      onClick={() => removeItem(item.product.id)}
                      className="text-red-600 hover:text-red-700 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center hover:bg-gray-300"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center hover:bg-gray-300"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="font-medium text-gray-900">
                      {formatAmount(item.subtotal)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cart Summary and Checkout */}
        {items.length > 0 && (
          <div className="border-t border-gray-200 p-4">
            {/* Discount */}
            <div className="mb-4">
              <div className="flex space-x-2">
                <input
                  type="number"
                  placeholder="Discount"
                  value={discount || ''}
                  onChange={(e) => setDiscount(Number(e.target.value) || 0, discountType)}
                  className="input text-sm flex-1"
                  min="0"
                />
                <select
                  value={discountType}
                  onChange={(e) => setDiscount(discount, e.target.value as 'percentage' | 'fixed')}
                  className="input text-sm w-20"
                >
                  <option value="fixed">Rs.</option>
                  <option value="percentage">%</option>
                </select>
              </div>
            </div>

            {/* Payment Method */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method
              </label>
              <div className="grid grid-cols-3 gap-2">
                {paymentMethods.map((method) => (
                  <button
                    key={method.value}
                    onClick={() => setPaymentMethod(method.value)}
                    className={`p-2 rounded-lg border text-xs font-medium transition-colors ${
                      paymentMethod === method.value
                        ? 'border-cafe-500 bg-cafe-50 text-cafe-700'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex flex-col items-center space-y-1">
                      {method.icon}
                      <span>{method.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Order Notes */}
            <div className="mb-4">
              <textarea
                placeholder="Order notes (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="input text-sm resize-none"
                rows={2}
              />
            </div>

            {/* Summary */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>{formatAmount(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-red-600">
                  <span>
                    Discount ({discountType === 'percentage' ? `${discount}%` : `Rs. ${discount}`}):
                    {selectedCustomer && getMembershipDiscount(selectedCustomer) > 0 && (
                      <span className="text-xs text-green-600 ml-1">(Membership)</span>
                    )}
                  </span>
                  <span>
                    -{formatAmount(discountType === 'percentage' ? subtotal * (discount / 100) : discount)}
                  </span>
                </div>
              )}

              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total:</span>
                <span>{formatAmount(total)}</span>
              </div>
            </div>

            {/* Checkout Buttons */}
            <div className="space-y-2">
              <button
                onClick={handleProcessOrder}
                disabled={isProcessingOrder}
                className="w-full btn btn-success disabled:opacity-50"
              >
                {isProcessingOrder ? 'Processing...' : 'Process Order'}
              </button>
              <button
                onClick={clearCart}
                className="w-full btn btn-secondary"
              >
                Clear Cart
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Customer Modal */}
      <CustomerModal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        onSave={handleCustomerSaved}
      />
    </div>
  );
}
