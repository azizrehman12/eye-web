import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Check } from 'lucide-react';
import { useCart } from '../../context/CartContext';

const PurchaseButton = ({ product, variant = 'full', className = '', selectedLens = null, selectedColor = null }) => {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [added, setAdded] = useState(false);
  const [error, setError] = useState('');

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setError('');

    if (product.available_colors && product.available_colors.length > 0 && !selectedColor) {
      if (variant === 'card') {
        navigate(`/products/${product.slug}`);
        return;
      }
      setError('Please select a color before adding to cart.');
      return;
    }

    if (variant === 'card' && product.purchase_method === 'direct_order') {
      navigate(`/products/${product.slug}`);
      return;
    }

    addToCart(product, selectedColor, selectedLens, 1);
    
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (variant === 'card') {
    return (
      <button 
        className={`btn btn--primary ${className}`} 
        onClick={handleAddToCart}
        style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}
      >
        {added ? <Check size={16} /> : <ShoppingBag size={16} />}
        {added ? 'Added' : 'Add to Cart'}
      </button>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      {error && <p style={{ color: '#ef4444', fontSize: '14px', marginBottom: '8px', textAlign: 'center' }}>{error}</p>}
      <button 
        className={`btn btn--primary w-100 ${className}`} 
        onClick={handleAddToCart}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px' }}
      >
        {added ? <Check size={20} /> : <ShoppingBag size={20} />}
        {added ? 'Added to Cart' : 'Add to Cart'}
      </button>
    </div>
  );
};

export default PurchaseButton;
