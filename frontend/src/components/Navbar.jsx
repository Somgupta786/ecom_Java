import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import { ShoppingBag, User, Sun, Moon, LogOut, Search, LayoutDashboard, ShoppingCart, Compass } from 'lucide-react';

export default function Navbar({ onSearch }) {
    const { user, logout } = useAuth();
    const { getCartCount } = useCart();
    const { theme, toggleTheme } = useTheme();
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

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

    return (
        <nav className="navbar">
            <Link to="/" className="nav-logo">
                <ShoppingBag size={28} />
                <span>E-Commerce Lite</span>
            </Link>

            <form onSubmit={handleSearchSubmit} className="nav-search">
                <Search size={18} />
                <input 
                    type="text" 
                    placeholder="Search premium products..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </form>

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
        </nav>
    );
}
