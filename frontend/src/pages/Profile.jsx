import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { MapPin, Award, Share2, Clipboard, Printer, Package, XCircle } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

export default function Profile() {
    const { token, user, refreshProfile } = useAuth();
    const { showToast } = useToast();
    const [orders, setOrders] = useState([]);
    const [ordersLoading, setOrdersLoading] = useState(true);
    
    // Address form state
    const [street, setStreet] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [zipCode, setZipCode] = useState('');
    const [country, setCountry] = useState('United States');
    const [phone, setPhone] = useState('');
    const [addressMsg, setAddressMsg] = useState('');
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [submittingAddress, setSubmittingAddress] = useState(false);
    const [cancellingId, setCancellingId] = useState(null);

    // Referral state
    const [copied, setCopied] = useState(false);

    const fetchOrders = async (showLoader = true) => {
        if (showLoader) setOrdersLoading(true);
        try {
            const res = await api.get('/orders/history');
            setOrders(res.data);
        } catch (err) {
            console.error('Error fetching order history', err);
        } finally {
            if (showLoader) setOrdersLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchOrders();
        }
    }, [token]);

    const handleCopyReferral = () => {
        const refUrl = `${window.location.origin}/register?ref=${user?.referralCode}`;
        navigator.clipboard.writeText(refUrl);
        setCopied(true);
        showToast('Referral link copied to clipboard!', 'success');
        setTimeout(() => setCopied(false), 2000);
    };

    const handleAddAddress = async (e) => {
        e.preventDefault();
        setAddressMsg('');
        setSubmittingAddress(true);

        try {
            const newAddress = { street, city, state, zipCode, country, phone };
            await api.post('/auth/addresses', newAddress);
            showToast('Address added successfully!', 'success');
            setShowAddressForm(false);
            setStreet('');
            setCity('');
            setState('');
            setZipCode('');
            setPhone('');
            await refreshProfile();
        } catch (err) {
            showToast('Failed to update address book', 'error');
        } finally {
            setSubmittingAddress(false);
        }
    };

    const handleCancelOrder = async (orderId) => {
        if (!window.confirm('Are you sure you want to cancel this order?')) return;

        const originalOrders = [...orders];
        // Optimistically set order status to CANCELLED in local state
        setOrders(prev => prev.map(order => 
            order.id === orderId ? { ...order, status: 'CANCELLED' } : order
        ));

        setCancellingId(orderId);
        try {
            const res = await api.post(`/orders/${orderId}/cancel`);
            showToast('Order cancelled successfully.', 'info');
            // Update state with actual response
            setOrders(prev => prev.map(order => 
                order.id === orderId ? res.data : order
            ));
            fetchOrders(false); // Silent sync in background
            refreshProfile();
        } catch (err) {
            setOrders(originalOrders); // Revert on error
            const msg = err.response?.data?.message || 'Failed to cancel order';
            showToast(msg, 'error');
        } finally {
            setCancellingId(null);
        }
    };

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '32px' }} className="cart-layout">
            
            {/* Sidebar Column: Profile Stats, Referral, Addresses */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* Profile Overview */}
                <div className="cart-summary" style={{ position: 'static', width: '100%' }}>
                    <h3>Profile Management</h3>
                    <div style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>
                        <div style={{ marginBottom: '8px' }}>Name: <strong>{user?.firstName} {user?.lastName}</strong></div>
                        <div style={{ marginBottom: '8px' }}>Email: <strong>{user?.email}</strong></div>
                        <div style={{ marginBottom: '8px' }}>Account Status: <strong style={{ color: 'var(--success)' }}>Active</strong></div>
                    </div>
                </div>

                {/* Loyalty Program */}
                <div className="cart-summary" style={{ position: 'static', width: '100%' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Award size={20} color="var(--rating-color)" />
                        <span>Loyalty Rewards</span>
                    </h3>
                    <div style={{ marginTop: '12px' }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', fontFamily: 'var(--font-heading)' }}>
                            {user?.rewardPoints || 0} <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>points</span>
                        </div>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                            Value: <strong>${((user?.rewardPoints || 0) / 10).toFixed(2)}</strong> discount on next checkout.
                        </p>
                    </div>
                </div>

                {/* Referral Link Widget */}
                <div className="cart-summary" style={{ position: 'static', width: '100%' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Share2 size={18} color="var(--accent)" />
                        <span>Referral Program</span>
                    </h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: '1.4' }}>
                        Invite friends! When they register with your code, they get 10 points and you get 50 points ($5.00 value).
                    </p>
                    <div style={{ display: 'flex', marginTop: '14px', gap: '8px' }}>
                        <input 
                            type="text" 
                            readOnly 
                            value={user?.referralCode || ''} 
                            style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontSize: '14px', textAlign: 'center', fontWeight: 'bold' }}
                        />
                        <button onClick={handleCopyReferral} className="btn btn-secondary btn-sm" style={{ padding: '8px' }}>
                            <Clipboard size={16} />
                        </button>
                    </div>
                    {copied && <span style={{ color: 'var(--success)', fontSize: '11px', fontWeight: 'bold', display: 'block', marginTop: '6px', textAlign: 'center' }}>Link copied to clipboard!</span>}
                </div>

                {/* Address Book */}
                <div className="cart-summary" style={{ position: 'static', width: '100%' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <MapPin size={18} color="var(--accent)" />
                        <span>Address Book</span>
                    </h3>
                    
                    <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {user?.addresses?.length === 0 ? (
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No saved addresses.</p>
                        ) : (
                            user?.addresses?.map((addr, idx) => (
                                <div key={idx} style={{ fontSize: '13px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                                    {addr.street}, {addr.city}, {addr.state} {addr.zipCode}, {addr.country}
                                </div>
                            ))
                        )}
                    </div>

                    {!showAddressForm ? (
                        <button onClick={() => setShowAddressForm(true)} className="btn btn-outline btn-sm" style={{ width: '100%', marginTop: '14px' }}>
                            Add New Address
                        </button>
                    ) : (
                        <form onSubmit={handleAddAddress} style={{ marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                            <div className="form-group">
                                <input 
                                    type="text" 
                                    required 
                                    disabled={submittingAddress}
                                    placeholder="Street Address" 
                                    value={street}
                                    onChange={(e) => setStreet(e.target.value)}
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }} className="form-group">
                                <input 
                                    type="text" 
                                    required 
                                    disabled={submittingAddress}
                                    placeholder="City" 
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                />
                                <input 
                                    type="text" 
                                    required 
                                    disabled={submittingAddress}
                                    placeholder="State" 
                                    value={state}
                                    onChange={(e) => setState(e.target.value)}
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }} className="form-group">
                                <input 
                                    type="text" 
                                    required 
                                    disabled={submittingAddress}
                                    placeholder="Zip Code" 
                                    value={zipCode}
                                    onChange={(e) => setZipCode(e.target.value)}
                                />
                                <input 
                                    type="text" 
                                    required 
                                    disabled={submittingAddress}
                                    placeholder="Phone" 
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                />
                            </div>
                            <button type="submit" className="btn btn-primary btn-sm" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }} disabled={submittingAddress}>
                                {submittingAddress ? (
                                    <>
                                        <div className="spinner" style={{ width: '12px', height: '12px', borderWidth: '1.5px', borderTopColor: '#fff', animationDuration: '0.6s' }}></div>
                                        <span>Saving Address...</span>
                                    </>
                                ) : 'Save Address'}
                            </button>
                            <button type="button" onClick={() => setShowAddressForm(false)} className="btn btn-secondary btn-sm" style={{ width: '100%', marginTop: '8px' }} disabled={submittingAddress}>
                                Cancel
                            </button>
                        </form>
                    )}
                    {addressMsg && <span style={{ color: 'var(--success)', fontSize: '12px', display: 'block', marginTop: '8px' }}>{addressMsg}</span>}
                </div>
            </div>

            {/* Main History Column */}
            <div className="checkout-card" style={{ margin: 0, padding: '24px' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '22px', marginBottom: '20px' }}>
                    <Package size={22} color="var(--accent)" />
                    <span>Order Placement History</span>
                </h2>

                {ordersLoading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '40px 0', gap: '16px', color: 'var(--text-muted)' }}>
                        <div className="spinner animate-spin" style={{ width: '32px', height: '32px', border: '3px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%' }} />
                        <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: '15px', fontWeight: '500' }}>Loading history...</p>
                    </div>
                ) : orders.length === 0 ? (
                    <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>No orders placed yet.</div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {orders.map(order => (
                            <div 
                                key={order.id} 
                                style={{ border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px', backgroundColor: 'var(--bg-tertiary)' }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '12px' }}>
                                    <div>
                                        <strong>Order #{order.orderNumber || order.id}</strong>
                                        <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginLeft: '12px' }}>
                                            {order.orderDate ? order.orderDate.substring(0, 10) : ''}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <span 
                                            style={{
                                                fontSize: '11px',
                                                fontWeight: 'bold',
                                                padding: '2px 8px',
                                                borderRadius: '10px',
                                                backgroundColor: order.status === 'PAID' || order.status === 'DELIVERED' || order.status === 'SHIPPED' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                                color: order.status === 'PAID' || order.status === 'DELIVERED' || order.status === 'SHIPPED' ? 'var(--success)' : 'var(--error)'
                                            }}
                                        >
                                            {order.status}
                                        </span>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                        <div>Items: {order.orderItems?.reduce((acc, item) => acc + item.quantity, 0) || 0}</div>
                                        <div style={{ marginTop: '4px' }}>Tracking: <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{order.trackingNumber || 'UNASSIGNED'}</span></div>
                                        <div style={{ marginTop: '4px' }}>Total amount: <strong style={{ color: 'var(--accent)' }}>${order.totalAmount?.toFixed(2)}</strong></div>
                                    </div>
                                    
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button 
                                            onClick={() => window.open(`${API_BASE}/orders/${order.id}/invoice?Authorization=Bearer ${token}`, '_blank')}
                                            className="btn btn-secondary btn-sm"
                                            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                                        >
                                            <Printer size={14} />
                                            <span>Invoice</span>
                                        </button>
                                        {(order.status === 'PENDING' || order.status === 'PAID') && (
                                            <button 
                                                onClick={() => handleCancelOrder(order.id)}
                                                className="btn btn-outline btn-sm"
                                                style={{ color: 'var(--error)', borderColor: 'var(--error)', display: 'flex', alignItems: 'center', gap: '6px' }}
                                                disabled={cancellingId === order.id}
                                            >
                                                {cancellingId === order.id ? (
                                                    <>
                                                        <div className="spinner" style={{ width: '12px', height: '12px', borderWidth: '1.5px', borderTopColor: 'var(--error)', animationDuration: '0.6s' }}></div>
                                                        <span>Cancelling...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <XCircle size={14} />
                                                        <span>Cancel</span>
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
