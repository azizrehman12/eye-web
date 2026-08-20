import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ScrollToTop from './components/shared/ScrollToTop';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layouts
import CustomerLayout from './layouts/CustomerLayout';
import AdminLayout from './layouts/AdminLayout';

import Home from './pages/customer/Home';
import Products from './pages/customer/Products';
import ProductDetails from './pages/customer/ProductDetails';
import NotFound from './pages/customer/NotFound';

import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import ProductForm from './pages/admin/ProductForm';
import AdminCategories from './pages/admin/AdminCategories';
import AdminOrders from './pages/admin/AdminOrders';
import OrderConfirmation from './pages/customer/OrderConfirmation';

const AdminSettings = () => <div><h1>Admin Settings</h1></div>;

// Protected Route wrapper
const ProtectedAdminRoute = ({ children }) => {
  const { user, isAdmin, loading } = useAuth();
  
  if (loading) return <div>Loading auth...</div>;
  
  // If not logged in OR not an admin, redirect to login
  if (!user || !isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }
  
  return children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          {/* Customer Routes */}
          <Route path="/" element={<CustomerLayout />}>
            <Route index element={<Home />} />
            <Route path="products" element={<Products />} />
            <Route path="products/:id" element={<ProductDetails />} />
            <Route path="category/:slug" element={<Products />} />
            <Route path="order/confirm" element={<OrderConfirmation />} />
            <Route path="*" element={<NotFound />} />
          </Route>

          {/* Admin Auth Route (No Layout) */}
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Admin Protected Routes */}
          <Route path="/admin" element={
            <ProtectedAdminRoute>
              <AdminLayout />
            </ProtectedAdminRoute>
          }>
            <Route index element={<AdminDashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="products/new" element={<ProductForm />} />
            <Route path="products/edit/:id" element={<ProductForm />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
