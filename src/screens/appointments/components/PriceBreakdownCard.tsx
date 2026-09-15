import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../../constants';
import { fs, hs, ws } from '../../../utils/metrics';
import { TYPOGRAPHY } from '../../../utils/typography';

interface Props {
  fee: number;
  taxPercent: number;
  taxAmount: number;
  couponDiscount: number;
  total: number;
}

export const PriceBreakdownCard: React.FC<Props> = ({
  fee,
  taxPercent,
  taxAmount,
  couponDiscount,
  total,
}) => {
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Bill Summary</Text>

      <View style={styles.row}>
        <Text style={styles.label}>Consultation Fee</Text>
        <Text style={styles.value}>₹{fee.toLocaleString('en-IN')}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Tax ({taxPercent}%)</Text>
        <Text style={styles.value}>+ ₹{taxAmount.toFixed(2)}</Text>
      </View>

      {couponDiscount > 0 && (
        <View style={styles.row}>
          <Text style={styles.discountLabel}>Coupon Discount</Text>
          <Text style={styles.discountValue}>- ₹{couponDiscount.toFixed(2)}</Text>
        </View>
      )}

      <View style={styles.divider} />

      <View style={styles.row}>
        <Text style={styles.totalLabel}>Total Payable</Text>
        <Text style={styles.totalValue}>₹{Math.round(total).toLocaleString('en-IN')}</Text>
      </View>
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hs(8),
  },
  label: {
    fontSize: fs(12),
    ...TYPOGRAPHY.regular,
    color: Colors.secondaryFontColor,
  },
  value: {
    fontSize: fs(13),
    ...TYPOGRAPHY.medium,
    color: Colors.primaryFontColor,
  },
  discountLabel: {
    fontSize: fs(12),
    ...TYPOGRAPHY.medium,
    color: '#059669',
  },
  discountValue: {
    fontSize: fs(13),
    ...TYPOGRAPHY.bold,
    color: '#059669',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: hs(8),
  },
  totalLabel: {
    fontSize: fs(14),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
  },
  totalValue: {
    fontSize: fs(17),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryColor,
  },
});
