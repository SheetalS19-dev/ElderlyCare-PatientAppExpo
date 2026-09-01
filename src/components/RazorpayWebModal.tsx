import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { Colors, Typography } from '../constants';

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

export const RazorpayWebModal: React.FC<RazorpayWebModalProps> = ({
  visible,
  onClose,
  onSuccess,
  onFailure,
  keyId = 'rzp_test_R6kmrnO91ID9yH',
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

  const activeKey = keyId && keyId.trim().length > 5 ? keyId.trim() : 'rzp_test_R6kmrnO91ID9yH';

  const numAmount = Number(amount) || 0;
  const finalPaise = amountInPaise ?? Math.round(numAmount * 100);

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
      border: 4px solid #FFE4D6;
      border-top: 4px solid #fe8423;
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

    try {
      var options = {
        key: "${activeKey}",
        amount: "${finalPaise}",
        currency: "INR",
        name: "${name.replace(/"/g, '\\"')}",
        description: "${description.replace(/"/g, '\\"')}",
        prefill: {
          email: "${cleanEmail}",
          contact: "${cleanPhone}",
          name: "${prefillName.replace(/"/g, '\\"')}"
        },
        theme: { color: "#fe8423" },
        handler: function (response) {
          sendMessage({
            status: "success",
            payment_id: response.razorpay_payment_id,
            order_id: response.razorpay_order_id || "",
            signature: response.razorpay_signature || ""
          });
        },
        modal: {
          ondismiss: function() {
            sendMessage({ status: "cancel" });
          }
        }
      };

      if ("${orderId}") {
        options.order_id = "${orderId}";
      }

      var rzp = new Razorpay(options);
      rzp.on('payment.failed', function (response) {
        sendMessage({
          status: "failed",
          error: response.error ? response.error.description : "Payment Failed"
        });
      });

      window.onload = function() {
        rzp.open();
      };
    } catch (e) {
      sendMessage({ status: "error", error: e.message });
    }
  </script>
</body>
</html>
  `;

  const handleMessage = (event: any) => {
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

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header Bar */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Razorpay Payment</Text>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <MaterialIcons name="close" size={22} color={Colors.primaryFontColor} />
          </TouchableOpacity>
        </View>

        {/* WebView */}
        <WebView
          originWhitelist={['*']}
          source={{ html: htmlContent, baseUrl: 'https://new.elderlycare.life' }}
          onMessage={handleMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
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
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: Colors.white,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryFontColor,
  },
  closeBtn: {
    padding: 6,
  },
  webview: {
    flex: 1,
  },
});
