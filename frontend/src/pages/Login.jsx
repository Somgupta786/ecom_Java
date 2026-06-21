import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, ShieldCheck } from 'lucide-react';

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const redirect = searchParams.get('redirect');

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    
    const [errors, setErrors] = useState({
        email: '',
        password: ''
    });
    const [touched, setTouched] = useState({
        email: false,
        password: false
    });
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');

    // Real-time validations
    useEffect(() => {
        if (!email) {
            setErrors(prev => ({ ...prev, email: 'Email address is required.' }));
            return;
        }
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) {
            setErrors(prev => ({ ...prev, email: 'Please enter a valid email address.' }));
        } else {
            setErrors(prev => ({ ...prev, email: '' }));
        }
    }, [email]);

    useEffect(() => {
        if (!password) {
            setErrors(prev => ({ ...prev, password: 'Password is required.' }));
            return;
        }
        if (password.length < 6) {
            setErrors(prev => ({ ...prev, password: 'Password must be at least 6 characters.' }));
        } else {
            setErrors(prev => ({ ...prev, password: '' }));
        }
    }, [password]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitError('');

        // Block submit if validation fails
        const hasErrors = Object.values(errors).some(msg => msg !== '');
        if (hasErrors) {
            setSubmitError('Please fix validation errors first.');
            return;
        }

        setSubmitting(true);
        const res = await login(email, password);
        setSubmitting(false);

        if (res.success) {
            navigate(redirect ? `/${redirect}` : '/');
        } else {
            setSubmitError(res.message);
        }
    };

    const hasValidationErrors = Object.values(errors).some(msg => msg !== '') || !email || !password;

    return (
        <div className="auth-box">
            <h2>Welcome Back</h2>
            {submitError && (
                <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', padding: '10px 14px', borderRadius: '8px', marginBottom: '18px', fontSize: '14px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                    {submitError}
                </div>
            )}
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Email Address</label>
                    <input 
                        type="email" 
                        required 
                        disabled={submitting}
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value);
                            setTouched(prev => ({ ...prev, email: true }));
                        }}
                        placeholder="you@example.com"
                    />
                    {touched.email && errors.email && <span style={{ color: 'var(--error)', fontSize: '11px', marginTop: '4px', display: 'block' }}>{errors.email}</span>}
                </div>
                <div className="form-group">
                    <label>Password</label>
                    <input 
                        type="password" 
                        required 
                        disabled={submitting}
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value);
                            setTouched(prev => ({ ...prev, password: true }));
                        }}
                        placeholder="••••••••"
                    />
                    {touched.password && errors.password && <span style={{ color: 'var(--error)', fontSize: '11px', marginTop: '4px', display: 'block' }}>{errors.password}</span>}
                </div>
                <button 
                    type="submit" 
                    className="btn btn-primary" 
                    style={{ width: '100%', marginTop: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                    disabled={submitting || hasValidationErrors}
                >
                    {submitting ? (
                        <>
                            <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px', borderTopColor: '#fff', animationDuration: '0.6s' }}></div>
                            <span>Authenticating...</span>
                        </>
                    ) : 'Sign In'}
                </button>
            </form>
            <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px', color: 'var(--text-secondary)' }}>
                New to E-Commerce Lite? <Link to="/register" style={{ color: 'var(--accent)', fontWeight: 'bold' }}>Create Account</Link>
            </p>
            
            {/* Quick Demo Access */}
            <div className="demo-credentials-container">
                <div className="demo-title">Quick Demo Login</div>
                <div className="demo-buttons-grid">
                    <button 
                        type="button" 
                        className="demo-btn user-demo-btn" 
                        onClick={() => {
                            setEmail('user@ecommerce.com');
                            setPassword('user123');
                            setTouched({ email: true, password: true });
                        }}
                    >
                        <User size={16} />
                        <span>User Demo</span>
                    </button>
                    <button 
                        type="button" 
                        className="demo-btn admin-demo-btn" 
                        onClick={() => {
                            setEmail('admin@ecommerce.com');
                            setPassword('admin123');
                            setTouched({ email: true, password: true });
                        }}
                    >
                        <ShieldCheck size={16} />
                        <span>Admin Demo</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
