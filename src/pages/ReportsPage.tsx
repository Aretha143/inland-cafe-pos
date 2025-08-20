import { useState, useEffect } from 'react';
import { Calendar, TrendingUp, DollarSign, ShoppingBag, BarChart3, Download, Trash2, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import api from '../utils/api';

interface DateRange {
  start: string;
  end: string;
}

interface SalesData {
  date: string;
  sales: number;
  orders: number;
}

export default function ReportsPage() {
  const { user } = useAuthStore();
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [todayStats, setTodayStats] = useState<any>(null);
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Check if user is admin
  const canDeleteReports = user?.role === 'admin';

  useEffect(() => {
    loadReportsData();
  }, [dateRange]);

  const loadReportsData = async () => {
    setIsLoading(true);
    try {
      console.log('Loading reports data...');
      
      // Load today's stats
      const statsResponse = await api.getTodayStats();
      console.log('Stats response:', statsResponse);
      if (statsResponse.data) {
        setTodayStats(statsResponse.data);
      }

      // Load real analytics data
      const analyticsResponse = await api.getSalesAnalytics(dateRange.start, dateRange.end);
      console.log('Analytics response:', analyticsResponse);
      console.log('Analytics response data:', analyticsResponse.data);
      console.log('Is array?', Array.isArray(analyticsResponse.data?.data));
      if (analyticsResponse.data?.data && Array.isArray(analyticsResponse.data.data)) {
        console.log('Setting sales data:', analyticsResponse.data.data);
        setSalesData(analyticsResponse.data.data);
      } else {
        // Fallback: create empty data for the date range
        const days = [];
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          days.push({
            date: d.toISOString().split('T')[0],
            sales: 0,
            orders: 0
          });
        }
        setSalesData(days);
      }
    } catch (error) {
      console.error('Failed to load reports data:', error);
      // Create empty data on error
      const days = [];
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        days.push({
          date: d.toISOString().split('T')[0],
          sales: 0,
          orders: 0
        });
      }
      setSalesData(days);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportReports = () => {
    if (!salesData || salesData.length === 0) {
      alert('No data available to export. Please select a date range with sales data.');
      return;
    }
    
    setIsExporting(true);
    try {
      // Create comprehensive CSV content
      const reportDate = new Date().toISOString().split('T')[0];
      const reportTime = new Date().toLocaleTimeString();
      
      // Header information
      const headerRows = [
        ['Inland Cafe - Sales Report'],
        [`Generated on: ${reportDate} at ${reportTime}`],
        [`Report Period: ${dateRange.start} to ${dateRange.end}`],
        [''],
        ['SUMMARY'],
        ['Total Sales ($)', 'Total Orders', 'Average Order Value ($)', 'Period Average Sales/Day'],
        [totalSales.toFixed(2), totalOrders.toString(), averageOrderValue.toFixed(2), (totalSales / salesData.length).toFixed(2)],
        [''],
        ['DAILY BREAKDOWN'],
        ['Date', 'Sales ($)', 'Orders', 'Average Order Value ($)', 'Day of Week']
      ];
      
      // Daily data
      const dailyRows = salesData.map(day => {
        const date = new Date(day.date);
        const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' });
        return [
          day.date,
          day.sales.toFixed(2),
          day.orders.toString(),
          day.orders > 0 ? (day.sales / day.orders).toFixed(2) : '0.00',
          dayOfWeek
        ];
      });
      
      // Summary statistics
      const summaryRows = [
        [''],
        ['SUMMARY STATISTICS'],
        ['Metric', 'Value'],
        ['Total Revenue', `$${totalSales.toFixed(2)}`],
        ['Total Orders', totalOrders.toString()],
        ['Average Order Value', `$${averageOrderValue.toFixed(2)}`],
        ['Average Daily Sales', `$${(totalSales / salesData.length).toFixed(2)}`],
        ['Average Daily Orders', (totalOrders / salesData.length).toFixed(1)],
        ['Best Day (Revenue)', salesData.length > 0 ? salesData.reduce((max, day) => day.sales > max.sales ? day : max).date : 'N/A'],
        ['Worst Day (Revenue)', salesData.length > 0 ? salesData.reduce((min, day) => day.sales < min.sales ? day : min).date : 'N/A'],
        [''],
        ['TODAY\'S STATS (if applicable)'],
        ['Today\'s Revenue', `$${todayStats?.total_revenue?.toFixed(2) || '0.00'}`],
        ['Today\'s Orders', todayStats?.total_orders?.toString() || '0'],
        ['Today\'s Average Order', todayStats?.total_orders > 0 ? `$${(todayStats?.total_revenue / todayStats?.total_orders).toFixed(2)}` : '$0.00']
      ];
      
      // Combine all rows
      const allRows = [...headerRows, ...dailyRows, ...summaryRows];
      
      // Convert to CSV format
      const csvContent = allRows
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `inland_cafe_sales_report_${dateRange.start}_to_${dateRange.end}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      alert('Report exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export report');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAllReports = async () => {
    if (confirmText !== 'DELETE ALL REPORTS') {
      return;
    }
    
    setIsDeleting(true);
    try {
      const response = await api.deleteAllReports();
      if (response.error) {
        alert('Failed to delete reports: ' + response.error);
      } else {
        alert('All reports and sales data have been deleted successfully');
        setShowDeleteModal(false);
        setConfirmText('');
        // Reload the reports data
        loadReportsData();
      }
    } catch (error) {
      console.error('Error deleting reports:', error);
      alert('Failed to delete reports');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const totalSales = Array.isArray(salesData) ? salesData.reduce((sum, day) => sum + day.sales, 0) : 0;
  const totalOrders = Array.isArray(salesData) ? salesData.reduce((sum, day) => sum + day.orders, 0) : 0;
  const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
  
  console.log('Sales data for calculations:', salesData);
  console.log('Sales data type:', typeof salesData, 'Is array:', Array.isArray(salesData));
  console.log('Calculated totals:', { totalSales, totalOrders, averageOrderValue });
  console.log('Today stats:', todayStats);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600">Track your cafe's performance</p>
        </div>
        <div className="flex items-center space-x-3">
          {canDeleteReports && (
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center space-x-2 px-4 py-2 text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
              title="Delete all reports data (Admin only)"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete All Reports</span>
            </button>
          )}
          
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
            <span className="text-gray-400">to</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          
          <button 
            onClick={handleExportReports}
            disabled={isExporting}
            className={`flex items-center space-x-2 px-4 py-2 border rounded-lg transition-colors ${
              isExporting 
                ? 'text-gray-400 bg-gray-50 border-gray-200 cursor-not-allowed'
                : 'text-orange-600 bg-orange-50 border-orange-200 hover:bg-orange-100'
            }`}
          >
            <Download className={`w-4 h-4 ${isExporting ? 'animate-pulse' : ''}`} />
            <span>{isExporting ? 'Exporting...' : 'Export'}</span>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sales</p>
              <p className="text-2xl font-bold text-gray-900">
                ${totalSales.toFixed(2)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
              <p className="text-2xl font-bold text-gray-900">
                ${averageOrderValue.toFixed(2)}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Today's Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                ${todayStats?.total_revenue?.toFixed(2) || '0.00'}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Sales Analytics Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Sales Analytics</h3>
              <p className="text-sm text-gray-500 mt-1">Revenue trends over the selected period</p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gradient-to-r from-orange-400 to-orange-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Revenue</span>
              </div>
            </div>
          </div>
        </div>
        <div className="p-6">
          {Array.isArray(salesData) && salesData.length > 0 ? (
            <div className="h-64 flex items-end justify-between space-x-1">
              {salesData.map((day) => {
                const maxSales = Math.max(...salesData.map(d => d.sales), 1);
                const height = maxSales > 0 ? (day.sales / maxSales) * 100 : 0;
                const actualHeight = Math.max(height, day.sales > 0 ? 5 : 2); // Minimum 5% for visible bars, 2% for empty days
                
                return (
                  <div key={day.date} className="flex flex-col items-center flex-1 group">
                    <div className="w-full flex flex-col items-end relative">
                      {/* Tooltip */}
                      <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                        {day.date}: ${day.sales.toFixed(2)}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                      </div>
                      
                      {/* Bar */}
                      <div
                        className={`w-full rounded-t transition-all duration-300 hover:opacity-80 ${
                          day.sales > 0 
                            ? 'bg-gradient-to-t from-orange-400 to-orange-500 shadow-sm' 
                            : 'bg-gray-200'
                        }`}
                        style={{ 
                          height: `${actualHeight}%`, 
                          minHeight: day.sales > 0 ? '20px' : '2px'
                        }}
                      ></div>
                    </div>
                    
                    {/* Date label */}
                    <div className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-center whitespace-nowrap">
                      {new Date(day.date).toLocaleDateString('en', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500">No sales data available for the selected period</p>
              </div>
            </div>
          )}
          
          {/* Peak Info */}
          {Array.isArray(salesData) && salesData.length > 0 && (
            <div className="mt-4 flex justify-between text-sm text-gray-600">
              <span>Total: ${totalSales.toFixed(2)}</span>
              <span>Peak: ${Math.max(...salesData.map(d => d.sales)).toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Delete All Reports Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Delete All Reports
                </h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-700 mb-3">
                This will permanently delete:
              </p>
              <ul className="text-sm text-gray-600 list-disc list-inside space-y-1 mb-4">
                <li>All order history and transactions</li>
                <li>All payment records</li>
                <li>All sales reports and statistics</li>
                <li>All inventory transaction logs</li>
                <li>All daily sales summaries</li>
              </ul>
              <p className="text-red-600 font-semibold text-sm">
                This action cannot be undone. All historical data will be lost forever.
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type "DELETE ALL REPORTS" to confirm:
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="DELETE ALL REPORTS"
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setConfirmText('');
                }}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAllReports}
                disabled={confirmText !== 'DELETE ALL REPORTS' || isDeleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
              >
                {isDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Delete All Reports</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}