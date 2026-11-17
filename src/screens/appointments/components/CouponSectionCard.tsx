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
    <View style={styles.couponContainer}>
      <View style={styles.couponInputWrapper}>
        <MaterialIcons
          name="confirmation-number"
          size={ws(18)}
          color={Colors.primaryColor}
          style={{ marginLeft: ws(12) }}
        />
        <TextInput
          style={styles.couponInput}
          placeholder="Enter coupon code"
          placeholderTextColor={Colors.slate_94A3B8}
          value={couponCode}
          onChangeText={onChangeCouponCode}
          autoCapitalize="characters"
          editable={!appliedCoupon}
        />
        <TouchableOpacity
          style={[
            styles.couponApplyBtn,
            appliedCoupon && styles.couponRemoveBtn,
            isValidating && { opacity: 0.7 },
          ]}
          onPress={appliedCoupon ? onRemove : onApply}
          disabled={isValidating}
          activeOpacity={0.85}
        >
          {isValidating ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Text style={styles.couponApplyBtnText}>
              {appliedCoupon ? 'Remove' : 'Apply'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
      {couponError ? <Text style={styles.couponErrorText}>{couponError}</Text> : null}
      {appliedCoupon && (
        <View style={styles.couponSuccessBadge}>
          <MaterialIcons name="check-circle" size={ws(14)} color={Colors.green_16A34A} />
          <Text style={styles.couponSuccessText}>
            Coupon "{appliedCoupon.code || couponCode}" applied
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  couponContainer: {
    marginBottom: hs(14),
  },
  couponInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: ws(14),
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  couponInput: {
    flex: 1,
    paddingHorizontal: ws(10),
    paddingVertical: hs(10),
    ...TYPOGRAPHY.semiBold,
    fontSize: fs(13),
    color: Colors.primaryFontColor,
  },
  couponApplyBtn: {
    backgroundColor: Colors.primaryColor,
    paddingHorizontal: ws(16),
    paddingVertical: hs(12),
    justifyContent: 'center',
    alignItems: 'center',
  },
  couponRemoveBtn: {
    backgroundColor: Colors.redColor,
  },
  couponApplyBtnText: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(12),
    color: Colors.white,
  },
  couponErrorText: {
    ...TYPOGRAPHY.regular,
    fontSize: fs(11),
    color: Colors.redColor,
    marginTop: hs(4),
    marginLeft: ws(4),
  },
  couponSuccessBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(4),
    marginTop: hs(6),
    backgroundColor: Colors.badgeSuccessBg,
    paddingHorizontal: ws(8),
    paddingVertical: hs(4),
    borderRadius: ws(6),
    alignSelf: 'flex-start',
  },
  couponSuccessText: {
    ...TYPOGRAPHY.semiBold,
    fontSize: fs(11),
    color: Colors.green_16A34A,
  },
});
