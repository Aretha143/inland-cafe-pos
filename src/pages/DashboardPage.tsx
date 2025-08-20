import { useState, useEffect } from 'react';
import {
  DollarSign,
  ShoppingBag,
  Users,
  AlertTriangle,
  TrendingUp,
  Clock,
  Package
} from 'lucide-react';
import api from '../utils/api';

interface TodayStats {
  total_orders: number;
  total_sales: number;
  unique_customers: number;
  payment_methods: {
    payment_method: string;
    count: number;
    total: number;
  }[];
  top_products: {
    name: string;
    quantity_sold: number;
    revenue: number;
  }[];
}

interface LowStockProduct {
  id: number;
  name: string;
  stock_quantity: number;
  min_stock_level: number;
  category_name: string;
}

export default function DashboardPage() {
  const [todayStats, setTodayStats] = useState<TodayStats | null>(null);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, lowStockRes, ordersRes] = await Promise.all([
        api.getTodayStats(),
        api.getLowStockProducts(),
        api.getOrders({ limit: 5 })
      ]);

      if (statsRes.data) setTodayStats(statsRes.data);
      if (lowStockRes.data) setLowStockProducts(lowStockRes.data);
      if (ordersRes.data) setRecentOrders(ordersRes.data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome to Inland Cafe POS System</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Sales</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${todayStats?.total_sales.toFixed(2) || '0.00'}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Orders Today</p>
                <p className="text-2xl font-bold text-gray-900">
                  {todayStats?.total_orders || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Customers Today</p>
                <p className="text-2xl font-bold text-gray-900">
                  {todayStats?.unique_customers || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
                <p className="text-2xl font-bold text-gray-900">
                  {lowStockProducts.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products Today */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-gray-500" />
              <h3 className="text-lg font-semibold text-gray-900">Top Products Today</h3>
            </div>
          </div>
          <div className="card-body">
            {todayStats?.top_products && todayStats.top_products.length > 0 ? (
              <div className="space-y-4">
                {todayStats.top_products.slice(0, 5).map((product, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-500">
                        {product.quantity_sold} sold
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        ${product.revenue.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No sales today yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-gray-500" />
              <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
            </div>
          </div>
          <div className="card-body">
            {recentOrders.length > 0 ? (
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">
                        #{order.order_number}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleTimeString()}
                      </p>
                      {order.table_number && (
                        <p className="text-xs text-gray-500">
                          Table {order.table_number}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        ${order.final_amount.toFixed(2)}
                      </p>
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                        order.order_status === 'completed' 
                          ? 'bg-green-100 text-green-800'
                          : order.order_status === 'active'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {order.order_status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No recent orders</p>
              </div>
            )}
          </div>
        </div>

        {/* Payment Methods Breakdown */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Payment Methods Today</h3>
          </div>
          <div className="card-body">
            {todayStats?.payment_methods && todayStats.payment_methods.length > 0 ? (
              <div className="space-y-3">
                {todayStats.payment_methods.map((method) => (
                  <div key={method.payment_method} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-cafe-500 rounded-full"></div>
                      <span className="font-medium text-gray-900 capitalize">
                        {method.payment_method}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        ${method.total.toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {method.count} orders
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No payments today yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h3 className="text-lg font-semibold text-gray-900">Low Stock Alert</h3>
            </div>
          </div>
          <div className="card-body">
            {lowStockProducts.length > 0 ? (
              <div className="space-y-3">
                {lowStockProducts.slice(0, 5).map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-500">{product.category_name}</p>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                        {product.stock_quantity} left
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        Min: {product.min_stock_level}
                      </p>
                    </div>
                  </div>
                ))}
                {lowStockProducts.length > 5 && (
                  <p className="text-sm text-gray-500 text-center">
                    +{lowStockProducts.length - 5} more items
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-green-300 mx-auto mb-3" />
                <p className="text-green-600">All products are well stocked!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
