import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

/**
 * RazorpayCheckout Button Component
 * 
 * @param {number} amount - Amount in paise (minimum 100 paise i.e., 1 INR)
 * @param {string} currency - Currency code (e.g., 'INR')
 * @param {string} receipt - Receipt identifier
 * @param {function} onSuccess - Callback when payment is successful and signature is verified
 * @param {function} onError - Callback when payment fails
 * @param {string} className - Optional Tailwind classes for the button
 * @param {string} buttonText - Text to display on the button
 */
const RazorpayCheckout = ({ 
  amount, 
  currency = 'INR', 
  receipt = 'receipt#1',
  onBeforePayment,
  onSuccess, 
  onError,
  className = '',
  buttonText = 'Pay Now'
}) => {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    if (onBeforePayment) {
      try {
        const canProceed = await onBeforePayment();
        if (!canProceed) return;
      } catch (err) {
        console.error('Pre-payment check failed', err);
        return;
      }
    }

    setLoading(true);

    try {
      // 1. Create Order via Supabase Edge Function
      const { data: orderData, error: orderError } = await supabase.functions.invoke('create-razorpay-order', {
        body: { amount, currency, receipt }
      });

      if (orderError || !orderData || orderData.error) {
        throw new Error(orderError?.message || orderData?.error || 'Failed to create order');
      }

      const { order_id, amount: orderAmount, currency: orderCurrency } = orderData;

      // 2. Setup Razorpay options
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderAmount,
        currency: orderCurrency,
        name: 'Upchar Health',
        description: 'Payment for Services',
        order_id: order_id,
        handler: async function (response) {
          // 3. Verify Signature via Supabase Edge Function
          try {
            const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-razorpay-signature', {
              body: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              }
            });

            if (verifyError || !verifyData || verifyData.error) {
              throw new Error(verifyError?.message || verifyData?.error || 'Signature verification failed');
            }

            if (onSuccess) {
              onSuccess(response, verifyData);
            }
          } catch (err) {
            console.error('Verification Error:', err);
            if (onError) onError(err);
          }
        },
        prefill: {
          name: '',
          email: '',
          contact: ''
        },
        theme: {
          color: '#3B82F6' // Tailwind Blue-500
        }
      };

      // 4. Open Razorpay Checkout Modal
      const rzp1 = new window.Razorpay(options);
      
      rzp1.on('payment.failed', function (response) {
        console.error('Payment Failed:', response.error);
        if (onError) onError(response.error);
      });

      rzp1.open();

    } catch (err) {
      console.error('Checkout Error:', err);
      if (onError) onError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handlePayment} 
      disabled={loading}
      className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors ${className}`}
    >
      {loading ? 'Processing...' : buttonText}
    </button>
  );
};

export default RazorpayCheckout;
