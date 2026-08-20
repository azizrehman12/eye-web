import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle, Loader } from 'lucide-react';
import { orderService } from '../../services/orderService';
import { useCart } from '../../context/CartContext';
import '../../styles/order-modal.css';

const INITIAL_FORM = {
  customerName: '',
  customerEmail: '',
  customerPhone: '',
  address: '',
  city: '',
  notes: '',
};

const OrderFormModal = ({ isOpen, onClose, cartItems, subtotal, deliveryCharges, grandTotal }) => {
  const { clearCart } = useCart();
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState('');

  React.useEffect(() => {
    if (isOpen) {
      setForm(INITIAL_FORM);
      setErrors({});
      setSubmitted(false);
      setServerError('');
      setSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;
  if (!submitted && (!cartItems || cartItems.length === 0)) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!form.customerName.trim()) newErrors.customerName = 'Name is required';
    if (!form.customerEmail.trim()) newErrors.customerEmail = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.customerEmail)) newErrors.customerEmail = 'Invalid email';
    if (!form.customerPhone.trim()) newErrors.customerPhone = 'Phone is required';
    if (!form.address.trim()) newErrors.address = 'Address is required';
    if (!form.city.trim()) newErrors.city = 'City is required';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);
    try {
      const itemsPayload = cartItems.map(item => ({
        product_id: item.product.id,
        quantity: item.quantity,
        selected_color: item.selectedColor,
        lens_details: item.selectedLens && item.selectedLens.id !== 'no-lens-default' ? item.selectedLens : null
      }));

      await orderService.createOrder({
        items: itemsPayload,
        customer_name: form.customerName,
        customer_email: form.customerEmail,
        customer_phone: form.customerPhone,
        address: form.address,
        city: form.city,
        notes: form.notes,
      });

      setSubmitted(true);
      clearCart();
    } catch (err) {
      setServerError(err.message || 'An error occurred while creating your order.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return createPortal(
      <div className="modal-overlay">
        <div className="modal-content success-modal">
          <div className="success-icon-container">
            <CheckCircle size={64} className="success-icon" />
          </div>
          <h2>Order Pending Confirmation</h2>
          <p>We've sent a secure confirmation link to <strong>{form.customerEmail}</strong>.</p>
          <p>Please click the link in your email to confirm and process your order.</p>
          <div className="warning-box">
            The link will expire in 24 hours. Your order is not confirmed until you verify your email.
          </div>
          <button className="btn btn--primary w-100 mt-2" onClick={onClose}>
            Close & Continue Shopping
          </button>
        </div>
      </div>,
      document.body
    );
  }

  return createPortal(
    <div className="modal-overlay">
      <div className="modal-content order-modal-content">
        <button className="modal-close" onClick={onClose}><X size={24} /></button>
        <div className="order-modal-header">
          <h2>Secure Checkout</h2>
          <p>Complete your details to finalize your order.</p>
        </div>

        <div className="order-modal-body">
          <div className="order-summary-section">
            <h3>Order Summary</h3>
            <div className="order-items-list" style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '16px' }}>
              {cartItems.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '14px', flex: 1 }}>
                    <strong style={{ display: 'block', color: '#0f172a' }}>{item.product.name} (x{item.quantity})</strong>
                    {item.selectedColor && <span style={{ color: '#64748b', fontSize: '12px', display: 'block' }}>Color: {item.selectedColor}</span>}
                    {item.selectedLens && item.selectedLens.id !== 'no-lens-default' && <span style={{ color: '#64748b', fontSize: '12px', display: 'block' }}>Lens: {item.selectedLens.name}</span>}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="summary-row"><span>Subtotal</span><span>Rs. {subtotal}</span></div>
            <div className="summary-row"><span>Delivery Charges</span><span>Rs. {deliveryCharges}</span></div>
            <div className="summary-row total-row" style={{ fontWeight: 'bold', fontSize: '18px', marginTop: '10px' }}>
              <span>Grand Total</span><span>Rs. {grandTotal}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="order-form">
            <h3>Delivery Details</h3>
            {serverError && <div className="error-banner">{serverError}</div>}
            
            <div className="form-group">
              <label>Full Name *</label>
              <input type="text" name="customerName" value={form.customerName} onChange={handleChange} className={errors.customerName ? 'error' : ''} />
              {errors.customerName && <span className="error-text">{errors.customerName}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Email Address *</label>
                <input type="email" name="customerEmail" value={form.customerEmail} onChange={handleChange} className={errors.customerEmail ? 'error' : ''} />
                {errors.customerEmail && <span className="error-text">{errors.customerEmail}</span>}
                <small>We'll send a secure confirmation link here.</small>
              </div>
              <div className="form-group">
                <label>Phone Number *</label>
                <input type="tel" name="customerPhone" value={form.customerPhone} onChange={handleChange} className={errors.customerPhone ? 'error' : ''} />
                {errors.customerPhone && <span className="error-text">{errors.customerPhone}</span>}
              </div>
            </div>

            <div className="form-group">
              <label>Complete Delivery Address *</label>
              <input type="text" name="address" value={form.address} onChange={handleChange} className={errors.address ? 'error' : ''} />
              {errors.address && <span className="error-text">{errors.address}</span>}
            </div>

            <div className="form-group">
              <label>City *</label>
              <input type="text" name="city" value={form.city} onChange={handleChange} className={errors.city ? 'error' : ''} />
              {errors.city && <span className="error-text">{errors.city}</span>}
            </div>

            <div className="form-group">
              <label>Order Notes (Optional)</label>
              <textarea name="notes" value={form.notes} onChange={handleChange} rows="3" placeholder="Any special instructions..."></textarea>
            </div>

            <button type="submit" className="btn btn--primary w-100 submit-btn" disabled={submitting}>
              {submitting ? <><Loader size={18} className="spin" /> Processing...</> : 'Place Order Securely'}
            </button>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default OrderFormModal;
