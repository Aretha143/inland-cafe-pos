import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Users, MapPin, Clock, Filter, Receipt, X, AlertTriangle, CreditCard, Percent, DollarSign, RotateCcw, Printer, Download, FileText } from 'lucide-react';
import { Table } from '../types';
import TableModal from '../components/TableModal';
import { useAuthStore } from '../store/authStore';
import { printOrderReceipt, downloadOrderReceipt } from '../utils/printer';
import api from '../utils/api';

export default function TablesPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [tables, setTables] = useState<Table[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showTableModal, setShowTableModal] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [selectedTableOrders, setSelectedTableOrders] = useState<any[]>([]);
  const [showOrdersModal, setShowOrdersModal] = useState(false);
  const [selectedTableForOrders, setSelectedTableForOrders] = useState<Table | null>(null);
  const [discountModalTable, setDiscountModalTable] = useState<Table | null>(null);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerForm, setCustomerForm] = useState({
    name: '',
    phone: '',
    isNewCustomer: true
  });
  const [pendingMoveToUnpaid, setPendingMoveToUnpaid] = useState<{
    table: Table;
    orders: any[];
  } | null>(null);
  const [showTotalSection, setShowTotalSection] = useState(false);
  const [tableTotals, setTableTotals] = useState<Record<number, any[]>>({});

  // Check if user has admin/manager permissions


  useEffect(() => {
    loadTables();
  }, [statusFilter, locationFilter]);

  const loadTables = async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (locationFilter !== 'all') params.location = locationFilter;
      
      const response = await api.getTables(params);
      console.log('Tables API Response:', response);
      
      if (response.data && response.data.data) {
        setTables(response.data.data);
        console.log('Tables loaded:', response.data.data.length);
      } else {
        console.log('No data in response:', response);
        setTables([]);
      }
    } catch (error) {
      console.error('Failed to load tables:', error);
      setTables([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTableTotals = async () => {
    try {
      const totals: Record<number, any[]> = {};
      
      for (const table of tables) {
        const response = await api.getTableTotals(table.id);
        if (response.data) {
          totals[table.id] = response.data;
        }
      }
      
      setTableTotals(totals);
    } catch (error) {
      console.error('Failed to load table totals:', error);
    }
  };

  const handleAddTable = () => {
    setEditingTable(null);
    setShowTableModal(true);
  };

  const handleEditTable = (table: Table) => {
    setEditingTable(table);
    setShowTableModal(true);
  };

  const handleDeleteTable = async (table: Table) => {
    if (window.confirm(`Are you sure you want to delete table "${table.table_number}"?`)) {
      try {
        const response = await api.deleteTable(table.id);
        if (response.error) {
          alert(response.error);
        } else {
          loadTables(); // Refresh the list
        }
      } catch (error) {
        alert('Failed to delete table');
      }
    }
  };

  const handleTableSaved = () => {
    loadTables(); // Refresh the list
    setShowTableModal(false);
    setEditingTable(null);
  };

  const handleStatusChange = async (table: Table, newStatus: string) => {
    try {
      await api.updateTableStatus(table.id, { status: newStatus });
      loadTables(); // Refresh the list
    } catch (error) {
      alert('Failed to update table status');
    }
  };

  const handleViewOrders = async (table: Table) => {
    try {
      setSelectedTableForOrders(table);
      const response = await api.getOrdersByTable(table.id);
      setSelectedTableOrders(response.data || []);
      setShowOrdersModal(true);
      setShowTotalSection(false);
    } catch (error) {
      console.error('Failed to load table orders:', error);
      setSelectedTableOrders([]);
      setShowOrdersModal(true);
    }
  };

  const handleViewTotals = async (table: Table) => {
    try {
      setSelectedTableForOrders(table);
      const response = await api.getTableTotals(table.id);
      setSelectedTableOrders(response.data || []);
      setShowOrdersModal(true);
      setShowTotalSection(true);
    } catch (error) {
      console.error('Failed to load table totals:', error);
      alert('Failed to load table totals');
    }
  };

  const handleResetTable = async (table: Table) => {
    const confirmMessage = `Clear Table ${table.table_number}?

This action will:
• Make the table available for new customers
• Clear the table (remove current orders from table view)
• Keep ALL data and history in the database
• Preserve sales reports and analytics
• Maintain complete order history

This is the SAFE option - no data is deleted, only the table is cleared for new customers.

Confirm clear table?`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      const response = await api.resetTable(table.id);
      if (response.error) {
        alert('Failed to reset table: ' + response.error);
      } else {
        alert(response.data.message || `Table ${table.table_number} has been cleared successfully! All data is preserved.`);
        // Refresh tables list and close orders modal if open
        loadTables();
        if (showOrdersModal && selectedTableForOrders?.id === table.id) {
          setShowOrdersModal(false);
        }
      }
    } catch (error) {
      alert('Failed to reset table');
    }
  };



  const handlePrintReceipt = (order: any) => {
    try {
      printOrderReceipt(order);
    } catch (error) {
      alert('Failed to print receipt');
    }
  };

  const handleDownloadReceipt = (order: any) => {
    try {
      downloadOrderReceipt(order);
    } catch (error) {
      alert('Failed to download receipt');
    }
  };

  const handleMoveToUnpaid = async (table: Table) => {
    try {
      // Get all orders for this table
      const ordersResponse = await api.getOrdersByTable(table.id);
      const orders = ordersResponse.data || [];
      
      const unpaidOrders = orders.filter((order: any) => 
        order.payment_status !== 'completed' && order.order_status !== 'cancelled'
      );

      const completedOrders = orders.filter((order: any) => 
        order.payment_status === 'completed'
      );

      if (unpaidOrders.length === 0 && completedOrders.length === 0) {
        alert(`No orders found for Table ${table.table_number}`);
        return;
      }

      // Store the pending move operation
      setPendingMoveToUnpaid({
        table,
        orders: unpaidOrders.length > 0 ? unpaidOrders : completedOrders
      });

      // Reset customer form
      setCustomerForm({
        name: '',
        phone: '',
        isNewCustomer: true
      });

      // Show customer modal
      setShowCustomerModal(true);

    } catch (error) {
      console.error('Failed to move table to unpaid:', error);
      alert('Failed to move table orders to unpaid tracking');
    }
  };

  const handleConfirmMoveToUnpaid = async () => {
    if (!pendingMoveToUnpaid) return;

    const { table, orders } = pendingMoveToUnpaid;

    if (!customerForm.name.trim()) {
      alert('Please enter a customer name');
      return;
    }

    try {
      let addedCount = 0;
      for (const order of orders) {
        try {
          await api.addToUnpaidTable({
            order_id: order.id,
            customer_name: customerForm.name.trim(),
            customer_phone: customerForm.phone.trim() || '',
            table_number: table.table_number,
            notes: `Moved from Table ${table.table_number} - ${new Date().toLocaleString()}`
          });
          addedCount++;
        } catch (error: any) {
          console.error(`Failed to add order ${order.id} to unpaid table:`, error);
        }
      }

      if (addedCount > 0) {
        alert(`Successfully moved ${addedCount} orders from Table ${table.table_number} to unpaid orders tracking under customer "${customerForm.name}"!`);
        
        // Reset state
        setShowCustomerModal(false);
        setPendingMoveToUnpaid(null);
        setCustomerForm({ name: '', phone: '', isNewCustomer: true });
        
        // Optionally navigate to unpaid orders page
        if (window.confirm('Would you like to view the unpaid orders page?')) {
          navigate('/unpaid-orders');
        }
      } else {
        alert('No orders were successfully moved to unpaid table');
      }
    } catch (error) {
      console.error('Failed to move table to unpaid:', error);
      alert('Failed to move table orders to unpaid tracking');
    }
  };

  const handlePayBill = (table: Table) => {
    setDiscountModalTable(table);
    setDiscountType('percentage');
    setDiscountValue(0);
  };

  const handleConfirmPayBill = async () => {
    if (!discountModalTable) return;
    
    try {
      const discountData = discountValue > 0 ? {
        discountType,
        discountValue
      } : undefined;

      // Create combined order for the table
      const response = await api.createTableCombinedOrder(discountModalTable.id, discountData);
      if (response.error) {
        alert('Failed to create combined order: ' + response.error);
        return;
      }

      // Close modal and redirect to payment page
      setDiscountModalTable(null);
      navigate(`/payment/${response.data.combined_order_id}`);
    } catch (error) {
      console.error('Error creating combined order:', error);
      alert('Failed to create combined order for payment');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'occupied':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'reserved':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'maintenance':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getLocationIcon = (location: string) => {
    switch (location) {
      case 'outdoor':
        return '🌳';
      case 'private':
        return '🚪';
      case 'bar':
        return '🍺';
      case 'terrace':
        return '🏞️';
      default:
        return '🏠';
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-40 bg-gray-200 rounded"></div>
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
          <h1 className="text-2xl font-bold text-gray-900">Tables Management</h1>
          <p className="text-gray-600">Manage restaurant tables and seating</p>
        </div>
        <button 
          onClick={handleAddTable}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Table</span>
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="card-body">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filters:</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600">Status:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input text-sm w-32"
              >
                <option value="all">All</option>
                <option value="available">Available</option>
                <option value="occupied">Occupied</option>
                <option value="reserved">Reserved</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600">Location:</label>
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="input text-sm w-32"
              >
                <option value="all">All</option>
                <option value="indoor">Indoor</option>
                <option value="outdoor">Outdoor</option>
                <option value="private">Private</option>
                <option value="bar">Bar</option>
                <option value="terrace">Terrace</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Tables Grid */}
      {tables.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg mb-4">No tables found</div>
          <div className="text-gray-600">
            {statusFilter !== 'all' || locationFilter !== 'all' 
              ? 'Try adjusting your filters or add a new table.' 
              : 'Start by adding your first table.'}
          </div>
          <button 
            onClick={handleAddTable}
            className="mt-4 btn btn-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add First Table
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {tables.map((table) => (
          <div key={table.id} className="card hover:shadow-md transition-shadow">
            <div className="card-body">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{getLocationIcon(table.location || 'indoor')}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Table {table.table_number}
                    </h3>
                    {table.table_name && (
                      <p className="text-sm text-gray-500">{table.table_name}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleViewOrders(table)}
                    className="text-blue-600 hover:text-blue-700 p-1"
                    title="View Active Orders"
                  >
                    <Receipt className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleViewTotals(table)}
                    className="text-purple-600 hover:text-purple-700 p-1"
                    title="View Total (Completed & Transferred)"
                  >
                    <DollarSign className="w-4 h-4" />
                  </button>
                  {table.status === 'occupied' && (
                    <>
                      <button
                        onClick={() => handlePayBill(table)}
                        className="text-green-600 hover:text-green-700 p-1"
                        title="Pay Bill"
                      >
                        <CreditCard className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleMoveToUnpaid(table)}
                        className="text-orange-600 hover:text-orange-700 p-1"
                        title="Move to Unpaid Orders"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleResetTable(table)}
                    className="text-green-600 hover:text-green-700 p-1"
                    title="Clear Table (Keep All Data)"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleEditTable(table)}
                    className="text-indigo-600 hover:text-indigo-700 p-1"
                    title="Edit Table"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteTable(table)}
                    className="text-red-600 hover:text-red-700 p-1"
                    title="Delete Table"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="w-4 h-4 mr-1" />
                    <span>Capacity: {table.capacity}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span className="capitalize">{table.location || 'Indoor'}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(table.status)}`}>
                    {table.status.charAt(0).toUpperCase() + table.status.slice(1)}
                  </span>
                  
                  {table.status === 'available' && (
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleStatusChange(table, 'occupied')}
                        className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                      >
                        Occupy
                      </button>
                      <button
                        onClick={() => handleStatusChange(table, 'reserved')}
                        className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
                      >
                        Reserve
                      </button>
                    </div>
                  )}
                  
                  {table.status === 'occupied' && (
                    <button
                      onClick={() => handleStatusChange(table, 'available')}
                      className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                    >
                      Free
                    </button>
                  )}
                  
                  {table.status === 'reserved' && (
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleStatusChange(table, 'occupied')}
                        className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                      >
                        Occupy
                      </button>
                      <button
                        onClick={() => handleStatusChange(table, 'available')}
                        className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                {(table as any).order_number && (
                  <div className="pt-2 border-t border-gray-200">
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="w-4 h-4 mr-1" />
                      <span>Order: {(table as any).order_number}</span>
                    </div>
                    {(table as any).customer_name && (
                      <p className="text-sm text-gray-600 ml-5">
                        Customer: {(table as any).customer_name}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        </div>
      )}

      {/* Table Modal */}
      <TableModal
        isOpen={showTableModal}
        onClose={() => {
          setShowTableModal(false);
          setEditingTable(null);
        }}
        onSave={handleTableSaved}
        table={editingTable}
      />

      {/* Table Orders Modal */}
      {showOrdersModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {showTotalSection ? 'Total' : 'Active Orders'} for Table {selectedTableForOrders?.table_number}
                {selectedTableForOrders?.table_name && ` - ${selectedTableForOrders.table_name}`}
              </h2>
              <div className="flex items-center space-x-2">
                {selectedTableOrders.length > 0 && !showTotalSection && (
                  <>
                    <button
                      onClick={() => selectedTableForOrders && handlePayBill(selectedTableForOrders)}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm flex items-center space-x-1"
                      title="Pay bill for this table"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Pay Bill</span>
                    </button>
                    <button
                      onClick={() => selectedTableForOrders && handleMoveToUnpaid(selectedTableForOrders)}
                      className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded text-sm flex items-center space-x-1"
                      title="Move table orders to unpaid tracking"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Move to Unpaid</span>
                    </button>
                  </>
                )}
                {selectedTableOrders.length > 0 && (
                  <>
                    <button
                      onClick={() => {
                        // Print all orders for this table
                        selectedTableOrders.forEach(order => handlePrintReceipt(order));
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm flex items-center space-x-1"
                      title="Print all receipts"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Print All</span>
                    </button>
                    <button
                      onClick={() => {
                        // Download all orders for this table
                        selectedTableOrders.forEach(order => handleDownloadReceipt(order));
                      }}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm flex items-center space-x-1"
                      title="Download all receipts"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download All</span>
                    </button>
                  </>
                )}
                <button
                  onClick={() => selectedTableForOrders && handleResetTable(selectedTableForOrders)}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm flex items-center space-x-1"
                  title="Clear table (keeps all data)"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Clear Table</span>
                </button>

                <button
                  onClick={() => setShowOrdersModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {selectedTableOrders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No orders found for this table
              </div>
            ) : (
              <>
                {/* Order Summary */}
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">
                      Total Orders: <span className="font-semibold">{selectedTableOrders.length}</span>
                    </span>
                    {!showTotalSection ? (
                      <>
                        <span className="text-gray-600">
                          Unpaid: <span className="font-semibold text-orange-600">
                            {selectedTableOrders.filter((o: any) => o.payment_status !== 'completed' && o.order_status !== 'cancelled').length}
                          </span>
                        </span>
                        <span className="text-gray-600">
                          Completed: <span className="font-semibold text-green-600">
                            {selectedTableOrders.filter((o: any) => o.payment_status === 'completed').length}
                          </span>
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-gray-600">
                          Completed: <span className="font-semibold text-green-600">
                            {selectedTableOrders.filter((o: any) => o.order_type === 'completed').length}
                          </span>
                        </span>
                        <span className="text-gray-600">
                          Transferred: <span className="font-semibold text-purple-600">
                            {selectedTableOrders.filter((o: any) => o.order_type === 'transferred').length}
                          </span>
                        </span>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="space-y-4">
                  {selectedTableOrders.map((order: any) => (
                  <div key={order.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          Order #{order.order_number}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {order.customer_name || 'Walk-in Customer'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(order.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-lg">Rs. {order.final_amount}</p>
                        <div className="space-x-2 mb-2">
                          {!showTotalSection ? (
                            <>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                order.order_status === 'completed' 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : order.order_status === 'cancelled'
                                  ? 'bg-red-100 text-red-800'
                                  : order.order_status === 'refunded'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-orange-100 text-orange-800'
                              }`}>
                                {order.order_status}
                              </span>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                order.payment_status === 'completed' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {order.payment_status}
                              </span>
                              {order.payment_status !== 'completed' && order.order_status !== 'cancelled' && (
                                <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-800 border border-orange-300">
                                  Can Move to Unpaid
                                </span>
                              )}
                              {order.payment_status === 'completed' && (
                                <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600 border border-gray-300">
                                  Completed (Can Still Move)
                                </span>
                              )}
                            </>
                          ) : (
                            <>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                order.order_type === 'completed'
                                  ? 'bg-green-100 text-green-800'
                                  : order.order_type === 'transferred'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                {order.order_type === 'completed' ? 'Completed' : order.order_type === 'transferred' ? 'Transferred to Unpaid' : 'Other'}
                              </span>
                              <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                                Historical
                              </span>
                            </>
                          )}
                        </div>
                        <div className="flex space-x-2 justify-end">
                          <button
                            onClick={() => handlePrintReceipt(order)}
                            className="text-blue-600 hover:text-blue-800 p-1"
                            title="Print Receipt"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDownloadReceipt(order)}
                            className="text-green-600 hover:text-green-800 p-1"
                            title="Download Receipt"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {order.items && order.items.length > 0 && (
                      <div className="mt-3">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Items:</h4>
                        <div className="space-y-1">
                          {order.items.map((item: any, index: number) => (
                            <div key={index} className="flex justify-between text-sm">
                              <span>{item.quantity}x {item.product_name || item.name}</span>
                              <span>Rs. {((item.unit_price || item.price || 0) * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Discount Modal */}
      {discountModalTable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                Apply Discount - Table {discountModalTable.table_number}
              </h2>
              <button
                onClick={() => setDiscountModalTable(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount Type
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="discountType"
                      value="percentage"
                      checked={discountType === 'percentage'}
                      onChange={(e) => setDiscountType(e.target.value as 'percentage')}
                      className="mr-2"
                    />
                    <Percent className="w-4 h-4 mr-1" />
                    Percentage
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="discountType"
                      value="fixed"
                      checked={discountType === 'fixed'}
                      onChange={(e) => setDiscountType(e.target.value as 'fixed')}
                      className="mr-2"
                    />
                    <DollarSign className="w-4 h-4 mr-1" />
                    Fixed Amount
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount Value {discountType === 'percentage' ? '(%)' : '(Rs.)'}
                </label>
                <input
                  type="number"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(Number(e.target.value))}
                  min="0"
                  max={discountType === 'percentage' ? '100' : undefined}
                  step={discountType === 'percentage' ? '1' : '0.01'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder={discountType === 'percentage' ? 'Enter percentage (0-100)' : 'Enter amount'}
                />
              </div>

              {discountValue > 0 && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Discount Preview:</strong> {discountType === 'percentage' ? `${discountValue}%` : `Rs. ${discountValue}`} will be applied to the total bill
                  </p>
                </div>
              )}
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setDiscountModalTable(null)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPayBill}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
              >
                <CreditCard className="w-4 h-4" />
                <span>Continue to Payment</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Modal for Move to Unpaid */}
      {showCustomerModal && pendingMoveToUnpaid && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                Move to Unpaid - Table {pendingMoveToUnpaid.table.table_number}
              </h2>
              <button
                onClick={() => {
                  setShowCustomerModal(false);
                  setPendingMoveToUnpaid(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Orders to move:</strong> {pendingMoveToUnpaid.orders.length} order(s) from Table {pendingMoveToUnpaid.table.table_number}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Information
                </label>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Customer Name *</label>
                    <input
                      type="text"
                      value={customerForm.name}
                      onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter customer name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={customerForm.phone}
                      onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter phone number (optional)"
                    />
                  </div>
                </div>
              </div>

              <div className="p-3 bg-yellow-50 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> All orders will be grouped under this customer name in the unpaid orders tracking.
                </p>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCustomerModal(false);
                  setPendingMoveToUnpaid(null);
                }}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmMoveToUnpaid}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center space-x-2"
              >
                <FileText className="w-4 h-4" />
                <span>Move to Unpaid</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
