import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Trash2, ShoppingBag, ArrowRight } from 'lucide-react';

export default function Cart() {
    const { cartItems, updateQuantity, removeFromCart, clearCart, getCartTotal, loading } = useCart();
    const { token } = useAuth();
    const navigate = useNavigate();

    const handleCheckoutClick = () => {
        if (token) {
            navigate('/checkout');
        } else {
            navigate('/login?redirect=checkout');
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', textAlign: 'center', padding: '40px 24px' }}>
                <div className="spinner" style={{ marginBottom: '20px' }}></div>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>Syncing Your Cart...</h2>
                <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '15px' }}>
                    Please wait while we merge your items with your account.
                </p>
            </div>
        );
    }

    if (cartItems.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '80px 24px' }}>
                <ShoppingBag size={64} color="var(--text-muted)" style={{ marginBottom: '20px' }} />
                <h2>Your Cart is Empty</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', marginTop: '8px' }}>
                    Looks like you haven't added anything to your cart yet.
                </p>
                <Link to="/" className="btn btn-primary">
                    Continue Shopping
                </Link>
            </div>
        );
    }

    return (
        <div>
            <h1 style={{ fontSize: '28px', marginBottom: '24px' }}>Your Shopping Cart</h1>
            
            <div className="cart-layout">
                {/* Cart Items List */}
                <div className="cart-list">
                    {cartItems.map(item => (
                        <div key={item.id} className="cart-item">
                            <img src={item.product.imageUrl} alt={item.product.name} className="cart-item-img" />
                            <div className="cart-item-info">
                                <h3 className="cart-item-title">{item.product.name}</h3>
                                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                                    SKU: {item.product.sku}
                                </p>
                                <span className="cart-item-price">${item.product.price.toFixed(2)}</span>
                            </div>
                            
                            {/* Quantity Editor */}
                            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '2px', backgroundColor: 'var(--bg-tertiary)' }}>
                                <button 
                                    onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                                    className="btn btn-secondary btn-sm"
                                    style={{ padding: '4px 8px', border: 'none' }}
                                >
                                    -
                                </button>
                                <span style={{ padding: '0 12px', fontSize: '14px', fontWeight: 'bold' }}>{item.quantity}</span>
                                <button 
                                    onClick={() => updateQuantity(item.id, Math.min(item.product.stock, item.quantity + 1))}
                                    className="btn btn-secondary btn-sm"
                                    style={{ padding: '4px 8px', border: 'none' }}
                                >
                                    +
                                </button>
                            </div>

                            {/* Subtotal of item */}
                            <div style={{ fontSize: '16px', fontWeight: 'bold', width: '90px', textAlign: 'right' }}>
                                ${(item.product.price * item.quantity).toFixed(2)}
                            </div>

                            {/* Delete Button */}
                            <button 
                                onClick={() => removeFromCart(item.id)}
                                className="nav-btn"
                                style={{ color: 'var(--error)', padding: '8px' }}
                                aria-label="Remove item"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))}

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
                        <Link to="/" className="btn btn-secondary">
                            Continue Shopping
                        </Link>
                        <button onClick={clearCart} className="btn btn-outline" style={{ color: 'var(--error)', borderColor: 'var(--error)' }}>
                            Clear Shopping Cart
                        </button>
                    </div>
                </div>

                {/* Checkout Summary Card */}
                <div className="cart-summary">
                    <h3>Order Summary</h3>
                    
                    <div className="summary-row">
                        <span>Subtotal</span>
                        <span>${getCartTotal().toFixed(2)}</span>
                    </div>
                    <div className="summary-row">
                        <span>Shipping</span>
                        <span>{getCartTotal() >= 100 ? 'FREE' : '$10.00'}</span>
                    </div>
                    <div style={{ borderBottom: '1px solid var(--border-color)', margin: '14px 0' }}></div>
                    
                    <div className="summary-row" style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                        <span>Total</span>
                        <span>${(getCartTotal() + (getCartTotal() >= 100 ? 0 : 10)).toFixed(2)}</span>
                    </div>

                    <div style={{ backgroundColor: 'var(--accent-light)', padding: '12px', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '12px', margin: '16px 0', lineHeight: '1.4' }}>
                        🎉 Tip: Use code <strong>SALETIME10</strong> during checkout to claim 10% discount on your first order!
                    </div>

                    <button 
                        onClick={handleCheckoutClick} 
                        className="btn btn-primary"
                        style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                    >
                        <span>Proceed to Checkout</span>
                        <ArrowRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}
