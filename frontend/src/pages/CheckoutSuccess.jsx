import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, Clipboard, Printer, Compass, ShoppingBag } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

export default function CheckoutSuccess() {
    const { token } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    
    const orderId = searchParams.get('orderId');
    const orderNumber = searchParams.get('orderNumber') || orderId;
    const trackingNumber = searchParams.get('trackingNumber');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!token) {
            navigate('/login');
        }
    }, [token, navigate]);

    const handleCopyTracking = () => {
        if (trackingNumber) {
            navigator.clipboard.writeText(trackingNumber);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', padding: '20px' }}>
            <div className="glass-panel bounce-in" style={{ maxWidth: '600px', width: '100%', textAlign: 'center', padding: '40px 32px' }}>
                <div className="pulse-success" style={{ display: 'inline-flex', borderRadius: '50%', padding: '12px', marginBottom: '24px', backgroundColor: 'rgba(16, 185, 129, 0.15)' }}>
                     <CheckCircle2 size={64} color="var(--success)" />
                </div>
                
                <h2 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '10px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Order Placed Successfully!
                </h2>
                
                <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginBottom: '30px', lineHeight: '1.6' }}>
                    Thank you for your purchase! Your payment has been verified, and your order has been registered in our system.
                </p>

                <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '24px', margin: '24px 0', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Order Reference</span>
                        <strong style={{ color: 'var(--text-primary)', fontFamily: "'Outfit', sans-serif" }}>#{orderNumber}</strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '14px' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Tracking Code</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <code style={{ color: 'var(--accent)', fontWeight: 'bold', fontSize: '14px', letterSpacing: '0.5px' }}>{trackingNumber || 'PENDING'}</code>
                            {trackingNumber && (
                                <button 
                                    onClick={handleCopyTracking}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: copied ? 'var(--success)' : 'var(--text-muted)', padding: '4px', borderRadius: '4px', transition: 'var(--transition)' }}
                                    title="Copy to Clipboard"
                                >
                                    <Clipboard size={14} />
                                </button>
                            )}
                        </div>
                    </div>
                    {copied && (
                        <div style={{ textAlign: 'right', fontSize: '11px', color: 'var(--success)', fontWeight: 'bold', marginTop: '-8px' }}>
                            ✓ Copied tracking number!
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '30px' }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button 
                            onClick={() => window.open(`${API_BASE}/orders/${orderId}/invoice?Authorization=Bearer ${token}`, '_blank')} 
                            className="btn btn-secondary" 
                            style={{ flex: 1, display: 'flex', gap: '8px', padding: '12px' }}
                        >
                            <Printer size={16} />
                            <span>Download Invoice</span>
                        </button>
                        
                        <button 
                            onClick={() => navigate(`/order-tracking?code=${trackingNumber}`)} 
                            className="btn btn-primary" 
                            style={{ flex: 1, display: 'flex', gap: '8px', padding: '12px' }}
                        >
                            <Compass size={16} />
                            <span>Track Order</span>
                        </button>
                    </div>

                    <button 
                        onClick={() => navigate('/')} 
                        className="btn btn-outline" 
                        style={{ display: 'flex', gap: '8px', padding: '12px', justifyContent: 'center' }}
                    >
                        <ShoppingBag size={16} />
                        <span>Continue Shopping</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
