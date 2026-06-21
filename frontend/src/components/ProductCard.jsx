import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, ShoppingCart, Check } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function ProductCard({ product }) {
    const { addToCart, cartItems } = useCart();
    const [added, setAdded] = useState(false);
    const [adding, setAdding] = useState(false);

    const cartItem = cartItems?.find(item => item.product.id === product.id);
    const quantityInCart = cartItem ? cartItem.quantity : 0;

    const renderStars = (rating) => {
        const stars = [];
        const floor = Math.floor(rating);
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <Star 
                    key={i} 
                    size={14} 
                    fill={i <= floor ? 'var(--rating-color)' : 'none'} 
                    color={i <= floor ? 'var(--rating-color)' : 'var(--text-muted)'} 
                />
            );
        }
        return stars;
    };

    const handleQuickAdd = async (e) => {
        e.preventDefault(); // prevent navigation to detail page
        setAdding(true);
        await addToCart(product, 1);
        setAdded(true);
        setAdding(false);
        setTimeout(() => setAdded(false), 2000);
    };

    return (
        <Link to={`/product/${product.id}`} className="product-card">
            <img src={product.imageUrl} alt={product.name} className="product-card-img" />
            <div className="product-card-content">
                <span className="product-card-category">{product.category?.name || 'Catalog'}</span>
                <h3 className="product-card-name">{product.name}</h3>
                
                <div className="product-card-rating">
                    <span className="rating-stars">{renderStars(product.rating)}</span>
                    <span>({product.reviewCount || 0})</span>
                </div>

                {quantityInCart > 0 && (
                    <div className="product-card-quantity-badge">
                        <span className="quantity-dot" />
                        <span>{quantityInCart} selected in cart</span>
                    </div>
                )}

                <div className="product-card-footer">
                    <span className="product-card-price">${product.price.toFixed(2)}</span>
                    {product.stock <= 0 ? (
                        <span style={{ color: 'var(--error)', fontSize: '13px', fontWeight: 'bold' }}>Out of Stock</span>
                    ) : (
                        <button 
                            onClick={handleQuickAdd} 
                            className={`btn ${added ? 'btn-success' : 'btn-primary'} btn-sm`}
                            style={{ 
                                transition: 'var(--transition)',
                                backgroundColor: added ? 'var(--success)' : undefined, 
                                borderColor: added ? 'var(--success)' : undefined,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                            }}
                            aria-label={added ? "Added to cart" : "Add to cart"}
                            disabled={added || adding}
                        >
                            {adding ? (
                                <>
                                    <div className="spinner" style={{ width: '12px', height: '12px', borderWidth: '1.5px', borderTopColor: '#fff', animationDuration: '0.6s' }}></div>
                                    <span>Add</span>
                                </>
                            ) : added ? (
                                <>
                                    <Check size={15} />
                                    <span>Added</span>
                                </>
                            ) : (
                                <>
                                    <ShoppingCart size={15} />
                                    <span>Add</span>
                                </>
                            )}
                        </button>
                    )}
                </div>
                {product.stock > 0 && product.stock <= 5 && (
                    <span style={{ color: 'var(--error)', fontSize: '11px', fontWeight: 'bold', marginTop: '6px' }}>
                        Only {product.stock} left in stock!
                    </span>
                )}
            </div>
        </Link>
    );
}
