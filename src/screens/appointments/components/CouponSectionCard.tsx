import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../../../constants';
import type { CouponModel } from '../../../types';
import { fs, hs, ws } from '../../../utils/metrics';
import { TYPOGRAPHY } from '../../../utils/typography';

interface Props {
  couponCode: string;
  onChangeCouponCode: (text: string) => void;
  appliedCoupon: CouponModel | null;
  isValidating: boolean;
  couponError?: string;
  onApply: () => void;
  onRemove: () => void;
}

export const CouponSectionCard: React.FC<Props> = ({
  couponCode,
  onChangeCouponCode,
  appliedCoupon,
  isValidating,
  couponError,
  onApply,
  onRemove,
}) => {
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Apply Coupon Code</Text>

      {appliedCoupon ? (
        <View style={styles.appliedBanner}>
          <View style={styles.appliedLeft}>
            <MaterialIcons name="local-offer" size={ws(20)} color="#10B981" />
            <View>
              <Text style={styles.appliedCode}>{appliedCoupon.code}</Text>
              <Text style={styles.appliedSuccess}>
                Coupon Applied! Save {appliedCoupon.discount}
                {appliedCoupon.type === 'percentage' ? '%' : ' ₹'}
              </Text>
            </View>
          </View>
          <TouchableOpacity activeOpacity={0.8} onPress={onRemove}>
            <Text style={styles.removeText}>Remove</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.inputRow}>
          <TextInput
            style={[styles.input, !!couponError && styles.inputError]}
            value={couponCode}
            onChangeText={onChangeCouponCode}
            placeholder="Enter promo / coupon code"
            placeholderTextColor="#94A3B8"
            autoCapitalize="characters"
          />
          <TouchableOpacity
            style={[styles.applyBtn, !couponCode.trim() && styles.applyBtnDisabled]}
            activeOpacity={0.8}
            onPress={onApply}
            disabled={!couponCode.trim() || isValidating}
          >
            {isValidating ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Text style={styles.applyBtnText}>Apply</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {!!couponError && <Text style={styles.errorText}>{couponError}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: ws(16),
    padding: ws(16),
    marginBottom: hs(14),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: hs(2) },
    shadowOpacity: 0.03,
    shadowRadius: ws(4),
    elevation: 1,
  },
  sectionTitle: {
    fontSize: fs(14),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
    marginBottom: hs(12),
  },
  inputRow: {
    flexDirection: 'row',
    gap: ws(10),
  },
  input: {
    flex: 1,
    height: hs(44),
    backgroundColor: '#F8FAFC',
    borderRadius: ws(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: ws(12),
    fontSize: fs(13),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
  },
  inputError: {
    borderColor: Colors.redColor,
  },
  applyBtn: {
    paddingHorizontal: ws(18),
    height: hs(44),
    borderRadius: ws(12),
    backgroundColor: Colors.primaryColor,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyBtnDisabled: {
    opacity: 0.5,
  },
  applyBtnText: {
    fontSize: fs(13),
    ...TYPOGRAPHY.bold,
    color: Colors.white,
  },
  appliedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: ws(12),
    padding: ws(12),
  },
  appliedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(10),
  },
  appliedCode: {
    fontSize: fs(13),
    ...TYPOGRAPHY.bold,
    color: '#047857',
  },
  appliedSuccess: {
    fontSize: fs(11),
    ...TYPOGRAPHY.medium,
    color: '#059669',
  },
  removeText: {
    fontSize: fs(12),
    ...TYPOGRAPHY.bold,
    color: Colors.redColor,
  },
  errorText: {
    fontSize: fs(11),
    ...TYPOGRAPHY.regular,
    color: Colors.redColor,
    marginTop: hs(6),
  },
});
