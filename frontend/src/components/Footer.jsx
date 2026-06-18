import React from 'react';
import { Shield, Truck, RotateCcw, Award } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="footer">
            <div className="footer-grid" style={{ marginBottom: '40px', borderBottom: '1px solid var(--border-color)', paddingBottom: '30px' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{ background: 'var(--accent-light)', p: 10, padding: '12px', borderRadius: '12px', color: 'var(--accent)' }}>
                        <Truck size={24} />
                    </div>
                    <div>
                        <h4 style={{ fontSize: '15px', fontWeight: 'bold' }}>Free & Fast Shipping</h4>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>On all orders exceeding $100</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{ background: 'var(--accent-light)', padding: '12px', borderRadius: '12px', color: 'var(--accent)' }}>
                        <Shield size={24} />
                    </div>
                    <div>
                        <h4 style={{ fontSize: '15px', fontWeight: 'bold' }}>Secure Payment</h4>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Simulated SSL checkout sandboxes</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{ background: 'var(--accent-light)', padding: '12px', borderRadius: '12px', color: 'var(--accent)' }}>
                        <RotateCcw size={24} />
                    </div>
                    <div>
                        <h4 style={{ fontSize: '15px', fontWeight: 'bold' }}>Easy Returns</h4>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>14-day hassle-free return window</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{ background: 'var(--accent-light)', padding: '12px', borderRadius: '12px', color: 'var(--accent)' }}>
                        <Award size={24} />
                    </div>
                    <div>
                        <h4 style={{ fontSize: '15px', fontWeight: 'bold' }}>Loyalty Program</h4>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Earn 1 reward point per $10 spent</p>
                    </div>
                </div>
            </div>
            
            <div className="footer-grid">
                <div className="footer-col">
                    <h3>E-Commerce Lite</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6' }}>
                        A production-grade, containerized digital storefront engineered for speed, responsiveness, and premium aesthetics.
                    </p>
                </div>
                <div className="footer-col">
                    <h3>Categories</h3>
                    <ul>
                        <li>Electronics</li>
                        <li>Clothing</li>
                        <li>Home & Living</li>
                        <li>Featured Gear</li>
                    </ul>
                </div>
                <div className="footer-col">
                    <h3>Developer Resources</h3>
                    <ul>
                        <li>Prometheus Metrics</li>
                        <li>Grafana Boards</li>
                        <li>API Documentation</li>
                        <li>Docker Pipelines</li>
                    </ul>
                </div>
            </div>
            
            <div className="footer-bottom">
                &copy; {new Date().getFullYear()} E-Commerce Lite. All rights reserved.
            </div>
        </footer>
    );
}
