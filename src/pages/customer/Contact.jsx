import React, { useState, useEffect } from 'react';
import { MessageCircle, Mail, MapPin } from 'lucide-react';
import { settingsService } from '../../services/settingsService';

const Contact = () => {
  const [phoneNumber, setPhoneNumber] = useState('923169649626');
  const [storeEmail, setStoreEmail] = useState('hello@aplusoptics.com');

  useEffect(() => {
    settingsService.getSettings().then(settings => {
      if (settings?.whatsapp_number) {
        setPhoneNumber(settings.whatsapp_number);
      }
      if (settings?.store_email) {
        setStoreEmail(settings.store_email);
      }
    }).catch(() => {});
  }, []);

  const handleWhatsApp = (e) => {
    e.preventDefault();
    window.open(`https://wa.me/${phoneNumber}?text=Hello%20APlusOptics!`, '_blank');
  };

  const handleGmail = (e) => {
    e.preventDefault();
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(storeEmail)}`, '_blank');
  };

  return (
    <div className="contact-page">
      <div className="container section-padding">
        <div className="contact-header text-center" style={{ marginBottom: '40px' }}>
          <h1 className="pd-outfit" style={{ fontSize: '36px', color: '#0f172a', marginBottom: '16px' }}>
            Contact Us
          </h1>
          <p style={{ color: '#64748b', fontSize: '16px' }}>We're here to help with your prescriptions and orders.</p>
        </div>
        
        <div className="contact-grid" style={{ display: 'flex', gap: '24px', justifyContent: 'center', flexWrap: 'wrap', maxWidth: '900px', margin: '0 auto' }}>
          
          <div className="contact-card" style={{ flex: '1', minWidth: '250px', background: '#f8fafc', padding: '32px', borderRadius: '12px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
            <MessageCircle size={32} color="#075E54" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ marginBottom: '12px' }}>WhatsApp</h3>
            <p style={{ color: '#64748b', marginBottom: '24px', fontSize: '14px' }}>Fastest response for prescriptions and orders.</p>
            <button 
              onClick={handleWhatsApp}
              style={{ background: '#075E54', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', width: '100%' }}
            >
              Chat on WhatsApp
            </button>
          </div>

          <div className="contact-card" style={{ flex: '1', minWidth: '250px', background: '#f8fafc', padding: '32px', borderRadius: '12px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
            <Mail size={32} color="#DC2626" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ marginBottom: '12px' }}>Email Us</h3>
            <p style={{ color: '#64748b', marginBottom: '24px', fontSize: '14px' }}>For general inquiries and support.</p>
            <button 
              onClick={handleGmail}
              style={{ background: '#DC2626', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', width: '100%' }}
            >
              Send an Email
            </button>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default Contact;
