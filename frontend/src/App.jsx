import React, { useState } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { ShoppingBag } from 'lucide-react';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Routes
import AppRoutes from './routes/AppRoutes';

function App() {
  const { user, loading, loggingOut, loggingOutAdmin, loggingIn, loggingInAdmin } = useAuth();
  const [searchFilter, setSearchFilter] = useState('');

  const handleSearch = (term) => {
    setSearchFilter(term);
  };

  if (loading || loggingOut) {
    return (
      <div className="site-loading-screen" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100vw', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', gap: '24px' }}>
        <div className="site-loading-brand" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ShoppingBag size={40} style={{ color: 'var(--accent)' }} />
          <span style={{ fontSize: '26px', fontWeight: '800', fontFamily: 'var(--font-heading)', background: 'linear-gradient(135deg, #818cf8 0%, #4f46e5 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '0.5px' }}>
            E-Commerce Lite
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <div className="spinner animate-spin" style={{ width: '36px', height: '36px', border: '3px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', marginBottom: '12px' }} />
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '500' }}>
            {loggingOutAdmin
              ? '🛡️ Securely signed out. All systems remain in good hands.'
              : loggingOut 
                ? '👋 See you soon, trendsetter.' 
                : loggingInAdmin 
                  ? '🛡️ Welcome back, Admin. Everything is under control.' 
                  : loggingIn 
                    ? "🚀 You're in. Let's find something awesome." 
                    : 'Loading experience...'}
          </span>
        </div>
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
