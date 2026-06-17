import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { MapPin, CreditCard, CheckCircle2, Ticket, Award, Printer, Package } from 'lucide-react';
import api from '../services/api';

const API_BASE = 'http://localhost:8080/api';

export default function Checkout() {
    const { cartItems, getCartTotal, clearCart } = useCart();
    const { token, user, refreshProfile } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [step, setStep] = useState(1); // 1: Shipping, 2: Payment, 3: Success
    
    useEffect(() => {
        const errorParam = searchParams.get('error');
        if (errorParam) {
            setCheckoutError(decodeURIComponent(errorParam));
            setStep(2);
        }
    }, [searchParams]);
    
    // Address state
    const [street, setStreet] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [zipCode, setZipCode] = useState('');
    const [country, setCountry] = useState('United States');
    const [phone, setPhone] = useState('');
    const [selectedAddressIdx, setSelectedAddressIdx] = useState(null);

    // Coupon & Points state
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [couponError, setCouponError] = useState('');
    const [usePoints, setUsePoints] = useState(false);

    // Payment state
    const [cardName, setCardName] = useState('');
    const [cardNumber, setCardNumber] = useState('4111 1111 1111 1111');
    const [cardExpiry, setCardExpiry] = useState('12/28');
    const [cardCvv, setCardCvv] = useState('123');
    const [paymentMethod, setPaymentMethod] = useState('RAZORPAY'); // 'RAZORPAY' or 'COD'
    const [paymentProcessing, setPaymentProcessing] = useState(false);
    
    // Result state
    const [placedOrder, setPlacedOrder] = useState(null);
    const [checkoutError, setCheckoutError] = useState('');

    useEffect(() => {
        if (!token) {
            navigate('/login?redirect=checkout');
        } else if (cartItems.length === 0 && step !== 3) {
            navigate('/cart');
        }
    }, [token, cartItems]);

    // Apply Coupon handler (local simulation matching backend logic)
    const handleApplyCoupon = async () => {
        setCouponError('');
        if (!couponCode.trim()) return;

        if (couponCode.trim().toUpperCase() === 'WELCOME10') {
            setAppliedCoupon({
                code: 'WELCOME10',
                percent: 10
            });
        } else {
            setCouponError('Invalid promo code');
            setAppliedCoupon(null);
        }
    };

    // Calculate totals matching backend formulas
    const subtotal = getCartTotal();
    const couponDiscount = appliedCoupon 
        ? subtotal * (appliedCoupon.percent / 100) 
        : 0;
    
    // Points calculation: 10 points = $1 discount
    const pointsDiscount = usePoints && user?.rewardPoints > 0
        ? Math.min(user.rewardPoints / 10, subtotal - couponDiscount)
        : 0;

    const netTotal = Math.max(0, subtotal - couponDiscount - pointsDiscount);
    const tax = netTotal * 0.05;
    const shipping = netTotal >= 100 ? 0 : 10.00;
    const orderTotal = netTotal + tax + shipping;

    const handleAddressSubmit = (e) => {
        e.preventDefault();
        setStep(2);
    };

    const handleSelectSavedAddress = (idx) => {
        const addr = user.addresses[idx];
        setStreet(addr.street);
        setCity(addr.city);
        setState(addr.state);
        setZipCode(addr.zipCode);
        setCountry(addr.country);
        setPhone(addr.phone);
        setSelectedAddressIdx(idx);
    };

    const handlePlaceOrder = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        setPaymentProcessing(true);
        setCheckoutError('');

        if (paymentMethod === 'RAZORPAY' && !window.Razorpay) {
            setCheckoutError('Razorpay SDK failed to load. Please check your internet connection and try again.');
            setPaymentProcessing(false);
            return;
        }

        const finalAddress = {
            street, city, state, zipCode, country, phone
        };

        try {
            // 1. Place Order in local database (creates pending order and Razorpay order if online)
            const placeRes = await api.post('/orders', {
                shippingAddress: finalAddress,
                couponCode: appliedCoupon ? appliedCoupon.code : null,
                usePoints: usePoints,
                paymentMethod: paymentMethod
            });

            const orderData = placeRes.data;

            if (paymentMethod === 'COD') {
                clearCart();
                await refreshProfile(); // Refresh loyalty points
                navigate(`/checkout-success?orderId=${orderData.id}&trackingNumber=${orderData.trackingNumber}`);
            } else {
                // 2. Configure Razorpay payment options
                const options = {
                    key: orderData.razorpayKey || 'rzp_test_ROYjaNT8463J8l',
                    amount: Math.round(orderTotal * 80 * 100), // convert to paise in INR (1 USD = 80 INR)
                    currency: 'INR',
                    name: 'E-Commerce Lite',
                    description: `Order Payment for #${orderData.id}`,
                    order_id: orderData.razorpayOrderId,
                    callback_url: `${API_BASE}/orders/public/verify-payment-redirect/${orderData.id}`,
                    prefill: {
                        name: `${user?.firstName || ''} ${user?.lastName || ''}`,
                        email: user?.email || '',
                        contact: phone
                    },
                    notes: {
                        address: `${street}, ${city}, ${state} ${zipCode}`
                    },
                    theme: {
                        color: '#6366f1' // match project accent color
                    },
                    modal: {
                        ondismiss: function () {
                            setPaymentProcessing(false);
                        }
                    }
                };

                const rzp = new window.Razorpay(options);
                rzp.open();
            }
        } catch (err) {
            setCheckoutError(err.message || 'Server error during checkout initialization');
            setPaymentProcessing(false);
        }
    };

    return (
        <div>
            {/* Steps Indicator */}
            <div className="checkout-steps">
                <div className={`step-indicator ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
                    <div className="step-number">1</div>
                    <span className="step-label">Shipping</span>
                </div>
                <div className={`step-indicator ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
                    <div className="step-number">2</div>
                    <span className="step-label">Payment</span>
                </div>
                <div className={`step-indicator ${step === 3 ? 'active' : ''} ${step === 3 ? 'completed' : ''}`}>
                    <div className="step-number">3</div>
                    <span className="step-label">Receipt</span>
                </div>
            </div>

            {/* Step 1: Shipping Address */}
            {step === 1 && (
                <div className="checkout-card">
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', fontSize: '22px' }}>
                        <MapPin size={22} color="var(--accent)" />
                        <span>Shipping Address</span>
                    </h2>

                    {/* Saved Addresses List */}
                    {user?.addresses?.length > 0 && (
                        <div style={{ marginBottom: '24px' }}>
                            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '10px' }}>Choose from saved addresses:</p>
                            <div className="address-grid">
                                {user.addresses.map((addr, idx) => (
                                    <div 
                                        key={idx} 
                                        onClick={() => handleSelectSavedAddress(idx)}
                                        className={`address-card ${selectedAddressIdx === idx ? 'selected' : ''}`}
                                    >
                                        <strong>{user.firstName} {user.lastName}</strong>
                                        <p style={{ fontSize: '13px', marginTop: '6px', color: 'var(--text-secondary)' }}>
                                            {addr.street}, {addr.city}<br/>
                                            {addr.state} {addr.zipCode}, {addr.country}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleAddressSubmit}>
                        <div className="form-group">
                            <label>Street Address</label>
                            <input 
                                type="text" 
                                required 
                                value={street}
                                onChange={(e) => setStreet(e.target.value)}
                                placeholder="123 Digital Ave"
                            />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div className="form-group">
                                <label>City</label>
                                <input 
                                    type="text" 
                                    required 
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                    placeholder="Tech City"
                                />
                            </div>
                            <div className="form-group">
                                <label>State / Province</label>
                                <input 
                                    type="text" 
                                    required 
                                    value={state}
                                    onChange={(e) => setState(e.target.value)}
                                    placeholder="CA"
                                />
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div className="form-group">
                                <label>Zip / Postal Code</label>
                                <input 
                                    type="text" 
                                    required 
                                    value={zipCode}
                                    onChange={(e) => setZipCode(e.target.value)}
                                    placeholder="94016"
                                />
                            </div>
                            <div className="form-group">
                                <label>Country</label>
                                <select 
                                    value={country} 
                                    onChange={(e) => setCountry(e.target.value)}
                                >
                                    <option value="United States">United States</option>
                                    <option value="India">India</option>
                                    <option value="United Kingdom">United Kingdom</option>
                                    <option value="Canada">Canada</option>
                                </select>
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Contact Phone Number</label>
                            <input 
                                type="tel" 
                                required 
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="+1 (555) 019-2834"
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '16px' }}>
                            Continue to Payment
                        </button>
                    </form>
                </div>
            )}

            {/* Step 2: Payment Selector & Options */}
            {step === 2 && (
                <div className="cart-layout" style={{ maxWidth: '960px', margin: '0 auto' }}>
                    <div className="checkout-card" style={{ flex: 1, margin: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                            <h2 style={{ fontSize: '22px', marginBottom: '24px' }}>Choose Payment Method</h2>

                            {checkoutError && (
                                <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', padding: '10px 14px', borderRadius: '8px', marginBottom: '18px', fontSize: '14px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                    {checkoutError}
                                </div>
                            )}

                            {/* Payment Tabs */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                                <div 
                                    onClick={() => setPaymentMethod('RAZORPAY')}
                                    style={{ 
                                        padding: '16px', 
                                        borderRadius: '12px', 
                                        border: `2px solid ${paymentMethod === 'RAZORPAY' ? 'var(--accent)' : 'var(--border-color)'}`, 
                                        backgroundColor: paymentMethod === 'RAZORPAY' ? 'rgba(99, 102, 241, 0.05)' : 'var(--bg-tertiary)', 
                                        cursor: 'pointer',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '8px',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <CreditCard size={24} color={paymentMethod === 'RAZORPAY' ? 'var(--accent)' : 'var(--text-secondary)'} />
                                    <span style={{ fontSize: '14px', fontWeight: '600', color: paymentMethod === 'RAZORPAY' ? 'var(--text-primary)' : 'var(--text-secondary)' }}>Pay Online</span>
                                </div>
                                <div 
                                    onClick={() => setPaymentMethod('COD')}
                                    style={{ 
                                        padding: '16px', 
                                        borderRadius: '12px', 
                                        border: `2px solid ${paymentMethod === 'COD' ? 'var(--accent)' : 'var(--border-color)'}`, 
                                        backgroundColor: paymentMethod === 'COD' ? 'rgba(99, 102, 241, 0.05)' : 'var(--bg-tertiary)', 
                                        cursor: 'pointer',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '8px',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <Package size={24} color={paymentMethod === 'COD' ? 'var(--accent)' : 'var(--text-secondary)'} />
                                    <span style={{ fontSize: '14px', fontWeight: '600', color: paymentMethod === 'COD' ? 'var(--text-primary)' : 'var(--text-secondary)' }}>Cash on Delivery</span>
                                </div>
                            </div>

                            {/* Dynamic info boxes based on selected payment method */}
                            {paymentMethod === 'RAZORPAY' ? (
                                <div>
                                    <div style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
                                        <h4 style={{ margin: '0 0 10px 0', fontSize: '15px', color: 'var(--text-primary)' }}>Razorpay Test Mode Info</h4>
                                        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                                            <li>This integration uses official Razorpay APIs in <strong>Test Mode</strong>.</li>
                                            <li>When the checkout modal opens, you can choose any payment method (UPI, Card, Netbanking).</li>
                                            <li>For Card payments, you can use any dummy card or click the "Success" simulation button in UPI/Netbanking.</li>
                                            <li>Currency will automatically be converted to INR for domestic test card processing (1 USD ≈ 80 INR).</li>
                                        </ul>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', margin: '30px 0', color: 'var(--text-muted)', fontSize: '12px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <CheckCircle2 size={14} color="var(--success)" />
                                            <span>Razorpay Verified Merchant</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <CheckCircle2 size={14} color="var(--success)" />
                                            <span>256-bit SSL Encryption</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <div style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
                                        <h4 style={{ margin: '0 0 10px 0', fontSize: '15px', color: 'var(--text-primary)' }}>COD Order Information</h4>
                                        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                                            <li>No online or upfront payment is required today.</li>
                                            <li>You will pay the total amount in cash or card to the delivery agent once the package reaches your address.</li>
                                            <li>A tracking code will be generated instantly for order status checks.</li>
                                        </ul>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', margin: '30px 0', color: 'var(--text-muted)', fontSize: '12px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <CheckCircle2 size={14} color="var(--success)" />
                                            <span>Pay at your Doorstep</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <CheckCircle2 size={14} color="var(--success)" />
                                            <span>Instant Order Confirmation</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                            <button type="button" onClick={() => setStep(1)} className="btn btn-secondary" style={{ flex: 1 }}>
                                Back to Shipping
                            </button>
                            {paymentMethod === 'RAZORPAY' ? (
                                <button type="button" onClick={handlePlaceOrder} className="btn btn-primary" style={{ flex: 2 }} disabled={paymentProcessing}>
                                    {paymentProcessing ? 'Opening Payment Window...' : `Pay $${orderTotal.toFixed(2)} with Razorpay`}
                                </button>
                            ) : (
                                <button type="button" onClick={handlePlaceOrder} className="btn btn-primary" style={{ flex: 2 }} disabled={paymentProcessing}>
                                    {paymentProcessing ? 'Confirming Order...' : `Confirm Order (COD) - $${orderTotal.toFixed(2)}`}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Summary Sidebar with Coupons / Points */}
                    <div className="cart-summary" style={{ position: 'static', width: '100%', height: 'fit-content' }}>
                        <h3>Checkout Summary</h3>
                        
                        {/* Coupon Application */}
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                                <Ticket size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                                <span>Apply Coupon Code</span>
                            </label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input 
                                    type="text" 
                                    placeholder="WELCOME10" 
                                    value={couponCode} 
                                    onChange={(e) => setCouponCode(e.target.value)}
                                    style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
                                />
                                <button type="button" onClick={handleApplyCoupon} className="btn btn-secondary btn-sm">
                                    Apply
                                </button>
                            </div>
                            {couponError && <span style={{ color: 'var(--error)', fontSize: '11px', fontWeight: 'bold', display: 'block', marginTop: '4px' }}>{couponError}</span>}
                            {appliedCoupon && <span style={{ color: 'var(--success)', fontSize: '11px', fontWeight: 'bold', display: 'block', marginTop: '4px' }}>✓ Coupon Applied: {appliedCoupon.code} ({appliedCoupon.percent}% off)</span>}
                        </div>

                        {/* Points Redemption */}
                        {user?.rewardPoints > 0 && (
                            <div style={{ marginBottom: '24px', backgroundColor: 'var(--bg-tertiary)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Award size={16} color="var(--rating-color)" />
                                        <span style={{ fontSize: '13px', fontWeight: '500' }}>Redeem Reward Points</span>
                                    </div>
                                    <input 
                                        type="checkbox" 
                                        checked={usePoints} 
                                        onChange={(e) => setUsePoints(e.target.checked)}
                                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                    />
                                </div>
                                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                                    You have <strong>{user.rewardPoints}</strong> reward points. Checking this will apply a discount of up to <strong>${(user.rewardPoints / 10).toFixed(2)}</strong>.
                                </p>
                            </div>
                        )}

                        <div className="summary-row">
                            <span>Subtotal</span>
                            <span>${subtotal.toFixed(2)}</span>
                        </div>
                        {couponDiscount > 0 && (
                            <div className="summary-row" style={{ color: 'var(--success)' }}>
                                <span>Coupon discount</span>
                                <span>-${couponDiscount.toFixed(2)}</span>
                            </div>
                        )}
                        {pointsDiscount > 0 && (
                            <div className="summary-row" style={{ color: 'var(--success)' }}>
                                <span>Loyalty reward discount</span>
                                <span>-${pointsDiscount.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="summary-row">
                            <span>Sales Tax (5%)</span>
                            <span>${tax.toFixed(2)}</span>
                        </div>
                        <div className="summary-row">
                            <span>Shipping fee</span>
                            <span>{shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}</span>
                        </div>
                        <div style={{ borderBottom: '1px solid var(--border-color)', margin: '14px 0' }}></div>
                        <div className="summary-row" style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
                            <span>Total Charge</span>
                            <span>${orderTotal.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Step 3: Success Receipt Download */}
            {step === 3 && placedOrder && (
                <div style={{ textAlign: 'center', maxWidth: '600px', margin: '40px auto', padding: '40px 32px' }} className="checkout-card">
                    <CheckCircle2 size={64} color="var(--success)" style={{ margin: '0 auto 20px auto' }} />
                    <h2 style={{ fontSize: '28px', marginBottom: '8px' }}>Payment Verified!</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
                        Thank you for your purchase. Your order <strong>#{placedOrder.id}</strong> has been successfully placed.
                    </p>

                    <div style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px', margin: '24px 0', textAlign: 'left' }}>
                        <div><strong>Tracking Code:</strong> <span style={{ color: 'var(--accent)', fontWeight: 'bold', fontFamily: 'monospace' }}>{placedOrder.trackingNumber || 'PENDING'}</span></div>
                        <div style={{ marginTop: '8px' }}><strong>Shipping To:</strong> {placedOrder.shippingAddress?.street}, {placedOrder.shippingAddress?.city}</div>
                        <div style={{ marginTop: '8px' }}><strong>Amount Charged:</strong> ${placedOrder.totalAmount?.toFixed(2)}</div>
                    </div>

                    <div style={{ display: 'flex', gap: '16px' }}>
                        <button 
                            onClick={() => window.open(`${API_BASE}/orders/${placedOrder.id}/invoice?Authorization=Bearer ${token}`, '_blank')} 
                            className="btn btn-secondary" 
                            style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                        >
                            <Printer size={16} />
                            <span>Print Invoice PDF</span>
                        </button>
                        <button onClick={() => navigate('/')} className="btn btn-primary" style={{ flex: 1 }}>
                            Return Storefront
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
