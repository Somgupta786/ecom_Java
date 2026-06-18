import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
    const { register } = useAuth();
    const navigate = useNavigate();
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [referredBy, setReferredBy] = useState('');
    
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // First Name: letters only, 2-30 chars
        const nameRegex = /^[a-zA-Z\s]{2,30}$/;
        if (!nameRegex.test(firstName.trim())) {
            setError('First name must contain only letters and be between 2 and 30 characters.');
            return;
        }

        // Last Name: optional, if entered must be letters only, 2-30 chars
        if (lastName.trim() && !nameRegex.test(lastName.trim())) {
            setError('Last name must contain only letters and be between 2 and 30 characters.');
            return;
        }

        // Email: standard pattern matching
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) {
            setError('Please enter a valid email address.');
            return;
        }

        // Password: min 6 chars, at least one letter and one number
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;
        if (!passwordRegex.test(password)) {
            setError('Password must be at least 6 characters and contain both letters and numbers.');
            return;
        }

        // Referral Code: optional, if entered validate it is alphanumeric
        if (referredBy.trim()) {
            const refRegex = /^[a-zA-Z0-9]{3,20}$/;
            if (!refRegex.test(referredBy.trim())) {
                setError('Invalid referral code format. Referral codes should be alphanumeric.');
                return;
            }
        }

        setSubmitting(true);
        const res = await register(email, password, firstName, lastName, referredBy);
        setSubmitting(false);
        if (res.success) {
            navigate('/');
        } else {
            setError(res.message);
        }
    };

    return (
        <div className="auth-box" style={{ maxWidth: '460px' }}>
            <h2>Create Account</h2>
            {error && (
                <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', padding: '10px 14px', borderRadius: '8px', marginBottom: '18px', fontSize: '14px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                    {error}
                </div>
            )}
            <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="form-group">
                        <label>First Name</label>
                        <input 
                            type="text" 
                            required 
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            placeholder="John"
                        />
                    </div>
                    <div className="form-group">
                        <label>Last Name</label>
                        <input 
                            type="text" 
                            required 
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            placeholder="Doe"
                        />
                    </div>
                </div>
                <div className="form-group">
                    <label>Email Address</label>
                    <input 
                        type="email" 
                        required 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="john.doe@example.com"
                    />
                </div>
                <div className="form-group">
                    <label>Password (Min. 6 characters)</label>
                    <input 
                        type="password" 
                        required 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                    />
                </div>
                <div className="form-group">
                    <label>Referral Code (Optional)</label>
                    <input 
                        type="text" 
                        value={referredBy}
                        onChange={(e) => setReferredBy(e.target.value)}
                        placeholder="REFERRALCODE123"
                    />
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Enter a friend's code to reward them with 50 points, and you'll get 10 points!
                    </span>
                </div>
                <button 
                    type="submit" 
                    className="btn btn-primary" 
                    style={{ width: '100%', marginTop: '10px' }}
                    disabled={submitting}
                >
                    {submitting ? 'Creating Account...' : 'Sign Up'}
                </button>
            </form>
            <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px', color: 'var(--text-secondary)' }}>
                Already have an account? <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 'bold' }}>Sign In</Link>
            </p>
        </div>
    );
}
