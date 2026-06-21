import React, { useState, useEffect } from 'react';
import ProductCard from '../components/ProductCard';
import { Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../services/api';

const slides = [
    {
        title: "Experience Premium Aesthetics",
        subtitle: "Discover E-Commerce Lite: A state-of-the-art catalog with high-fidelity sound, designer apparel, and handcrafted home accessories.",
        bg: "linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(99, 102, 241, 0.15) 50%, rgba(15, 23, 42, 0.85) 100%), url('https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200')",
        actionText: "Shop the Collection"
    },
    {
        title: "High-Fidelity Audio Acoustics",
        subtitle: "Immersive soundscapes and noise-canceling acoustics. Designed for purists who value premium acoustic accuracy.",
        bg: "linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(16, 185, 129, 0.15) 50%, rgba(15, 23, 42, 0.85) 100%), url('https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=1200')",
        actionText: "Explore Sound Systems"
    },
    {
        title: "Handcrafted Living & Comfort",
        subtitle: "Curate your private spaces with functional designer products, premium textile apparel, and ambient lighting concepts.",
        bg: "linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(239, 68, 68, 0.15) 50%, rgba(15, 23, 42, 0.85) 100%), url('https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200')",
        actionText: "Explore Comfort Design"
    }
];

export default function Home({ searchFilter }) {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [recommendations, setRecommendations] = useState([]);
    
    // Pagination & Sorting state
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [sortBy, setSortBy] = useState('id');
    const [dir, setDir] = useState('desc');
    const [loading, setLoading] = useState(true);

    // Fetch categories once on mount
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await api.get('/products/categories');
                setCategories(res.data);
            } catch (err) {
                console.error('Error fetching categories', err);
            }
        };

        fetchCategories();
    }, []);

    // Fetch recommendations on mount
    useEffect(() => {
        const fetchRecommendations = async () => {
            try {
                const res = await api.get('/products/recommendations');
                setRecommendations(res.data);
            } catch (err) {
                console.error('Error fetching recommendations', err);
            }
        };

        fetchRecommendations();
    }, []);

    // Fetch products when category, search, page, or sort changes
    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                let path = `/products?page=${page}&size=6&sortBy=${sortBy}&direction=${dir}`;
                if (selectedCategory) {
                    path += `&categoryId=${selectedCategory}`;
                }
                if (searchFilter) {
                    path += `&search=${encodeURIComponent(searchFilter)}`;
                }
                
                const res = await api.get(path);
                const data = res.data;
                if (page === 0) {
                    setProducts(data.content || []);
                } else {
                    setProducts(prev => {
                        const existingIds = new Set(prev.map(p => p.id));
                        const newContent = (data.content || []).filter(p => !existingIds.has(p.id));
                        return [...prev, ...newContent];
                    });
                }
                setTotalPages(data.totalPages || 0);
            } catch (err) {
                console.error('Error fetching products', err);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [selectedCategory, searchFilter, page, sortBy, dir]);

    // Reset page on filter or sorting changes
    useEffect(() => {
        setPage(0);
    }, [selectedCategory, searchFilter, sortBy, dir]);

    // Reset selected category when search filter changes
    useEffect(() => {
        setSelectedCategory(null);
    }, [searchFilter]);

    // Scroll to collection section when search filter is updated
    useEffect(() => {
        if (searchFilter) {
            const el = document.getElementById('collection-section');
            if (el) {
                el.scrollIntoView({ behavior: 'smooth' });
            }
        }
    }, [searchFilter]);

    // Infinite Scroll event listener
    useEffect(() => {
        const handleScroll = () => {
            // Check if user is scrolled within 150px of the page bottom
            if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 150) {
                if (!loading && page < totalPages - 1) {
                    setPage(prev => prev + 1);
                }
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [loading, page, totalPages]);

    const handleCategoryClick = (categoryId) => {
        setSelectedCategory(prev => prev === categoryId ? null : categoryId);
    };

    const [activeSlide, setActiveSlide] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveSlide(prev => (prev + 1) % slides.length);
        }, 1500);
        return () => clearInterval(interval);
    }, []);

    const handlePrevSlide = (e) => {
        e.stopPropagation();
        setActiveSlide(prev => (prev - 1 + slides.length) % slides.length);
    };

    const handleNextSlide = (e) => {
        e.stopPropagation();
        setActiveSlide(prev => (prev + 1) % slides.length);
    };

    const scrollToCollection = () => {
        const el = document.getElementById('collection-section');
        if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <div className="home-container">
            {/* Hero Carousel */}
            <div className="hero-carousel">
                <div className="carousel-slides">
                    {slides.map((slide, idx) => (
                        <div 
                            key={idx}
                            className={`carousel-slide ${idx === activeSlide ? 'active' : ''}`}
                            style={{ backgroundImage: slide.bg }}
                        >
                            <div className="carousel-slide-overlay" />
                            <div className="carousel-slide-content">
                                <h1 className="hero-title">{slide.title}</h1>
                                <p className="hero-subtitle">{slide.subtitle}</p>
                                <button className="btn btn-primary carousel-action-btn" onClick={scrollToCollection}>
                                    {slide.actionText}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Left/Right Controls */}
                <button className="carousel-control prev" onClick={handlePrevSlide} aria-label="Previous Slide">
                    <ChevronLeft size={24} />
                </button>
                <button className="carousel-control next" onClick={handleNextSlide} aria-label="Next Slide">
                    <ChevronRight size={24} />
                </button>

                {/* Bottom Dot Indicators */}
                <div className="carousel-indicators">
                    {slides.map((_, idx) => (
                        <button 
                            key={idx}
                            className={`carousel-indicator ${idx === activeSlide ? 'active' : ''}`}
                            onClick={() => setActiveSlide(idx)}
                            aria-label={`Go to slide ${idx + 1}`}
                        />
                    ))}
                </div>
            </div>

            {/* Recommendations Section */}
            {recommendations.length > 0 && (
                <div style={{ marginBottom: '48px' }}>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '22px', marginBottom: '20px' }}>
                        <Sparkles size={20} color="var(--accent)" />
                        <span>Recommended for You</span>
                    </h2>
                    <div className="products-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
                        {recommendations.map(prod => (
                            <ProductCard key={prod.id} product={prod} />
                        ))}
                    </div>
                </div>
            )}

            {/* Main Catalog Header */}
            <div id="collection-section" className="products-section-title">
                <h2>Our Collection</h2>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <select 
                        value={sortBy} 
                        onChange={(e) => setSortBy(e.target.value)} 
                        style={{ padding: '6px 12px', borderRadius: '8px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                    >
                        <option value="id">Latest</option>
                        <option value="price">Price</option>
                        <option value="rating">Rating</option>
                        <option value="name">Alphabetical</option>
                    </select>
                    <select 
                        value={dir} 
                        onChange={(e) => setDir(e.target.value)} 
                        style={{ padding: '6px 12px', borderRadius: '8px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                    >
                        <option value="desc">Descending</option>
                        <option value="asc">Ascending</option>
                    </select>
                </div>
            </div>

            {/* Categories Selector */}
            <div className="category-container">
                <button 
                    onClick={() => setSelectedCategory(null)}
                    className={`category-bubble ${selectedCategory === null ? 'active' : ''}`}
                >
                    All Products
                </button>
                {categories.map(cat => (
                    <button 
                        key={cat.id}
                        onClick={() => handleCategoryClick(cat.id)}
                        className={`category-bubble ${selectedCategory === cat.id ? 'active' : ''}`}
                    >
                        {cat.name}
                    </button>
                ))}
            </div>

            {/* Products Listing */}
            {page === 0 && loading ? (
                <div style={{ textAlign: 'center', padding: '60px 0', fontSize: '18px', color: 'var(--text-muted)' }}>
                    Loading premium catalog...
                </div>
            ) : products.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', fontSize: '18px', color: 'var(--text-muted)' }}>
                    No products found in this category.
                </div>
            ) : (
                <>
                    <div className="products-grid">
                        {products.map(product => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>

                    {/* Small loader at bottom when fetching more pages */}
                    {page > 0 && loading && (
                        <div style={{ textAlign: 'center', padding: '24px 0', fontSize: '14px', color: 'var(--text-muted)' }}>
                            Loading more products...
                        </div>
                    )}

                    {/* End of results message */}
                    {!loading && page >= totalPages - 1 && products.length > 0 && (
                        <div style={{ textAlign: 'center', padding: '40px 0', fontSize: '13px', color: 'var(--text-muted)', fontWeight: 'bold' }}>
                            ✓ You have viewed all products in our catalog.
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
