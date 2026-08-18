import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { productService } from '../../services/productService';
import { ShieldCheck, Eye, Truck, RefreshCw, User, CheckCircle, ChevronRight, Heart, Phone, Sun, Monitor, Sparkles, Shield, Camera } from 'lucide-react';
import WhatsAppButton from '../../components/shared/WhatsAppButton';
import '../../styles/home.css';

import ProductCard from '../../components/shared/ProductCard';

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const { supabase } = await import('../../lib/supabase');
        
        // Fetch Featured
        const { data: featured } = await supabase
          .from('products')
          .select('*, categories(*), images:product_images(*)')
          .eq('active', true)
          .eq('featured', true)
          .limit(4);
          
        setFeaturedProducts(featured || []);

        // Fetch New Arrivals
        const { data: newProd } = await supabase
          .from('products')
          .select('*, categories(*), images:product_images(*)')
          .eq('active', true)
          .eq('new_arrival', true)
          .limit(4);
          
        setNewArrivals(newProd || []);
      } catch (err) {
        console.error("Failed to load home data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <div className="hero-eyebrow">
              <div className="line"></div>
              <span>PREMIUM OPTICAL BOUTIQUE</span>
            </div>
            <h1 className="hero-title">See Better. Look Better.</h1>
            <p className="hero-subtitle">
              Discover premium eyewear crafted for clarity, comfort, and style. From prescription lenses to designer frames — your perfect pair awaits.
            </p>
          </div>
          <div className="hero-actions">
            <Link to="/products" className="btn btn--primary">Shop Collection</Link>
            <Link to="/category/sunglasses" className="btn btn--outline-dark">
              Explore Eyewear
            </Link>
          </div>
        </div>
        <div className="hero-image-container"></div>
      </section>

      {/* Features Banner */}
      <section className="features-section">
        <div className="features-banner">
          <div className="feature-banner-card">
            <div className="feature-banner-icon"><Truck size={24} strokeWidth={2} /></div>
            <div className="feature-banner-text">
              <h3 className="feature-banner-title">Free Shipping</h3>
              <p className="feature-banner-subtitle">Fast & trackable door-to-door delivery</p>
            </div>
          </div>
          <div className="feature-banner-card">
            <div className="feature-banner-icon"><RefreshCw size={24} strokeWidth={2} /></div>
            <div className="feature-banner-text">
              <h3 className="feature-banner-title">30-Day Returns</h3>
              <p className="feature-banner-subtitle">Easy risk-free exchange or refunds</p>
            </div>
          </div>
          <div className="feature-banner-card">
            <div className="feature-banner-icon"><ShieldCheck size={24} strokeWidth={2} /></div>
            <div className="feature-banner-text">
              <h3 className="feature-banner-title">Certified Lenses</h3>
              <p className="feature-banner-subtitle">Premium clinical quality assurance</p>
            </div>
          </div>
          <div className="feature-banner-card">
            <div className="feature-banner-icon"><User size={24} strokeWidth={2} /></div>
            <div className="feature-banner-text">
              <h3 className="feature-banner-title">Expert Support</h3>
              <p className="feature-banner-subtitle">Online consultation with opticians</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="categories-section">
        <div className="categories-heading">
          <h2 className="categories-title">Shop by Category</h2>
          <p className="categories-subtitle">Precision engineered eyewear and options curated for every visual demand</p>
        </div>
        
        <div className="categories-grid">
          <Link to="/category/mens" className="category-card" style={{ backgroundImage: `url('/category-card.svg')` }} aria-label="Men's Eyewear" />
          
          <Link to="/category/womens" className="category-card" style={{ backgroundImage: `url('/category-card (1).svg')` }} aria-label="Women's Eyewear" />

          <Link to="/category/eyeglasses" className="category-card" style={{ backgroundImage: `url('/category-card (2).svg')` }} aria-label="Eyeglasses" />

          <Link to="/category/sunglasses" className="category-card" style={{ backgroundImage: `url('/category-card (3).svg')` }} aria-label="Sunglasses" />

          <Link to="/category/screen-glasses" className="category-card" style={{ backgroundImage: `url('/category-card (5).svg')` }} aria-label="Screen Glasses" />

          <Link to="/category/intelligent-glasses" className="category-card" style={{ backgroundImage: `url('/category-card (6).svg')` }} aria-label="Intelligent Glasses" />

          <Link to="/category/contact-lenses" className="category-card" style={{ backgroundImage: `url('/category-card (7).svg')` }} aria-label="Contact Lenses" />

          <Link to="/category/accessories" className="category-card" style={{ backgroundImage: `url('/category-card (8).svg')` }} aria-label="Accessories" />
        </div>
      </section>

      {/* Featured Products */}
      <section className="featured-products-section">
        <div className="section-heading">
          <h2 className="section-title">Best Sellers</h2>
          <p className="section-subtitle">Our most coveted frames, celebrating iconic shapes and premium materials</p>
        </div>
        {loading ? (
          <p className="text-center">Loading products...</p>
        ) : (
          <div className="products-row">
            {featuredProducts.length > 0 ? (
              featuredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))
            ) : (
              <div className="empty-state" style={{ width: '100%' }}>
                <h3>Collection Curating</h3>
                <p>Our experts are preparing a new selection of featured eyewear. Check back soon.</p>
              </div>
            )}
          </div>
        )}
        {featuredProducts.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px', width: '100%' }}>
            <Link to="/products?filter=best-sellers" className="btn btn--outline-dark">View All Best Sellers</Link>
          </div>
        )}
      </section>

      {/* New Arrivals */}
      <section className="featured-products-section" style={{ background: '#FFFFFF', border: 'none' }}>
        <div className="section-heading">
          <h2 className="section-title">New Arrivals</h2>
          <p className="section-subtitle">Stay ahead of the curve with our latest seasonal drops and modern rim designs</p>
        </div>
        {loading ? (
          <p className="text-center">Loading products...</p>
        ) : (
          <div className="products-row">
            {newArrivals.length > 0 ? (
              newArrivals.map(product => (
                <ProductCard key={product.id} product={product} />
              ))
            ) : (
              <div className="empty-state" style={{ width: '100%' }}>
                <h3>Fresh Styles Incoming</h3>
                <p>We are currently updating our catalog with the latest arrivals.</p>
              </div>
            )}
          </div>
        )}
        {newArrivals.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px', width: '100%' }}>
            <Link to="/products?filter=new-arrivals" className="btn btn--outline-dark">View All New Arrivals</Link>
          </div>
        )}
      </section>

      {/* Lens Technology Section */}
      <section className="lens-technology-section">
        <div className="lens-text-area">
          <div className="lens-heading-container">
            <h2 className="lens-title">Advanced Lens Technology</h2>
            <p className="lens-subtitle">At APlusOptics, a stunning frame is only half the story. Our German-engineered prescription lenses offer pristine optical clarity and robust modern safeguards.</p>
          </div>
          
          <div className="lens-features-list">
            <div className="lens-feature">
              <div className="feature-icon-circle">
                <Sun size={18} strokeWidth={2} />
              </div>
              <div className="feature-text-content">
                <h3 className="feature-title">Anti-Glare & UV Protection</h3>
                <p className="feature-desc">Full spectrum UV400 defense paired with premium anti-reflective coating to prevent visual fatigue and squinting.</p>
              </div>
            </div>

            <div className="lens-feature">
              <div className="feature-icon-circle">
                <Monitor size={18} strokeWidth={2} />
              </div>
              <div className="feature-text-content">
                <h3 className="feature-title">Blue-Light Filtering</h3>
                <p className="feature-desc">High-precision digital shield filtering harmful blue light from screens, helping you sleep better and maintain eye health.</p>
              </div>
            </div>

            <div className="lens-feature">
              <div className="feature-icon-circle">
                <Sparkles size={18} strokeWidth={2} />
              </div>
              <div className="feature-text-content">
                <h3 className="feature-title">Pro-HD Progressive Lenses</h3>
                <p className="feature-desc">Gradual multi-focus architecture delivering seamless transition from reading distance to horizon without visual distortion.</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="lens-image-container" aria-label="Advanced Lens Technology image"></div>
      </section>

      {/* Brand Story Section */}
      <section className="brand-story-section">
        <div className="story-content">
          <div className="story-tag">DECADE OF OPTICAL ARTISTRY</div>
          <h2 className="story-heading">Clinical Excellence Meets High Fashion</h2>
          <p className="story-paragraph">APlusOptics was founded with a singular purpose: to bridge the gap between clinical optical expertise and refined contemporary aesthetics. Every frame is hand-selected in Italy, while each premium lens is custom-cut in our labs to match your exact prescription parameters. We believe vision correction shouldn't hide your character — it should define it.</p>
          <div className="story-signature">
            <span className="signature-name">Dr. Marcus Sterling</span>
            <div className="signature-dot"></div>
            <span className="signature-title">Founder & Chief Optician</span>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="why-choose-us">
        <div className="why-heading-container">
          <h2 className="why-title">Why Eye Specialists Trust OptiVue</h2>
          <p className="why-subtitle">Engineered for ocular precision, curated for aesthetic distinction</p>
        </div>
        <div className="why-columns-row">
          <div className="choose-column">
            <div className="column-icon-bg">
              <Shield size={24} strokeWidth={2} />
            </div>
            <div className="column-text">
              <h3 className="column-title">Certified Quality</h3>
              <p className="column-desc">Our lenses carry strict optical certification. We inspect each pair across 17 control points before safe dispatch to your door.</p>
            </div>
          </div>
          
          <div className="choose-column">
            <div className="column-icon-bg">
              <Camera size={24} strokeWidth={2} />
            </div>
            <div className="column-text">
              <h3 className="column-title">Virtual Try-On</h3>
              <p className="column-desc">Leverage our cutting-edge web AR tool to accurately measure your pupillary distance and preview frames in high-fidelity 3D.</p>
            </div>
          </div>
          
          <div className="choose-column">
            <div className="column-icon-bg">
              <User size={24} strokeWidth={2} />
            </div>
            <div className="column-text">
              <h3 className="column-title">Expert Consultation</h3>
              <p className="column-desc">Not sure about your lens type? Book a direct session with our registered opticians for clear guidance and recommendations.</p>
            </div>
          </div>
        </div>
      </section>

      {/* WhatsApp CTA Section */}
      <section className="whatsapp-cta-section">
        <div className="whatsapp-banner">
          <div className="banner-text-content">
            <div className="badge-row">
              <Phone size={16} strokeWidth={2} />
              <p className="badge-text">DIRECT NURSE & OPTICIAN HELPLINE</p>
            </div>
            <h2 className="whatsapp-heading">Need Help Choosing Your Frame or Lens?</h2>
            <p className="whatsapp-desc">Chat live with a certified OptiVue optical specialist on WhatsApp. Send us your prescription photo, and we will recommend the perfect lens parameters for you.</p>
          </div>
          <WhatsAppButton className="whatsapp-cta-button">
            <Phone size={20} color="#FFFFFF" strokeWidth={2} />
            <span className="whatsapp-cta-text">Chat on WhatsApp</span>
          </WhatsAppButton>
        </div>
      </section>
      
    </div>
  );
};

export default Home;
