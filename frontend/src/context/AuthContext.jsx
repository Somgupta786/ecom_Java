import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { useToast } from './ToastContext';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const { showToast } = useToast();
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token') || null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async (accessToken) => {
        try {
            const res = await api.get('/auth/me', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });
            setUser(res.data);
        } catch (err) {
            console.error('Error fetching user profile', err);
            logout();
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            setToken(storedToken);
            fetchProfile(storedToken);
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (email, password) => {
        setLoading(true);
        try {
            const res = await api.post('/auth/login', { email, password });
            const data = res.data;
            localStorage.setItem('token', data.accessToken);
            localStorage.setItem('refreshToken', data.refreshToken);
            setToken(data.accessToken);
            // Set initial user details, then fetch full profile to get address lists
            setUser({
                email: data.email,
                role: data.role,
                rewardPoints: data.rewardPoints,
                referralCode: data.referralCode,
                firstName: data.firstName,
                lastName: data.lastName,
                addresses: []
            });
            await fetchProfile(data.accessToken);
            showToast('Welcome back!', 'success');
            return { success: true };
        } catch (err) {
            const message = err.response?.data?.message || 'Login failed';
            showToast(message, 'error');
            return { success: false, message };
        } finally {
            setLoading(false);
        }
    };

    const register = async (email, password, firstName, lastName, referredBy) => {
        setLoading(true);
        try {
            const payload = { email, password, firstName, lastName };
            if (referredBy && referredBy.trim() !== '') {
                payload.referredBy = referredBy;
            }
            const res = await api.post('/auth/register', payload);
            const data = res.data;
            localStorage.setItem('token', data.accessToken);
            localStorage.setItem('refreshToken', data.refreshToken);
            setToken(data.accessToken);
            setUser({
                email: data.email,
                role: data.role,
                rewardPoints: data.rewardPoints,
                referralCode: data.referralCode,
                firstName: data.firstName,
                lastName: data.lastName,
                addresses: []
            });
            await fetchProfile(data.accessToken);
            showToast('Account created successfully!', 'success');
            return { success: true };
        } catch (err) {
            const message = err.response?.data?.message || 'Registration failed';
            showToast(message, 'error');
            return { success: false, message };
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        setToken(null);
        setUser(null);
        showToast('Logged out successfully.', 'info');
    };

    const refreshProfile = async () => {
        if (token) {
            await fetchProfile(token);
        }
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, register, logout, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
