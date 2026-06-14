import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
    TrendingUp, Users, ShoppingCart, AlertCircle, 
    PlusCircle, Trash2, Edit, Save, PowerOff 
} from 'lucide-react';

const API_BASE = 'http://localhost:8080/api';

export default function AdminDashboard() {
    const { token } = useAuth();
    
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

    // Messages
    const [msg, setMsg] = useState('');

    const fetchData = async () => {
        try {
            // Stats
            const statsRes = await fetch(`${API_BASE}/admin/dashboard/stats`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (statsRes.ok) {
                const statsData = await statsRes.json();
                setStats(statsData);
            }

            // Products
            const prodRes = await fetch(`${API_BASE}/products?size=100`);
            if (prodRes.ok) {
                const prodData = await prodRes.json();
                setProducts(prodData.content || []);
            }

            // Categories
            const catRes = await fetch(`${API_BASE}/products/categories`);
            if (catRes.ok) {
                const catData = await catRes.json();
                setCategories(catData);
            }

            // Orders
            const orderRes = await fetch(`${API_BASE}/admin/orders`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (orderRes.ok) {
                const orderData = await orderRes.json();
                setOrders(orderData);
            }
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
        setMsg('');

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
            const res = await fetch(`${API_BASE}/admin/products`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setMsg('Product created successfully!');
                setNewProduct({ name: '', description: '', price: '', sku: '', stock: '', imageUrl: '', categoryId: '' });
                await fetchData();
            } else {
                setMsg('Error creating product.');
            }
        } catch (err) {
            setMsg('Network error.');
        }
    };

    const handleUpdateProduct = async (e) => {
        e.preventDefault();
        setMsg('');

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
            const res = await fetch(`${API_BASE}/admin/products/${editingProduct.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setMsg('Product updated successfully!');
                setEditingProduct(null);
                await fetchData();
            } else {
                setMsg('Error updating product.');
            }
        } catch (err) {
            setMsg('Network error.');
        }
    };

    const handleDeleteProduct = async (prodId) => {
        if (!window.confirm('Are you sure you want to delete this product?')) return;
        setMsg('');

        try {
            const res = await fetch(`${API_BASE}/admin/products/${prodId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setMsg('Product deleted.');
                await fetchData();
            } else {
                setMsg('Error deleting product.');
            }
        } catch (err) {
            setMsg('Network error.');
        }
    };

    const handleCreateCategory = async (e) => {
        e.preventDefault();
        setMsg('');
        if (!newCategoryName.trim()) return;

        try {
            const res = await fetch(`${API_BASE}/admin/categories`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name: newCategoryName })
            });

            if (res.ok) {
                setMsg('Category added!');
                setNewCategoryName('');
                await fetchData();
            } else {
                setMsg('Error adding category.');
            }
        } catch (err) {
            setMsg('Network error.');
        }
    };

    const handleUpdateOrderStatus = async (orderId, newStatus) => {
        try {
            const res = await fetch(`${API_BASE}/admin/orders/${orderId}/status?status=${newStatus}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                await fetchData();
            }
        } catch (err) {
            console.error('Error updating status', err);
        }
    };

    return (
        <div className="admin-layout">
            
            {/* Sidebar View Switcher */}
            <div className="admin-sidebar">
                <h3 style={{ fontSize: '18px', marginBottom: '20px', paddingLeft: '8px' }}>Store Admin</h3>
                <ul className="admin-sidebar-menu">
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
                </ul>
            </div>

            {/* Dashboard Content */}
            <div className="admin-content">
                
                {msg && (
                    <div style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent)', padding: '10px 14px', borderRadius: '8px', marginBottom: '18px', fontSize: '14px', border: '1px solid var(--accent)' }}>
                        {msg}
                    </div>
                )}

                {/* VIEW 1: Analytics */}
                {view === 'analytics' && (
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

                        {/* Recent Order Activities */}
                        <div className="checkout-card" style={{ margin: 0, padding: '24px' }}>
                            <h3 style={{ marginBottom: '16px' }}>Pending Order Activities</h3>
                            {orders.filter(o => o.status === 'PENDING' || o.status === 'PAID').length === 0 ? (
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
                                        {orders.filter(o => o.status === 'PENDING' || o.status === 'PAID').map(o => (
                                            <tr key={o.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                <td style={{ padding: '8px' }}>#{o.id}</td>
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
                )}

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
                                        <input type="text" required value={editingProduct.name} onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})} />
                                    </div>
                                    <div className="form-group">
                                        <label>Description</label>
                                        <textarea required value={editingProduct.description} onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})} />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                                        <div className="form-group">
                                            <label>Price ($)</label>
                                            <input type="number" step="0.01" required value={editingProduct.price} onChange={(e) => setEditingProduct({...editingProduct, price: e.target.value})} />
                                        </div>
                                        <div className="form-group">
                                            <label>Stock Count</label>
                                            <input type="number" required value={editingProduct.stock} onChange={(e) => setEditingProduct({...editingProduct, stock: e.target.value})} />
                                        </div>
                                        <div className="form-group">
                                            <label>Category</label>
                                            <select value={editingProduct.categoryId} onChange={(e) => setEditingProduct({...editingProduct, categoryId: e.target.value})}>
                                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Image URL</label>
                                        <input type="text" value={editingProduct.imageUrl} onChange={(e) => setEditingProduct({...editingProduct, imageUrl: e.target.value})} />
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button type="submit" className="btn btn-primary">Save Changes</button>
                                        <button type="button" onClick={() => setEditingProduct(null)} className="btn btn-secondary">Cancel</button>
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
                                            <input type="text" required placeholder="Smart Watch" value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} />
                                        </div>
                                        <div className="form-group">
                                            <label>SKU Code</label>
                                            <input type="text" required placeholder="ELEC-SMART-099" value={newProduct.sku} onChange={(e) => setNewProduct({...newProduct, sku: e.target.value})} />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Description</label>
                                        <textarea required placeholder="Write a description..." value={newProduct.description} onChange={(e) => setNewProduct({...newProduct, description: e.target.value})} />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                                        <div className="form-group">
                                            <label>Price ($)</label>
                                            <input type="number" step="0.01" required placeholder="99.99" value={newProduct.price} onChange={(e) => setNewProduct({...newProduct, price: e.target.value})} />
                                        </div>
                                        <div className="form-group">
                                            <label>Stock Count</label>
                                            <input type="number" required placeholder="50" value={newProduct.stock} onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})} />
                                        </div>
                                        <div className="form-group">
                                            <label>Category</label>
                                            <select value={newProduct.categoryId} required onChange={(e) => setNewProduct({...newProduct, categoryId: e.target.value})}>
                                                <option value="">Select Category</option>
                                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Image URL</label>
                                        <input type="text" placeholder="https://example.com/watch.jpg" value={newProduct.imageUrl} onChange={(e) => setNewProduct({...newProduct, imageUrl: e.target.value})} />
                                    </div>
                                    <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Add Product</button>
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
                                            >
                                                <Edit size={14} />
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteProduct(prod.id)} 
                                                className="btn btn-outline btn-sm"
                                                style={{ padding: '6px', color: 'var(--error)', borderColor: 'var(--error)' }}
                                            >
                                                <Trash2 size={14} />
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
                                                <strong>Order #{ord.id}</strong> | User: {ord.user?.email}
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
                                            <div>
                                                <select 
                                                    value={ord.status} 
                                                    onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value)}
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
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                            />
                            <button type="submit" className="btn btn-primary">Add Category</button>
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
            </div>
        </div>
    );
}
