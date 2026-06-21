import React, { createContext, useState, useEffect, useContext } from 'react';
import { useAuth } from './AuthContext';
import api from '../services/api';
import { useToast } from './ToastContext';

const CartContext = createContext();

const isTempOrGuestId = (id) => {
    if (typeof id === 'string') {
        return id.startsWith('temp-') || id.startsWith('guest-');
    }
    if (typeof id === 'number') {
        return id > 1000000000000;
    }
    return false;
};


export const CartProvider = ({ children }) => {
    const { token, user } = useAuth();
    const { showToast } = useToast();
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(false);

    // Load cart depending on Auth status
    const loadCart = async (showSpinner = false) => {
        if (token) {
            if (showSpinner) setLoading(true);
            try {
                const res = await api.get('/cart');
                setCartItems(res.data);
            } catch (err) {
                console.error('Error fetching cart from DB', err);
            } finally {
                if (showSpinner) setLoading(false);
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
                            await api.post(`/cart/add?productId=${item.product.id}&quantity=${item.quantity}`);
                        } catch (err) {
                            console.error('Error merging item to DB', err);
                        }
                    }
                    localStorage.removeItem('guestCart');
                }
                await loadCart(true);
            } else {
                loadCart(true);
            }
        };

        mergeAndLoadCart();
    }, [token]);

    const addToCart = async (product, quantity = 1) => {
        const originalCart = [...cartItems];
        const tempId = `temp-${Date.now()}`;
        
        // Optimistic Add to Local State
        setCartItems(prev => {
            const existingIdx = prev.findIndex(item => item.product.id === product.id);
            if (existingIdx > -1) {
                return prev.map((item, idx) => 
                    idx === existingIdx ? { ...item, quantity: item.quantity + quantity } : item
                );
            } else {
                return [...prev, { id: tempId, product, quantity }];
            }
        });

        if (token) {
            try {
                const res = await api.post(`/cart/add?productId=${product.id}&quantity=${quantity}`);
                const realItem = res.data;
                // Swap the temporary item with the actual database item (which has the correct database ID)
                setCartItems(prev => prev.map(item => 
                    item.id === tempId ? realItem : item
                ));
                showToast(`${product.name} added to cart!`, 'success');
                return { success: true };
            } catch (err) {
                setCartItems(originalCart); // Revert on failure
                const message = err.response?.data?.message || 'Failed to add item';
                showToast(message, 'error');
                return { success: false, message };
            }
        } else {
            // Guest logic
            const guestCart = JSON.parse(localStorage.getItem('guestCart')) || [];
            const existingIdx = guestCart.findIndex(item => item.product.id === product.id);
            if (existingIdx > -1) {
                guestCart[existingIdx].quantity += quantity;
            } else {
                guestCart.push({ id: `guest-${Date.now()}`, product, quantity });
            }
            localStorage.setItem('guestCart', JSON.stringify(guestCart));
            setCartItems(guestCart);
            showToast(`${product.name} added to cart!`, 'success');
            return { success: true };
        }
    };

    const updateQuantity = async (cartItemId, quantity) => {
        const originalCart = [...cartItems];
        
        // Optimistically update local state for instant responsiveness
        setCartItems(prev => prev.map(item => 
            item.id === cartItemId ? { ...item, quantity } : item
        ));

        if (token) {
            try {
                let realId = cartItemId;
                if (isTempOrGuestId(cartItemId)) {
                    const res = await api.get('/cart');
                    const dbCart = res.data;
                    const tempItem = originalCart.find(item => item.id === cartItemId);
                    if (tempItem) {
                        const dbItem = dbCart.find(item => item.product.id === tempItem.product.id);
                        if (dbItem) {
                            realId = dbItem.id;
                        } else {
                            throw new Error('Item not found in database');
                        }
                    }
                }
                await api.put(`/cart/update/${realId}?quantity=${quantity}`);
            } catch (err) {
                setCartItems(originalCart);
                const message = err.response?.data?.message || err.message || 'Failed to update quantity';
                showToast(message, 'error');
            }
        } else {
            // Guest logic
            const guestCart = JSON.parse(localStorage.getItem('guestCart')) || [];
            const item = guestCart.find(item => item.id === cartItemId);
            if (item) {
                item.quantity = quantity;
                localStorage.setItem('guestCart', JSON.stringify(guestCart));
            }
            setCartItems(guestCart);
        }
    };

    const removeFromCart = async (cartItemId) => {
        const originalCart = [...cartItems];
        
        // Optimistically remove item from local state for instant responsiveness
        setCartItems(prev => prev.filter(item => item.id !== cartItemId));

        if (token) {
            try {
                let realId = cartItemId;
                if (isTempOrGuestId(cartItemId)) {
                    const res = await api.get('/cart');
                    const dbCart = res.data;
                    const tempItem = originalCart.find(item => item.id === cartItemId);
                    if (tempItem) {
                        const dbItem = dbCart.find(item => item.product.id === tempItem.product.id);
                        if (dbItem) {
                            realId = dbItem.id;
                        } else {
                            throw new Error('Item not found in database');
                        }
                    }
                }
                await api.delete(`/cart/remove/${realId}`);
                showToast('Item removed from cart.', 'info');
            } catch (err) {
                setCartItems(originalCart);
                const message = err.response?.data?.message || err.message || 'Failed to remove item';
                showToast(message, 'error');
            }
        } else {
            // Guest logic
            let guestCart = JSON.parse(localStorage.getItem('guestCart')) || [];
            guestCart = guestCart.filter(item => item.id !== cartItemId);
            localStorage.setItem('guestCart', JSON.stringify(guestCart));
            setCartItems(guestCart);
            showToast('Item removed from cart.', 'info');
        }
    };

    const clearCart = async () => {
        const originalCart = [...cartItems];
        setCartItems([]);

        if (token) {
            try {
                await api.delete('/cart/clear');
                showToast('Cart cleared.', 'info');
                await loadCart(false); // Background sync
            } catch (err) {
                setCartItems(originalCart);
                showToast('Failed to clear cart.', 'error');
                console.error('Error clearing cart in DB', err);
            }
        } else {
            localStorage.removeItem('guestCart');
            setCartItems([]);
            showToast('Cart cleared.', 'info');
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
