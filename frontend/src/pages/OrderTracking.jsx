import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Compass, Search, Calendar, MapPin, ShieldAlert, ArrowLeft, PackageCheck } from 'lucide-react';
import api from '../services/api';

export default function OrderTracking() {
    const [searchParams, setSearchParams] = useSearchParams();
    const codeParam = searchParams.get('code') || '';
    
    const [trackingNumber, setTrackingNumber] = useState(codeParam);
    const [loading, setLoading] = useState(false);
    const [order, setOrder] = useState(null);
    const [error, setError] = useState('');

    const handleTrack = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        if (!trackingNumber.trim()) return;

        setLoading(true);
        setError('');
        setOrder(null);
        setSearchParams({ code: trackingNumber.trim() });

        try {
            const res = await api.get(`/orders/public/track/${trackingNumber.trim()}`);
            setOrder(res.data);
        } catch (err) {
            const msg = err.response?.data?.message || 'Tracking number not found. Please verify and try again.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (codeParam) {
            handleTrack();
        }
    }, [codeParam]);

    // Calculate step statuses
    const getStepStatus = (stepName) => {
        if (!order) return 'pending';
        const status = order.status;

        if (status === 'CANCELLED' || status === 'RETURNED') {
            return 'cancelled';
        }

        switch (stepName) {
            case 'PLACED':
                return ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED'].includes(status) ? 'completed' : 'pending';
            case 'PAID':
                if (status === 'PENDING') return 'active';
                return ['PAID', 'SHIPPED', 'DELIVERED'].includes(status) ? 'completed' : 'pending';
            case 'SHIPPED':
                if (status === 'PAID') return 'active';
                return ['SHIPPED', 'DELIVERED'].includes(status) ? 'completed' : 'pending';
            case 'DELIVERED':
                if (status === 'SHIPPED') return 'active';
                return status === 'DELIVERED' ? 'completed' : 'pending';
            default:
                return 'pending';
        }
    };

    return (
        <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px' }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div style={{ display: 'inline-flex', alignSelf: 'center', gap: '8px', alignItems: 'center', marginBottom: '12px', color: 'var(--accent)' }}>
                    <Compass size={32} />
                    <h1 style={{ fontSize: '32px', fontWeight: '800', margin: 0 }}>Real-Time Order Tracking</h1>
                </div>
                <p style={{ color: 'var(--text-secondary)' }}>Enter your tracking code to visualize shipping history and status.</p>
            </div>

            {/* Glass Search Box */}
            <div className="glass-panel" style={{ padding: '24px', marginBottom: '32px' }}>
                <form onSubmit={handleTrack} style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                        <input 
                            type="text" 
                            className="glass-input" 
                            required
                            placeholder="e.g. TRK411111111111" 
                            value={trackingNumber}
                            onChange={(e) => setTrackingNumber(e.target.value)}
                            style={{ width: '100%', paddingLeft: trackingNumber ? '16px' : '44px', height: '48px', transition: 'padding-left 0.2s ease' }}
                        />
                        {!trackingNumber && <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />}
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ padding: '0 28px', height: '48px' }} disabled={loading}>
                        {loading ? 'Searching...' : 'Track Package'}
                    </button>
                </form>
            </div>

            {/* Error Message */}
            {error && (
                <div className="glass-panel bounce-in" style={{ borderColor: 'rgba(239, 68, 68, 0.2)', backgroundColor: 'rgba(239, 68, 68, 0.05)', display: 'flex', alignItems: 'center', gap: '12px', padding: '20px' }}>
                    <ShieldAlert color="var(--error)" size={24} />
                    <span style={{ color: 'var(--error)', fontWeight: '500', fontSize: '15px' }}>{error}</span>
                </div>
            )}

            {/* Tracking Result Visualizer */}
            {order && (
                <div className="glass-panel bounce-in" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
                    {/* Header Summary */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '20px' }}>
                        <div>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>Active Order</span>
                            <h2 style={{ fontSize: '22px', marginTop: '4px' }}>#{order.id}</h2>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>Status</span>
                            <div style={{ 
                                marginTop: '4px', 
                                backgroundColor: order.status === 'DELIVERED' ? 'rgba(16, 185, 129, 0.15)' : order.status === 'CANCELLED' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                                color: order.status === 'DELIVERED' ? 'var(--success)' : order.status === 'CANCELLED' ? 'var(--error)' : 'var(--accent)',
                                padding: '4px 12px', 
                                borderRadius: '30px', 
                                fontSize: '13px', 
                                fontWeight: 'bold', 
                                display: 'inline-block' 
                            }}>
                                {order.status}
                            </div>
                        </div>
                    </div>

                    {/* Cancelled/Returned Notification */}
                    {(order.status === 'CANCELLED' || order.status === 'RETURNED') ? (
                        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '24px', borderRadius: '12px', textAlign: 'center' }}>
                            <ShieldAlert color="var(--error)" size={48} style={{ margin: '0 auto 12px auto' }} />
                            <h3 style={{ color: 'var(--error)', fontSize: '18px', fontWeight: 'bold' }}>This order has been cancelled or returned.</h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '6px' }}>
                                Inventory stocks have been restocked, and payment refunds (if applicable) have been processed.
                            </p>
                        </div>
                    ) : (
                        /* Standard Delivery Timeline */
                        <div>
                            <h3 style={{ fontSize: '18px', marginBottom: '20px' }}>Delivery Timeline</h3>
                            <div className="tracking-timeline">
                                <div className={`timeline-step ${getStepStatus('PLACED')}`}>
                                    <div className="timeline-node"></div>
                                    <div className="timeline-content">
                                        <div className="timeline-title">Order Placed</div>
                                        <div className="timeline-desc">We received your request and started verification.</div>
                                    </div>
                                </div>
                                <div className={`timeline-step ${getStepStatus('PAID')}`}>
                                    <div className="timeline-node"></div>
                                    <div className="timeline-content">
                                        <div className="timeline-title">Payment Confirmed</div>
                                        <div className="timeline-desc">Transaction completed. Order verified and preparing for shipment.</div>
                                    </div>
                                </div>
                                <div className={`timeline-step ${getStepStatus('SHIPPED')}`}>
                                    <div className="timeline-node"></div>
                                    <div className="timeline-content">
                                        <div className="timeline-title">Shipped & In Transit</div>
                                        <div className="timeline-desc">Your package is processed at the sorting facility and has departed.</div>
                                    </div>
                                </div>
                                <div className={`timeline-step ${getStepStatus('DELIVERED')}`}>
                                    <div className="timeline-node"></div>
                                    <div className="timeline-content">
                                        <div className="timeline-title">Delivered</div>
                                        <div className="timeline-desc">Package has been dropped off at the specified shipping address.</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Shipping Address details */}
                    <div style={{ backgroundColor: 'rgba(15, 23, 42, 0.4)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px' }}>
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', color: 'var(--text-primary)', marginBottom: '12px' }}>
                            <MapPin size={16} color="var(--accent)" />
                            <span>Destination details</span>
                        </h4>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
                            Delivering to: {order.shippingAddress?.city}, {order.shippingAddress?.state}, {order.shippingAddress?.country}
                        </p>
                    </div>

                    {/* Order Items */}
                    <div>
                        <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>Items In Package</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {order.orderItems?.map((item, idx) => (
                                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '10px', backgroundColor: 'var(--bg-tertiary)' }}>
                                    <img 
                                        src={item.imageUrl || "https://images.unsplash.com/photo-1535016120720-40c646be5580?w=80"} 
                                        alt={item.productName} 
                                        style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px' }}
                                    />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: '600', fontSize: '14px' }}>{item.productName}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Quantity: {item.quantity}</div>
                                    </div>
                                    <div style={{ fontWeight: 'bold', fontSize: '14px', color: 'var(--accent)' }}>
                                        ${(item.price * item.quantity).toFixed(2)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
