import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types';
import api from '../utils/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
  getCurrentUser: () => Promise<void>;
  initializeAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (username: string, password: string) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await api.login({ username, password });
          
          if (response.error) {
            set({ error: response.error, isLoading: false });
            return false;
          }

          const { user, token } = response.data;
          
          // Set token in both auth store and API client
          api.setToken(token);
          localStorage.setItem('auth_token', token);
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          
          return true;
        } catch (error) {
          set({
            error: 'Login failed. Please try again.',
            isLoading: false,
          });
          return false;
        }
      },

      logout: () => {
        api.clearToken();
        localStorage.removeItem('auth_token');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      },

      clearError: () => {
        set({ error: null });
      },

      getCurrentUser: async () => {
        const { token } = get();
        if (!token) return;

        try {
          const response = await api.getCurrentUser();
          
          if (response.error) {
            // Token might be expired, logout
            get().logout();
            return;
          }

          set({
            user: response.data.user,
            isAuthenticated: true,
          });
        } catch (error) {
          get().logout();
        }
      },

      initializeAuth: () => {
        // Initialize token from localStorage on app start
        const storedToken = localStorage.getItem('auth_token');
        if (storedToken) {
          set({ token: storedToken });
          // Try to get current user
          get().getCurrentUser();
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
