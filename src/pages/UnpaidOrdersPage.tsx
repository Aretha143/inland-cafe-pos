import { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Trash2, 
  Edit, 
  Eye, 
  DollarSign, 
  User, 
  Phone, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  CreditCard
} from 'lucide-react';
import { api } from '../utils/api';

interface UnpaidOrder {
  id: number;
  order_id: number;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  table_number: string;
  total_amount: number;
  items_summary: string;
  items: Array<{
    product_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
  notes: string;
  created_at: string;
  order_status: string;
  payment_status: string;
}

interface UnpaidStats {
  total_unpaid_orders: number;
  total_unpaid_amount: number;
  unique_customers: number;
  customer_breakdown: Array<{
    customer_name: string;
    order_count: number;
    total_amount: number;
  }>;
}

export default function UnpaidOrdersPage() {
  const [unpaidOrders, setUnpaidOrders] = useState<UnpaidOrder[]>([]);
  const [stats, setStats] = useState<UnpaidStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<UnpaidOrder | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<UnpaidOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [existingCustomers, setExistingCustomers] = useState<string[]>([]);
  const [showCustomerSelect, setShowCustomerSelect] = useState(false);
  const [showMarkAsPaidModal, setShowMarkAsPaidModal] = useState(false);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<UnpaidOrder | null>(null);

  // Add order form state
  const [addForm, setAddForm] = useState({
    order_id: '',
    customer_name: '',
    customer_phone: '',
    table_number: '',
    notes: ''
  });

  // Customer selection form
  const [customerSelectForm, setCustomerSelectForm] = useState({
    selectedCustomer: '',
    newCustomerName: '',
    newCustomerPhone: ''
  });

  // Mark as paid form
  const [markAsPaidForm, setMarkAsPaidForm] = useState({
    payment_method: 'cash',
    notes: ''
  });

  // Edit form state
  const [editForm, setEditForm] = useState({
    customer_name: '',
    customer_phone: '',
    table_number: '',
    notes: ''
  });

  useEffect(() => {
    fetchUnpaidOrders();
    fetchStats();
  }, []);

  const getExistingCustomers = () => {
    const customers = [...new Set(unpaidOrders.map(order => order.customer_name))];
    setExistingCustomers(customers);
  };

  const fetchUnpaidOrders = async () => {
    try {
      setLoading(true);
      const response = await api.getUnpaidOrders();
      console.log('Unpaid orders response:', response);
      console.log('Response data:', response.data);
      console.log('Response data type:', typeof response.data);
      console.log('Is array?', Array.isArray(response.data));
      setUnpaidOrders(response.data || []);
    } catch (error) {
      console.error('Error fetching unpaid orders:', error);
      setUnpaidOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.getUnpaidStats();
      console.log('Unpaid stats response:', response);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching unpaid stats:', error);
    }
  };

  const handleAddToUnpaid = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    try {
      console.log('Adding to unpaid table:', {
        order_id: parseInt(addForm.order_id),
        customer_name: addForm.customer_name,
        customer_phone: addForm.customer_phone || undefined,
        table_number: addForm.table_number || undefined,
        notes: addForm.notes || undefined
      });
      
      const response = await api.addToUnpaidTable({
        order_id: parseInt(addForm.order_id),
        customer_name: addForm.customer_name,
        customer_phone: addForm.customer_phone || undefined,
        table_number: addForm.table_number || undefined,
        notes: addForm.notes || undefined
      });
      
      console.log('Add to unpaid response:', response);
      
      setShowAddModal(false);
      setAddForm({
        order_id: '',
        customer_name: '',
        customer_phone: '',
        table_number: '',
        notes: ''
      });
      setSuccess('Order added to unpaid table successfully!');
      fetchUnpaidOrders();
      fetchStats();
    } catch (error: any) {
      console.error('Error adding to unpaid table:', error);
      setError(error.message || 'Failed to add order to unpaid table');
    }
  };

  const handleUpdateUnpaid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;
    
