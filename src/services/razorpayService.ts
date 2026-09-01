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
    if (phoneDigits.length > 10) {
      phoneDigits = phoneDigits.slice(-10);
    }
    if (!phoneDigits || phoneDigits.length < 10) {
      phoneDigits = '9999999999';
    }

    let userEmail = (options.prefill?.email || options.prefillEmail || options.email || '').trim();
    if (!userEmail || !userEmail.includes('@')) {
      userEmail = 'patient@elderlycare.life';
    }

    const name = (options.prefill?.name || options.name || 'Patient').trim();
    const amountVal = Number(options.amount);

    const sanitizedOptions: any = {
      description: options.description || 'Payment',
      currency: 'INR',
      key: key,
      amount: String(isNaN(amountVal) ? options.amount : amountVal),
      name: options.name || 'ElderlyCare',
      prefill: {
        email: userEmail,
        contact: phoneDigits,
        name: name,
      },
      theme: { color: '#fe8423' },
      send_sms_hash: true,
      retry: {
        enabled: true,
        max_count: 1,
      },
    };

    if (orderId) {
      sanitizedOptions.order_id = orderId;
    }

    const data = await RazorpayCheckout.open(sanitizedOptions);
    return data;
  } catch (error) {
    throw error;
  }
};

export const openRazorpayCheckout = startRazorpayPayment;
