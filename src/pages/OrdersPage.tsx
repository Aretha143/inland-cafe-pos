import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Calendar, Filter, FileText, CreditCard, Clock, CheckCircle, Printer, XCircle, RefreshCw, Trash2 } from 'lucide-react';
import { Order } from '../types';
import { formatAmount } from '../utils/currency';
import { printOrderReceipt } from '../utils/printer';
import { useAuthStore } from '../store/authStore';
import api from '../utils/api';

export default function OrdersPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Check if user has admin/manager permissions
  const canDeleteOrders = user?.role === 'admin' || user?.role === 'manager';

  useEffect(() => {
    loadOrders();
  }, [selectedDate, selectedStatus]);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const params: any = { limit: 100 };
      if (selectedDate) params.date = selectedDate;
      if (selectedStatus) params.status = selectedStatus;

      const response = await api.getOrders(params);
      if (response.data) {
        setOrders(response.data);
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewOrder = (order: Order) => {
    navigate(`/payment/${order.id}`);
  };

  const handleCompleteOrder = async (order: Order) => {
    if (window.confirm(`Mark order #${order.order_number} as completed?`)) {
      try {
        const response = await api.updateOrderStatus(order.id, 'completed');
        if (response.error) {
          alert('Failed to complete order: ' + response.error);
        } else {
          // Refresh orders list
          loadOrders();
        }
      } catch (error) {
        alert('Failed to complete order');
      }
    }
  };

  const handleCancelOrder = async (order: Order) => {
    if (window.confirm(`Cancel order #${order.order_number}? This action cannot be undone.`)) {
      try {
        const response = await api.updateOrderStatus(order.id, 'cancelled');
        if (response.error) {
          alert('Failed to cancel order: ' + response.error);
        } else {
          // Refresh orders list
          loadOrders();
        }
      } catch (error) {
        alert('Failed to cancel order');
      }
    }
  };

  const handleRefundOrder = async (order: Order) => {
    if (window.confirm(`Refund order #${order.order_number}? This will restore stock levels.`)) {
      try {
        const response = await api.updateOrderStatus(order.id, 'refunded');
        if (response.error) {
          alert('Failed to refund order: ' + response.error);
        } else {
          // Refresh orders list
          loadOrders();
        }
      } catch (error) {
        alert('Failed to refund order');
      }
    }
  };

  const handlePrintOrder = (order: Order) => {
    printOrderReceipt(order);
  };

  const handleDeleteOrderHistory = async (order: Order) => {
    const confirmMessage = `⚠️ PERMANENT DELETE WARNING ⚠️

Are you sure you want to PERMANENTLY DELETE order #${order.order_number}?

This action will:
• Remove the order from all records
• Delete all order items and payments
• Restore stock levels (if applicable)
• Remove from all reports and history

This action CANNOT be undone!

Type "DELETE" to confirm:`;

    const confirmation = prompt(confirmMessage);
    if (confirmation !== 'DELETE') {
      return;
    }

    try {
      const response = await api.deleteOrderHistory(order.id, true);
      if (response.error) {
        alert('Failed to delete order: ' + response.error);
      } else {
        alert(`Order #${order.order_number} has been permanently deleted.`);
        // Refresh orders list
        loadOrders();
      }
    } catch (error) {
      alert('Failed to delete order');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash':
        return '💵';
      case 'card':
        return '💳';
      case 'mobile':
        return '📱';
      default:
        return '💰';
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
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
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-600">View and manage customer orders</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="card-body">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="input"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="input"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="card">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      #{order.order_number}
                    </h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.order_status)}`}>
                      {order.order_status}
                    </span>
                    <div className="flex items-center text-sm text-gray-500">
                      <span>{getPaymentMethodIcon(order.payment_method)}</span>
                      <span className="ml-1 capitalize">{order.payment_method}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Customer</p>
                      <p className="font-medium text-gray-900">
                        {order.customer_name || 'Walk-in Customer'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Date & Time</p>
                      <p className="font-medium text-gray-900">
                        {new Date(order.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Items</p>
                      <p className="font-medium text-gray-900">
                        {order.items?.length || 0} items
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Total</p>
                      <p className="font-medium text-gray-900 text-lg">
                        {formatAmount(order.final_amount)}
                      </p>
                    </div>
                  </div>

                  {order.table_number && (
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                        Table {order.table_number}
                      </span>
                    </div>
                  )}

                  {order.notes && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Notes:</span> {order.notes}
                      </p>
                    </div>
                  )}

                  {/* Order Items */}
                  {order.items && order.items.length > 0 && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Order Items:</h4>
                      <div className="space-y-2">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex justify-between items-center text-sm">
                            <span className="text-gray-900">
                              {item.quantity}x {item.product_name}
                              {item.notes && (
                                <span className="text-gray-500 italic"> - {item.notes}</span>
                              )}
                            </span>
                            <span className="font-medium text-gray-900">
                              {formatAmount(item.total_price)}
                            </span>
                          </div>
                        ))}
                      </div>
                      
                      {/* Order Summary */}
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex justify-between text-sm">
                          <span>Subtotal:</span>
                          <span>{formatAmount(order.total_amount)}</span>
                        </div>
                        {order.discount_amount > 0 && (
                          <div className="flex justify-between text-sm text-red-600">
                            <span>Discount:</span>
                            <span>-{formatAmount(order.discount_amount)}</span>
                          </div>
                        )}

                        <div className="flex justify-between font-medium border-t pt-2 mt-2">
                          <span>Total:</span>
                          <span>{formatAmount(order.final_amount)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col space-y-2 ml-4">
                  <button 
                    onClick={() => handleViewOrder(order)}
                    className="btn btn-secondary flex items-center space-x-2"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Payment</span>
                  </button>
                  <button 
                    onClick={() => handlePrintOrder(order)}
                    className="btn btn-primary flex items-center space-x-2"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print</span>
                  </button>
                  {order.order_status === 'active' && (
                    <>
                      <button 
                        onClick={() => handleCompleteOrder(order)}
                        className="btn btn-success flex items-center space-x-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Complete</span>
                      </button>
                      <button 
                        onClick={() => handleCancelOrder(order)}
                        className="btn btn-danger flex items-center space-x-2"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Cancel</span>
                      </button>
                    </>
                  )}
                  {order.order_status === 'completed' && (
                    <button 
                      onClick={() => handleRefundOrder(order)}
                      className="btn btn-warning flex items-center space-x-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Refund</span>
                    </button>
                  )}
                  {canDeleteOrders && (
                    <button 
                      onClick={() => handleDeleteOrderHistory(order)}
                      className="btn bg-red-600 hover:bg-red-700 text-white flex items-center space-x-2"
                      title="Permanently delete order (Admin only)"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {orders.length === 0 && (
          <div className="card">
            <div className="card-body text-center py-12">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No orders found for the selected filters</p>
            </div>
          </div>
        )}
      </div>


    </div>
  );
}
