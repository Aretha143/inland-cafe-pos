import React, { useState, useEffect, useRef } from 'react';
import { Bell, Clock, CheckCircle, AlertCircle, ChefHat } from 'lucide-react';
import { api } from '../utils/api';
import { formatAmount } from '../utils/currency';

interface OrderItem {
  id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  notes: string | null;
}

interface Order {
  id: number;
  order_number: string;
  table_number: string | null;
  order_type: string;
  total_amount: number;
  final_amount: number;
  order_status: string;
  payment_status: string;
  notes: string | null;
  created_at: string;
  items: OrderItem[];
  customer_name?: string;
  customer_phone?: string;
}

const KitchenPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastOrderCount, setLastOrderCount] = useState(0);
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Create beep sound using Web Audio API
  useEffect(() => {
    const createBeepSound = () => {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    };
    
    // Store the beep function for later use
    audioRef.current = { play: createBeepSound } as any;
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await api.getOrders({ 
        status: 'active',
        limit: 50
      });
      
      if (response.data) {
        const activeOrders = response.data.filter((order: Order) => 
          order.order_status === 'active' && order.payment_status === 'pending'
        );
        
        setOrders(activeOrders);
        
        // Check for new orders and play sound
        if (lastOrderCount > 0 && activeOrders.length > lastOrderCount) {
          const newOrders = activeOrders.length - lastOrderCount;
          setNewOrdersCount(newOrders);
          
          if (soundEnabled) {
            playNotificationSound();
          }
          
          // Clear new orders count after 5 seconds
          setTimeout(() => setNewOrdersCount(0), 5000);
        }
        
        setLastOrderCount(activeOrders.length);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      setError('Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  };

  const playNotificationSound = () => {
    if (audioRef.current && audioRef.current.play) {
      try {
        audioRef.current.play();
      } catch (error) {
        console.log('Audio play failed:', error);
      }
    }
  };

  const markOrderAsCompleted = async (orderId: number) => {
    try {
      await api.updateOrderStatus(orderId, 'completed');
      await fetchOrders(); // Refresh orders
    } catch (error) {
      console.error('Failed to mark order as completed:', error);
      setError('Failed to update order status');
    }
  };

  const getOrderAge = (createdAt: string) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMins % 60}m`;
    }
    return `${diffMins}m`;
  };

  const getOrderPriority = (order: Order) => {
    const age = new Date().getTime() - new Date(order.created_at).getTime();
    const minutes = Math.floor(age / 60000);
    
    if (minutes > 30) return 'urgent';
    if (minutes > 15) return 'high';
    return 'normal';
  };

  // Auto-refresh every 10 seconds
  useEffect(() => {
    fetchOrders();
    
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [soundEnabled]); // Removed lastOrderCount to prevent infinite loops

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ChefHat className="w-12 h-12 text-cafe-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading kitchen orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <ChefHat className="w-8 h-8 text-cafe-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Kitchen Display</h1>
                <p className="text-sm text-gray-500">Real-time order management</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={fetchOrders}
                className="px-3 py-1 bg-cafe-600 text-white rounded-md text-sm font-medium hover:bg-cafe-700 transition-colors"
              >
                Refresh
              </button>
              
              <div className="flex items-center space-x-2">
                <Bell className={`w-5 h-5 ${soundEnabled ? 'text-cafe-600' : 'text-gray-400'}`} />
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`px-3 py-1 rounded-md text-sm font-medium ${
                    soundEnabled 
                      ? 'bg-cafe-100 text-cafe-700' 
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {soundEnabled ? 'Sound ON' : 'Sound OFF'}
                </button>
              </div>
              
              <div className="text-right">
                <div className="text-2xl font-bold text-cafe-600">{orders.length}</div>
                <div className="text-xs text-gray-500">Active Orders</div>
                {newOrdersCount > 0 && (
                  <div className="text-xs text-green-600 font-medium animate-pulse">
                    +{newOrdersCount} new
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Orders Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <ChefHat className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Orders</h3>
            <p className="text-gray-500">New orders will appear here automatically</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orders.map((order) => {
              const priority = getOrderPriority(order);
              const isUrgent = priority === 'urgent';
              
              return (
                <div
                  key={order.id}
                  className={`bg-white rounded-lg shadow-md border-l-4 ${
                    isUrgent 
                      ? 'border-red-500 animate-pulse' 
                      : priority === 'high' 
                        ? 'border-orange-500' 
                        : 'border-cafe-500'
                  }`}
                >
                  {/* Order Header */}
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">
                          #{order.order_number}
                        </h3>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <Clock className="w-4 h-4" />
                          <span>{getOrderAge(order.created_at)} ago</span>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          isUrgent 
                            ? 'bg-red-100 text-red-800' 
                            : priority === 'high' 
                              ? 'bg-orange-100 text-orange-800' 
                              : 'bg-cafe-100 text-cafe-800'
                        }`}>
                          {priority.toUpperCase()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">Table:</span>
                        <span className="bg-gray-100 px-2 py-1 rounded">
                          {order.table_number || 'Takeaway'}
                        </span>
                      </div>
                      
                      <div className="text-right">
                        <div className="font-bold text-lg text-cafe-600">
                          {formatAmount(order.final_amount)}
                        </div>
                      </div>
                    </div>
                    
                    {order.customer_name && (
                      <div className="mt-2 text-sm text-gray-600">
                        <span className="font-medium">Customer:</span> {order.customer_name}
                      </div>
                    )}
                  </div>

                  {/* Order Items */}
                  <div className="p-4">
                    <div className="space-y-3">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="bg-cafe-100 text-cafe-800 px-2 py-1 rounded text-sm font-medium">
                                {item.quantity}x
                              </span>
                              <span className="font-medium text-gray-900">
                                {item.product_name}
                              </span>
                            </div>
                            {item.notes && (
                              <div className="mt-1 text-sm text-gray-600 italic">
                                Note: {item.notes}
                              </div>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatAmount(item.total_price)}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {order.notes && (
                      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                        <div className="text-sm text-yellow-800">
                          <span className="font-medium">Order Note:</span> {order.notes}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Order Actions */}
                  <div className="p-4 border-t border-gray-200">
                    <button
                      onClick={() => markOrderAsCompleted(order.id)}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md flex items-center justify-center space-x-2 transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Mark as Completed</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default KitchenPage;
