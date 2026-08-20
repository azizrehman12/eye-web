import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import { orderService } from '../../services/orderService';

const OrderConfirmation = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const [alreadyConfirmed, setAlreadyConfirmed] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('No confirmation token found. Please check your email link.');
      return;
    }

    orderService.confirmOrder(token)
      .then((data) => {
        setStatus('success');
        setAlreadyConfirmed(Boolean(data.already_confirmed));
      })
      .catch((err) => {
        setStatus('error');
        setErrorMessage(err.message || 'Failed to confirm your order.');
      });
  }, [token]);

  return (
    <div style={{
      minHeight: '60vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
    }}>
      <div style={{
        maxWidth: '480px',
        width: '100%',
        textAlign: 'center',
        background: '#ffffff',
        borderRadius: '16px',
        boxShadow: '0 8px 40px rgba(15,23,42,0.1)',
        padding: '48px 40px',
      }}>
        {status === 'loading' && (
          <>
            <Loader size={48} color="#2563EB" style={{ margin: '0 auto 24px', animation: 'spin 1s linear infinite' }} />
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '22px', color: '#0f172a', marginBottom: '12px' }}>
              Confirming Your Order...
            </h2>
            <p style={{ color: '#64748b', fontSize: '15px' }}>
              Please wait while we validate your confirmation link.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{
              width: '80px',
              height: '80px',
              background: '#d1fae5',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
            }}>
              <CheckCircle size={40} color="#065f46" />
            </div>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '26px', color: '#0f172a', marginBottom: '12px' }}>
              {alreadyConfirmed ? 'Order Already Confirmed' : 'Order Confirmed!'}
            </h2>
            <p style={{ color: '#475569', fontSize: '15px', lineHeight: '1.6', marginBottom: '24px' }}>
              {alreadyConfirmed
                ? 'This order was already confirmed successfully. No further action is needed.'
                : 'Your order has been confirmed successfully. Our team at APlusOptics will process it shortly and contact you with delivery details.'}
            </p>
            {!alreadyConfirmed && (
            <div style={{
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '32px',
              fontSize: '14px',
              color: '#1e40af',
            }}>
              📧 A confirmation has been sent to <strong>opticsaplus@gmail.com</strong>. You may also receive a follow-up from our team.
            </div>
            )}
            <Link
              to="/products"
              style={{
                display: 'inline-block',
                padding: '14px 32px',
                background: '#2563EB',
                color: '#ffffff',
                borderRadius: '8px',
                textDecoration: 'none',
                fontFamily: 'Inter, sans-serif',
                fontWeight: '700',
                fontSize: '15px',
              }}
            >
              Continue Shopping
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{
              width: '80px',
              height: '80px',
              background: '#fee2e2',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
            }}>
              <XCircle size={40} color="#dc2626" />
            </div>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '24px', color: '#0f172a', marginBottom: '12px' }}>
              Confirmation Failed
            </h2>
            <p style={{ color: '#475569', fontSize: '15px', lineHeight: '1.6', marginBottom: '24px' }}>
              {errorMessage}
            </p>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '32px' }}>
              The link may have expired (valid for 24 hours) or already been used. If you need help, please contact us on WhatsApp.
            </p>
            <Link
              to="/"
              style={{
                display: 'inline-block',
                padding: '14px 32px',
                background: '#0f172a',
                color: '#ffffff',
                borderRadius: '8px',
                textDecoration: 'none',
                fontFamily: 'Inter, sans-serif',
                fontWeight: '700',
                fontSize: '15px',
              }}
            >
              Go to Homepage
            </Link>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default OrderConfirmation;
