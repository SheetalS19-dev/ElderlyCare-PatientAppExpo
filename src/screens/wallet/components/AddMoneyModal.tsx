import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppTextField } from '../../../components';
import { AppConstants, Colors } from '../../../constants';
import { fs, hs, ws } from '../../../utils/metrics';
import { TYPOGRAPHY } from '../../../utils/typography';

export type PaymentMethodOption = 'Net Banking' | 'UPI / GPay / PhonePe' | 'Card' | 'Wallet';

export const PAYMENT_METHODS: { key: PaymentMethodOption; label: string; icon: keyof typeof MaterialIcons.glyphMap }[] = [
  { key: 'Net Banking', label: 'Net Banking', icon: 'account-balance' },
  { key: 'UPI / GPay / PhonePe', label: 'UPI / GPay / PhonePe', icon: 'qr-code' },
  { key: 'Card', label: 'Card', icon: 'credit-card' },
  { key: 'Wallet', label: 'Wallet', icon: 'account-balance-wallet' },
];

export const QUICK_AMOUNTS = [250, 500, 1000, 1500, 2000];

export interface AddMoneyModalProps {
  visible: boolean;
  onClose: () => void;
  walletBalance: number;
  selectedMethod: PaymentMethodOption;
  onSelectMethod: (method: PaymentMethodOption) => void;
  amount: string;
  onAmountChange: (val: string) => void;
  amountError?: string;
  processing: boolean;
  onProcess: () => void;
}

