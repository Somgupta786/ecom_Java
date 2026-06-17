import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import CheckoutSuccess from './pages/CheckoutSuccess';
import OrderTracking from './pages/OrderTracking';

function App() {
  const { user, loading } = useAuth();
  const [searchFilter, setSearchFilter] = useState('');

  const handleSearch = (term) => {
    setSearchFilter(term);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#0f172a', color: '#f8fafc' }}>
        <div style={{ fontSize: '20px', fontFamily: "'Outfit', sans-serif" }}>Loading E-Commerce Lite...</div>
      </div>
    );
  }

  // Guard routing elements
  const ProtectedRoute = ({ children, adminOnly = false }) => {
    if (!user) {
      return <Navigate to="/login" replace />;
    }
    if (adminOnly && user.role !== 'ROLE_ADMIN') {
      return <Navigate to="/" replace />;
    }
    return children;
  };

  const isAdmin = user?.role === 'ROLE_ADMIN';

  return (
    <Router>
      <div className="app-container">
        {!isAdmin && <Navbar onSearch={handleSearch} />}
        
        <main className="main-content">
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
        </main>

        {!isAdmin && <Footer />}
      </div>
    </Router>
  );
}

export default App;
