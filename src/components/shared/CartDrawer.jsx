import React, { useEffect, useState, useMemo } from 'react';
import { useCart } from '../../context/CartContext';
import { X, Trash2, Plus, Minus, Phone } from 'lucide-react';
import OrderFormModal from './OrderFormModal';
import { settingsService } from '../../services/settingsService';
import {
  evaluateCartOrderRouting,
  getActualProductCategory,
  hasActualLensSelected,
  logCartRoutingDebug,
} from '../../utils/orderRouting';

const CartDrawer = () => {
  const { cartItems, isCartOpen, setIsCartOpen, updateQuantity, removeFromCart } = useCart();
  const [phoneNumber, setPhoneNumber] = useState('923169649626');
  const [orderModalOpen, setOrderModalOpen] = useState(false);

  useEffect(() => {
    settingsService.getSettings().then(settings => {
      if (settings?.whatsapp_number) {
        setPhoneNumber(settings.whatsapp_number);
      }
    }).catch(() => {});
  }, []);

  const subtotal = cartItems.reduce((total, item) => {
    const itemPrice = item.product.sale_price && item.product.sale_price < item.product.price
      ? item.product.sale_price 
      : item.product.price;
    const lensPrice = hasActualLensSelected(item) ? (item.selectedLens?.price || 0) : 0;
    return total + ((itemPrice + lensPrice) * item.quantity);
  }, 0);

  const deliveryCharges = subtotal >= 5000 ? 0 : 300;
  const grandTotal = subtotal + deliveryCharges;

  const routing = useMemo(() => evaluateCartOrderRouting(cartItems), [cartItems]);
  const { useEmailConfirmation } = routing;

  useEffect(() => {
    if (cartItems.length > 0) {
      logCartRoutingDebug(cartItems, routing);
    }
  }, [cartItems, routing]);

  const handleWhatsAppOrder = () => {
    let message = `Hello Aplus Optics, I would like to order:\n\n`;
    
    cartItems.forEach((item, index) => {
      const baseUrl = window.location.origin;
      const productUrl = `${baseUrl}/products/${item.product.slug}`;
      const itemPrice = item.product.sale_price && item.product.sale_price < item.product.price
        ? item.product.sale_price 
        : item.product.price;
      const lensPrice = hasActualLensSelected(item) ? (item.selectedLens?.price || 0) : 0;
      const categoryLabel = getActualProductCategory(item) || item.categoryName || item.product.categories?.name || 'N/A';
      
      message += `${index + 1}. ${item.product.name}\n`;
      message += `Category: ${categoryLabel}\n`;
      if (item.selectedColor) message += `Color: ${item.selectedColor}\n`;
      if (item.selectedLens) {
        message += `Lens: ${item.selectedLens.name}\n`;
      } else {
        message += `Lens: No Lens Selected\n`;
      }
      message += `Quantity: ${item.quantity}\n`;
      message += `Price: Rs. ${(itemPrice + lensPrice).toLocaleString()}\n`;
      message += `Link: ${productUrl}\n\n`;
    });

    message += `Subtotal: Rs. ${subtotal.toLocaleString()}\n`;
    message += `Delivery Charges: Rs. ${deliveryCharges.toLocaleString()}\n`;
    message += `Grand Total: Rs. ${grandTotal.toLocaleString()}\n\n`;
    message += `I would like to discuss my order and prescription requirements.`;

    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <>
      {isCartOpen && (
        <>
          <div className="cart-drawer-overlay" onClick={() => setIsCartOpen(false)} />
          <div className="cart-drawer">
        <div className="cart-header">
          <h2>Your Cart ({cartItems.length})</h2>
          <button onClick={() => setIsCartOpen(false)} className="close-btn"><X size={24} /></button>
        </div>
        <div style={{ backgroundColor: '#fef2f2', color: '#991b1b', padding: '8px 16px', fontSize: '13px', textAlign: 'center', fontWeight: '500', borderBottom: '1px solid #fee2e2' }}>
          Enjoy Free Shipping on all orders above Rs. 5,000!
        </div>

        <div className="cart-items">
          {cartItems.length === 0 ? (
            <div className="empty-cart">
              <p>Your cart is empty.</p>
              <button onClick={() => setIsCartOpen(false)} className="btn btn--outline-dark mt-2">Continue Shopping</button>
            </div>
          ) : (
            cartItems.map(item => {
              const primaryImage = item.product.images?.find(img => img.is_primary) || item.product.images?.[0];
              const imageUrl = primaryImage ? primaryImage.image_url : '/placeholder-glasses.jpg';
              const basePrice = item.product.sale_price && item.product.sale_price < item.product.price
                ? item.product.sale_price 
                : item.product.price;
              const lensPrice = hasActualLensSelected(item) ? (item.selectedLens?.price || 0) : 0;
              const itemTotal = (basePrice + lensPrice) * item.quantity;

              return (
                <div key={item.id} className="cart-item">
                  <img src={imageUrl} alt={item.product.name} className="cart-item-image" />
                  <div className="cart-item-details">
                    <h4>{item.product.name}</h4>
                    {item.selectedColor && <p className="cart-item-option">Color: {item.selectedColor}</p>}
                    {item.selectedLens && (
                      <p className="cart-item-option">
                        Lens: {item.selectedLens.name}
                        {hasActualLensSelected(item) ? ` (+Rs. ${lensPrice})` : ''}
                      </p>
                    )}
                    
                    <div className="cart-item-bottom">
                      <div className="quantity-controls">
                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)}><Minus size={14} /></button>
                        <span>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)}><Plus size={14} /></button>
                      </div>
                      <div className="cart-item-price">Rs. {itemTotal.toLocaleString()}</div>
                    </div>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="remove-btn" aria-label="Remove item"><Trash2 size={18} /></button>
                </div>
              );
            })
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="cart-footer">
            <div className="cart-summary-row">
              <span>Subtotal</span>
              <span>Rs. {subtotal.toLocaleString()}</span>
            </div>
            <div className="cart-summary-row">
              <span>Delivery</span>
              <span>Rs. {deliveryCharges.toLocaleString()}</span>
            </div>
            <div className="cart-summary-row total">
              <span>Grand Total</span>
              <span>Rs. {grandTotal.toLocaleString()}</span>
            </div>

            {useEmailConfirmation ? (
              <button className="btn btn--primary w-100 mt-2" onClick={() => { setIsCartOpen(false); setOrderModalOpen(true); }}>
                Proceed to Checkout
              </button>
            ) : (
              <button className="btn btn--whatsapp w-100 mt-2" onClick={handleWhatsAppOrder}>
                <Phone size={18} className="mr-1" /> Order via WhatsApp
              </button>
            )}
            
            {!useEmailConfirmation && (
              <p className="cart-note text-center mt-2" style={{ fontSize: '12px', color: '#64748b' }}>
                {!routing.noLensSelectedAnywhere
                  ? 'Your cart contains a prescription lens selection that requires WhatsApp consultation.'
                  : 'Your cart contains products (e.g. contact lenses or specialty items) that require WhatsApp ordering.'}
              </p>
            )}
          </div>
        )}
      </div>
        </>
      )}

      {orderModalOpen && (
        <OrderFormModal 
          isOpen={orderModalOpen} 
          onClose={() => setOrderModalOpen(false)} 
          cartItems={cartItems}
          subtotal={subtotal}
          deliveryCharges={deliveryCharges}
          grandTotal={grandTotal}
        />
      )}
    </>
  );
};

export default CartDrawer;
