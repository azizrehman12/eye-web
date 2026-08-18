import React, { useState } from 'react';
import { Outlet, Link, NavLink } from 'react-router-dom';
import { Menu, Search, ShoppingBag, Eye, Phone, CreditCard, Shield, Check } from 'lucide-react';
import MobileSidebar from '../components/customer/MobileSidebar';
import '../styles/header.css';
import '../styles/footer.css';

const Header = ({ onOpenSidebar }) => (
  <header className="site-header">
    <div className="site-header__inner">
      <button 
        className="hide-on-desktop btn-icon" 
        onClick={onOpenSidebar}
        aria-label="Open menu"
      >
        <Menu size={24} />
      </button>

      <Link to="/" className="site-header__logo" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', marginRight: '32px' }}>
        <div style={{ height: '50px', width: '150px', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
          <img src="/IMG_7101.PNG" alt="APlusOptics Logo" style={{ height: '140px', mixBlendMode: 'multiply', filter: 'contrast(1.2) brightness(1.1)' }} />
        </div>
      </Link>
      
      <nav className="site-header__nav hide-on-mobile">
        <NavLink to="/category/luxury-glasses">Luxury Glasses</NavLink>
        <NavLink to="/category/rimless-glasses">Rimless Glasses</NavLink>
        <NavLink to="/category/half-frame">Half Frame</NavLink>
        <NavLink to="/category/sunglasses">Sunglasses</NavLink>
        <NavLink to="/category/blue-cut-screen">Blue Cut (Screen)</NavLink>
        <NavLink to="/category/transition">Transition (Photochromic)</NavLink>
        <NavLink to="/category/intelligent-glasses">Intelligent Glasses</NavLink>
      </nav>

      <div className="site-header__actions">
        <div className="icon-actions hide-on-mobile">
          <button className="icon-btn"><Search size={20} color="#0F172A" strokeWidth={2} /></button>
          <button className="icon-btn"><ShoppingBag size={20} color="#0F172A" strokeWidth={2} /></button>
        </div>
        <button className="btn-consult hide-on-mobile">
          <Phone size={16} color="#FFFFFF" strokeWidth={2} />
          Consult Optician
        </button>
      </div>
    </div>
  </header>
);

const Footer = () => (
  <footer className="footer-container">
    <div className="footer-grid">
      <div className="footer-col-about">
        <Link to="/" className="footer-logo" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <div style={{ height: '40px', width: '120px', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
            <img src="/IMG_7101.PNG" alt="APlusOptics Logo" style={{ height: '110px', mixBlendMode: 'screen', filter: 'grayscale(1) invert(1) contrast(2)' }} />
          </div>
        </Link>
        <p className="footer-about-text">
          Clinical expertise meets high-end eyewear fashion. We deliver certified prescription solutions tailored to your unique visual identity.
        </p>
      </div>
      
      <div className="footer-col-links">
        <h3 className="footer-col-title">Quick Links</h3>
        <ul className="link-items">
          <li><Link to="/products">Shop Eyewear</Link></li>
          <li><Link to="/products?filter=best-sellers">Best Sellers</Link></li>
          <li><Link to="/products?filter=new-arrivals">New Arrivals</Link></li>
          <li><Link to="/guide">Lens Guide</Link></li>
          <li><Link to="/offers">Special Offers</Link></li>
        </ul>
      </div>
      
      <div className="footer-col-service">
        <h3 className="footer-col-title">Customer Service</h3>
        <ul className="link-items">
          <li><Link to="/contact">Contact Us</Link></li>
          <li><Link to="/prescription">Prescription Guide</Link></li>
          <li><Link to="/shipping">Shipping & Delivery</Link></li>
          <li><Link to="/returns">Returns & Exchanges</Link></li>
          <li><Link to="/faq">FAQs</Link></li>
        </ul>
      </div>
      
      <div className="footer-col-connect">
        <h3 className="footer-col-title">Join Our Newsletter</h3>
        <p className="footer-connect-desc">Get updates on seasonal frame drops and certified advice on ocular health.</p>
        <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
          <input type="email" placeholder="Enter your email" className="newsletter-input" required />
          <button type="submit" className="newsletter-submit">Subscribe</button>
        </form>
      </div>
    </div>
    
    <div className="footer-divider"></div>
    
    <div className="footer-bottom-bar">
      <p className="footer-copyright">&copy; 2026 APlusOptics. All rights reserved. Registered Eye Specialists.</p>
      <div className="payment-icons">
        <div className="payment-icon-box">
          <CreditCard size={14} strokeWidth={2} />
        </div>
        <div className="payment-icon-box">
          <Shield size={14} strokeWidth={2} />
        </div>
        <div className="payment-icon-box">
          <Check size={14} strokeWidth={2} />
        </div>
      </div>
    </div>
  </footer>
);

const CustomerLayout = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="customer-layout">
      <Header onOpenSidebar={() => setSidebarOpen(true)} />
      <MobileSidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="main-content">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default CustomerLayout;

