import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Phone } from 'lucide-react';
import WhatsAppButton from './WhatsAppButton';

const ProductCard = ({ product }) => {
  const primaryImage = product.images?.find(img => img.is_primary) || product.images?.[0];
  const imageUrl = primaryImage ? primaryImage.image_url : '/placeholder-glasses.jpg';
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
        <Link to={`/products/${product.slug}`} className="product-image" style={{ backgroundImage: `url('${imageUrl}')` }} aria-label={product.name} />
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
          <WhatsAppButton product={product} className="whatsapp-action">
            <Phone size={18} strokeWidth={2} />
          </WhatsAppButton>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
