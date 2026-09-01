import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { AppConstants, Colors, Typography } from '../../../constants';
import { DateTimeUtils } from '../../../utils';

export type PaymentMethodChoice = 'razorpay' | 'wallet' | 'cash' | 'stripe';

export interface PaymentSheetProps {
  visible: boolean;
  onClose: () => void;
  doctorName?: string;
  patientName?: string;
  appointmentType?: string;
  selectedDate?: string;
  selectedTime?: string;
  fee: number;
  taxPercent?: number;
  taxAmount?: number;
  couponDiscount?: number;
  couponTitle?: string;
  total: number;
  walletBalance?: number;
  allowPayAtHospital?: boolean;
  submitting?: boolean;
  onSubmit: (choice: PaymentMethodChoice) => void;
}

export const PaymentSheet: React.FC<PaymentSheetProps> = ({
  visible,
  onClose,
  doctorName = '--',
  patientName = '--',
  appointmentType = 'OPD',
  selectedDate = '',
  selectedTime = '',
  fee = 0,
  taxPercent = 0,
  taxAmount = 0,
  couponDiscount = 0,
  couponTitle = '',
  total = 0,
  walletBalance = 0,
  allowPayAtHospital = true,
  submitting = false,
  onSubmit,
}) => {
  const insets = useSafeAreaInsets();
  // 1 = Online (Razorpay), 0 = Pay At Hospital, 2 = Wallet
  const [selectedPayOption, setSelectedPayOption] = useState<number>(1);

  const isWalletSufficient = walletBalance >= total;

  const handleConfirm = () => {
    if (selectedPayOption === 1) {
      onSubmit('razorpay');
    } else if (selectedPayOption === 0) {
      onSubmit('cash');
    } else if (selectedPayOption === 2) {
      if (!isWalletSufficient) return;
      onSubmit('wallet');
    }
  };

  const formattedDateStr = React.useMemo(() => {
    if (!selectedDate) return '--';
    const formatted = DateTimeUtils.getDataFormat(selectedDate);
    return formatted || selectedDate;
  }, [selectedDate]);

  const formattedTimeStr = React.useMemo(() => {
    if (!selectedTime) return '--';
    const formatted = DateTimeUtils.formatTimeToAmPm(selectedTime);
    return formatted || selectedTime;
  }, [selectedTime]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

        <View style={[styles.sheetContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Confirm & Pay</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <MaterialIcons name="close" size={24} color="#4A5568" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {/* Top Illustration */}
            <View style={styles.illustrationWrapper}>
              <Image
                source={require('../../../../assets/icons/appointment.png')}
                style={styles.illustrationImage}
                resizeMode="contain"
              />
              <Text style={styles.illustrationTitle}>Only one step away</Text>
              <Text style={styles.illustrationSubtitle}>
                Pay and book your appointment.
              </Text>
            </View>

            <View style={styles.divider} />

            {/* Summary Details */}
            <View style={styles.summarySection}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Doctor:</Text>
                <Text style={styles.summaryValue}>{doctorName}</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Patient:</Text>
                <Text style={styles.summaryValue}>{patientName}</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Appointment:</Text>
                <Text style={styles.summaryValue}>{appointmentType}</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Date - Time:</Text>
                <Text style={styles.summaryValue}>
                  {formattedDateStr} - {formattedTimeStr}
                </Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Appointment Fee:</Text>
                <Text style={styles.summaryValue}>
                  {AppConstants.appCurrency}{fee.toFixed(2)}
                </Text>
              </View>

              {couponDiscount > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: '#16A34A' }]}>
                    Coupon {couponTitle ? `(${couponTitle})` : ''} OFF:
                  </Text>
                  <Text style={[styles.summaryValue, { color: '#16A34A' }]}>
                    -{AppConstants.appCurrency}{couponDiscount.toFixed(2)}
                  </Text>
                </View>
              )}

              {taxAmount > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>
                    Tax {taxPercent > 0 ? `(${taxPercent}%)` : ''}:
                  </Text>
                  <Text style={styles.summaryValue}>
                    +{AppConstants.appCurrency}{taxAmount.toFixed(2)}
                  </Text>
                </View>
              )}

              <View style={styles.divider} />

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Amount:</Text>
                <Text style={styles.totalValue}>
                  {AppConstants.appCurrency}{total.toFixed(2)}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Payment Options (Radio List) */}
            <Text style={styles.paymentOptionsTitle}>Select Payment Method</Text>

            {/* Option 1: Pay Now (Online Gateway) */}
            <TouchableOpacity
              style={[
                styles.radioOptionCard,
                selectedPayOption === 1 && styles.radioOptionCardActive,
              ]}
              onPress={() => setSelectedPayOption(1)}
              activeOpacity={0.8}
            >
              <View style={styles.radioOuter}>
                {selectedPayOption === 1 && <View style={styles.radioInner} />}
              </View>
              <View style={styles.radioInfo}>
                <Text style={styles.radioTitle}>Pay Now (Online)</Text>
                <Text style={styles.radioSubtitle}>Credit/Debit Card, UPI, NetBanking</Text>
              </View>
              <MaterialIcons name="payment" size={22} color={Colors.primaryColor} />
            </TouchableOpacity>

            {/* Option 2: Pay At Hospital (Cash) */}
            {allowPayAtHospital && (
              <TouchableOpacity
                style={[
                  styles.radioOptionCard,
                  selectedPayOption === 0 && styles.radioOptionCardActive,
                ]}
                onPress={() => setSelectedPayOption(0)}
                activeOpacity={0.8}
              >
                <View style={styles.radioOuter}>
                  {selectedPayOption === 0 && <View style={styles.radioInner} />}
                </View>
                <View style={styles.radioInfo}>
                  <Text style={styles.radioTitle}>Pay At Hospital</Text>
                  <Text style={styles.radioSubtitle}>Pay cash during clinic visit</Text>
                </View>
                <MaterialIcons name="local-hospital" size={22} color="#4CAF50" />
              </TouchableOpacity>
            )}

            {/* Option 3: Pay From Wallet */}
            <TouchableOpacity
              style={[
                styles.radioOptionCard,
                selectedPayOption === 2 && styles.radioOptionCardActive,
                !isWalletSufficient && styles.radioOptionDisabled,
              ]}
              onPress={() => {
                if (isWalletSufficient) {
                  setSelectedPayOption(2);
                }
              }}
              activeOpacity={0.8}
            >
              <View style={styles.radioOuter}>
                {selectedPayOption === 2 && <View style={styles.radioInner} />}
              </View>
              <View style={styles.radioInfo}>
                <Text style={styles.radioTitle}>
                  Pay From Wallet ({AppConstants.appCurrency}{walletBalance.toFixed(2)})
                </Text>
                {isWalletSufficient ? (
                  <Text style={styles.radioSubtitle}>Instant payment from your in-app wallet</Text>
                ) : (
                  <Text style={[styles.radioSubtitle, { color: '#E53E3E' }]}>
                    Insufficient wallet balance
                  </Text>
                )}
              </View>
              <MaterialIcons name="account-balance-wallet" size={22} color="#3B82F6" />
            </TouchableOpacity>

            {/* Bottom Submit Button */}
            <TouchableOpacity
              style={[styles.paySubmitBtn, submitting && styles.btnDisabled]}
              onPress={handleConfirm}
              disabled={submitting}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.paySubmitBtnText}>
                  {selectedPayOption === 1
                    ? `Pay ${AppConstants.appCurrency}${total.toFixed(2)} & Book Appointment`
                    : 'Book Appointment'}
                </Text>
              )}
            </TouchableOpacity>

            <View style={{ height: 20 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: Typography.fontFamily.bold,
    color: '#1A202C',
  },
  scrollArea: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  illustrationWrapper: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  illustrationImage: {
    width: 110,
    height: 110,
    marginBottom: 8,
  },
  illustrationTitle: {
    fontSize: 15,
    fontFamily: Typography.fontFamily.bold,
    color: '#1A202C',
    textAlign: 'center',
  },
  illustrationSubtitle: {
    fontSize: 13,
    fontFamily: Typography.fontFamily.regular,
    color: '#718096',
    textAlign: 'center',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 12,
  },
  summarySection: {
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 13,
    fontFamily: Typography.fontFamily.regular,
    color: '#4A5568',
  },
  summaryValue: {
    fontSize: 13,
    fontFamily: Typography.fontFamily.bold,
    color: '#1A202C',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 15,
    fontFamily: Typography.fontFamily.bold,
    color: '#1A202C',
  },
  totalValue: {
    fontSize: 17,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryColor,
  },
  paymentOptionsTitle: {
    fontSize: 14,
    fontFamily: Typography.fontFamily.bold,
    color: '#1A202C',
    marginBottom: 10,
  },
  radioOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 10,
  },
  radioOptionCardActive: {
    borderColor: Colors.primaryColor,
    backgroundColor: '#F0FDF4',
  },
  radioOptionDisabled: {
    opacity: 0.6,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.primaryColor,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primaryColor,
  },
  radioInfo: {
    flex: 1,
  },
  radioTitle: {
    fontSize: 13,
    fontFamily: Typography.fontFamily.bold,
    color: '#1A202C',
  },
  radioSubtitle: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.regular,
    color: '#718096',
    marginTop: 2,
  },
  paySubmitBtn: {
    backgroundColor: Colors.primaryColor,
    borderRadius: 8,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    shadowColor: Colors.primaryColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  paySubmitBtnText: {
    fontSize: 15,
    fontFamily: Typography.fontFamily.bold,
    color: '#FFFFFF',
  },
});
