import React, { useState, useEffect } from 'react';
import { settingsService } from '../../services/settingsService';

const WhatsAppButton = ({ product, className = '', children }) => {
  const [phoneNumber, setPhoneNumber] = useState('923000000000'); // Default fallback

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await settingsService.getSettings();
        if (settings?.whatsapp_number) {
          setPhoneNumber(settings.whatsapp_number);
        }
      } catch (error) {
        console.error("Failed to fetch settings for WhatsApp button", error);
      }
    };
    fetchSettings();
  }, []);

  const handleClick = (e) => {
    e.preventDefault();
    
    let message = "Hello! I need some help choosing a frame or lens.";
    
    if (product) {
      const baseUrl = window.location.origin;
      const productUrl = `${baseUrl}/products/${product.slug}`;
      message = `Hello! I am interested in this product.

Product: ${product.name}
Category: ${product.categories?.name || 'N/A'}
Price: $${product.sale_price ? product.sale_price : product.price}
SKU: ${product.sku || 'N/A'}

Product Link:
${productUrl}

Please provide more details and availability.`;
    }

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
  };

  return (
    <button onClick={handleClick} className={className}>
      {children || 'Order via WhatsApp'}
    </button>
  );
};

export default WhatsAppButton;
