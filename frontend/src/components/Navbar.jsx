import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import { ShoppingBag, User, Sun, Moon, LogOut, Search, LayoutDashboard, ShoppingCart, Compass, Menu, X } from 'lucide-react';

export default function Navbar({ onSearch }) {
    const { user, logout } = useAuth();
    const { getCartCount } = useCart();
    const { theme, toggleTheme } = useTheme();
    const [searchTerm, setSearchTerm] = useState('');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    
    const navigate = useNavigate();
    const location = useLocation();

    // Debounce search input changes
    useEffect(() => {
        const handler = setTimeout(() => {
            if (onSearch) {
                onSearch(searchTerm);
            }
        }, 300);
        return () => clearTimeout(handler);
    }, [searchTerm, onSearch]);

    const handleSearchSubmit = (e) => {
        if (e && e.preventDefault) e.preventDefault();
        if (onSearch) {
            onSearch(searchTerm);
        }
        navigate('/');
    };

    const showSearch = location.pathname === '/';

    return (
        <>
            <nav className="navbar">
                <Link to="/" className="nav-logo" onClick={() => setIsMobileMenuOpen(false)}>
                    <ShoppingBag size={28} />
                    <span>E-Commerce Lite</span>
                </Link>

                {showSearch && (
                    <form onSubmit={handleSearchSubmit} className="nav-search">
                        <Search size={18} />
                        <input 
                            type="text" 
                            placeholder="Search premium products..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </form>
                )}

                <div className="nav-actions">
                    <button onClick={toggleTheme} className="nav-btn" aria-label="Toggle theme">
                        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                    </button>

                    <Link to="/order-tracking" className="nav-btn">
                        <Compass size={20} />
                        <span>Track Order</span>
                    </Link>

                    <Link to="/cart" className="nav-btn">
                        <ShoppingCart size={20} />
                        <span>Cart</span>
                        {getCartCount() > 0 && <span className="badge-count">{getCartCount()}</span>}
                    </Link>

                    {user ? (
                        <>
                            {user.role === 'ROLE_ADMIN' && (
                                <Link to="/admin" className="nav-btn">
                                    <LayoutDashboard size={20} />
                                    <span>Admin</span>
                                </Link>
                            )}
                            <Link to="/profile" className="nav-btn">
                                <User size={20} />
                                <span>{user.firstName}</span>
                            </Link>
                            <button onClick={logout} className="nav-btn">
                                <LogOut size={20} />
                                <span>Logout</span>
                            </button>
                        </>
                    ) : (
                        <Link to="/login" className="nav-btn">
                            <User size={20} />
                            <span>Login</span>
                        </Link>
                    )}
                </div>

                <div className="nav-mobile-actions">
                    <button onClick={toggleTheme} className="nav-btn" aria-label="Toggle theme">
                        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                    <Link to="/cart" className="nav-btn cart-mobile-btn" onClick={() => setIsMobileMenuOpen(false)}>
                        <ShoppingCart size={20} />
                        {getCartCount() > 0 && <span className="badge-count">{getCartCount()}</span>}
                    </Link>
                    <button 
                        className="nav-hamburger" 
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
                        aria-label="Toggle menu"
                    >
                        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </nav>

            <div className={`mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}>
                <Link to="/order-tracking" className="mobile-menu-item" onClick={() => setIsMobileMenuOpen(false)}>
                    <Compass size={18} />
                    <span>Track Order</span>
                </Link>
                {user ? (
                    <>
                        {user.role === 'ROLE_ADMIN' && (
                            <Link to="/admin" className="mobile-menu-item" onClick={() => setIsMobileMenuOpen(false)}>
                                <LayoutDashboard size={18} />
                                <span>Admin Dashboard</span>
                            </Link>
                        )}
                        <Link to="/profile" className="mobile-menu-item" onClick={() => setIsMobileMenuOpen(false)}>
                            <User size={18} />
                            <span>Profile ({user.firstName})</span>
                        </Link>
                        <button 
                            onClick={() => {
                                logout();
                                setIsMobileMenuOpen(false);
                            }} 
                            className="mobile-menu-item logout-btn"
                        >
                            <LogOut size={18} />
                            <span>Logout</span>
                        </button>
                    </>
                ) : (
                    <Link to="/login" className="mobile-menu-item" onClick={() => setIsMobileMenuOpen(false)}>
                        <User size={18} />
                        <span>Login / Register</span>
                    </Link>
                )}
            </div>
        </>
    );
}
