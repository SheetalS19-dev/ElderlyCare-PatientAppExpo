import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../../constants';
import type { AppointmentModel } from '../../../types';
import { fs, hs, ws } from '../../../utils/metrics';
import { TYPOGRAPHY } from '../../../utils/typography';

interface Props {
  appointment: AppointmentModel;
}

export const AppointmentPaymentCard: React.FC<Props> = ({ appointment }) => {
  const amount = Number(appointment.amount || (appointment as any)?.total_amount || 0);
  const paymentStatus = appointment.payment_status || 'Paid';
  const paymentMethod = (appointment as any)?.payment_type || (appointment as any)?.payment_method || 'Online';
  const txnId = (appointment as any)?.payment_transaction_id || (appointment as any)?.transaction_id || '';

  const isPaid = paymentStatus.toLowerCase() === 'paid' || paymentStatus === '1';

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Payment Details</Text>

      <View style={styles.row}>
        <Text style={styles.label}>Total Amount Paid</Text>
        <Text style={styles.amountValue}>₹{amount.toLocaleString('en-IN')}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Payment Status</Text>
        <View style={[styles.statusBadge, isPaid ? styles.paidBadge : styles.unpaidBadge]}>
          <Text style={[styles.statusBadgeText, isPaid ? styles.paidText : styles.unpaidText]}>
            {isPaid ? 'Paid' : 'Pending'}
          </Text>
        </View>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Payment Mode</Text>
        <Text style={styles.value}>{paymentMethod}</Text>
      </View>

      {!!txnId && (
        <View style={styles.row}>
          <Text style={styles.label}>Transaction Ref ID</Text>
          <Text style={styles.value}>#{txnId}</Text>
        </View>
      )}
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
    fontSize: fs(12),
    ...TYPOGRAPHY.medium,
    color: Colors.primaryFontColor,
  },
  amountValue: {
    fontSize: fs(15),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryColor,
  },
  statusBadge: {
    paddingHorizontal: ws(8),
    paddingVertical: hs(3),
    borderRadius: ws(6),
    borderWidth: 1,
  },
  paidBadge: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  unpaidBadge: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  statusBadgeText: {
    fontSize: fs(10),
    ...TYPOGRAPHY.bold,
  },
  paidText: {
    color: '#059669',
  },
  unpaidText: {
    color: '#EF4444',
  },
});
