import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle, ShoppingBag, Loader } from 'lucide-react';
import { orderService } from '../../services/orderService';
import '../../styles/order-modal.css';

const INITIAL_FORM = {
  customerName: '',
  customerEmail: '',
  customerPhone: '',
  address: '',
  city: '',
  quantity: 1,
  notes: '',
};

const OrderFormModal = ({ isOpen, onClose, product, selectedLens }) => {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState('');

  if (!isOpen || !product) return null;

  const primaryImage = product.images?.find(img => img.is_primary) || product.images?.[0];
  const imageUrl = primaryImage?.image_url || '/placeholder-glasses.jpg';
  const unitPrice = product.sale_price && product.sale_price < product.price
    ? parseFloat(product.sale_price)
    : parseFloat(product.price);
  const lensPrice = selectedLens ? parseFloat(selectedLens.price) || 0 : 0;
  const quantity = parseInt(form.quantity, 10) || 1;
  const subTotal = (unitPrice + lensPrice) * quantity;
  const total = subTotal.toFixed(2);

  const validate = () => {
    const errs = {};
    if (!form.customerName.trim()) errs.customerName = 'Full name is required.';
    if (!form.customerEmail.trim() || !/\S+@\S+\.\S+/.test(form.customerEmail)) errs.customerEmail = 'Valid email is required.';
    if (!form.customerPhone.trim()) errs.customerPhone = 'Phone/WhatsApp is required.';
    if (!form.address.trim()) errs.address = 'Address is required.';
    if (!form.city.trim()) errs.city = 'City is required.';
    const qty = parseInt(form.quantity, 10);
    if (isNaN(qty) || qty < 1 || qty > 99) errs.quantity = 'Quantity must be between 1 and 99.';
    return errs;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);
    setServerError('');

    try {
      await orderService.createOrder({
        productId: product.id,
        quantity: parseInt(form.quantity, 10),
        customerName: form.customerName,
        customerEmail: form.customerEmail,
        customerPhone: form.customerPhone,
        address: form.address,
        city: form.city,
        notes: form.notes,
        lensDetails: selectedLens ? {
          id: selectedLens.id,
          name: selectedLens.name,
          price: selectedLens.price
        } : null,
      });

      setSubmitted(true);
      setForm(INITIAL_FORM);
    } catch (err) {
      setServerError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSubmitted(false);
    setServerError('');
    setErrors({});
    setForm(INITIAL_FORM);
    onClose();
  };

  return createPortal(
    <div className={`order-modal-overlay ${isOpen ? 'is-open' : ''}`} onClick={(e) => e.target === e.currentTarget && handleClose()}>
      <div className="order-modal" role="dialog" aria-modal="true" aria-label="Place Order">

        {/* Header */}
        <div className="order-modal__header">
          <div className="order-modal__logo-title">
            <img src="/logo.jpeg" alt="OptiVue Logo" className="order-modal__logo" />
            <h2 className="order-modal__title">
              {submitted ? 'Order Submitted!' : 'Place Order'}
            </h2>
          </div>
          <button className="order-modal__close" onClick={handleClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* SUCCESS STATE */}
        {submitted ? (
          <div className="order-success">
            <div className="order-success__icon">
              <CheckCircle size={36} />
            </div>
            <h3 className="order-success__title">Order Received!</h3>
            <p className="order-success__message">
              Your order for <strong>{product.name}</strong> has been submitted successfully.
            </p>
            <div className="order-success__email-note">
              📧 We sent a confirmation email to <strong>{form.customerEmail || 'your email'}</strong>.<br />
              Please click <strong>"Confirm My Order"</strong> in that email to complete your purchase.
            </div>
            <button className="btn-place-order" onClick={handleClose} style={{ marginTop: 8 }}>
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <div className="order-modal__body">

              {/* Product Summary (auto-populated, read-only) */}
              <div className="order-product-summary">
                <img src={imageUrl} alt={product.name} className="order-product-summary__img" />
                <div className="order-product-summary__info">
                  <p className="order-product-summary__name">{product.name}</p>
                  <p className="order-product-summary__meta">
                    {product.categories?.name && `${product.categories.name} · `}
                    {product.sku && `SKU: ${product.sku}`}
                  </p>
                  {selectedLens && (
                    <p className="order-product-summary__meta" style={{ color: '#dc2626', marginTop: 4 }}>
                      + Lens: {selectedLens.name} (Rs. {selectedLens.price})
                    </p>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <span className="order-product-summary__price">Rs. {unitPrice.toLocaleString()}</span>
                </div>
              </div>

              {/* Server Error */}
              {serverError && (
                <div className="order-form__alert">{serverError}</div>
              )}

              {/* Customer Details */}
              <p className="order-form__section-title">Your Details</p>

              <div className="order-form__grid">
                <div className="order-form__field">
                  <label className="order-form__label" htmlFor="customerName">
                    Full Name <span className="required">*</span>
                  </label>
                  <input
                    id="customerName"
                    name="customerName"
                    className={`order-form__input ${errors.customerName ? 'has-error' : ''}`}
                    type="text"
                    value={form.customerName}
                    onChange={handleChange}
                    placeholder="Ahmed Khan"
                    autoComplete="name"
                  />
                  {errors.customerName && <p className="order-form__error-text">{errors.customerName}</p>}
                </div>

                <div className="order-form__field">
                  <label className="order-form__label" htmlFor="customerPhone">
                    Phone / WhatsApp <span className="required">*</span>
                  </label>
                  <input
                    id="customerPhone"
                    name="customerPhone"
                    className={`order-form__input ${errors.customerPhone ? 'has-error' : ''}`}
                    type="tel"
                    value={form.customerPhone}
                    onChange={handleChange}
                    placeholder="03001234567"
                    autoComplete="tel"
                  />
                  {errors.customerPhone && <p className="order-form__error-text">{errors.customerPhone}</p>}
                </div>

                <div className="order-form__field full-width">
                  <label className="order-form__label" htmlFor="customerEmail">
                    Email Address <span className="required">*</span>
                  </label>
                  <input
                    id="customerEmail"
                    name="customerEmail"
                    className={`order-form__input ${errors.customerEmail ? 'has-error' : ''}`}
                    type="email"
                    value={form.customerEmail}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                  {errors.customerEmail && <p className="order-form__error-text">{errors.customerEmail}</p>}
                </div>
              </div>

              {/* Delivery Details */}
              <p className="order-form__section-title" style={{ marginTop: 8 }}>Delivery Details</p>

              <div className="order-form__grid">
                <div className="order-form__field full-width">
                  <label className="order-form__label" htmlFor="address">
                    Address <span className="required">*</span>
                  </label>
                  <input
                    id="address"
                    name="address"
                    className={`order-form__input ${errors.address ? 'has-error' : ''}`}
                    type="text"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="House #, Street, Area"
                    autoComplete="street-address"
                  />
                  {errors.address && <p className="order-form__error-text">{errors.address}</p>}
                </div>

                <div className="order-form__field">
                  <label className="order-form__label" htmlFor="city">
                    City <span className="required">*</span>
                  </label>
                  <input
                    id="city"
                    name="city"
                    className={`order-form__input ${errors.city ? 'has-error' : ''}`}
                    type="text"
                    value={form.city}
                    onChange={handleChange}
                    placeholder="Karachi"
                    autoComplete="address-level2"
                  />
                  {errors.city && <p className="order-form__error-text">{errors.city}</p>}
                </div>

                <div className="order-form__field">
                  <label className="order-form__label" htmlFor="quantity">
                    Quantity <span className="required">*</span>
                  </label>
                  <input
                    id="quantity"
                    name="quantity"
                    className={`order-form__input ${errors.quantity ? 'has-error' : ''}`}
                    type="number"
                    min="1"
                    max="99"
                    value={form.quantity}
                    onChange={handleChange}
                  />
                  {errors.quantity && <p className="order-form__error-text">{errors.quantity}</p>}
                </div>

                <div className="order-form__field full-width">
                  <label className="order-form__label" htmlFor="notes">Additional Notes</label>
                  <textarea
                    id="notes"
                    name="notes"
                    className="order-form__textarea"
                    value={form.notes}
                    onChange={handleChange}
                    placeholder="Lens prescription, color preference, special instructions..."
                  />
                </div>
              </div>

              {/* Total */}
              <div className="order-total-row">
                <span className="order-total-row__label">
                  (Rs. {unitPrice.toLocaleString()} {selectedLens ? `+ Rs. ${lensPrice}` : ''}) × {quantity} = Total
                </span>
                <span className="order-total-row__amount">Rs. {parseFloat(total).toLocaleString()}</span>
              </div>

            </div>

            <div className="order-modal__footer">
              <button type="button" className="btn-cancel-order" onClick={handleClose} disabled={submitting}>
                Cancel
              </button>
              <button type="submit" className="btn-place-order" disabled={submitting}>
                {submitting ? (
                  <><Loader size={16} className="spin" /> Placing Order...</>
                ) : (
                  <><ShoppingBag size={16} /> Confirm & Place Order</>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
};

export default OrderFormModal;
