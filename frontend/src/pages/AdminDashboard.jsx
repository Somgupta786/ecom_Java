import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
    TrendingUp, Users, ShoppingCart, AlertCircle, 
    PlusCircle, Trash2, Edit, Save, PowerOff, Sun, Moon, Upload 
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

export default function AdminDashboard() {
    const { token, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { showToast } = useToast();
    
    // Sidebar view
    const [view, setView] = useState('analytics'); // analytics, products, orders, coupons

    // Data lists
    const [stats, setStats] = useState({ totalRevenue: 0, totalUsers: 0, pendingOrders: 0, outOfStockProducts: 0 });
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [categories, setCategories] = useState([]);

    // Form states
    const [newProduct, setNewProduct] = useState({ name: '', description: '', price: '', sku: '', stock: '', imageUrl: '', categoryId: '' });
    const [editingProduct, setEditingProduct] = useState(null);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCoupon, setNewCoupon] = useState({ code: '', discountPercent: '', expiryDate: '' });
    const [uploading, setUploading] = useState(false);

    // Loading states
    const [submittingProduct, setSubmittingProduct] = useState(false);
    const [deletingProductId, setDeletingProductId] = useState(null);
    const [submittingCategory, setSubmittingCategory] = useState(false);
    const [updatingOrderId, setUpdatingOrderId] = useState(null);

    // Synonym states
    const [synonyms, setSynonyms] = useState([]);
    const [newSynonym, setNewSynonym] = useState({ term: '', synonym: '' });
    const [submittingSynonym, setSubmittingSynonym] = useState(false);
    const [deletingSynonymId, setDeletingSynonymId] = useState(null);

    const fetchData = async () => {
        try {
            // Stats
            const statsRes = await api.get('/admin/dashboard/stats');
            setStats(statsRes.data);

            // Products
            const prodRes = await api.get('/products?size=100');
            setProducts(prodRes.data.content || []);

            // Categories
            const catRes = await api.get('/products/categories');
            setCategories(catRes.data);

            // Orders
            const orderRes = await api.get('/admin/orders');
            setOrders(orderRes.data);

            // Synonyms
            const synRes = await api.get('/admin/synonyms');
            setSynonyms(synRes.data || []);
        } catch (err) {
            console.error('Error fetching admin data', err);
        }
    };

    useEffect(() => {
        if (token) {
            fetchData();
        }
    }, [token]);

    const handleCreateProduct = async (e) => {
        e.preventDefault();
        setSubmittingProduct(true);

        const selectedCat = categories.find(c => c.id === Number(newProduct.categoryId));
        const payload = {
            name: newProduct.name,
            description: newProduct.description,
            price: Number(newProduct.price),
            sku: newProduct.sku,
            stock: Number(newProduct.stock),
            imageUrl: newProduct.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
            category: selectedCat
        };

        try {
            await api.post('/admin/products', payload);
            showToast('Product created successfully!', 'success');
            setNewProduct({ name: '', description: '', price: '', sku: '', stock: '', imageUrl: '', categoryId: '' });
            await fetchData();
        } catch (err) {
            showToast('Error creating product.', 'error');
        } finally {
            setSubmittingProduct(false);
        }
    };

    const handleUpdateProduct = async (e) => {
        e.preventDefault();
        setSubmittingProduct(true);

        const selectedCat = categories.find(c => c.id === Number(editingProduct.categoryId));
        const payload = {
            name: editingProduct.name,
            description: editingProduct.description,
            price: Number(editingProduct.price),
            sku: editingProduct.sku,
            stock: Number(editingProduct.stock),
            imageUrl: editingProduct.imageUrl,
            category: selectedCat
        };

        try {
            await api.put(`/admin/products/${editingProduct.id}`, payload);
            showToast('Product updated successfully!', 'success');
            setEditingProduct(null);
            await fetchData();
        } catch (err) {
            showToast('Error updating product.', 'error');
        } finally {
            setSubmittingProduct(false);
        }
    };

    const handleDeleteProduct = async (prodId) => {
        if (!window.confirm('Are you sure you want to delete this product?')) return;
        setDeletingProductId(prodId);

        try {
            await api.delete(`/admin/products/${prodId}`);
            showToast('Product deleted.', 'success');
            await fetchData();
        } catch (err) {
            showToast('Error deleting product.', 'error');
        } finally {
            setDeletingProductId(null);
        }
    };

    const handleFileUpload = async (e, type) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setUploading(true);

        try {
            const res = await api.post('/admin/products/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            let data = res.data;
            if (typeof data === 'string') {
                try {
                    data = JSON.parse(data);
                } catch (pe) {
                    console.error('Error parsing response string', pe);
                }
            }
            const url = data.imageUrl;
            if (url) {
                if (type === 'new') {
                    setNewProduct(prev => ({ ...prev, imageUrl: url }));
                } else if (type === 'edit') {
                    setEditingProduct(prev => ({ ...prev, imageUrl: url }));
                }
                showToast('Image uploaded successfully to Cloudinary!', 'success');
            } else {
                showToast('Failed to extract image URL from upload response.', 'error');
            }
        } catch (err) {
            console.error('Upload error', err);
            showToast('Failed to upload image to Cloudinary.', 'error');
        } finally {
            setUploading(false);
        }
    };

    const handleCreateCategory = async (e) => {
        e.preventDefault();
        if (!newCategoryName.trim()) return;
        setSubmittingCategory(true);

        try {
            await api.post('/admin/categories', { name: newCategoryName });
            showToast('Category added!', 'success');
            setNewCategoryName('');
            await fetchData();
        } catch (err) {
            showToast('Error adding category.', 'error');
        } finally {
            setSubmittingCategory(false);
        }
    };

    const handleUpdateOrderStatus = async (orderId, newStatus) => {
        setUpdatingOrderId(orderId);
        try {
            await api.put(`/admin/orders/${orderId}/status?status=${newStatus}`);
            showToast('Order status updated successfully.', 'success');
            await fetchData();
        } catch (err) {
            console.error('Error updating status', err);
            showToast('Error updating status.', 'error');
        } finally {
            setUpdatingOrderId(null);
        }
    };

    const handleCreateSynonym = async (e) => {
        e.preventDefault();
        if (!newSynonym.term.trim() || !newSynonym.synonym.trim()) return;
        setSubmittingSynonym(true);
        try {
            await api.post('/admin/synonyms', {
                term: newSynonym.term.trim().toLowerCase(),
                synonym: newSynonym.synonym.trim().toLowerCase()
            });
            showToast('Synonym mapped successfully!', 'success');
            setNewSynonym({ term: '', synonym: '' });
            await fetchData();
        } catch (err) {
            showToast('Error mapping synonym.', 'error');
        } finally {
            setSubmittingSynonym(false);
        }
    };

    const handleDeleteSynonym = async (synId) => {
        if (!window.confirm('Are you sure you want to delete this synonym mapping?')) return;
        setDeletingSynonymId(synId);
        try {
            await api.delete(`/admin/synonyms/${synId}`);
            showToast('Synonym mapping deleted.', 'success');
            await fetchData();
        } catch (err) {
            showToast('Error deleting synonym.', 'error');
        } finally {
            setDeletingSynonymId(null);
        }
    };

    // Helper to calculate daily revenue for Area Chart
    const getRevenueChartData = () => {
        const dailyRevenue = {};
        const sortedOrders = [...orders]
            .filter(o => o.status !== 'CANCELLED' && o.orderDate)
            .sort((a, b) => a.orderDate.localeCompare(b.orderDate));

        sortedOrders.forEach(order => {
            const dateStr = order.orderDate.substring(0, 10); // YYYY-MM-DD
            const amount = order.totalAmount || 0;
            dailyRevenue[dateStr] = (dailyRevenue[dateStr] || 0) + amount;
        });

        const dates = Object.keys(dailyRevenue).slice(-7);
        const values = dates.map(d => dailyRevenue[d]);

        if (dates.length === 0) {
            return {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                values: [80, 210, 140, 390, 270, 540, 420]
            };
        }

        return { labels: dates.map(d => d.substring(5)), values }; // MM-DD
    };

    // Helper to calculate status breakdown for Activity Rings
    const getStatusChartData = () => {
        const statusCounts = { PENDING: 0, PAID: 0, SHIPPED: 0, DELIVERED: 0, CANCELLED: 0 };
        orders.forEach(o => {
            if (o.status && statusCounts[o.status] !== undefined) {
                statusCounts[o.status]++;
            }
        });
        return statusCounts;
    };

    // Helper to calculate category distribution for horizontal bars
    const getCategoryProductCounts = () => {
        const counts = {};
        categories.forEach(c => {
            counts[c.name] = 0;
        });
        products.forEach(p => {
            if (p.category && p.category.name) {
                counts[p.category.name] = (counts[p.category.name] || 0) + 1;
            }
        });
        return counts;
    };

    return (
        <div className="admin-layout">
            
            {/* Sidebar View Switcher */}
            <div className="admin-sidebar" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)', position: 'sticky', top: '40px' }}>
                <h3 style={{ fontSize: '18px', marginBottom: '20px', paddingLeft: '8px' }}>Store Admin</h3>
                <ul className="admin-sidebar-menu" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <li onClick={() => setView('analytics')} className={`admin-sidebar-item ${view === 'analytics' ? 'active' : ''}`}>
                        <TrendingUp size={16} />
                        <span>Dashboard</span>
                    </li>
                    <li onClick={() => setView('products')} className={`admin-sidebar-item ${view === 'products' ? 'active' : ''}`}>
                        <PlusCircle size={16} />
                        <span>Products CRUD</span>
                    </li>
                    <li onClick={() => setView('orders')} className={`admin-sidebar-item ${view === 'orders' ? 'active' : ''}`}>
                        <ShoppingCart size={16} />
                        <span>Fulfill Orders</span>
                    </li>
                    <li onClick={() => setView('categories')} className={`admin-sidebar-item ${view === 'categories' ? 'active' : ''}`}>
                        <AlertCircle size={16} />
                        <span>Categories</span>
                    </li>
                    <li onClick={() => setView('synonyms')} className={`admin-sidebar-item ${view === 'synonyms' ? 'active' : ''}`}>
                        <Save size={16} />
                        <span>Synonyms</span>
                    </li>
                    
                    {/* Theme Toggle in Admin View */}
                    <li onClick={toggleTheme} className="admin-sidebar-item" style={{ marginTop: 'auto' }}>
                        {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                        <span>Toggle Theme</span>
                    </li>
                    {/* Logout in Admin View */}
                    <li onClick={logout} className="admin-sidebar-item" style={{ color: 'var(--error)' }}>
                        <PowerOff size={16} />
                        <span>Logout</span>
                    </li>
                </ul>
            </div>

            {/* Dashboard Content */}
            <div className="admin-content">
                
                {/* VIEW 1: Analytics */}
                {view === 'analytics' && (() => {
                    const revenueData = getRevenueChartData();
                    const maxRevenue = Math.max(...revenueData.values, 100);
                    const height = 180;
                    const width = 500;
                    const padding = 30;

                    const points = revenueData.values.map((val, idx) => {
                        const x = padding + (idx * (width - 2 * padding)) / Math.max(1, revenueData.values.length - 1);
                        const y = height - padding - (val * (height - 2 * padding)) / maxRevenue;
                        return { x, y, val, label: revenueData.labels[idx] };
                    });

                    let pathD = '';
                    if (points.length > 0) {
                        pathD = `M ${points[0].x} ${points[0].y}`;
                        for (let i = 1; i < points.length; i++) {
                            pathD += ` L ${points[i].x} ${points[i].y}`;
                        }
                    }
                    const areaD = points.length > 0 
                        ? `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`
                        : '';

                    const statusCounts = getStatusChartData();
                    const totalOrders = orders.length || 1;
                    const deliveredPercent = Math.min(100, Math.max(0, (((statusCounts.DELIVERED + statusCounts.PAID + statusCounts.SHIPPED) / totalOrders) * 100)));
                    const pendingPercent = Math.min(100, Math.max(0, ((statusCounts.PENDING / totalOrders) * 100)));
                    const cancelledPercent = Math.min(100, Math.max(0, ((statusCounts.CANCELLED / totalOrders) * 100)));

                    const categoryCounts = getCategoryProductCounts();
                    const maxCatCount = Math.max(...Object.values(categoryCounts), 1);

                    return (
                        <div>
                            <h2 style={{ fontSize: '24px', marginBottom: '24px' }}>Performance & Analytics</h2>
                            
                            <div className="admin-dashboard-metrics">
                                <div className="metric-card">
                                    <div className="metric-icon"><TrendingUp size={24} /></div>
                                    <div className="metric-info">
                                        <h4>Total Revenue</h4>
                                        <p>${stats.totalRevenue?.toFixed(2) || '0.00'}</p>
                                    </div>
                                </div>
                                <div className="metric-card">
                                    <div className="metric-icon"><Users size={24} /></div>
                                    <div className="metric-info">
                                        <h4>Total Users</h4>
                                        <p>{stats.totalUsers || 0}</p>
                                    </div>
                                </div>
                                <div className="metric-card">
                                    <div className="metric-icon"><ShoppingCart size={24} /></div>
                                    <div className="metric-info">
                                        <h4>Pending Orders</h4>
                                        <p>{stats.pendingOrders || 0}</p>
                                    </div>
                                </div>
                                <div className="metric-card" style={{ borderLeft: stats.outOfStockProducts > 0 ? '3px solid var(--error)' : 'none' }}>
                                    <div className="metric-icon" style={{ color: stats.outOfStockProducts > 0 ? 'var(--error)' : 'var(--accent)' }}><AlertCircle size={24} /></div>
                                    <div className="metric-info">
                                        <h4>Out of Stock</h4>
                                        <p style={{ color: stats.outOfStockProducts > 0 ? 'var(--error)' : 'var(--text-primary)' }}>
                                            {stats.outOfStockProducts || 0}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Charts Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '32px' }}>
                                
                                {/* Area Chart: Revenue Trend */}
                                <div className="checkout-card" style={{ margin: 0, padding: '20px' }}>
                                    <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>Revenue Timeline (Last 7 Days)</h3>
                                    <div style={{ position: 'relative' }}>
                                        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
                                            <defs>
                                                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.4"/>
                                                    <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.0"/>
                                                </linearGradient>
                                            </defs>
                                            
                                            {/* Y-axis gridlines */}
                                            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                                                const y = padding + ratio * (height - 2 * padding);
                                                return (
                                                    <line key={i} x1={padding} y1={y} x2={width - padding} y2={y} 
                                                          stroke="var(--border-color)" strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />
                                                );
                                            })}

                                            {/* Area Path */}
                                            {areaD && <path d={areaD} fill="url(#chartGradient)" />}
                                            
                                            {/* Line Path */}
                                            {pathD && <path d={pathD} fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" />}
                                            
                                            {/* Labels and Dots */}
                                            {points.map((pt, i) => (
                                                <g key={i}>
                                                    <circle cx={pt.x} cy={pt.y} r="5" fill="var(--bg-secondary)" stroke="var(--accent)" strokeWidth="2" />
                                                    <text x={pt.x} y={height - 10} textAnchor="middle" fill="var(--text-muted)" fontSize="10px" fontFamily="var(--font-heading)">
                                                        {pt.label}
                                                    </text>
                                                    <text x={pt.x} y={pt.y - 10} textAnchor="middle" fill="var(--text-primary)" fontSize="9px" fontWeight="bold">
                                                        ${Math.round(pt.val)}
                                                    </text>
                                                </g>
                                            ))}
                                        </svg>
                                    </div>
                                </div>

                                {/* Concentric Activity Rings: Order Status */}
                                <div className="checkout-card" style={{ margin: 0, padding: '20px', display: 'flex', gap: '20px', alignItems: 'center' }}>
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>Order Fulfillment Rate</h3>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                                                <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--success)' }} />
                                                <span>Delivered/Paid ({Math.round(deliveredPercent)}%)</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                                                <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--accent)' }} />
                                                <span>Pending ({Math.round(pendingPercent)}%)</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                                                <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--error)' }} />
                                                <span>Cancelled ({Math.round(cancelledPercent)}%)</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', width: '120px', height: '120px' }}>
                                        <svg viewBox="0 0 120 120" width="120" height="120" style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}>
                                            {/* Outermost Ring: Success */}
                                            <circle cx="60" cy="60" r="45" fill="none" stroke="var(--border-color)" strokeWidth="6" opacity="0.15" />
                                            <circle cx="60" cy="60" r="45" fill="none" stroke="var(--success)" strokeWidth="6" 
                                                    strokeDasharray={2 * Math.PI * 45} 
                                                    strokeDashoffset={2 * Math.PI * 45 * (1 - Math.max(0.01, deliveredPercent) / 100)} 
                                                    strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease-in-out' }} />
                                            
                                            {/* Middle Ring: Pending */}
                                            <circle cx="60" cy="60" r="32" fill="none" stroke="var(--border-color)" strokeWidth="6" opacity="0.15" />
                                            <circle cx="60" cy="60" r="32" fill="none" stroke="var(--accent)" strokeWidth="6" 
                                                    strokeDasharray={2 * Math.PI * 32} 
                                                    strokeDashoffset={2 * Math.PI * 32 * (1 - Math.max(0.01, pendingPercent) / 100)} 
                                                    strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease-in-out' }} />
                                            
                                            {/* Innermost Ring: Cancelled */}
                                            <circle cx="60" cy="60" r="19" fill="none" stroke="var(--border-color)" strokeWidth="6" opacity="0.15" />
                                            <circle cx="60" cy="60" r="19" fill="none" stroke="var(--error)" strokeWidth="6" 
                                                    strokeDasharray={2 * Math.PI * 19} 
                                                    strokeDashoffset={2 * Math.PI * 19 * (1 - Math.max(0.01, cancelledPercent) / 100)} 
                                                    strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease-in-out' }} />
                                        </svg>
                                    </div>
                                </div>

                                {/* Catalog Inventory Distribution */}
                                <div className="checkout-card" style={{ margin: 0, padding: '20px' }}>
                                    <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>Catalog by Category</h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '10px' }}>
                                        {Object.entries(categoryCounts).map(([catName, count]) => (
                                            <div key={catName}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                                                    <span>{catName}</span>
                                                    <strong>{count} items</strong>
                                                </div>
                                                <div style={{ height: '8px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                                                    <div style={{ 
                                                        height: '100%', 
                                                        width: `${(count / maxCatCount) * 100}%`, 
                                                        backgroundColor: 'var(--accent)', 
                                                        borderRadius: '4px',
                                                        transition: 'width 0.8s ease-out'
                                                    }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                            </div>

                            {/* Recent Order Activities */}
                            <div className="checkout-card" style={{ margin: 0, padding: '24px' }}>
                                <h3 style={{ marginBottom: '16px' }}>Pending Order Activities</h3>
                                {orders.filter(o => o.status === 'PENDING').length === 0 ? (
                                    <p style={{ color: 'var(--text-muted)' }}>No pending orders requiring attention.</p>
                                ) : (
                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                                                <th style={{ padding: '8px' }}>Order ID</th>
                                                <th style={{ padding: '8px' }}>User</th>
                                                <th style={{ padding: '8px' }}>Amount</th>
                                                <th style={{ padding: '8px' }}>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {orders.filter(o => o.status === 'PENDING').map(o => (
                                                <tr key={o.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                    <td style={{ padding: '8px' }}>#{o.orderNumber || o.id}</td>
                                                    <td style={{ padding: '8px' }}>{o.user?.email}</td>
                                                    <td style={{ padding: '8px' }}>${o.totalAmount?.toFixed(2)}</td>
                                                    <td style={{ padding: '8px', color: 'var(--success)' }}>{o.status}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    );
                })()}

                {/* VIEW 2: Products CRUD */}
                {view === 'products' && (
                    <div>
                        <h2 style={{ fontSize: '24px', marginBottom: '20px' }}>Product Catalog CRUD</h2>
                        
                        {/* Edit Product Modal Form */}
                        {editingProduct ? (
                            <div className="checkout-card" style={{ marginBottom: '24px', border: '1px solid var(--accent)' }}>
                                <h3>Edit Product #{editingProduct.id}</h3>
                                <form onSubmit={handleUpdateProduct} style={{ marginTop: '16px' }}>
                                    <div className="form-group">
                                        <label>Product Name</label>
                                        <input type="text" required disabled={submittingProduct || uploading} value={editingProduct.name} onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})} />
                                    </div>
                                    <div className="form-group">
                                        <label>Description</label>
                                        <textarea required disabled={submittingProduct || uploading} value={editingProduct.description} onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})} />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                                        <div className="form-group">
                                            <label>Price ($)</label>
                                            <input type="number" step="0.01" required disabled={submittingProduct || uploading} value={editingProduct.price} onChange={(e) => setEditingProduct({...editingProduct, price: e.target.value})} />
                                        </div>
                                        <div className="form-group">
                                            <label>Stock Count</label>
                                            <input type="number" required disabled={submittingProduct || uploading} value={editingProduct.stock} onChange={(e) => setEditingProduct({...editingProduct, stock: e.target.value})} />
                                        </div>
                                        <div className="form-group">
                                            <label>Category</label>
                                            <select disabled={submittingProduct || uploading} value={editingProduct.categoryId} onChange={(e) => setEditingProduct({...editingProduct, categoryId: e.target.value})}>
                                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Image URL / Upload</label>
                                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                            <input 
                                                type="text" 
                                                disabled={submittingProduct || uploading}
                                                value={editingProduct.imageUrl} 
                                                onChange={(e) => setEditingProduct({...editingProduct, imageUrl: e.target.value})} 
                                                style={{ flex: 1 }}
                                            />
                                            <label className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: submittingProduct || uploading ? 'not-allowed' : 'pointer', margin: 0, padding: '10px 16px', height: '42px', whiteSpace: 'nowrap', opacity: submittingProduct || uploading ? 0.7 : 1 }}>
                                                {uploading ? (
                                                    <>
                                                        <span className="spinner animate-spin" style={{ width: '14px', height: '14px', border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block' }} />
                                                        <span>Uploading...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Upload size={16} />
                                                        <span>Upload File</span>
                                                    </>
                                                )}
                                                <input 
                                                    type="file" 
                                                    accept="image/*" 
                                                    onChange={(e) => handleFileUpload(e, 'edit')} 
                                                    style={{ display: 'none' }}
                                                    disabled={submittingProduct || uploading}
                                                />
                                            </label>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button type="submit" className="btn btn-primary" disabled={submittingProduct || uploading}>
                                            {submittingProduct ? (
                                                <>
                                                    <span className="spinner animate-spin" style={{ width: '14px', height: '14px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', marginRight: '6px' }} />
                                                    <span>Saving...</span>
                                                </>
                                            ) : 'Save Changes'}
                                        </button>
                                        <button type="button" onClick={() => setEditingProduct(null)} className="btn btn-secondary" disabled={submittingProduct || uploading}>Cancel</button>
                                    </div>
                                </form>
                            </div>
                        ) : (
                            /* Add Product Form */
                            <div className="checkout-card" style={{ marginBottom: '24px' }}>
                                <h3>Add New Product</h3>
                                <form onSubmit={handleCreateProduct} style={{ marginTop: '16px' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        <div className="form-group">
                                            <label>Product Name</label>
                                            <input type="text" required disabled={submittingProduct || uploading} placeholder="Smart Watch" value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} />
                                        </div>
                                        <div className="form-group">
                                            <label>SKU Code</label>
                                            <input type="text" required disabled={submittingProduct || uploading} placeholder="ELEC-SMART-099" value={newProduct.sku} onChange={(e) => setNewProduct({...newProduct, sku: e.target.value})} />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Description</label>
                                        <textarea required disabled={submittingProduct || uploading} placeholder="Write a description..." value={newProduct.description} onChange={(e) => setNewProduct({...newProduct, description: e.target.value})} />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                                        <div className="form-group">
                                            <label>Price ($)</label>
                                            <input type="number" step="0.01" required disabled={submittingProduct || uploading} placeholder="99.99" value={newProduct.price} onChange={(e) => setNewProduct({...newProduct, price: e.target.value})} />
                                        </div>
                                        <div className="form-group">
                                            <label>Stock Count</label>
                                            <input type="number" required disabled={submittingProduct || uploading} placeholder="50" value={newProduct.stock} onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})} />
                                        </div>
                                        <div className="form-group">
                                            <label>Category</label>
                                            <select disabled={submittingProduct || uploading} value={newProduct.categoryId} required onChange={(e) => setNewProduct({...newProduct, categoryId: e.target.value})}>
                                                <option value="">Select Category</option>
                                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Image URL / Upload</label>
                                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                            <input 
                                                type="text" 
                                                disabled={submittingProduct || uploading}
                                                placeholder="https://example.com/watch.jpg" 
                                                value={newProduct.imageUrl} 
                                                onChange={(e) => setNewProduct({...newProduct, imageUrl: e.target.value})}
                                                style={{ flex: 1 }}
                                            />
                                            <label className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: submittingProduct || uploading ? 'not-allowed' : 'pointer', margin: 0, padding: '10px 16px', height: '42px', whiteSpace: 'nowrap', opacity: submittingProduct || uploading ? 0.7 : 1 }}>
                                                {uploading ? (
                                                    <>
                                                        <span className="spinner animate-spin" style={{ width: '14px', height: '14px', border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block' }} />
                                                        <span>Uploading...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Upload size={16} />
                                                        <span>Upload File</span>
                                                    </>
                                                )}
                                                <input 
                                                    type="file" 
                                                    accept="image/*" 
                                                    onChange={(e) => handleFileUpload(e, 'new')} 
                                                    style={{ display: 'none' }}
                                                    disabled={submittingProduct || uploading}
                                                />
                                            </label>
                                        </div>
                                    </div>
                                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={submittingProduct || uploading}>
                                        {submittingProduct ? (
                                            <>
                                                <span className="spinner animate-spin" style={{ width: '14px', height: '14px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', marginRight: '6px' }} />
                                                <span>Adding Product...</span>
                                            </>
                                        ) : 'Add Product'}
                                    </button>
                                </form>
                            </div>
                        )}

                        {/* List products for Delete/Edit */}
                        <div className="checkout-card" style={{ margin: 0, padding: '24px' }}>
                            <h3>Product Catalog ({products.length})</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                                {products.map(prod => (
                                    <div key={prod.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                            <img src={prod.imageUrl} alt={prod.name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
                                            <div>
                                                <strong>{prod.name}</strong>
                                                <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '12px' }}>SKU: {prod.sku} | Stock: {prod.stock}</span>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button 
                                                onClick={() => setEditingProduct({ ...prod, categoryId: prod.category?.id })} 
                                                className="btn btn-secondary btn-sm"
                                                style={{ padding: '6px' }}
                                                disabled={deletingProductId !== null || submittingProduct}
                                            >
                                                <Edit size={14} />
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteProduct(prod.id)} 
                                                className="btn btn-outline btn-sm"
                                                style={{ padding: '6px', color: 'var(--error)', borderColor: 'var(--error)' }}
                                                disabled={deletingProductId !== null || submittingProduct}
                                            >
                                                {deletingProductId === prod.id ? (
                                                    <span className="spinner animate-spin" style={{ width: '14px', height: '14px', border: '2px solid var(--error)', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block' }} />
                                                ) : (
                                                    <Trash2 size={14} />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                    ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* VIEW 3: Orders Fulfillment */}
                {view === 'orders' && (
                    <div className="checkout-card" style={{ margin: 0, padding: '24px' }}>
                        <h2 style={{ fontSize: '24px', marginBottom: '20px' }}>Order Fulfillment</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {orders.length === 0 ? (
                                <p style={{ color: 'var(--text-muted)' }}>No orders placed on the system.</p>
                            ) : (
                                orders.map(ord => (
                                    <div key={ord.id} style={{ border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px', backgroundColor: 'var(--bg-tertiary)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', marginBottom: '10px' }}>
                                            <div>
                                                <strong>Order #{ord.orderNumber || ord.id}</strong> | User: {ord.user?.email}
                                            </div>
                                            <div>
                                                Status: <strong style={{ color: 'var(--accent)' }}>{ord.status}</strong>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                                <div>Address: {ord.shippingAddress?.street}, {ord.shippingAddress?.city}</div>
                                                <div>Total: <strong>${ord.totalAmount?.toFixed(2)}</strong></div>
                                                <div>Tracking: <strong>{ord.trackingNumber || 'NONE'}</strong></div>
                                            </div>
                                            
                                            {/* Status Transition selection */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                {updatingOrderId === ord.id && (
                                                    <span className="spinner animate-spin" style={{ width: '16px', height: '16px', border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block' }} />
                                                )}
                                                <select 
                                                    value={ord.status} 
                                                    onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value)}
                                                    disabled={updatingOrderId !== null}
                                                    style={{ padding: '6px 12px', borderRadius: '8px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                                                >
                                                    <option value="PENDING">PENDING</option>
                                                    <option value="PAID">PAID</option>
                                                    <option value="SHIPPED">SHIPPED</option>
                                                    <option value="DELIVERED">DELIVERED</option>
                                                    <option value="CANCELLED">CANCELLED</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* VIEW 4: Categories Management */}
                {view === 'categories' && (
                    <div className="checkout-card" style={{ margin: 0, padding: '24px' }}>
                        <h2 style={{ fontSize: '24px', marginBottom: '20px' }}>Category Management</h2>
                        <form onSubmit={handleCreateCategory} style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                            <input 
                                type="text" 
                                placeholder="New category name (e.g. Footwear)" 
                                required
                                disabled={submittingCategory}
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                            />
                            <button type="submit" className="btn btn-primary" disabled={submittingCategory} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {submittingCategory ? (
                                    <>
                                        <span className="spinner animate-spin" style={{ width: '14px', height: '14px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block' }} />
                                        <span>Adding...</span>
                                    </>
                                ) : 'Add Category'}
                            </button>
                        </form>
                        
                        <h3>Existing Categories</h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '14px' }}>
                            {categories.map(c => (
                                <span key={c.id} style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)', padding: '6px 12px', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold' }}>
                                    {c.name}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* VIEW 5: Synonyms Management */}
                {view === 'synonyms' && (
                    <div className="checkout-card" style={{ margin: 0, padding: '24px' }}>
                        <h2 style={{ fontSize: '24px', marginBottom: '20px' }}>Manage Synonym Dictionary</h2>
                        <form onSubmit={handleCreateSynonym} style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
                            <div className="form-group" style={{ flex: '1 0 200px', margin: 0 }}>
                                <input 
                                    type="text" 
                                    placeholder="Word 1 (e.g. tshirt)" 
                                    required
                                    disabled={submittingSynonym}
                                    value={newSynonym.term}
                                    onChange={(e) => setNewSynonym({ ...newSynonym, term: e.target.value })}
                                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                                />
                            </div>
                            <div className="form-group" style={{ flex: '1 0 200px', margin: 0 }}>
                                <input 
                                    type="text" 
                                    placeholder="Word 2 (e.g. tee)" 
                                    required
                                    disabled={submittingSynonym}
                                    value={newSynonym.synonym}
                                    onChange={(e) => setNewSynonym({ ...newSynonym, synonym: e.target.value })}
                                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                                />
                            </div>
                            <button type="submit" className="btn btn-primary" disabled={submittingSynonym} style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '42px' }}>
                                {submittingSynonym ? (
                                    <>
                                        <span className="spinner animate-spin" style={{ width: '14px', height: '14px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block' }} />
                                        <span>Mapping...</span>
                                    </>
                                ) : 'Map Synonym'}
                            </button>
                        </form>
                        
                        <h3>Active Mappings</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                            {synonyms.length === 0 ? (
                                <p style={{ color: 'var(--text-muted)' }}>No synonyms mapped in the system.</p>
                            ) : (
                                synonyms.map(syn => (
                                    <div key={syn.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                            <span style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)', padding: '4px 10px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold' }}>{syn.term}</span>
                                            <span style={{ color: 'var(--text-muted)' }}>&harr;</span>
                                            <span style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)', padding: '4px 10px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold' }}>{syn.synonym}</span>
                                        </div>
                                        <button 
                                            onClick={() => handleDeleteSynonym(syn.id)} 
                                            className="btn btn-outline btn-sm"
                                            style={{ padding: '6px', color: 'var(--error)', borderColor: 'var(--error)' }}
                                            disabled={deletingSynonymId !== null}
                                        >
                                            {deletingSynonymId === syn.id ? (
                                                <span className="spinner animate-spin" style={{ width: '14px', height: '14px', border: '2px solid var(--error)', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block' }} />
                                            ) : (
                                                <Trash2 size={14} />
                                            )}
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
