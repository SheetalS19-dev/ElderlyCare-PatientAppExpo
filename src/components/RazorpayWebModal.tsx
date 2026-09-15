import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useRef } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { Colors } from '../constants';
import { fs, hs, ws } from '../utils/metrics';
import { TYPOGRAPHY } from '../utils/typography';

// NOTE: if you see a TS error like `WebView<undefined>` / "props not
// assignable to type undefined" here, it means two copies of
// `react-native-webview` (with mismatched types) exist in node_modules.
// The real fix is: delete node_modules + lockfile and reinstall so only
// one copy remains. This `any`-cast alias is just a stopgap so the file
// still compiles in the meantime.
const AnyWebView = WebView as any;

export interface RazorpayWebModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (paymentId: string, orderId?: string, signature?: string) => void;
  onFailure: (errorMsg: string) => void;
  keyId?: string;
  amount: number | string; // in Rupees or Paise (if >= 100 and integer, specify unit)
  amountInPaise?: number;
  name?: string;
  description?: string;
  prefillEmail?: string;
  prefillPhone?: string;
  prefillName?: string;
  orderId?: string;
}

// --- TEMP: force test mode -------------------------------------------------
// Flip this to false once the live/backend gateway key is confirmed working.
// While true, RazorpayWebModal ALWAYS uses TEST_KEY_ID below, no matter what
// `keyId` prop (e.g. from the backend gateway API) is passed in.
const FORCE_TEST_MODE = true;

// Replace this with YOUR real Razorpay TEST key id from
// Dashboard > Settings > API Keys (it must start with "rzp_test_").
// The previous fallback key baked into this file/razorpayService.ts was a
// generic placeholder that isn't tied to your account — using a key that
// doesn't belong to (or isn't active on) your account is exactly what makes
// the Razorpay checkout page show "Something went wrong, please try again
// after some time." immediately on open.
const TEST_KEY_ID = 'rzp_test_R6kmrnO91ID9yH';
// -----------------------------------------------------------------------

export const RazorpayWebModal: React.FC<RazorpayWebModalProps> = ({
  visible,
  onClose,
  onSuccess,
  onFailure,
  keyId,
  amount,
  amountInPaise,
  name = 'ElderlyCare',
  description = 'Payment',
  prefillEmail = '',
  prefillPhone = '',
  prefillName = 'Patient',
  orderId = '',
}) => {
  const insets = useSafeAreaInsets();
  const webviewRef = useRef<WebView>(null);

  const providedKey = keyId && keyId.trim().length > 5 ? keyId.trim() : '';
  const activeKey = FORCE_TEST_MODE ? TEST_KEY_ID : providedKey || TEST_KEY_ID;

  const numAmount = Number(amount);
  const rawPaise = amountInPaise ?? (isNaN(numAmount) ? NaN : Math.round(numAmount * 100));
  // Guard against NaN / 0 / below Razorpay's ₹1 minimum instead of silently
  // opening a broken checkout that shows a generic error.
  const finalPaise = !isNaN(rawPaise) && rawPaise >= 100 ? Math.round(rawPaise) : 0;

  let cleanPhone = prefillPhone.replace(/[^0-9]/g, '');
  if (cleanPhone.length > 10) {
    cleanPhone = cleanPhone.slice(-10);
  }
  if (!cleanPhone || cleanPhone.length < 10) {
    cleanPhone = '9999999999';
  }

  let cleanEmail = prefillEmail.trim();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    cleanEmail = 'patient@elderlycare.life';
  }

  // Build the options as a real JS object and serialize with JSON.stringify
  // instead of hand-interpolating strings into the HTML template. The old
  // approach only escaped double quotes, so a name/description containing a
  // backslash, single quote, newline, or other special character could
  // produce invalid JS inside the WebView and silently break checkout.
  const razorpayOptions: Record<string, any> = {
    key: activeKey,
    amount: String(finalPaise),
    currency: 'INR',
    name,
    description,
    prefill: {
      email: cleanEmail,
      contact: cleanPhone,
      name: prefillName,
    },
    theme: { color: '#2563EB' },
  };
  if (orderId) {
    razorpayOptions.order_id = orderId;
  }
  const razorpayOptionsJson = JSON.stringify(razorpayOptions);

  // Net Banking (and some Card 3DS) flows redirect the user to the bank's
  // login page via `window.open(...)` in a *new* popup window, then that
  // popup redirects back to Razorpay's callback URL once auth is done.
  // `react-native-webview` doesn't render real popup windows even with
  // `setSupportMultipleWindows`, so that call silently does nothing and
  // Razorpay's own JS then shows "Something went wrong, please try again"
  // or "please use another payment method" because it never sees the bank
  // page load. UPI doesn't hit this path (it just shows a QR / intent link
  // in the same page), which is why UPI works but Net Banking doesn't.
  //
  // Fix: override `window.open` (and give it back a window-like stub so
  // Razorpay's own code doesn't throw) so that instead of opening a real
  // popup, it just navigates the *same* WebView to that URL. This lets the
  // bank login page and its redirect back to Razorpay's callback happen
  // in-place, inside the one WebView we control.
  const openOverrideScript = `
    (function () {
      window.open = function (url) {
        if (url) {
          window.location.href = url;
        }
        // Return a minimal fake window object so code that calls
        // methods on the returned value (e.g. win.close()) doesn't throw.
        return { close: function () {}, focus: function () {}, location: { href: url || '' } };
      };
    })();
    true;
  `;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    body {
      background-color: #F8FAFC;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
      padding: 20px;
      box-sizing: border-box;
    }
    .spinner {
      width: 44px;
      height: 44px;
      border: 4px solid #DBEAFE;
      border-top: 4px solid #2563EB;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 16px;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .title {
      font-size: 16px;
      font-weight: 600;
      color: #1E293B;
      margin: 0 0 6px 0;
    }
    .subtitle {
      font-size: 13px;
      color: #64748B;
      margin: 0;
    }
  </style>
  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
