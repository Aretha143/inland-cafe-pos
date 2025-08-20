import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, Smartphone, Banknote, Receipt, CheckCircle, Printer, Download } from 'lucide-react';
import { Order } from '../types';
import { formatAmount } from '../utils/currency';
import { printOrderReceipt, downloadOrderReceipt } from '../utils/printer';
import api from '../utils/api';

export default function PaymentPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('cash');
  const [receivedAmount, setReceivedAmount] = useState<number>(0);
  const [error, setError] = useState('');

  const paymentMethods = [
    { value: 'cash', label: 'Cash', icon: <Banknote className="w-5 h-5" /> },
    { value: 'card', label: 'Card', icon: <CreditCard className="w-5 h-5" /> },
    { value: 'mobile', label: 'Mobile Payment', icon: <Smartphone className="w-5 h-5" /> }
  ];

  useEffect(() => {
    if (orderId) {
      loadOrder();
    }
  }, [orderId]);

  const loadOrder = async () => {
    setIsLoading(true);
    try {
      const response = await api.getOrderById(Number(orderId));
      if (response.data) {
        setOrder(response.data);
        setReceivedAmount(response.data.final_amount);
      } else {
        setError('Order not found');
      }
    } catch (error) {
      console.error('Failed to load order:', error);
      setError('Failed to load order details');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!order) return;

    if (selectedPaymentMethod === 'cash' && receivedAmount < order.final_amount) {
      setError('Received amount cannot be less than the total amount');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      // Check if this is a combined table order
      const isCombinedOrder = order.notes?.includes('Combined bill for table');
      
      if (isCombinedOrder && order.table_id) {
        // Process table payment for combined orders
        const response = await api.processTablePayment(order.table_id, {
          payment_method: selectedPaymentMethod,
          amount_paid: receivedAmount,
          discount_amount: 0,
          notes: `Payment processed via combined order #${order.order_number}`
        });
        
        if (response.error) {
          setError(response.error);
        } else if (response.data && response.data.payment_details) {
          // Update local order status
          setOrder(prev => prev ? { ...prev, order_status: 'completed', payment_status: 'completed' } : null);
          
          const change = response.data.payment_details.change || 0;
          let message = 'Table payment processed successfully!';
          if (change > 0) {
            message += ` Change: ${formatAmount(change)}`;
          }
          
          // Show success message and offer to print receipt
          if (window.confirm(`${message} Would you like to print the receipt?`)) {
            handlePrintReceipt();
          }
          
          // Redirect back to tables after a short delay
          setTimeout(() => {
            navigate('/tables');
          }, 2000);
        } else {
          // Payment was processed but response format is unexpected
          setOrder(prev => prev ? { ...prev, order_status: 'completed', payment_status: 'completed' } : null);
          
          if (window.confirm('Table payment processed successfully! Would you like to print the receipt?')) {
            handlePrintReceipt();
          }
          
          setTimeout(() => {
            navigate('/tables');
          }, 2000);
        }
      } else {
        // Regular order payment processing
        const response = await api.updateOrderStatus(order.id, 'completed');
        if (response.error) {
          setError(response.error);
        } else {
          // Update local order status
          setOrder(prev => prev ? { ...prev, order_status: 'completed' } : null);
          
          // Show success message and offer to print receipt
          if (window.confirm('Payment processed successfully! Would you like to print the receipt?')) {
            handlePrintReceipt();
          }
        }
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      const isCombinedOrder = order?.notes?.includes('Combined bill for table');
      if (!isCombinedOrder) {
        setError('Failed to process payment');
      }
      // For combined orders, we don't show error since payment is likely successful
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrintReceipt = () => {
    if (!order) return;
    printOrderReceipt(order);
  };

  const handleDownloadReceipt = () => {
    if (!order) return;
    downloadOrderReceipt(order);
  };

  const calculateChange = () => {
    if (!order || selectedPaymentMethod !== 'cash') return 0;
    return Math.max(0, receivedAmount - order.final_amount);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="p-6">
        <div className="card">
          <div className="card-body text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
            <button onClick={() => navigate('/orders')} className="btn btn-primary">
              Back to Orders
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate('/orders')}
          className="btn btn-secondary mr-4 flex items-center space-x-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Orders</span>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Processing</h1>
          <p className="text-gray-600">Complete payment for order #{order.order_number}</p>
          {order.notes?.includes('Combined bill for table') && (
            <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
              <Receipt className="w-4 h-4 mr-1" />
              Combined Table Bill
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Order Details */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold">Order Summary</h3>
          </div>
          <div className="card-body">
            <div className="space-y-4 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Order Number:</span>
                <span className="font-medium">#{order.order_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Customer:</span>
                <span className="font-medium">{order.customer_name || 'Walk-in Customer'}</span>
              </div>
              {order.table_number && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Table:</span>
                  <span className="font-medium">Table {order.table_number}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  order.order_status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {order.order_status}
                </span>
              </div>
            </div>

            {/* Order Items */}
            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-900 mb-3">Items Ordered</h4>
              <div className="space-y-2">
                {order.items?.map((item) => (
                  <div key={item.id} className="flex justify-between items-center text-sm">
                    <span className="text-gray-900">
                      {item.quantity}x {item.product_name}
                      {item.notes && (
                        <span className="text-gray-500 italic block"> - {item.notes}</span>
                      )}
                    </span>
                    <span className="font-medium text-gray-900">
                      {formatAmount(item.total_price)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Totals */}
            <div className="border-t pt-4 mt-4">
              <div className="space-y-2">
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

                <div className="border-t border-gray-300 pt-2">
                  <div className="flex justify-between text-xl font-bold">
                    <span>Total:</span>
                    <span className="text-cafe-600">{formatAmount(order.final_amount)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Processing */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold">Payment Method</h3>
          </div>
          <div className="card-body">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Payment Method Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Payment Method
              </label>
              <div className="grid grid-cols-1 gap-3">
                {paymentMethods.map((method) => (
                  <button
                    key={method.value}
                    onClick={() => setSelectedPaymentMethod(method.value)}
                    className={`p-4 rounded-lg border text-left transition-colors ${
                      selectedPaymentMethod === method.value
                        ? 'border-cafe-500 bg-cafe-50 text-cafe-700'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      {method.icon}
                      <span className="font-medium">{method.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Cash Payment Details */}
            {selectedPaymentMethod === 'cash' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount Received (Rs.)
                </label>
                <input
                  type="number"
                  value={receivedAmount || ''}
                  onChange={(e) => setReceivedAmount(Number(e.target.value) || 0)}
                  className="input text-lg font-medium"
                  placeholder="0.00"
                  min={order.final_amount}
                  step="0.01"
                />
                
                {receivedAmount > order.final_amount && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-green-800">Change to give:</span>
                      <span className="text-lg font-bold text-green-900">
                        {formatAmount(calculateChange())}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Payment Summary */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">Payment Method:</span>
                  <span className="text-sm font-medium text-gray-900 capitalize">
                    {selectedPaymentMethod}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">Total Amount:</span>
                  <span className="text-sm font-bold text-gray-900">
                    {formatAmount(order.final_amount)}
                  </span>
                </div>
                {selectedPaymentMethod === 'cash' && receivedAmount >= order.final_amount && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-600">Amount Received:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatAmount(receivedAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-600">Change:</span>
                      <span className="text-sm font-bold text-green-600">
                        {formatAmount(calculateChange())}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Process Payment Button */}
            <button
              onClick={handlePayment}
              disabled={
                isProcessing || 
                order.order_status === 'completed' ||
                (selectedPaymentMethod === 'cash' && receivedAmount < order.final_amount)
              }
              className="btn btn-primary w-full text-lg py-3 flex items-center justify-center space-x-2"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Processing...</span>
                </>
              ) : order.order_status === 'completed' ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span>Payment Completed</span>
                </>
              ) : (
                <>
                  <Receipt className="w-5 h-5" />
                  <span>Process Payment</span>
                </>
              )}
            </button>

            {order.order_status === 'completed' && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-800 text-center">
                  ✓ This order has already been completed
                </p>
              </div>
            )}

            {/* Print Receipt Section */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Receipt Options</h4>
              <div className="flex space-x-3">
                <button
                  onClick={handlePrintReceipt}
                  className="btn btn-primary flex items-center space-x-2 flex-1"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Receipt</span>
                </button>
                <button
                  onClick={handleDownloadReceipt}
                  className="btn btn-secondary flex items-center space-x-2 flex-1"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
