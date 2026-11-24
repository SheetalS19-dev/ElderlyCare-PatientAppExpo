import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppCard } from '../../../components';
import { AppConstants, Colors } from '../../../constants';
import { fs, hs, ws } from '../../../utils/metrics';
import { TYPOGRAPHY } from '../../../utils/typography';

interface Props {
  consultationTypeLabel?: string;
  consultationTypeSubtext?: string;
  isOnlineConsult?: boolean;
  fee: number;
  taxAmount: number;
  couponDiscount: number;
  couponCode?: string;
  total: number;
}

export const PriceBreakdownCard: React.FC<Props> = memo(({
  consultationTypeLabel,
  consultationTypeSubtext,
  isOnlineConsult,
  fee,
  taxAmount,
  couponDiscount,
  couponCode,
  total,
}) => {
  return (
    <AppCard style={styles.priceBreakdownCard}>
      <Text style={styles.priceBreakdownTitle}>Price Breakdown</Text>

      <View style={styles.priceBreakdownRow}>
        <Text style={styles.priceBreakdownLabel}>Consultation Type</Text>
        <View style={styles.priceBreakdownTypeBadge}>
          <Text style={styles.priceBreakdownTypeValue}>
            {consultationTypeLabel ?? 'Clinic Visit'}{' '}
            {consultationTypeSubtext ? (
              <Text style={styles.priceBreakdownTypeSub}>{consultationTypeSubtext}</Text>
            ) : null}
          </Text>
        </View>
      </View>

      <View style={styles.priceBreakdownRow}>
        <Text style={styles.priceBreakdownLabel}>Consultation Fee</Text>
        <Text style={styles.priceBreakdownValue}>
          {AppConstants.appCurrency}{Number(fee || 0).toFixed(2)}
        </Text>
      </View>

      <View style={styles.priceBreakdownRow}>
        <Text style={styles.priceBreakdownLabel}>Tax (12%)</Text>
        <Text style={styles.priceBreakdownValue}>
          {AppConstants.appCurrency}{Number(taxAmount || 0).toFixed(2)}
        </Text>
      </View>

      {couponDiscount > 0 && (
        <View style={styles.priceBreakdownRow}>
          <Text style={styles.priceBreakdownDiscountLabel}>
            Discount ({couponCode})
          </Text>
          <Text style={styles.priceBreakdownDiscountValue}>
            -{AppConstants.appCurrency}{Number(couponDiscount || 0).toFixed(2)}
          </Text>
        </View>
      )}

      <View style={styles.priceBreakdownDivider} />

      <View style={styles.priceBreakdownRow}>
        <Text style={styles.priceBreakdownTotalLabel}>Total Amount</Text>
        <Text style={styles.priceBreakdownTotalValue}>
          {AppConstants.appCurrency}{Number(total || 0).toFixed(2)}
        </Text>
      </View>
    </AppCard>
  );
});

const styles = StyleSheet.create({
  priceBreakdownCard: {
    padding: ws(16),
    marginBottom: hs(14),
    borderRadius: ws(16),
  },
  priceBreakdownTitle: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(14),
    color: Colors.primaryFontColor,
    marginBottom: hs(12),
  },
  priceBreakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hs(10),
  },
  priceBreakdownLabel: {
    ...TYPOGRAPHY.regular,
    fontSize: fs(12.5),
    color: Colors.secondaryFontColor,
  },
  priceBreakdownValue: {
    ...TYPOGRAPHY.semiBold,
    fontSize: fs(12.5),
    color: Colors.primaryFontColor,
  },
  priceBreakdownTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(4),
  },
  priceBreakdownTypeValue: {
    ...TYPOGRAPHY.semiBold,
    fontSize: fs(12.5),
    color: Colors.primaryColor,
  },
  priceBreakdownTypeSub: {
    ...TYPOGRAPHY.regular,
    fontSize: fs(11),
    color: Colors.secondaryFontColor,
  },
  priceBreakdownDiscountLabel: {
    ...TYPOGRAPHY.regular,
    fontSize: fs(12.5),
    color: Colors.green_16A34A,
  },
  priceBreakdownDiscountValue: {
    ...TYPOGRAPHY.semiBold,
    fontSize: fs(12.5),
    color: Colors.green_16A34A,
  },
  priceBreakdownDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: hs(8),
  },
  priceBreakdownTotalLabel: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(14),
    color: Colors.primaryFontColor,
  },
  priceBreakdownTotalValue: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(16),
    color: Colors.primaryColor,
  },
});
