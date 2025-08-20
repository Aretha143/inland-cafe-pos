const API_BASE_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:3001/api';

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
}

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          error: data.message || 'An error occurred',
          status: response.status,
        };
      }

      return {
        data,
        status: response.status,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Network error',
        status: 0,
      };
    }
  }

  // Auth endpoints
  async login(credentials: { username: string; password: string }) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  async changePassword(data: { currentPassword: string; newPassword: string }) {
    return this.request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Admin-only auth endpoints

  async changeAdminPassword(data: { currentPassword: string; newPassword: string }) {
    return this.request('/auth/admin/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async changeUserPassword(data: { userId: number; newPassword: string }) {
    return this.request('/auth/admin/change-user-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Permissions endpoints
  async getAvailablePermissions() {
    return this.request('/permissions/available');
  }

  async getUserPermissions(userId: number) {
    return this.request(`/permissions/user/${userId}`);
  }

  async updateUserPermissions(userId: number, permissions: { permission: string; granted: boolean }[]) {
    return this.request(`/permissions/user/${userId}`, {
      method: 'PUT',
      body: JSON.stringify({ permissions }),
    });
  }

  async grantPermission(userId: number, permission: string) {
    return this.request(`/permissions/user/${userId}/grant`, {
      method: 'POST',
      body: JSON.stringify({ permission }),
    });
  }

  async revokePermission(userId: number, permission: string) {
    return this.request(`/permissions/user/${userId}/revoke`, {
      method: 'DELETE',
      body: JSON.stringify({ permission }),
    });
  }

  // Categories endpoints
  async getCategories(includeAll = false) {
    const params = includeAll ? '?include_all=true' : '';
    return this.request(`/categories${params}`);
  }

  async getCategoryById(id: number) {
    return this.request(`/categories/${id}`);
  }

  async createCategory(data: any) {
    return this.request('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCategory(id: number, data: any) {
    return this.request(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCategory(id: number) {
    return this.request(`/categories/${id}`, {
      method: 'DELETE',
    });
  }

  async deleteAllCategories() {
    return this.request('/categories/delete-all', {
      method: 'DELETE',
    });
  }

  // Products endpoints
  async getProducts(params?: { 
    category_id?: number; 
    active_only?: boolean; 
    search?: string 
  }) {
    const searchParams = new URLSearchParams();
    if (params?.category_id) searchParams.append('category_id', params.category_id.toString());
    if (params?.active_only) searchParams.append('active_only', 'true');
    if (params?.search) searchParams.append('search', params.search);
    
    const queryString = searchParams.toString();
    return this.request(`/products${queryString ? `?${queryString}` : ''}`);
  }

  async getProductById(id: number) {
    return this.request(`/products/${id}`);
  }

  async createProduct(data: any) {
    return this.request('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProduct(id: number, data: any) {
    return this.request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteProduct(id: number) {
    return this.request(`/products/${id}`, {
      method: 'DELETE',
    });
  }

  async deleteAllProducts() {
    return this.request('/products/delete-all', {
      method: 'DELETE',
    });
  }

  async getLowStockProducts() {
    return this.request('/products/low-stock');
  }

  async updateStock(id: number, data: { 
    quantity: number; 
    type: 'add' | 'subtract' | 'set'; 
    notes?: string 
  }) {
    return this.request(`/products/${id}/stock`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Orders endpoints
  async getOrders(params?: { 
    status?: string; 
    date?: string; 
    limit?: number 
  }) {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);
    if (params?.date) searchParams.append('date', params.date);
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    
    const queryString = searchParams.toString();
    return this.request(`/orders${queryString ? `?${queryString}` : ''}`);
  }

  async getOrderById(id: number) {
    return this.request(`/orders/${id}`);
  }

  async createOrder(data: any) {
    return this.request('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateOrderStatus(id: number, status: string) {
    return this.request(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async getTodayStats() {
    return this.request('/orders/stats/today');
  }

  async getOrdersByTable(tableId: number) {
    return this.request(`/orders/table/${tableId}`);
  }

  async getTableTotals(tableId: number) {
    return this.request(`/orders/table/${tableId}/totals`);
  }

  async resetTable(tableId: number) {
    return this.request(`/orders/table/${tableId}/reset`, {
      method: 'PATCH',
    });
  }



  async deleteOrderHistory(orderId: number, restoreStock: boolean = true) {
    return this.request(`/orders/${orderId}/history`, {
      method: 'DELETE',
      body: JSON.stringify({ restoreStock }),
    });
  }

  async deleteAllReports() {
    return this.request('/orders/reports/all', {
      method: 'DELETE',
    });
  }

  async getSalesAnalytics(startDate: string, endDate: string) {
    return this.request(`/orders/analytics?startDate=${startDate}&endDate=${endDate}`);
  }

  async getTableBillSummary(tableId: number) {
    return this.request(`/orders/table/${tableId}/bill`);
  }

  // Unpaid Orders endpoints
  async getUnpaidOrders(params?: { 
    customer_name?: string; 
    table_number?: string; 
    limit?: number 
  }) {
    const searchParams = new URLSearchParams();
    if (params?.customer_name) searchParams.append('customer_name', params.customer_name);
    if (params?.table_number) searchParams.append('table_number', params.table_number);
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    
    const queryString = searchParams.toString();
    return this.request(`/orders/unpaid/all${queryString ? `?${queryString}` : ''}`);
  }

  async getUnpaidStats() {
    return this.request('/orders/unpaid/stats');
  }

  async addToUnpaidTable(data: {
    order_id: number;
    customer_name: string;
    customer_phone?: string;
    table_number?: string;
    notes?: string;
  }) {
    return this.request('/orders/unpaid/add', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getUnpaidOrderById(id: number) {
    return this.request(`/orders/unpaid/${id}`);
  }

  async updateUnpaidOrder(id: number, data: {
    customer_name?: string;
    customer_phone?: string;
    table_number?: string;
    notes?: string;
  }) {
    return this.request(`/orders/unpaid/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async removeFromUnpaidTable(id: number) {
    return this.request(`/orders/unpaid/${id}`, {
      method: 'DELETE',
    });
  }

  async markUnpaidOrderAsPaid(id: number, data: {
    payment_method?: string;
    notes?: string;
  }) {
    return this.request(`/orders/unpaid/${id}/mark-paid`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createTableCombinedOrder(tableId: number, discountData?: {
    discountType?: 'percentage' | 'fixed';
    discountValue?: number;
  }) {
    return this.request(`/orders/table/${tableId}/combined`, {
      method: 'POST',
      body: discountData ? JSON.stringify(discountData) : undefined,
    });
  }

  async processTablePayment(tableId: number, paymentData: {
    payment_method: string;
    amount_paid: number;
    discount_amount?: number;
    notes?: string;
  }) {
    return this.request(`/orders/table/${tableId}/payment`, {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }

  // Tables endpoints
  async getTables(params: Record<string, any> = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/tables${queryString ? `?${queryString}` : ''}`);
  }

  async getTableById(id: number) {
    return this.request(`/tables/${id}`);
  }

  async createTable(data: any) {
    return this.request('/tables', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTable(id: number, data: any) {
    return this.request(`/tables/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTable(id: number) {
    return this.request(`/tables/${id}`, {
      method: 'DELETE',
    });
  }

  async updateTableStatus(id: number, data: any) {
    return this.request(`/tables/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async getAvailableTables() {
    return this.request('/tables/available');
  }

  // Customers endpoints
  async getCustomers(params?: { 
    search?: string; 
    membership_type?: string; 
    limit?: number 
  }) {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.append('search', params.search);
    if (params?.membership_type) searchParams.append('membership_type', params.membership_type);
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    
    const queryString = searchParams.toString();
    return this.request(`/customers${queryString ? `?${queryString}` : ''}`);
  }

  async getCustomerById(id: number) {
    return this.request(`/customers/${id}`);
  }

  async createCustomer(data: any) {
    return this.request('/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCustomer(id: number, data: any) {
    return this.request(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCustomer(id: number) {
    return this.request(`/customers/${id}`, {
      method: 'DELETE',
    });
  }

  async updateLoyaltyPoints(id: number, data: { 
    points: number; 
    type: 'earn' | 'redeem' | 'bonus'; 
    description?: string 
  }) {
    return this.request(`/customers/${id}/loyalty`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async getMembershipStats() {
    return this.request('/customers/membership/stats');
  }

  // Generic HTTP methods for convenience
  async get(endpoint: string) {
    const response = await this.request(endpoint, { method: 'GET' });
    if (response.error) {
      throw new Error(response.error);
    }
    return response;
  }

  async post(endpoint: string, data?: any) {
    const response = await this.request(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
    if (response.error) {
      throw new Error(response.error);
    }
    return response;
  }

  async put(endpoint: string, data?: any) {
    const response = await this.request(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
    if (response.error) {
      throw new Error(response.error);
    }
    return response;
  }

  async patch(endpoint: string, data?: any) {
    const response = await this.request(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
    if (response.error) {
      throw new Error(response.error);
    }
    return response;
  }

  async delete(endpoint: string) {
    const response = await this.request(endpoint, { method: 'DELETE' });
    if (response.error) {
      throw new Error(response.error);
    }
    return response;
  }
}

export const api = new ApiClient(API_BASE_URL);
export default api;