export const AddMoneyModal: React.FC<AddMoneyModalProps> = ({
  visible,
  onClose,
  walletBalance,
  selectedMethod,
  onSelectMethod,
  amount,
  onAmountChange,
  amountError,
  processing,
  onProcess,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.sheetOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -20}
      >
        <TouchableOpacity
          style={styles.backdropPressable}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom + hs(12), hs(20)) }]}>
          {/* Sheet Handle */}
          <View style={styles.sheetHandle} />

          <View style={styles.sheetHeader}>
            <View style={styles.sheetHeaderLeft}>
              <View style={styles.sheetIconCircle}>
                <MaterialIcons name="account-balance-wallet" size={fs(22)} color={Colors.primaryColor} />
              </View>
              <View>
                <Text style={styles.sheetTitle}>Add Money To Wallet</Text>
                <View style={styles.balancePill}>
                  <Text style={styles.balancePillLabel}>Balance: </Text>
                  <Text style={styles.balancePillValue}>{AppConstants.appCurrency}{walletBalance.toFixed(2)}</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity style={styles.closeHeaderBtn} onPress={onClose}>
              <MaterialIcons name="close" size={fs(18)} color={Colors.secondaryFontColor} />
            </TouchableOpacity>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            bounces={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: hs(16) }}
          >
            <Text style={styles.inputSectionLabel}>Select Payment Method</Text>
            <View style={styles.methodGrid}>
              {PAYMENT_METHODS.map((m) => {
                const isSelected = selectedMethod === m.key;
                return (
                  <TouchableOpacity
                    key={m.key}
                    style={[styles.methodCard, isSelected && styles.methodCardActive]}
                    activeOpacity={0.8}
                    onPress={() => onSelectMethod(m.key)}
                  >
                    <View style={[styles.methodIconBox, isSelected && styles.methodIconBoxActive]}>
                      <MaterialIcons name={m.icon} size={fs(18)} color={isSelected ? Colors.white : Colors.primaryColor} />
                    </View>
                    <Text style={[styles.methodCardText, isSelected && styles.methodCardTextActive]}>
                      {m.label}
                    </Text>
                    {isSelected && (
                      <View style={styles.selectedCheckBadge}>
                        <MaterialIcons name="check" size={fs(12)} color={Colors.white} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.inputSectionLabel}>Enter Amount (₹)</Text>
            <AppTextField
              placeholder="Enter amount in rupees"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={(v) => onAmountChange(v.replace(/[^0-9.]/g, ''))}
              error={amountError}
            />
            <Text style={styles.hintText}>Minimum 100 ₹ required to place this order</Text>

            <Text style={styles.quickAmountLabel}>Quick Select</Text>
            <View style={styles.chipRow}>
              {QUICK_AMOUNTS.map((a) => (
                <TouchableOpacity
                  key={a}
                  style={[styles.chip, amount === String(a) && styles.chipActive]}
                  activeOpacity={0.75}
                  onPress={() => onAmountChange(String(a))}
                >
                  <Text style={[styles.chipText, amount === String(a) && styles.chipTextActive]}>
                    +₹{a.toLocaleString('en-IN')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.sheetActionsRow}>
              <TouchableOpacity
                style={styles.closeBtn}
                activeOpacity={0.8}
                onPress={onClose}
              >
                <Text style={styles.closeBtnText}>Close</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmAddBtn, processing && styles.confirmAddBtnDisabled]}
                activeOpacity={0.85}
                disabled={processing}
                onPress={onProcess}
              >
                {processing ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <>
                    <Text style={styles.confirmAddBtnText}>Add Money</Text>
                    <MaterialIcons name="arrow-forward" size={fs(16)} color={Colors.white} />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  backdropPressable: {
    flex: 1,
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: fs(24),
    borderTopRightRadius: fs(24),
    paddingHorizontal: ws(20),
    paddingTop: hs(10),
    maxHeight: '85%',
  },
  sheetHandle: {
    width: ws(40),
    height: hs(4),
    borderRadius: fs(2),
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: hs(14),
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hs(16),
  },
  sheetHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(12),
  },
  sheetIconCircle: {
    width: ws(42),
    height: ws(42),
    aspectRatio: 1,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetTitle: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(16),
    color: Colors.primaryFontColor,
  },
  balancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hs(2),
  },
  balancePillLabel: {
    ...TYPOGRAPHY.medium,
    fontSize: fs(11),
    color: Colors.secondaryFontColor,
  },
  balancePillValue: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(12),
    color: Colors.primaryColor,
  },
  closeHeaderBtn: {
    padding: ws(6),
  },
  inputSectionLabel: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(13),
    color: Colors.primaryFontColor,
    marginTop: hs(14),
    marginBottom: hs(8),
  },
  methodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ws(10),
  },
  methodCard: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderRadius: fs(12),
    padding: ws(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
  },
  methodCardActive: {
    backgroundColor: '#EFF6FF',
    borderColor: Colors.primaryColor,
  },
  methodIconBox: {
    width: ws(32),
    height: ws(32),
    borderRadius: ws(16),
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hs(8),
  },
  methodIconBoxActive: {
    backgroundColor: Colors.primaryColor,
  },
  methodCardText: {
    ...TYPOGRAPHY.medium,
    fontSize: fs(12),
    color: Colors.primaryFontColor,
  },
  methodCardTextActive: {
    ...TYPOGRAPHY.bold,
    color: Colors.primaryColor,
  },
  selectedCheckBadge: {
    position: 'absolute',
    top: ws(8),
    right: ws(8),
    width: ws(18),
    height: ws(18),
    borderRadius: ws(9),
    backgroundColor: Colors.primaryColor,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hintText: {
    ...TYPOGRAPHY.regular,
    fontSize: fs(11),
    color: Colors.secondaryFontColor,
    marginTop: hs(-4),
    marginBottom: hs(8),
  },
  quickAmountLabel: {
    ...TYPOGRAPHY.medium,
    fontSize: fs(12),
    color: Colors.secondaryFontColor,
    marginTop: hs(10),
    marginBottom: hs(6),
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ws(8),
    marginBottom: hs(20),
  },
  chip: {
    paddingVertical: hs(6),
    paddingHorizontal: ws(12),
    borderRadius: fs(20),
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipActive: {
    backgroundColor: Colors.primaryColor,
    borderColor: Colors.primaryColor,
  },
  chipText: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(12),
    color: Colors.secondaryFontColor,
  },
  chipTextActive: {
    color: Colors.white,
  },
  sheetActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: ws(12),
    marginTop: hs(10),
  },
  closeBtn: {
    flex: 1,
    height: hs(48),
    borderRadius: fs(12),
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(14),
    color: Colors.secondaryFontColor,
  },
  confirmAddBtn: {
    flex: 2,
    height: hs(48),
    borderRadius: fs(12),
    backgroundColor: Colors.primaryColor,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: ws(6),
  },
  confirmAddBtnDisabled: {
    backgroundColor: Colors.disabled,
  },
  confirmAddBtnText: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(14),
    color: Colors.white,
  },
});
