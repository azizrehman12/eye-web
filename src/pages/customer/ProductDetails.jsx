import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Phone } from 'lucide-react';
import { productService } from '../../services/productService';
import { lensService } from '../../services/lensService';
import PurchaseButton from '../../components/shared/PurchaseButton';
import '../../styles/product-details.css';

const ProductDetails = () => {
  const { id } = useParams();
  const slug = id;
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeImage, setActiveImage] = useState(null);
  
  const [lenses, setLenses] = useState([]);
  const [selectedLens, setSelectedLens] = useState(null);
  
  const [selectedColor, setSelectedColor] = useState(null);

  useEffect(() => {
    const fetchProductAndLenses = async () => {
      try {
        const productData = await productService.getProductBySlug(slug);
        setProduct(productData);
        
        const primaryImage = productData.images?.find(img => img.is_primary) || productData.images?.[0];
        setActiveImage(primaryImage ? primaryImage.image_url : '/placeholder-glasses.jpg');
        
        // Now fetch lenses ONLY if the product has a category
        let activeLenses = [];
        if (productData.category_id) {
          try {
            const lensesData = await lensService.getAllLenses(productData.category_id);
            activeLenses = lensesData.filter(l => l.active);
          } catch (lensErr) {
            console.error("Failed to fetch lenses, continuing without them", lensErr);
          }
        }
        
        if (activeLenses.length > 0) {
          // Add default "No Lens Selected" option at the beginning
          const defaultNoLens = {
            id: 'no-lens-default',
            name: 'No Lens Selected',
            price: 0,
            features: [
              'No extra lens added',
              'Frame with standard lenses'
            ]
          };
          
          const lensesWithDefault = [defaultNoLens, ...activeLenses];
          setLenses(lensesWithDefault);
          setSelectedLens(defaultNoLens);
        } else {
          setLenses([]);
          setSelectedLens(null);
        }
        if (productData.available_colors && Array.isArray(productData.available_colors) && productData.available_colors.length > 0) {
          setSelectedColor(productData.available_colors[0]);
        }

      } catch (err) {
        console.error("Failed to fetch product data", err);
        setError("Product not found or an error occurred.");
      } finally {
        setLoading(false);
      }
    };

    fetchProductAndLenses();
  }, [slug]);

  // Slideshow Effect
  useEffect(() => {
    let intervalId;
    if (product && product.images && product.images.length > 1) {
      intervalId = setInterval(() => {
        setActiveImage(prevImage => {
          const currentIndex = product.images.findIndex(img => img.image_url === prevImage);
          // If for some reason not found, start at 0
          if (currentIndex === -1) return product.images[0].image_url;
          
          const nextIndex = (currentIndex + 1) % product.images.length;
          return product.images[nextIndex].image_url;
        });
      }, 3000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [product]);

  if (loading) {
    return <div className="container section-padding text-center">Loading product details...</div>;
  }

  if (error || !product) {
    return (
      <div className="container section-padding text-center">
        <h2>{error || 'Product not found'}</h2>
        <Link to="/products" className="btn btn--primary mt-2">Back to Shop</Link>
      </div>
    );
  }

  const hasSale = product.sale_price && product.sale_price < product.price;

  return (
    <div className="pd-page">
      <div className="main-content-split">

        {/* Left Column - Gallery */}
        <div className="left-column">
          <div className="product-image-container">
            {product.images && product.images.length > 0 ? (
              product.images.map((img, index) => (
                <img
                  key={img.id || index}
                  src={img.image_url}
                  alt={`${product.name} - view ${index + 1}`}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    opacity: activeImage === img.image_url ? 1 : 0,
                    transition: 'opacity 0.8s ease-in-out',
                    zIndex: activeImage === img.image_url ? 1 : 0
                  }}
                />
              ))
            ) : (
              <img src={activeImage} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            )}
          </div>

          {product.images && product.images.length > 0 && (
            <div className="image-gallery-thumbnails">
              {product.images.map(img => (
                <div
                  key={img.id}
                  className={`thumb-frame ${activeImage === img.image_url ? 'active' : ''}`}
                  onClick={() => setActiveImage(img.image_url)}
                >
                  <img src={img.image_url} alt="Thumbnail" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column - Info & Checkout */}
        <div className="right-column">

          {/* Info Block */}
          <div className="info-block">
            <div className="category-badge-wrap">
              <span className="category-name">{product.categories?.name || 'EYEGLASSES'}</span>
              <div className="dot"></div>
              <span className="lab-certified">LAB CERTIFIED</span>
            </div>

            <h1 className="product-title pd-outfit">{product.name}</h1>

            <div className="pricing-row">
              {hasSale ? (
                <>
                  <span className="sale-price pd-outfit">Rs. {product.sale_price}</span>
                  <span className="original-price pd-outfit">Rs. {product.price}</span>
                </>
              ) : (
                <span className="price pd-outfit">Rs. {product.price}</span>
              )}

            </div>

            <p className="product-short-desc">
              {product.short_description || product.description || "Premium handcrafted frames engineered for seamless everyday durability."}
            </p>
          </div>

          <div className="section-divider"></div>

          {/* Specifications Grid */}
          <div className="specifications-section">
            <h2 className="section-title pd-outfit">Product Specifications</h2>
            <div className="specs-grid">

              <div className="grid-row">
                <div className="spec-box">
                  <span className="label">Brand</span>
                  <span className="value">{product.brand || 'OptiVue Crafted'}</span>
                </div>
                <div className="spec-box">
                  <span className="label">SKU</span>
                  <span className="value">{product.sku || 'N/A'}</span>
                </div>
              </div>

              <div className="grid-row">
                <div className="spec-box">
                  <span className="label">Gender</span>
                  <span className="value">{product.gender || 'Unisex'}</span>
                </div>
                <div className="spec-box">
                  <span className="label">Frame Type</span>
                  <span className="value">{product.frame_type || 'Full Rim'}</span>
                </div>
              </div>

              <div className="grid-row">
                <div className="spec-box">
                  <span className="label">Material</span>
                  <span className="value">{product.frame_material || 'Aerospace Titanium'}</span>
                </div>
                <div className="spec-box">
                  <span className="label">Color</span>
                  <span className="value">{product.frame_color || 'Gunmetal Grey'}</span>
                </div>
              </div>

            </div>
          </div>

          <div className="section-divider"></div>

          {/* Color Selection Section */}
          {product.available_colors && Array.isArray(product.available_colors) && product.available_colors.length > 0 && (
            <>
              <div className="color-selection-section">
                <h4 className="pd-outfit" style={{ fontSize: '16px', marginBottom: '8px', color: '#0f172a' }}>
                  Select Color: <span style={{ fontWeight: 'normal', color: '#64748b' }}>{selectedColor}</span>
                </h4>
                <div className="color-options-container" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {product.available_colors.map((color) => (
                    <button
                      key={color}
                      className={`color-btn ${selectedColor === color ? 'selected' : ''}`}
                      onClick={() => setSelectedColor(color)}
                      style={{
                        padding: '6px 12px',
                        fontSize: '14px',
                        border: selectedColor === color ? '2px solid #0f172a' : '1px solid #e2e8f0',
                        borderRadius: '6px',
                        background: selectedColor === color ? '#f8fafc' : '#ffffff',
                        color: '#0f172a',
                        fontWeight: selectedColor === color ? '600' : '400',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
              <div className="section-divider"></div>
            </>
          )}

          {/* Details Section */}
          <div className="details-section">
            <h2 className="section-title pd-outfit">Details</h2>
            <p className="details-text">
              {product.description || "Every frame incorporates clinical-grade, ultra-flexible beta-titanium temples and adjustable medical silicone nose pads. Fully certified protective coatings guard against screen glare, digital blue-light strain, and ultraviolet radiation. Delivered in a premium leather case with a microfiber lens cleaning cloth."}
            </p>
          </div>

          <div className="section-divider"></div>

          {/* Prescription/Eyesight Lenses Section */}
          {product?.purchase_method === 'direct_order' && lenses.length > 0 && (
            <div className="lenses-section">
              <h2 className="section-title pd-outfit">Prescription/Eyesight Lenses:</h2>
              <p style={{ fontSize: 13, color: '#dc2626', marginBottom: 16 }}>Note: Cylinder value above 2 may incur additional charges</p>
              
              <div className="lenses-scroll-container">
                {lenses.map(lens => (
                  <div 
                    key={lens.id} 
                    className={`lens-card ${selectedLens?.id === lens.id ? 'selected' : ''}`}
                    onClick={() => setSelectedLens(lens)}
                  >
                    <div className="lens-card-header">
                      <h4 className="lens-title">{lens.name} + Rs. {lens.price}</h4>
                    </div>
                    <div className="lens-card-body">
                      <ul>
                        {Array.isArray(lens.features) && lens.features.map((feature, i) => (
                          <li key={i}>{feature}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Checkout Actions */}
          <div className="checkout-actions mt-4">
            <div className="place-order-btn-wrapper">
              <PurchaseButton product={product} variant="full" selectedLens={selectedLens} selectedColor={selectedColor} />
            </div>

            <a href="https://wa.me/1234567890" target="_blank" rel="noopener noreferrer" className="whatsapp-assist" title="Contact on WhatsApp">
              <Phone />
            </a>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
