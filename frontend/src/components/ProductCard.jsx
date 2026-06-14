import React from 'react';
import { Link } from 'react-router-dom';
import { Star, ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function ProductCard({ product }) {
    const { addToCart } = useCart();

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

    const handleQuickAdd = (e) => {
        e.preventDefault(); // prevent navigation to detail page
        addToCart(product, 1);
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

                <div className="product-card-footer">
                    <span className="product-card-price">${product.price.toFixed(2)}</span>
                    {product.stock <= 0 ? (
                        <span style={{ color: 'var(--error)', fontSize: '13px', fontWeight: 'bold' }}>Out of Stock</span>
                    ) : (
                        <button 
                            onClick={handleQuickAdd} 
                            className="btn btn-primary btn-sm"
                            aria-label="Add to cart"
                        >
                            <ShoppingCart size={15} />
                            <span>Add</span>
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
