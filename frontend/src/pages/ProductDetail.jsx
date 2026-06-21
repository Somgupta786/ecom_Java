import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/ProductCard';
import { Star, ShieldAlert, CheckCircle2, MessageSquarePlus } from 'lucide-react';
import api from '../services/api';

export default function ProductDetail() {
    const { id } = useParams();
    const { addToCart, cartItems } = useCart();
    const { token, user } = useAuth();
    
    const [product, setProduct] = useState(null);
    const [related, setRelated] = useState([]);
    const [reviews, setReviews] = useState([]);
    
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(true);
    const [added, setAdded] = useState(false);
    const [adding, setAdding] = useState(false);
    const [submittingReview, setSubmittingReview] = useState(false);

    const cartItem = cartItems?.find(item => item.product.id === product?.id);
    const quantityInCart = cartItem ? cartItem.quantity : 0;
    
    // Review form state
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [reviewError, setReviewError] = useState('');
    const [reviewSuccess, setReviewSuccess] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const prodRes = await api.get(`/products/${id}`);
            setProduct(prodRes.data);

            const relatedRes = await api.get(`/products/${id}/related`);
            setRelated(relatedRes.data);

            const reviewRes = await api.get(`/products/${id}/reviews`);
            setReviews(reviewRes.data);
        } catch (err) {
            console.error('Error fetching product details', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        setQuantity(1);
        setReviewSuccess(false);
        setComment('');
        setRating(5);
    }, [id]);

    const handleAddToCart = async () => {
        if (!product) return;
        setAdding(true);
        await addToCart(product, quantity);
        setAdded(true);
        setAdding(false);
        setTimeout(() => setAdded(false), 2000);
    };

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        setReviewError('');
        setReviewSuccess(false);

        if (!token) {
            setReviewError('You must be signed in to submit a review.');
            return;
        }

        setSubmittingReview(true);
        try {
            await api.post(`/products/${id}/reviews`, { rating, comment });
            setReviewSuccess(true);
            setComment('');
            setRating(5);
            // Reload data to show new review and update average rating
            const reviewRes = await api.get(`/products/${id}/reviews`);
            setReviews(reviewRes.data);
            const prodRes = await api.get(`/products/${id}`);
            setProduct(prodRes.data);
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to submit review';
            setReviewError(msg);
        } finally {
            setSubmittingReview(false);
        }
    };

    const renderStars = (ratingVal) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <Star 
                    key={i} 
                    size={16} 
                    fill={i <= ratingVal ? 'var(--rating-color)' : 'none'} 
                    color={i <= ratingVal ? 'var(--rating-color)' : 'var(--text-muted)'} 
                />
            );
        }
        return stars;
    };

    if (loading) {
        return <div style={{ textAlign: 'center', padding: '100px 0', fontSize: '18px', color: 'var(--text-muted)' }}>Loading premium details...</div>;
    }

    if (!product) {
        return <div style={{ textAlign: 'center', padding: '100px 0', fontSize: '18px', color: 'var(--error)' }}>Product not found.</div>;
    }

    return (
        <div className="product-detail-container">
            <div className="detail-grid">
                <div className="detail-img-container">
                    <img src={product.imageUrl} alt={product.name} className="detail-img" />
                </div>
                <div className="detail-info">
                    <span className="product-card-category" style={{ fontSize: '14px', marginBottom: '8px' }}>
                        {product.category?.name || 'Catalog'}
                    </span>
                    <h1 className="detail-title">{product.name}</h1>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                        <div style={{ display: 'flex' }}>
                            {renderStars(product.rating)}
                        </div>
                        <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                            <strong>{product.rating.toFixed(1)}</strong> ({product.reviewCount} customer reviews)
                        </span>
                    </div>

                    <div className="detail-price">${product.price.toFixed(2)}</div>
                    
                    <p className="detail-desc">{product.description}</p>
                    
                    <div className="detail-meta">
                        <div><span>SKU:</span> <strong>{product.sku}</strong></div>
                        <div><span>Availability:</span> {product.stock > 0 ? (
                            <strong style={{ color: 'var(--success)' }}>In Stock ({product.stock} units)</strong>
                        ) : (
                            <strong style={{ color: 'var(--error)' }}>Out of Stock</strong>
                        )}</div>
                    </div>

                    {product.stock > 0 && (
                        <>
                            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '4px' }}>
                                    <button 
                                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                        className="btn btn-secondary btn-sm"
                                        style={{ padding: '6px 12px' }}
                                    >
                                        -
                                    </button>
                                    <span style={{ padding: '0 16px', fontWeight: 'bold' }}>{quantity}</span>
                                    <button 
                                        onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                                        className="btn btn-secondary btn-sm"
                                        style={{ padding: '6px 12px' }}
                                    >
                                        +
                                    </button>
                                </div>
                                <button 
                                    onClick={handleAddToCart} 
                                    className={`btn ${added ? 'btn-success' : 'btn-primary'}`} 
                                    style={{ 
                                        flex: 1,
                                        backgroundColor: added ? 'var(--success)' : undefined,
                                        borderColor: added ? 'var(--success)' : undefined,
                                        display: 'flex',
                                        gap: '8px',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        transition: 'var(--transition)'
                                    }}
                                    disabled={added || adding}
                                >
                                    {adding ? (
                                        <>
                                            <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px', borderTopColor: '#fff', animationDuration: '0.6s' }}></div>
                                            <span>Adding...</span>
                                        </>
                                    ) : added ? (
                                        <>
                                            <CheckCircle2 size={16} />
                                            <span>Added</span>
                                        </>
                                    ) : (
                                        <span>Add to Cart</span>
                                    )}
                                </button>
                            </div>
                            {quantityInCart > 0 && (
                                <div style={{ 
                                    marginTop: '16px', 
                                    padding: '10px 14px', 
                                    borderRadius: '8px', 
                                    backgroundColor: 'var(--accent-light)', 
                                    border: '1px solid rgba(99, 102, 241, 0.2)', 
                                    color: 'var(--accent)', 
                                    fontSize: '13px', 
                                    fontWeight: 'bold', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '8px',
                                    animation: 'fadeIn 0.2s ease-out'
                                }}>
                                    <CheckCircle2 size={16} />
                                    <span>You have {quantityInCart} unit(s) of this item in your cart.</span>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Related Products */}
            {related.length > 0 && (
                <div style={{ marginBottom: '50px' }}>
                    <h2 style={{ fontSize: '22px', marginBottom: '20px' }}>Related Products</h2>
                    <div className="products-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
                        {related.map(prod => (
                            <ProductCard key={prod.id} product={prod} />
                        ))}
                    </div>
                </div>
            )}

            {/* Reviews Section */}
            <div className="reviews-section">
                <h2 style={{ fontSize: '22px', marginBottom: '24px' }}>Customer Reviews ({reviews.length})</h2>
                
                <div className="cart-layout">
                    {/* Review List */}
                    <div className="reviews-list">
                        {reviews.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)' }}>No reviews yet. Be the first to write a review!</p>
                        ) : (
                            reviews.map(review => (
                                <div key={review.id} className="review-item">
                                    <div className="review-header">
                                        <div>
                                            <strong style={{ fontSize: '15px' }}>{review.user?.firstName} {review.user?.lastName}</strong>
                                            <div style={{ display: 'flex', marginTop: '4px' }}>
                                                {renderStars(review.rating)}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                                {review.createdAt ? review.createdAt.substring(0, 10) : ''}
                                            </span>
                                            {review.verifiedPurchase && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--success)', marginTop: '4px', fontSize: '11px', fontWeight: 'bold' }}>
                                                    <CheckCircle2 size={12} />
                                                    <span>Verified Purchase</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '10px', lineHeight: '1.5' }}>
                                        {review.comment}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Review Form */}
                    <div className="cart-summary" style={{ position: 'static', width: '100%' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px' }}>
                            <MessageSquarePlus size={18} color="var(--accent)" />
                            <span>Add a Review</span>
                        </h3>
                        {token ? (
                            <form onSubmit={handleReviewSubmit} style={{ marginTop: '16px' }}>
                                {reviewError && (
                                    <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', padding: '10px 14px', borderRadius: '8px', marginBottom: '12px', fontSize: '13px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                        {reviewError}
                                    </div>
                                )}
                                {reviewSuccess && (
                                    <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', padding: '10px 14px', borderRadius: '8px', marginBottom: '12px', fontSize: '13px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                        Review submitted successfully!
                                    </div>
                                )}
                                <div className="form-group">
                                    <label>Rating</label>
                                    <select 
                                        value={rating} 
                                        disabled={submittingReview}
                                        onChange={(e) => setRating(Number(e.target.value))}
                                    >
                                        <option value="5">5 Stars (Excellent)</option>
                                        <option value="4">4 Stars (Good)</option>
                                        <option value="3">3 Stars (Average)</option>
                                        <option value="2">2 Stars (Poor)</option>
                                        <option value="1">1 Star (Terrible)</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Review Description</label>
                                    <textarea 
                                        rows="4" 
                                        required 
                                        disabled={submittingReview}
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        placeholder="What did you like or dislike about this product?"
                                    />
                                </div>
                                <button type="submit" className="btn btn-primary" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }} disabled={submittingReview}>
                                    {submittingReview ? (
                                        <>
                                            <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px', borderTopColor: '#fff', animationDuration: '0.6s' }}></div>
                                            <span>Submitting...</span>
                                        </>
                                    ) : 'Submit Feedback'}
                                </button>
                            </form>
                        ) : (
                            <div style={{ marginTop: '16px', fontSize: '14px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>
                                Please <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 'bold' }}>Sign In</Link> to share your experience.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
