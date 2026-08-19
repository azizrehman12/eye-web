import React, { useState, useEffect } from 'react';
import { MessageCircle, ShoppingBag, Mail } from 'lucide-react';
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
const PurchaseButton = ({ product, variant = 'full', className = '' }) => {
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

    const message = `Hello! I am interested in this product.\n\nProduct: ${product.name}\nCategory: ${product.categories?.name || 'N/A'}\nSKU: ${product.sku || 'N/A'}\nPrice: Rs. ${unitPrice}\n\nProduct Link:\n${productUrl}\n\nPlease provide more details.`;

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
    const body = `Hello! I am interested in this product.\n\nProduct: ${product.name}\nCategory: ${product.categories?.name || 'N/A'}\nSKU: ${product.sku || 'N/A'}\nPrice: Rs. ${unitPrice}\n\nProduct Link:\n${productUrl}\n\nPlease provide more details.`;

    window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(storeEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
  };

  const isDirectOrder = product?.purchase_method === 'direct_order';
  const isGmail = product?.purchase_method === 'gmail';

  // CARD variant — compact icon-only button
  if (variant === 'card') {
    if (isDirectOrder) {
      return (
        <>
          <button
            className={`direct-order-action ${className}`}
            onClick={() => setOrderModalOpen(true)}
            aria-label="Place Order"
            title="Place Order"
          >
            <ShoppingBag size={18} strokeWidth={2} />
          </button>
          <OrderFormModal
            isOpen={orderModalOpen}
            onClose={() => setOrderModalOpen(false)}
            product={product}
          />
        </>
      );
    }
    if (isGmail) {
      return (
        <button
          className={`whatsapp-action ${className}`}
          style={{ background: '#FEE2E2', color: '#DC2626' }}
          onClick={handleGmail}
          aria-label="Email to Order"
          title="Email to Order"
        >
          <Mail size={18} strokeWidth={2} />
        </button>
      );
    }
    return (
      <button
        className={`whatsapp-action ${className}`}
        onClick={handleWhatsApp}
        aria-label="WhatsApp to Order"
        title="WhatsApp to Order"
      >
        <MessageCircle size={18} strokeWidth={2} />
      </button>
    );
  }

  // FULL variant — full-width button with label
  if (isDirectOrder) {
    return (
      <>
        <button
          className={`btn-purchase-direct ${className}`}
          onClick={() => setOrderModalOpen(true)}
        >
          <ShoppingBag size={18} strokeWidth={2} />
          Place Order
        </button>
        <OrderFormModal
          isOpen={orderModalOpen}
          onClose={() => setOrderModalOpen(false)}
          product={product}
        />
      </>
    );
  }

  if (isGmail) {
    return (
      <button
        className={`btn-purchase-direct ${className}`}
        style={{ background: '#DC2626', color: 'white', border: 'none' }}
        onClick={handleGmail}
      >
        <Mail size={18} strokeWidth={2} />
        Email to Order
      </button>
    );
  }

  return (
    <button
      className={`btn-purchase-whatsapp ${className}`}
      onClick={handleWhatsApp}
    >
      <MessageCircle size={18} strokeWidth={2} />
      WhatsApp to Order
    </button>
  );
};

export default PurchaseButton;
