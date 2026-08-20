import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import PurchaseButton from './PurchaseButton';

const ProductCard = ({ product }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Filter valid images and fallback if none
  const validImages = (product.images || []).filter(img => img && img.image_url);
  
  // Sort to ensure primary image is first
  const sortedImages = [...validImages].sort((a, b) => {
    if (a.is_primary) return -1;
    if (b.is_primary) return 1;
    return (a.sort_order || 0) - (b.sort_order || 0);
  });

  const displayImages = sortedImages.length > 0 
    ? sortedImages 
    : [{ id: 'fallback', image_url: '/placeholder-glasses.jpg' }];

  useEffect(() => {
    let intervalId;
    if (displayImages.length > 1) {
      intervalId = setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % displayImages.length);
      }, 3000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [displayImages.length]);

  const hasSale = product.sale_price && product.sale_price < product.price;
  
  // Calculate discount percentage
  const discount = hasSale ? Math.round(((product.price - product.sale_price) / product.price) * 100) : 0;

  return (
    <div className="product-card">
      <div className="product-image-container">
        {hasSale && <div className="discount-badge">-{discount}%</div>}
        <button className="wishlist-btn" aria-label="Add to wishlist">
          <Heart size={16} strokeWidth={2} />
        </button>
        <Link 
          to={`/products/${product.slug}`} 
          style={{ display: 'block', position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 1 }} 
          aria-label={product.name}
        >
          {displayImages.map((img, index) => (
            <div
              key={img.id || index}
              className="product-image"
              style={{
                backgroundImage: `url('${img.image_url}')`,
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                opacity: currentIndex === index ? 1 : 0,
                transition: 'opacity 0.8s ease-in-out',
                zIndex: currentIndex === index ? 1 : 0
              }}
            />
          ))}
        </Link>
      </div>
      
      <div className="product-info">
        <div className="category-stock">
          <span className="category-name">{product.categories?.name || 'Uncategorized'}</span>
          {product.stock_quantity > 0 || product.stock_quantity === undefined ? (
            <div className="stock-status in-stock">IN STOCK</div>
          ) : (
            <div className="stock-status pre-order">PRE-ORDER</div>
          )}
        </div>
        
        <div className="name-price">
          <Link to={`/products/${product.slug}`}>
            <h3 className="product-title">{product.name}</h3>
          </Link>
          <div className="prices">
            {hasSale ? (
              <>
                <span className="sale-price">Rs. {product.sale_price}</span>
                <span className="original-price">Rs. {product.price}</span>
              </>
            ) : (
              <span className="sale-price">Rs. {product.price}</span>
            )}
          </div>
        </div>
        
        <div className="card-actions">
          <Link to={`/products/${product.slug}`} className="view-details-btn">
            View Details
          </Link>
          <PurchaseButton product={product} variant="card" />
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
