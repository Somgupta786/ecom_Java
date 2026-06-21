import React, { useState } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Routes
import AppRoutes from './routes/AppRoutes';

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

  const isAdmin = user?.role === 'ROLE_ADMIN';

  return (
    <Router>
      <div className="app-container">
        {!isAdmin && <Navbar onSearch={handleSearch} />}
        
        <main className="main-content">
          <AppRoutes searchFilter={searchFilter} />
        </main>

        {!isAdmin && <Footer />}
      </div>
    </Router>
  );
}

export default App;
