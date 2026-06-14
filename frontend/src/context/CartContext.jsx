import React, { createContext, useState, useEffect, useContext } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext();

const API_BASE = 'http://localhost:8080/api';

export const CartProvider = ({ children }) => {
    const { token, user } = useAuth();
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(false);

    // Load cart depending on Auth status
    const loadCart = async () => {
        if (token) {
            setLoading(true);
            try {
                const res = await fetch(`${API_BASE}/cart`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setCartItems(data);
                }
            } catch (err) {
                console.error('Error fetching cart from DB', err);
            } finally {
                setLoading(false);
            }
        } else {
            // Read from LocalStorage for guest cart
            const localCart = JSON.parse(localStorage.getItem('guestCart')) || [];
            setCartItems(localCart);
        }
    };

    // Listen to authentication token changes to load or merge carts
    useEffect(() => {
        const mergeAndLoadCart = async () => {
            if (token) {
                const guestCart = JSON.parse(localStorage.getItem('guestCart')) || [];
                if (guestCart.length > 0) {
                    setLoading(true);
                    for (const item of guestCart) {
                        try {
                            await fetch(`${API_BASE}/cart/add?productId=${item.product.id}&quantity=${item.quantity}`, {
                                method: 'POST',
                                headers: { 'Authorization': `Bearer ${token}` }
                            });
                        } catch (err) {
                            console.error('Error merging item to DB', err);
                        }
                    }
                    localStorage.removeItem('guestCart');
                }
                await loadCart();
            } else {
                loadCart();
            }
        };

        mergeAndLoadCart();
    }, [token]);

    const addToCart = async (product, quantity = 1) => {
        if (token) {
            try {
                const res = await fetch(`${API_BASE}/cart/add?productId=${product.id}&quantity=${quantity}`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    await loadCart();
                    return { success: true };
                } else {
                    const err = await res.json();
                    return { success: false, message: err.message || 'Failed to add item' };
                }
            } catch (err) {
                return { success: false, message: 'Server communication error' };
            }
        } else {
            // Guest logic
            const guestCart = JSON.parse(localStorage.getItem('guestCart')) || [];
            const existingIdx = guestCart.findIndex(item => item.product.id === product.id);
            if (existingIdx > -1) {
                guestCart[existingIdx].quantity += quantity;
            } else {
                guestCart.push({ id: Date.now(), product, quantity }); // mock cartItem id
            }
            localStorage.setItem('guestCart', JSON.stringify(guestCart));
            setCartItems(guestCart);
            return { success: true };
        }
    };

    const updateQuantity = async (cartItemId, quantity) => {
        if (token) {
            try {
                const res = await fetch(`${API_BASE}/cart/update/${cartItemId}?quantity=${quantity}`, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    await loadCart();
                }
            } catch (err) {
                console.error('Error updating quantity in DB', err);
            }
        } else {
            // Guest logic
            const guestCart = JSON.parse(localStorage.getItem('guestCart')) || [];
            const item = guestCart.find(item => item.id === cartItemId);
            if (item) {
                item.quantity = quantity;
                localStorage.setItem('guestCart', JSON.stringify(guestCart));
                setCartItems(guestCart);
            }
        }
    };

    const removeFromCart = async (cartItemId) => {
        if (token) {
            try {
                const res = await fetch(`${API_BASE}/cart/remove/${cartItemId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    await loadCart();
                }
            } catch (err) {
                console.error('Error removing item from DB', err);
            }
        } else {
            // Guest logic
            let guestCart = JSON.parse(localStorage.getItem('guestCart')) || [];
            guestCart = guestCart.filter(item => item.id !== cartItemId);
            localStorage.setItem('guestCart', JSON.stringify(guestCart));
            setCartItems(guestCart);
        }
    };

    const clearCart = async () => {
        if (token) {
            try {
                const res = await fetch(`${API_BASE}/cart/clear`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    setCartItems([]);
                }
            } catch (err) {
                console.error('Error clearing cart in DB', err);
            }
        } else {
            localStorage.removeItem('guestCart');
            setCartItems([]);
        }
    };

    const getCartTotal = () => {
        return cartItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
    };

    const getCartCount = () => {
        return cartItems.reduce((acc, item) => acc + item.quantity, 0);
    };

    return (
        <CartContext.Provider value={{ cartItems, loading, addToCart, updateQuantity, removeFromCart, clearCart, getCartTotal, getCartCount, loadCart }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);