</head>
<body>
  <div class="spinner"></div>
  <div class="title">Opening Razorpay Checkout...</div>
  <div class="subtitle">Please complete your payment in the popup window.</div>

  <script>
    function sendMessage(data) {
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(JSON.stringify(data));
      }
    }

    // Surface any uncaught script error (e.g. checkout.js failing to load,
    // a malformed options object, etc.) back to the app instead of leaving
    // Razorpay's own generic "Something went wrong" as the only signal.
    window.onerror = function (message, source, lineno, colno, err) {
      sendMessage({ status: 'error', error: 'Checkout script error: ' + message });
      return true;
    };

    if (!${finalPaise} || ${finalPaise} < 100) {
      sendMessage({ status: 'error', error: 'Invalid amount — must be at least ₹1.' });
    } else if (typeof Razorpay === 'undefined') {
      sendMessage({ status: 'error', error: 'Razorpay checkout script failed to load. Check your internet connection.' });
    } else {
      try {
        var options = ${razorpayOptionsJson};

        options.handler = function (response) {
          sendMessage({
            status: 'success',
            payment_id: response.razorpay_payment_id,
            order_id: response.razorpay_order_id || '',
            signature: response.razorpay_signature || ''
          });
        };

        options.modal = {
          ondismiss: function () {
            sendMessage({ status: 'cancel' });
          }
        };

        var rzp = new Razorpay(options);
        rzp.on('payment.failed', function (response) {
          sendMessage({
            status: 'failed',
            error: response.error ? response.error.description : 'Payment Failed'
          });
        });

        window.onload = function () {
          rzp.open();
        };
        // In case window.onload already fired before this script ran.
        if (document.readyState === 'complete') {
          rzp.open();
        }
      } catch (e) {
        sendMessage({ status: 'error', error: e.message });
      }
    }
  </script>
</body>
</html>
  `;

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.status === 'success' && data.payment_id) {
        onSuccess(data.payment_id, data.order_id, data.signature);
      } else if (data.status === 'cancel') {
        onClose();
      } else if (data.status === 'failed' || data.status === 'error') {
        onFailure(data.error || 'Payment failed');
      }
    } catch (err) {
      console.warn('Error parsing webview message:', err);
    }
  };

  // Android fallback: some devices still fire a native "open window" event
  // instead of running our overridden `window.open`. When that happens,
  // load the target URL into the SAME webview instead of letting it be
  // dropped silently (which is what caused the "please try again"/"use
  // another method" errors for Net Banking).
  const handleOpenWindow = (event: { nativeEvent: { targetUrl?: string } }) => {
    const targetUrl = event.nativeEvent?.targetUrl;
    if (targetUrl && webviewRef.current) {
      webviewRef.current.injectJavaScript(
        `window.location.href = ${JSON.stringify(targetUrl)}; true;`
      );
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header Bar */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Razorpay Payment</Text>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <MaterialIcons name="close" size={fs(22)} color={Colors.primaryFontColor} />
          </TouchableOpacity>
        </View>

        {/* WebView */}
        <AnyWebView
          ref={webviewRef}
          originWhitelist={['*']}
          source={{ html: htmlContent, baseUrl: 'https://new.elderlycare.life' }}
          onMessage={handleMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          thirdPartyCookiesEnabled={true}
          sharedCookiesEnabled={true}
          mixedContentMode="always"
          javaScriptCanOpenWindowsAutomatically={true}
          setSupportMultipleWindows={true}
          onOpenWindow={handleOpenWindow}
          // Runs before any page script (including checkout.js), so our
          // window.open override is in place before Razorpay ever calls it.
          injectedJavaScriptBeforeContentLoaded={openOverrideScript}
          // Also re-inject after each navigation (e.g. once we've
          // navigated into the bank's own page) so a same-window redirect
          // chain doesn't lose the override partway through.
          onLoadEnd={() => {
            webviewRef.current?.injectJavaScript(openOverrideScript);
          }}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.warn('RazorpayWebModal WebView error:', nativeEvent);
            onFailure('Could not load the payment page. Please check your connection and try again.');
          }}
          onHttpError={(syntheticEvent) => {
            console.warn('RazorpayWebModal WebView HTTP error:', syntheticEvent.nativeEvent);
          }}
          style={styles.webview}
        />
        {/* ^ rendered as AnyWebView above; closing tag name doesn't need to match in JSX */}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    height: hs(54),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ws(16),
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: Colors.white,
  },
  headerTitle: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(16),
    color: Colors.primaryFontColor,
  },
  closeBtn: {
    padding: ws(6),
  },
  webview: {
    flex: 1,
  },
});