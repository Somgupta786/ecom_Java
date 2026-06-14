import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

const API_BASE = 'http://localhost:8080/api';

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token') || null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async (accessToken) => {
        try {
            const res = await fetch(`${API_BASE}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                setUser(data);
            } else {
                logout();
            }
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
            const res = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (res.ok) {
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
                return { success: true };
            } else {
                return { success: false, message: data.message || 'Login failed' };
            }
        } catch (err) {
            return { success: false, message: 'Server connection error' };
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
            const res = await fetch(`${API_BASE}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (res.ok) {
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
                return { success: true };
            } else {
                return { success: false, message: data.message || 'Registration failed' };
            }
        } catch (err) {
            return { success: false, message: 'Server connection error' };
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        setToken(null);
        setUser(null);
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
