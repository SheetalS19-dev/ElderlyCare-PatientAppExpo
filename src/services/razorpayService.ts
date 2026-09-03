import RazorpayCheckout from 'react-native-razorpay';

export interface RazorpayOptions {
  description: string;
  image?: string;
  currency?: string;
  key?: string;
  keyId?: string;
  amount: string | number;
  name: string;
  order_id?: string;
  orderId?: string;
  phone?: string;
  prefillPhone?: string;
  email?: string;
  prefillEmail?: string;
  prefill?: {
    email?: string;
    contact?: string;
    name?: string;
  };
  theme?: {
    color?: string;
  };
}

export const startRazorpayPayment = async (options: RazorpayOptions) => {
  try {
    const rawKey = options.key || options.keyId || '';
    const key = rawKey && rawKey.trim().length > 5 ? rawKey.trim() : 'rzp_test_R6kmrnO91ID9yH';
    const orderId = options.order_id || options.orderId;

    const rawPhone = options.prefill?.contact || options.prefillPhone || options.phone || '';
    let phoneDigits = rawPhone.replace(/[^0-9]/g, '');
    if (phoneDigits.length > 10) phoneDigits = phoneDigits.slice(-10);
    if (!phoneDigits || phoneDigits.length < 10) phoneDigits = '9999999999';

    let userEmail = (options.prefill?.email || options.prefillEmail || options.email || '').trim();
    if (!userEmail || !userEmail.includes('@')) userEmail = 'patient@elderlycare.life';

    const name = (options.prefill?.name || options.name || 'Patient').trim();

    // amount can arrive already-in-paise (amountInPaise-style callers) or in rupees.
    // Standardize: treat options.amount as RUPEES unless caller explicitly says otherwise.
    const rupeeAmount = Number(options.amount);
    if (isNaN(rupeeAmount) || rupeeAmount <= 0) {
      throw new Error('Invalid amount passed to startRazorpayPayment');
    }
    const paise = Math.round(rupeeAmount * 100);
    if (paise < 100) {
      throw new Error('Amount must be at least ₹1 (100 paise) — Razorpay minimum');
    }

    const sanitizedOptions: any = {
      description: options.description || 'Payment',
      currency: 'INR',
      key,
      amount: String(paise), // <-- paise, not rupees
      name: options.name || 'ElderlyCare',
      prefill: { email: userEmail, contact: phoneDigits, name },
      theme: { color: '#2563EB' },
      send_sms_hash: true,
      retry: { enabled: true, max_count: 1 },
    };

    if (orderId) sanitizedOptions.order_id = orderId;

    return await RazorpayCheckout.open(sanitizedOptions);
  } catch (error) {
    throw error;
  }
};

export const openRazorpayCheckout = startRazorpayPayment;
