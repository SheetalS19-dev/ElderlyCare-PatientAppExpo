import { Colors } from '../constants';
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
    const key = rawKey && rawKey.trim().length > 5 ? rawKey.trim() : '';
    if (!key) {
      throw new Error('Payment gateway key is not configured.');
    }
    const orderId = options.order_id || options.orderId;

    const rawPhone = options.prefill?.contact || options.prefillPhone || options.phone || '';
    let phoneDigits = rawPhone.replace(/[^0-9]/g, '');
    if (phoneDigits.length > 10) phoneDigits = phoneDigits.slice(-10);

    const userEmail = (options.prefill?.email || options.prefillEmail || options.email || '').trim();
    const name = (options.prefill?.name || options.name || '').trim();

    const prefillObj: Record<string, string> = {};
    if (phoneDigits && phoneDigits.length === 10) prefillObj.contact = phoneDigits;
    if (userEmail && userEmail.includes('@')) prefillObj.email = userEmail;
    if (name) prefillObj.name = name;

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
      prefill: prefillObj,
      theme: options.theme || { color: Colors.primaryColor },
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
