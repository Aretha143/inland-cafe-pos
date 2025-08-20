// Core entity types
export interface Category {
  id: number;
  name: string;
  description?: string;
  color: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  cost: number;
  category_id: number;
  sku?: string;
  barcode?: string;
  stock_quantity: number;
  min_stock_level: number;
  is_active: boolean;
  image_url?: string;
  created_at: string;
  updated_at: string;
  category?: Category;
  category_name?: string;
}

export interface Customer {
  id: number;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  loyalty_points: number;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: number;
  order_number: string;
  customer_id?: number;
  table_id?: number;
  total_amount: number;
  discount_amount: number;
  tax_amount: number;
  final_amount: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  order_status: OrderStatus;
  notes?: string;
  cashier_name?: string;
  table_number?: string;
  order_type: OrderType;
  created_at: string;
  updated_at: string;
  customer?: Customer;
  customer_name?: string;
  items?: OrderItem[];
  payments?: Payment[];
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  total_price: number;
  notes?: string;
  created_at: string;
  product?: Product;
  product_name?: string;
  name?: string;
  price?: number;
}

export interface Payment {
  id: number;
  order_id: number;
  amount: number;
  payment_method: PaymentMethod;
  reference_number?: string;
  status: PaymentStatus;
  created_at: string;
}

export interface InventoryTransaction {
  id: number;
  product_id: number;
  transaction_type: TransactionType;
  quantity: number;
  reference_id?: number;
  reference_type?: string;
  notes?: string;
  created_at: string;
  product?: Product;
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  full_name: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
  permissions?: string[];
}

export interface DailySales {
  id: number;
  date: string;
  total_sales: number;
  total_orders: number;
  total_customers: number;
  cash_sales: number;
  card_sales: number;
  created_at: string;
  updated_at: string;
}

// Enums
export type PaymentMethod = 'cash' | 'card' | 'mobile' | 'loyalty_points';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type OrderStatus = 'active' | 'completed' | 'cancelled' | 'refunded';
export type OrderType = 'dine_in' | 'takeaway' | 'delivery';
export type TransactionType = 'sale' | 'purchase' | 'adjustment' | 'waste';
export type UserRole = 'admin' | 'manager' | 'cashier';

// Cart types for frontend
export interface CartItem {
  product: Product;
  quantity: number;
  notes?: string;
  subtotal: number;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
}

// API request/response types
export interface CreateOrderRequest {
  customer_id?: number;
  items: {
    product_id: number;
    quantity: number;
    notes?: string;
  }[];
  payment_method: PaymentMethod;
  discount_amount?: number;
  table_number?: string;
  order_type?: OrderType;
  notes?: string;
}

export interface CreateProductRequest {
  name: string;
  description?: string;
  price: number;
  cost?: number;
  category_id: number;
  sku?: string;
  barcode?: string;
  stock_quantity?: number;
  min_stock_level?: number;
  image_url?: string;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  color?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  full_name: string;
  role?: UserRole;
}

export interface UpdateUserRequest {
  username: string;
  email: string;
  full_name: string;
  role?: UserRole;
  is_active?: boolean;
}

export interface ChangePasswordRequest {
  userId: number;
  newPassword: string;
}

// Sales report types
export interface SalesReport {
  period: string;
  total_sales: number;
  total_orders: number;
  average_order_value: number;
  top_products: {
    product: Product;
    quantity_sold: number;
    revenue: number;
  }[];
  sales_by_payment_method: {
    payment_method: PaymentMethod;
    amount: number;
    count: number;
  }[];
  hourly_sales?: {
    hour: number;
    sales: number;
    orders: number;
  }[];
}

// Dashboard types
export interface DashboardStats {
  today_sales: number;
  today_orders: number;
  today_customers: number;
  low_stock_items: Product[];
  recent_orders: Order[];
  top_products_today: {
    product: Product;
    quantity: number;
  }[];
}

// Error types
export interface APIError {
  message: string;
  code?: string;
  details?: any;
}

// Table management
export interface Table {
  id: number;
  table_number: string;
  table_name?: string;
  capacity: number;
  location?: string;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
  current_order_id?: number;
  created_at: string;
  updated_at: string;
}

// Discount types
export interface Discount {
  type: 'percentage' | 'fixed';
  value: number;
  reason?: string;
}
