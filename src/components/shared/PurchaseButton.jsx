import React, { useState, useEffect } from 'react';
import { MessageCircle, ShoppingBag, Mail, Check } from 'lucide-react';
import { settingsService } from '../../services/settingsService';
import OrderFormModal from './OrderFormModal';

/**
 * PurchaseButton — reads product.purchase_method to decide the CTA:
 * - 'whatsapp'      → "WhatsApp to Order" — opens WhatsApp with pre-filled message
 * - 'direct_order'  → "Place Order"        → opens the OrderFormModal
 *
 * The purchase_method is stored on the product in the DB and set by the admin.
 * It is NEVER hard-coded in this component.
 */
const PurchaseButton = ({ product, variant = 'full', className = '', selectedLens = null }) => {
  const [phoneNumber, setPhoneNumber] = useState('923169649626'); // Fallback only
  const [storeEmail, setStoreEmail] = useState('hello@aplusoptics.com'); // Fallback email
  const [orderModalOpen, setOrderModalOpen] = useState(false);

  useEffect(() => {
    settingsService.getSettings().then(settings => {
      if (settings?.whatsapp_number) {
        setPhoneNumber(settings.whatsapp_number);
      }
      if (settings?.store_email) {
        setStoreEmail(settings.store_email);
      }
    }).catch(() => {/* Use fallback */});
  }, []);

  const handleWhatsApp = (e) => {
    e.preventDefault();
    const baseUrl = window.location.origin;
    const productUrl = product.slug ? `${baseUrl}/products/${product.slug}` : window.location.href;
    const unitPrice = product.sale_price && product.sale_price < product.price
      ? product.sale_price
      : product.price;

    let message = `Hello! I am interested in this product.\n\nProduct: ${product.name}\nCategory: ${product.categories?.name || 'N/A'}\nSKU: ${product.sku || 'N/A'}\nBase Price: Rs. ${unitPrice}\n`;
    
    if (selectedLens) {
      message += `Selected Lens: ${selectedLens.name} (+ Rs. ${selectedLens.price})\n`;
      message += `Total Price: Rs. ${unitPrice + selectedLens.price}\n`;
    }

    message += `\nProduct Link:\n${productUrl}\n\nPlease provide more details.`;

    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleGmail = (e) => {
    e.preventDefault();
    const baseUrl = window.location.origin;
    const productUrl = product.slug ? `${baseUrl}/products/${product.slug}` : window.location.href;
    const unitPrice = product.sale_price && product.sale_price < product.price
      ? product.sale_price
      : product.price;

    const subject = `Inquiry regarding ${product.name}`;
    let body = `Hello! I am interested in this product.\n\nProduct: ${product.name}\nCategory: ${product.categories?.name || 'N/A'}\nSKU: ${product.sku || 'N/A'}\nBase Price: Rs. ${unitPrice}\n`;

    if (selectedLens) {
      body += `Selected Lens: ${selectedLens.name} (+ Rs. ${selectedLens.price})\n`;
      body += `Total Price: Rs. ${unitPrice + selectedLens.price}\n`;
    }

    body += `\nProduct Link:\n${productUrl}\n\nPlease provide more details.`;

    window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(storeEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
  };

  const isDirectOrder = product?.purchase_method === 'direct_order';
  const isGmail = product?.purchase_method === 'gmail';
  const isCustomLens = selectedLens && selectedLens.id !== 'no-lens-default';

  const handlePurchaseClick = (e) => {
    if (isCustomLens || product?.purchase_method === 'whatsapp') {
      handleWhatsApp(e);
    } else if (isDirectOrder) {
      setOrderModalOpen(true);
    } else if (isGmail) {
      handleGmail(e);
    }
  };

  // CARD variant — compact icon-only button
  if (variant === 'card') {
    if (isCustomLens || product?.purchase_method === 'whatsapp') {
      return (
        <button
          className={`whatsapp-action ${className}`}
          onClick={handlePurchaseClick}
          aria-label="WhatsApp to Order"
          title="WhatsApp to Order"
        >
          <MessageCircle size={18} strokeWidth={2} />
        </button>
      );
    }
    if (isDirectOrder) {
      return (
        <>
          <button
            className={`direct-order-action ${className}`}
            onClick={handlePurchaseClick}
            aria-label="Place Order"
            title="Place Order"
          >
            <ShoppingBag size={18} strokeWidth={2} />
          </button>
          <OrderFormModal
            isOpen={orderModalOpen}
            onClose={() => setOrderModalOpen(false)}
            product={product}
            selectedLens={selectedLens}
          />
        </>
      );
    }
    if (isGmail) {
      return (
        <button
          className={`whatsapp-action ${className}`}
          style={{ background: '#FEE2E2', color: '#DC2626' }}
          onClick={handlePurchaseClick}
          aria-label="Email to Order"
          title="Email to Order"
        >
          <Mail size={18} strokeWidth={2} />
        </button>
      );
    }
  }

  // FULL variant — full-width button with label
  return (
    <>
      <button 
        className={`btn-purchase-direct ${className}`} 
        onClick={handlePurchaseClick}
        style={isCustomLens ? { background: '#075E54' } : {}}
      >
        {isCustomLens || product?.purchase_method === 'whatsapp' ? (
          <><MessageCircle size={20} strokeWidth={2} /> Continue on WhatsApp</>
        ) : isDirectOrder ? (
          <><Check size={20} strokeWidth={2} /> Place Order</>
        ) : (
          <><Mail size={20} strokeWidth={2} /> Email to Order</>
        )}
      </button>
      <OrderFormModal
        isOpen={orderModalOpen}
        onClose={() => setOrderModalOpen(false)}
        product={product}
        selectedLens={selectedLens}
      />
    </>
  );
};

export default PurchaseButton;
