import React, { createContext, useState, useEffect, useContext } from 'react';
import api, { setAccessToken } from '../services/api';
import { useToast } from './ToastContext';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const { showToast } = useToast();
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loggingOut, setLoggingOut] = useState(false);
    const [loggingOutAdmin, setLoggingOutAdmin] = useState(false);
    const [loggingIn, setLoggingIn] = useState(false);
    const [loggingInAdmin, setLoggingInAdmin] = useState(false);

    const fetchProfile = async () => {
        try {
            const res = await api.get('/auth/me');
            setUser(res.data);
        } catch (err) {
            console.error('Error fetching user profile', err);
            setToken(null);
            setAccessToken(null);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const bootstrapSession = async () => {
            try {
                // Attempt to silent refresh to bootstrap active session on page mount
                const res = await api.post('/auth/refresh');
                const { accessToken } = res.data;
                setToken(accessToken);
                setAccessToken(accessToken);
                
                // Fetch profile details
                const profileRes = await api.get('/auth/me');
                setUser(profileRes.data);
            } catch (err) {
                console.log('No active session found.');
            } finally {
                setLoading(false);
            }
        };

        bootstrapSession();

        // Listen for session expiry custom event triggered by Axios interceptor
        const handleAuthExpired = () => {
            setToken(null);
            setAccessToken(null);
            setUser(null);
            showToast('Session expired. Please log in again.', 'error');
        };

        window.addEventListener('auth-expired', handleAuthExpired);
        return () => window.removeEventListener('auth-expired', handleAuthExpired);
    }, []);

    const login = async (email, password) => {
        if (email && email.toLowerCase().includes('admin')) {
            setLoggingInAdmin(true);
        }
        setLoggingIn(true);
        setLoading(true);
        try {
            const res = await api.post('/auth/login', { email, password });
            const data = res.data;
            if (data && data.role === 'ROLE_ADMIN') {
                setLoggingInAdmin(true);
            }
            
            // Set access token in memory
            setToken(data.accessToken);
            setAccessToken(data.accessToken);
            
            setUser({
                email: data.email,
                role: data.role,
                rewardPoints: data.rewardPoints,
                referralCode: data.referralCode,
                firstName: data.firstName,
                lastName: data.lastName,
                addresses: []
            });
            
            // Fetch complete profile details (e.g. addresses)
            const profileRes = await api.get('/auth/me');
            setUser(profileRes.data);
            
            showToast('Welcome back!', 'success');
            return { success: true };
        } catch (err) {
            const message = err.response?.data?.message || 'Login failed';
            showToast(message, 'error');
            return { success: false, message };
        } finally {
            setLoggingIn(false);
            setLoggingInAdmin(false);
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
            
            // Set access token in memory
            setToken(data.accessToken);
            setAccessToken(data.accessToken);
            
            setUser({
                email: data.email,
                role: data.role,
                rewardPoints: data.rewardPoints,
                referralCode: data.referralCode,
                firstName: data.firstName,
                lastName: data.lastName,
                addresses: []
            });
            
            const profileRes = await api.get('/auth/me');
            setUser(profileRes.data);
            
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

    const logout = async () => {
        if (user && user.role === 'ROLE_ADMIN') {
            setLoggingOutAdmin(true);
        }
        setLoggingOut(true);
        try {
            await api.post('/auth/logout');
        } catch (err) {
            console.error('Error logging out from server', err);
        } finally {
            setTimeout(() => {
                setToken(null);
                setAccessToken(null);
                setUser(null);
                setLoggingOut(false);
                setLoggingOutAdmin(false);
                showToast('Logged out successfully.', 'info');
            }, 1000);
        }
    };

    const refreshProfile = async () => {
        if (token) {
            try {
                const res = await api.get('/auth/me');
                setUser(res.data);
            } catch (err) {
                console.error('Error refreshing profile', err);
            }
        }
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, loggingOut, loggingOutAdmin, loggingIn, loggingInAdmin, login, register, logout, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
