import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Register() {
    const { register } = useAuth();
    const navigate = useNavigate();
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [referredBy, setReferredBy] = useState('');
    
    const [errors, setErrors] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        referredBy: ''
    });
    const [touched, setTouched] = useState({
        firstName: false,
        lastName: false,
        email: false,
        password: false,
        referredBy: false
    });
    const [isCheckingEmail, setIsCheckingEmail] = useState(false);
    const [emailAvailable, setEmailAvailable] = useState(null); // null, true, false
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');

    // Real-time validations
    useEffect(() => {
        if (!firstName) {
            setErrors(prev => ({ ...prev, firstName: 'First name is required.' }));
            return;
        }
        const nameRegex = /^[a-zA-Z\s]{2,30}$/;
        if (!nameRegex.test(firstName.trim())) {
            setErrors(prev => ({ ...prev, firstName: 'First name must contain only letters (2-30 chars).' }));
        } else {
            setErrors(prev => ({ ...prev, firstName: '' }));
        }
    }, [firstName]);

    useEffect(() => {
        if (!lastName.trim()) {
            setErrors(prev => ({ ...prev, lastName: '' }));
            return;
        }
        const nameRegex = /^[a-zA-Z\s]{2,30}$/;
        if (!nameRegex.test(lastName.trim())) {
            setErrors(prev => ({ ...prev, lastName: 'Last name must contain only letters (2-30 chars).' }));
        } else {
            setErrors(prev => ({ ...prev, lastName: '' }));
        }
    }, [lastName]);

    useEffect(() => {
        if (!email) {
            setErrors(prev => ({ ...prev, email: 'Email address is required.' }));
            setEmailAvailable(null);
            return;
        }
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) {
            setErrors(prev => ({ ...prev, email: 'Please enter a valid email address.' }));
            setEmailAvailable(null);
            return;
        }
        
        setErrors(prev => ({ ...prev, email: '' }));
        setEmailAvailable(null);

        const delayDebounce = setTimeout(async () => {
            setIsCheckingEmail(true);
            try {
                const res = await api.get(`/auth/check-email?email=${encodeURIComponent(email)}`);
                if (res.data.exists) {
                    setErrors(prev => ({ ...prev, email: 'Email is already registered.' }));
                    setEmailAvailable(false);
                } else {
                    setEmailAvailable(true);
                }
            } catch (err) {
                console.error('Error checking email', err);
            } finally {
                setIsCheckingEmail(false);
            }
        }, 500);

        return () => clearTimeout(delayDebounce);
    }, [email]);

    useEffect(() => {
        if (!password) {
            setErrors(prev => ({ ...prev, password: 'Password is required.' }));
            return;
        }
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;
        if (!passwordRegex.test(password)) {
            setErrors(prev => ({ ...prev, password: 'Password must be at least 6 characters and contain both letters and numbers.' }));
        } else {
            setErrors(prev => ({ ...prev, password: '' }));
        }
    }, [password]);

    useEffect(() => {
        if (!referredBy.trim()) {
            setErrors(prev => ({ ...prev, referredBy: '' }));
            return;
        }
        const refRegex = /^[a-zA-Z0-9]{3,20}$/;
        if (!refRegex.test(referredBy.trim())) {
            setErrors(prev => ({ ...prev, referredBy: 'Referral code must be alphanumeric (3-20 chars).' }));
        } else {
            setErrors(prev => ({ ...prev, referredBy: '' }));
        }
    }, [referredBy]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitError('');

        // Block submit if validation fails
        const hasErrors = Object.values(errors).some(msg => msg !== '') || emailAvailable === false;
        if (hasErrors) {
            setSubmitError('Please fix the errors before registering.');
            return;
        }

        setSubmitting(true);
        const res = await register(email, password, firstName, lastName, referredBy);
        setSubmitting(false);
        
        if (res.success) {
            navigate('/');
        } else {
            setSubmitError(res.message);
        }
    };

    const hasValidationErrors = Object.values(errors).some(msg => msg !== '') || 
                                 emailAvailable === false || 
                                 !firstName || 
                                 !email || 
                                 !password;

    return (
        <div className="auth-box" style={{ maxWidth: '460px' }}>
            <h2>Create Account</h2>
            {submitError && (
                <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', padding: '10px 14px', borderRadius: '8px', marginBottom: '18px', fontSize: '14px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                    {submitError}
                </div>
            )}
            <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="form-group">
                        <label>First Name</label>
                        <input 
                            type="text" 
                            required 
                            disabled={submitting}
                            value={firstName}
                            onChange={(e) => {
                                setFirstName(e.target.value);
                                setTouched(prev => ({ ...prev, firstName: true }));
                            }}
                            placeholder="John"
                        />
                        {touched.firstName && errors.firstName && <span style={{ color: 'var(--error)', fontSize: '11px', marginTop: '4px', display: 'block' }}>{errors.firstName}</span>}
                    </div>
                    <div className="form-group">
                        <label>Last Name</label>
                        <input 
                            type="text" 
                            required 
                            disabled={submitting}
                            value={lastName}
                            onChange={(e) => {
                                setLastName(e.target.value);
                                setTouched(prev => ({ ...prev, lastName: true }));
                            }}
                            placeholder="Doe"
                        />
                        {touched.lastName && errors.lastName && <span style={{ color: 'var(--error)', fontSize: '11px', marginTop: '4px', display: 'block' }}>{errors.lastName}</span>}
                    </div>
                </div>
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
                        placeholder="john.doe@example.com"
                    />
                    {touched.email && isCheckingEmail && <span style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '4px', display: 'block' }}>Checking availability...</span>}
                    {touched.email && !isCheckingEmail && emailAvailable === true && <span style={{ color: 'var(--success)', fontSize: '11px', marginTop: '4px', display: 'block', fontWeight: 'bold' }}>✓ Email is available!</span>}
                    {touched.email && !isCheckingEmail && errors.email && <span style={{ color: 'var(--error)', fontSize: '11px', marginTop: '4px', display: 'block' }}>{errors.email}</span>}
                </div>
                <div className="form-group">
                    <label>Password (Min. 6 characters)</label>
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
                <div className="form-group">
                    <label>Referral Code (Optional)</label>
                    <input 
                        type="text" 
                        disabled={submitting}
                        value={referredBy}
                        onChange={(e) => {
                            setReferredBy(e.target.value);
                            setTouched(prev => ({ ...prev, referredBy: true }));
                        }}
                        placeholder="REFERRALCODE123"
                    />
                    {touched.referredBy && errors.referredBy && <span style={{ color: 'var(--error)', fontSize: '11px', marginTop: '4px', display: 'block' }}>{errors.referredBy}</span>}
                    {(!touched.referredBy || !errors.referredBy) && (
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            Enter a friend's code to reward them with 50 points, and you'll get 10 points!
                        </span>
                    )}
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
                            <span>Creating Account...</span>
                        </>
                    ) : 'Sign Up'}
                </button>
            </form>
            <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px', color: 'var(--text-secondary)' }}>
                Already have an account? <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 'bold' }}>Sign In</Link>
            </p>
        </div>
    );
}
