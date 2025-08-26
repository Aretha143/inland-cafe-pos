import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import POSPage from './pages/POSPage';
import ProductsPage from './pages/ProductsPage';
import CategoriesPage from './pages/CategoriesPage';
import TablesPage from './pages/TablesPage';
import OrdersPage from './pages/OrdersPage';
import UnpaidOrdersPage from './pages/UnpaidOrdersPage';
import PaymentPage from './pages/PaymentPage';
import ReportsPage from './pages/ReportsPage';
import AdminPage from './pages/AdminPage';
import KitchenPage from './pages/KitchenPage';
import Layout from './components/Layout';

function App() {
  const { isAuthenticated, token, getCurrentUser, initializeAuth } = useAuthStore();

  useEffect(() => {
    // Initialize auth on app start
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    // If we have a token but no user, try to get current user
    if (token && !isAuthenticated) {
      getCurrentUser();
    }
  }, [token, isAuthenticated, getCurrentUser]);

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/pos" element={<POSPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/tables" element={<TablesPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/unpaid-orders" element={<UnpaidOrdersPage />} />
          <Route path="/payment/:orderId" element={<PaymentPage />} />
          <Route path="/kitchen" element={<KitchenPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
