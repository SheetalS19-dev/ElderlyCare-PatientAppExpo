import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useRef } from 'react';
import { Linking, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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

// Fallback test key ID if no key is provided by backend
const TEST_KEY_ID = 'rzp_test_R6kmrnO91ID9yH';

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

  const isValidRzpKey = (k?: string): boolean => {
    if (!k || typeof k !== 'string') return false;
    const trimmed = k.trim();
    return (
      (trimmed.startsWith('rzp_test_') || trimmed.startsWith('rzp_live_')) &&
      !trimmed.includes('xxxx') &&
      !trimmed.includes('XXXX')
    );
  };

  const providedKey = isValidRzpKey(keyId) ? keyId!.trim() : '';
  const activeKey = providedKey || TEST_KEY_ID;

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
  const razorpayOptions: Record<string, any> = {
    key: activeKey,
    amount: finalPaise,
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
  if (orderId && typeof orderId === 'string' && orderId.trim().length > 0) {
    razorpayOptions.order_id = orderId.trim();
  }
  const razorpayOptionsJson = JSON.stringify(razorpayOptions);

  // Overriding `window.open` with a full location getter/setter stub so that
  // when Razorpay or bank auth popups call `win = window.open(...)` and then
  // set `win.location.href = bankUrl`, the WebView navigates in-place.
  const openOverrideScript = `
    (function () {
      if (window.__rzp_override_done) return;
      window.__rzp_override_done = true;

      window.open = function (url) {
        if (url && url !== 'about:blank' && url !== 'about:blank#') {
          window.location.href = url;
        }
        var fakeWin = {
          close: function () {},
          focus: function () {},
          blur: function () {},
          postMessage: function () {},
        };
        Object.defineProperty(fakeWin, 'location', {
          get: function () {
            return {
              get href() { return window.location.href; },
              set href(val) {
                if (val && val !== 'about:blank' && val !== 'about:blank#') {
                  window.location.href = val;
                }
              },
              assign: function (val) { window.location.href = val; },
              replace: function (val) { window.location.replace(val); }
            };
          },
          set: function (val) {
            if (typeof val === 'string' && val && val !== 'about:blank' && val !== 'about:blank#') {
              window.location.href = val;
            }
          }
        });
        return fakeWin;
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
  <div class="subtitle">Please complete your payment below</div>

  <script>
    function sendMessage(data) {
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(JSON.stringify(data));
      }
    }

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

        var isOpened = false;
        function doOpen() {
          if (isOpened) return;
          isOpened = true;
          rzp.open();
        }
        window.onload = doOpen;
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
          doOpen();
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

  const handleShouldStartLoadWithRequest = (request: any) => {
    const url = request?.url;
    if (!url) return true;

    // Detect deep link / custom scheme URLs (UPI, Intent, Bank app links)
    const isStandardUrl =
      url.startsWith('http://') ||
      url.startsWith('https://') ||
      url.startsWith('about:') ||
      url.startsWith('data:');

    if (!isStandardUrl) {
      // Launch native UPI app (GPay, PhonePe, Paytm, BHIM, etc.) or Intent
      Linking.canOpenURL(url)
        .then((supported) => {
          if (supported) {
            Linking.openURL(url).catch(() => {});
          } else if (url.startsWith('intent://')) {
            Linking.openURL(url).catch(() => {});
          }
        })
        .catch(() => {});
      return false; // Prevent WebView from trying to navigate to custom scheme
    }
    return true;
  };

  const handleOpenWindow = (event: { nativeEvent: { targetUrl?: string } }) => {
    const targetUrl = event.nativeEvent?.targetUrl;
    if (targetUrl && webviewRef.current) {
      if (
        !targetUrl.startsWith('http://') &&
        !targetUrl.startsWith('https://') &&
        !targetUrl.startsWith('about:') &&
        !targetUrl.startsWith('data:')
      ) {
        Linking.openURL(targetUrl).catch(() => {});
      } else {
        webviewRef.current.injectJavaScript(
          `window.location.href = ${JSON.stringify(targetUrl)}; true;`
        );
      }
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
          onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          thirdPartyCookiesEnabled={true}
          sharedCookiesEnabled={true}
          mixedContentMode="always"
          javaScriptCanOpenWindowsAutomatically={true}
          setSupportMultipleWindows={true}
          onOpenWindow={handleOpenWindow}
          injectedJavaScriptBeforeContentLoaded={openOverrideScript}
          onLoadEnd={() => {
            webviewRef.current?.injectJavaScript(openOverrideScript);
          }}
          onError={(syntheticEvent: any) => {
            const { nativeEvent } = syntheticEvent;
            console.warn('RazorpayWebModal WebView error:', nativeEvent);
            const errUrl = nativeEvent?.url || '';
            const errDesc = nativeEvent?.description || '';
            if (
              errDesc.includes('ERR_UNKNOWN_URL_SCHEME') ||
              (!errUrl.startsWith('http://') && !errUrl.startsWith('https://') && !errUrl.startsWith('about:') && errUrl.length > 0)
            ) {
              return;
            }
            onFailure('Could not load the payment page. Please check your connection and try again.');
          }}
          onHttpError={(syntheticEvent: any) => {
            console.warn('RazorpayWebModal WebView HTTP error:', syntheticEvent.nativeEvent);
          }}
          style={styles.webview}
        />
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