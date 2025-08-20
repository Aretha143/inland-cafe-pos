import { create } from 'zustand';
import { CartItem, Product, PaymentMethod } from '../types';

interface CartState {
  items: CartItem[];
  discount: number;
  discountType: 'percentage' | 'fixed';
  paymentMethod: PaymentMethod;
  tableNumber: string;
  notes: string;
  
  // Computed values
  subtotal: number;
  total: number;
  
  // Actions
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  updateItemNotes: (productId: number, notes: string) => void;
  clearCart: () => void;
  setDiscount: (amount: number, type: 'percentage' | 'fixed') => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  setTableNumber: (table: string) => void;
  setNotes: (notes: string) => void;
  
  // Computed getters
  getItemCount: () => number;
  getItemByProductId: (productId: number) => CartItem | undefined;
}



export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  discount: 0,
  discountType: 'fixed',
  paymentMethod: 'cash',
  tableNumber: '',
  notes: '',
  
  // Computed values - these will be calculated on each access
  get subtotal() {
    return get().items.reduce((sum, item) => sum + item.subtotal, 0);
  },
  
  get total() {
    const subtotal = get().subtotal;
    const discount = get().discount;
    const discountType = get().discountType;
    
    const discountAmount = discountType === 'percentage' 
      ? subtotal * (discount / 100)
      : discount;
      
    return Math.max(0, subtotal - discountAmount);
  },

  addItem: (product: Product, quantity = 1) => {
    set((state) => {
      const existingItem = state.items.find(item => item.product.id === product.id);
      
      if (existingItem) {
        // Update existing item
        return {
          items: state.items.map(item =>
            item.product.id === product.id
              ? {
                  ...item,
                  quantity: item.quantity + quantity,
                  subtotal: (item.quantity + quantity) * item.product.price
                }
              : item
          )
        };
      } else {
        // Add new item
        const newItem: CartItem = {
          product,
          quantity,
          subtotal: quantity * product.price,
          notes: ''
        };
        
        return {
          items: [...state.items, newItem]
        };
      }
    });
  },

  removeItem: (productId: number) => {
    set((state) => ({
      items: state.items.filter(item => item.product.id !== productId)
    }));
  },

  updateQuantity: (productId: number, quantity: number) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }
    
    set((state) => ({
      items: state.items.map(item =>
        item.product.id === productId
          ? {
              ...item,
              quantity,
              subtotal: quantity * item.product.price
            }
          : item
      )
    }));
  },

  updateItemNotes: (productId: number, notes: string) => {
    set((state) => ({
      items: state.items.map(item =>
        item.product.id === productId
          ? { ...item, notes }
          : item
      )
    }));
  },

  clearCart: () => {
    set({
      items: [],
      discount: 0,
      discountType: 'fixed',
      tableNumber: '',
      notes: ''
    });
  },

  setDiscount: (amount: number, type: 'percentage' | 'fixed') => {
    set({ discount: Math.max(0, amount), discountType: type });
  },

  setPaymentMethod: (method: PaymentMethod) => {
    set({ paymentMethod: method });
  },

  setTableNumber: (table: string) => {
    set({ tableNumber: table });
  },

  setNotes: (notes: string) => {
    set({ notes });
  },

  getItemCount: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  },

  getItemByProductId: (productId: number) => {
    return get().items.find(item => item.product.id === productId);
  }
}));
