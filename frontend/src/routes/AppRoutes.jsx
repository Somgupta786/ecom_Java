import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Pages
import Home from '../pages/Home';
import Login from '../pages/Login';
import Register from '../pages/Register';
import ProductDetail from '../pages/ProductDetail';
import Cart from '../pages/Cart';
import Checkout from '../pages/Checkout';
import Profile from '../pages/Profile';
import AdminDashboard from '../pages/AdminDashboard';
import CheckoutSuccess from '../pages/CheckoutSuccess';
import OrderTracking from '../pages/OrderTracking';

// Guard routing elements
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (adminOnly && user.role !== 'ROLE_ADMIN') {
    return <Navigate to="/" replace />;
  }
  return children;
};

export default function AppRoutes({ searchFilter }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ROLE_ADMIN';

  return (
    <Routes>
      <Route path="/" element={isAdmin ? <Navigate to="/admin" replace /> : <Home searchFilter={searchFilter} />} />
      <Route path="/login" element={isAdmin ? <Navigate to="/admin" replace /> : <Login />} />
      <Route path="/register" element={isAdmin ? <Navigate to="/admin" replace /> : <Register />} />
      <Route path="/product/:id" element={isAdmin ? <Navigate to="/admin" replace /> : <ProductDetail />} />
      <Route path="/cart" element={isAdmin ? <Navigate to="/admin" replace /> : <Cart />} />
      
      {/* Protected Routes */}
      <Route path="/checkout" element={
        <ProtectedRoute>
          {isAdmin ? <Navigate to="/admin" replace /> : <Checkout />}
        </ProtectedRoute>
      } />
      <Route path="/checkout-success" element={
        <ProtectedRoute>
          {isAdmin ? <Navigate to="/admin" replace /> : <CheckoutSuccess />}
        </ProtectedRoute>
      } />
      <Route path="/order-tracking" element={
        isAdmin ? <Navigate to="/admin" replace /> : <OrderTracking />
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          {isAdmin ? <Navigate to="/admin" replace /> : <Profile />}
        </ProtectedRoute>
      } />
      <Route path="/admin" element={
        <ProtectedRoute adminOnly={true}>
          <AdminDashboard />
        </ProtectedRoute>
      } />

      {/* Fallback */}
      <Route path="*" element={<Navigate to={isAdmin ? "/admin" : "/"} replace />} />
    </Routes>
  );
}