    try {
      await api.updateUnpaidOrder(editingOrder.id, {
        customer_name: editForm.customer_name,
        customer_phone: editForm.customer_phone || undefined,
        table_number: editForm.table_number || undefined,
        notes: editForm.notes || undefined
      });
      setShowEditModal(false);
      setEditingOrder(null);
      fetchUnpaidOrders();
    } catch (error) {
      console.error('Error updating unpaid order:', error);
    }
  };

  const handleRemoveFromUnpaid = async (id: number) => {
    if (!confirm('Are you sure you want to remove this order from the unpaid table?')) {
      return;
    }

    try {
      await api.removeFromUnpaidTable(id);
      fetchUnpaidOrders();
      fetchStats();
    } catch (error) {
      console.error('Error removing from unpaid table:', error);
    }
  };

  const handleMarkAsPaid = async (order: UnpaidOrder) => {
    setSelectedOrderForPayment(order);
    setMarkAsPaidForm({
      payment_method: 'cash',
      notes: ''
    });
    setShowMarkAsPaidModal(true);
  };

  const handleConfirmMarkAsPaid = async () => {
    if (!selectedOrderForPayment) return;

    try {
      await api.markUnpaidOrderAsPaid(selectedOrderForPayment.id, {
        payment_method: markAsPaidForm.payment_method,
        notes: markAsPaidForm.notes
      });
      
      setSuccess(`Order marked as paid successfully! Payment of ${formatCurrency(selectedOrderForPayment.total_amount)} processed.`);
      setShowMarkAsPaidModal(false);
      setSelectedOrderForPayment(null);
      fetchUnpaidOrders();
      fetchStats();
    } catch (error: any) {
      setError(error.message || 'Failed to mark order as paid');
    }
  };

  const openEditModal = (order: UnpaidOrder) => {
    setEditingOrder(order);
    setEditForm({
      customer_name: order.customer_name,
      customer_phone: order.customer_phone || '',
      table_number: order.table_number || '',
      notes: order.notes || ''
    });
    setShowEditModal(true);
  };

  const openDetailsModal = (order: UnpaidOrder) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  const filteredOrders = unpaidOrders.filter(order =>
    order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.table_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.order_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group orders by customer name
  const groupedOrders = filteredOrders.reduce((groups, order) => {
    const customerName = order.customer_name;
    if (!groups[customerName]) {
      groups[customerName] = [];
    }
    groups[customerName].push(order);
    return groups;
  }, {} as Record<string, UnpaidOrder[]>);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cafe-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Unpaid Orders</h1>
        <p className="text-gray-600">Manage pending food bills and customer information</p>
      </div>

      {/* Error and Success Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <CheckCircle className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-800">{success}</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <AlertTriangle className="w-8 h-8 text-red-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Total Unpaid</p>
                <p className="text-lg font-semibold text-gray-900">{stats.total_unpaid_orders}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <DollarSign className="w-8 h-8 text-green-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Total Amount</p>
                <p className="text-lg font-semibold text-gray-900">{formatCurrency(stats.total_unpaid_amount)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <User className="w-8 h-8 text-blue-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Customers</p>
                <p className="text-lg font-semibold text-gray-900">{stats.unique_customers}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-cafe-500" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Actions</p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="text-cafe-600 hover:text-cafe-700 font-medium"
                >
                  Add Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Actions */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by customer name, table number, or order number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-cafe-500 focus:border-cafe-500"
              />
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center px-4 py-2 bg-cafe-600 text-white rounded-md hover:bg-cafe-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add to Unpaid
          </button>
        </div>
      </div>

      {/* Unpaid Orders Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          {Object.entries(groupedOrders).map(([customerName, orders]) => (
            <div key={customerName} className="border-b border-gray-200">
              {/* Customer Header */}
              <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">{customerName}</h3>
                    <p className="text-xs text-gray-500">
                      {orders.length} order(s) • Total: {formatCurrency(orders.reduce((sum, order) => sum + order.total_amount, 0))}
                    </p>
                  </div>
                  <div className="text-xs text-gray-500">
                    {orders[0].customer_phone && (
                      <div className="flex items-center">
                        <Phone className="w-3 h-3 mr-1" />
                        {orders[0].customer_phone}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Orders for this customer */}
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Table
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{order.order_number}</div>
                          <div className="text-sm text-gray-500">
                            {order.items.length} items
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {order.table_number ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Table {order.table_number}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(order.total_amount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {formatDate(order.created_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openDetailsModal(order)}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(order)}
                            className="text-green-600 hover:text-green-900"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleMarkAsPaid(order)}
                            className="text-purple-600 hover:text-purple-900"
                            title="Mark as Paid"
                          >
                            <CreditCard className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRemoveFromUnpaid(order.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Remove from Unpaid"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
        
        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No unpaid orders</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'No orders match your search criteria.' : 'Get started by adding an order to the unpaid table.'}
            </p>
          </div>
        )}
      </div>

      {/* Add Order Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add Order to Unpaid Table</h3>
              <form onSubmit={handleAddToUnpaid}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Order ID</label>
                    <input
                      type="number"
                      required
                      value={addForm.order_id}
                      onChange={(e) => setAddForm({ ...addForm, order_id: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-cafe-500 focus:border-cafe-500"
                    />
                  </div>
                  
                  {/* Customer Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Customer</label>
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => {
                          getExistingCustomers();
                          setShowCustomerSelect(true);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-left text-sm text-gray-600 hover:bg-gray-50"
                      >
                        {addForm.customer_name || 'Select existing customer or enter new one...'}
                      </button>
                      
                      {addForm.customer_name && (
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">Selected: {addForm.customer_name}</span>
                          <button
                            type="button"
                            onClick={() => setAddForm({ ...addForm, customer_name: '', customer_phone: '' })}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Clear
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Customer Phone</label>
                    <input
                      type="text"
                      value={addForm.customer_phone}
                      onChange={(e) => setAddForm({ ...addForm, customer_phone: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-cafe-500 focus:border-cafe-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Table Number</label>
                    <input
                      type="text"
                      value={addForm.table_number}
                      onChange={(e) => setAddForm({ ...addForm, table_number: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-cafe-500 focus:border-cafe-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                    <textarea
                      value={addForm.notes}
                      onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
                      rows={3}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-cafe-500 focus:border-cafe-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-cafe-600 rounded-md hover:bg-cafe-700"
                  >
                    Add Order
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Customer Selection Modal */}
      {showCustomerSelect && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Select Customer</h3>
              
              <div className="space-y-4">
                {/* Existing Customers */}
                {existingCustomers.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Existing Customers</label>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {existingCustomers.map((customer, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => {
                            setAddForm({ ...addForm, customer_name: customer });
                            setShowCustomerSelect(false);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-left text-sm hover:bg-gray-50"
                        >
                          {customer}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* New Customer */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">New Customer</label>
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={customerSelectForm.newCustomerName}
                      onChange={(e) => setCustomerSelectForm({ ...customerSelectForm, newCustomerName: e.target.value })}
                      placeholder="Enter new customer name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-cafe-500 focus:border-cafe-500"
                    />
                    <input
                      type="text"
                      value={customerSelectForm.newCustomerPhone}
                      onChange={(e) => setCustomerSelectForm({ ...customerSelectForm, newCustomerPhone: e.target.value })}
                      placeholder="Enter phone number (optional)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-cafe-500 focus:border-cafe-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (customerSelectForm.newCustomerName.trim()) {
                          setAddForm({ 
                            ...addForm, 
                            customer_name: customerSelectForm.newCustomerName.trim(),
                            customer_phone: customerSelectForm.newCustomerPhone.trim()
                          });
                          setCustomerSelectForm({ selectedCustomer: '', newCustomerName: '', newCustomerPhone: '' });
                          setShowCustomerSelect(false);
                        }
                      }}
                      className="w-full px-3 py-2 bg-cafe-600 text-white rounded-md hover:bg-cafe-700"
                    >
                      Use New Customer
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  type="button"
                  onClick={() => setShowCustomerSelect(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Order Modal */}
      {showEditModal && editingOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Unpaid Order</h3>
              <form onSubmit={handleUpdateUnpaid}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Customer Name</label>
                    <input
                      type="text"
                      required
                      value={editForm.customer_name}
                      onChange={(e) => setEditForm({ ...editForm, customer_name: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-cafe-500 focus:border-cafe-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Customer Phone</label>
                    <input
                      type="text"
                      value={editForm.customer_phone}
                      onChange={(e) => setEditForm({ ...editForm, customer_phone: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-cafe-500 focus:border-cafe-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Table Number</label>
                    <input
                      type="text"
                      value={editForm.table_number}
                      onChange={(e) => setEditForm({ ...editForm, table_number: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-cafe-500 focus:border-cafe-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                    <textarea
                      value={editForm.notes}
                      onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                      rows={3}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-cafe-500 focus:border-cafe-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-cafe-600 rounded-md hover:bg-cafe-700"
                  >
                    Update Order
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {showDetailsModal && selectedOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Order Details</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900">Customer Information</h4>
                  <p className="text-sm text-gray-600">{selectedOrder.customer_name}</p>
                  {selectedOrder.customer_phone && (
                    <p className="text-sm text-gray-600">{selectedOrder.customer_phone}</p>
                  )}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Order Information</h4>
                  <p className="text-sm text-gray-600">Order #: {selectedOrder.order_number}</p>
                  <p className="text-sm text-gray-600">Total: {formatCurrency(selectedOrder.total_amount)}</p>
                  {selectedOrder.table_number && (
                    <p className="text-sm text-gray-600">Table: {selectedOrder.table_number}</p>
                  )}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Items</h4>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{item.product_name} x{item.quantity}</span>
                        <span>{formatCurrency(item.total_price)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {selectedOrder.notes && (
                  <div>
                    <h4 className="font-medium text-gray-900">Notes</h4>
                    <p className="text-sm text-gray-600">{selectedOrder.notes}</p>
                  </div>
                )}
              </div>
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mark as Paid Modal */}
      {showMarkAsPaidModal && selectedOrderForPayment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Mark Order as Paid</h3>
              
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Order:</strong> {selectedOrderForPayment.order_number}<br/>
                  <strong>Customer:</strong> {selectedOrderForPayment.customer_name}<br/>
                  <strong>Amount:</strong> {formatCurrency(selectedOrderForPayment.total_amount)}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                  <select
                    value={markAsPaidForm.payment_method}
                    onChange={(e) => setMarkAsPaidForm({ ...markAsPaidForm, payment_method: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-cafe-500 focus:border-cafe-500"
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="upi">UPI</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                  <textarea
                    value={markAsPaidForm.notes}
                    onChange={(e) => setMarkAsPaidForm({ ...markAsPaidForm, notes: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-cafe-500 focus:border-cafe-500"
                    placeholder="Add any payment notes..."
                  />
                </div>

                <div className="p-3 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> This will mark the order as paid and remove it from unpaid orders, but keep all history in the database.
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowMarkAsPaidModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmMarkAsPaid}
                  className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 flex items-center space-x-2"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Mark as Paid</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
