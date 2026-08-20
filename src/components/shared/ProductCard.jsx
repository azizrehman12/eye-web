import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import PurchaseButton from './PurchaseButton';
import { useCart } from '../../context/CartContext';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Redirect when mandatory options must be chosen on the product page
    if (product.available_colors && product.available_colors.length > 0) {
      navigate(`/products/${product.slug}`);
      return;
    }

    if (product.purchase_method === 'direct_order') {
      navigate(`/products/${product.slug}`);
      return;
    }

    addToCart(product, null, null, 1);
  };

  const primaryImage = product.images?.find(img => img.is_primary) || product.images?.[0];
  const imageUrl = primaryImage ? primaryImage.image_url : '/placeholder-glasses.jpg';
  const hasSale = product.sale_price && product.sale_price < product.price;
  
  // Calculate discount percentage
  const discount = hasSale ? Math.round(((product.price - product.sale_price) / product.price) * 100) : 0;

  return (
    <div className="product-card">
      <div className="product-image-container">
        {hasSale && <div className="discount-badge">-{discount}%</div>}
        <button className="wishlist-btn" aria-label="Add to cart" onClick={handleAddToCart}>
          <Heart size={16} strokeWidth={2} />
        </button>
        <Link 
          to={`/products/${product.slug}`} 
          className="product-image" 
          style={{ backgroundImage: `url('${imageUrl}')`, display: 'block', width: '100%', height: '100%' }} 
          aria-label={product.name} 
        />
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
