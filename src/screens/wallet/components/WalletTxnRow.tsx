import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { memo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../../constants';
import type { TxnModel } from '../../../types';
import { DateTimeUtils } from '../../../utils';
import { fs, hs, ws } from '../../../utils/metrics';
import { TYPOGRAPHY } from '../../../utils/typography';

export interface WalletTxnRowProps {
  txn: TxnModel | any;
}

export const WalletTxnRow: React.FC<WalletTxnRowProps> = memo(({ txn }) => {
  const [expanded, setExpanded] = useState(false);

  const rawType = (txn.transaction_type || txn.type || 'Credited').trim();
  const isCredit = rawType.toLowerCase() === 'credited' || rawType.toLowerCase() === 'credit';
  const color = isCredit ? Colors.green_10B981 : Colors.red_EF4444;
  const bg = isCredit ? Colors.green_ECFDF5 : Colors.red_FEF2F2;
  const border = isCredit ? Colors.green_A7F3D0 : Colors.red_FCA5A5;

  const txnIdStr = txn.id ? `#${txn.id}` : '--';
  const payId = txn.payment_transaction_id || txn.transaction_id || '';
  const appointmentId = txn.appointment_id ? `#${txn.appointment_id}` : null;

  let rawPaymentMode = (
    txn.payment_method ||
    txn.payment_mode ||
    txn.method ||
    ''
  ).trim();

  let paymentMode = rawPaymentMode;
  if (!paymentMode || paymentMode.toLowerCase() === 'other') {
    paymentMode = isCredit ? 'Net Banking' : 'Wallet';
  } else {
    const lower = paymentMode.toLowerCase();
    if (lower === 'netbanking' || lower === 'net banking') paymentMode = 'Net Banking';
    else if (lower === 'upi' || lower === 'gpay' || lower === 'phonepe') paymentMode = 'UPI';
    else if (lower === 'card') paymentMode = 'Card';
    else if (lower === 'wallet') paymentMode = 'Wallet';
    else if (lower === 'hospital' || lower === 'cash') paymentMode = 'Pay At Hospital';
  }

  const notesText =
    txn.notes || txn.description || (isCredit ? 'Wallet Top-up' : 'Appointment Payment');

  let parsedPatientName = `${txn.patient_f_name ?? ''} ${txn.patient_l_name ?? ''}`.trim();
  const matchFor = notesText.match(/booking for ([^(]+)/i);
  if (matchFor && matchFor[1]) {
    parsedPatientName = matchFor[1].trim();
  }

  const patientName =
    parsedPatientName ||
    `${txn.user_f_name ?? ''} ${txn.user_l_name ?? ''}`.trim();

  const hasPatientInNotes = /booking for/i.test(notesText);
  const numAmount = Number(txn.amount ?? 0);
  const formattedDate = DateTimeUtils.getDataFormatWithTime(txn.created_at);

  return (
    <TouchableOpacity
      style={styles.txnCard}
      activeOpacity={0.9}
      onPress={() => setExpanded((prev) => !prev)}
    >
      {/* Top Row: Type Badge + Payment Mode + Amount + Expand Chevron */}
      <View style={styles.txnTopRow}>
        <View style={styles.txnLeftGroup}>
          <View style={[styles.statusBadgePill, { backgroundColor: bg, borderColor: border }]}>
            <Text style={[styles.statusBadgePillText, { color }]}>
              {isCredit ? 'Credited' : 'Debited'}
            </Text>
          </View>
          <View style={styles.paymentModeBadge}>
            <Text style={styles.paymentModeBadgeText}>{paymentMode}</Text>
          </View>
        </View>

        <View style={styles.txnRightGroup}>
          <Text style={[styles.txnAmountText, { color }]}>
            {isCredit ? '+ ₹' : '- ₹'}{numAmount.toLocaleString('en-IN')}
          </Text>
          <MaterialIcons
            name={expanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
            size={fs(20)}
            color={Colors.secondaryFontColor}
          />
        </View>
      </View>

      {/* Middle Row: Ref IDs (TXN & PAY on separate stacked lines) + Date */}
      <View style={styles.txnMetaRow}>
        <View style={styles.txnIdColumn}>
          <Text style={styles.txnIdLabel}>
            TXN: <Text style={styles.txnIdValue}>{txnIdStr}</Text>
          </Text>
          {!!payId && (
            <Text style={styles.payIdLabel}>
              PAY: <Text style={styles.payIdValue}>{payId}</Text>
            </Text>
          )}
        </View>

        <Text style={styles.txnDateText}>{formattedDate}</Text>
      </View>

      {/* Bottom Row: Patient & Description */}
      <View style={styles.txnBottomRow}>
        <Text style={styles.notesText} numberOfLines={expanded ? undefined : 2}>
          {notesText} {!hasPatientInNotes && patientName ? `(Patient: ${patientName})` : ''}
        </Text>
      </View>

      {/* Expanded Detailed Breakdown */}
      {expanded && (
        <View style={styles.expandedDetailsBox}>
          <View style={styles.expandedDivider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Transaction ID</Text>
            <Text style={styles.detailValue}>{txnIdStr}</Text>
          </View>

          {!!payId && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Payment Ref ID</Text>
              <Text style={styles.detailValue}>{payId}</Text>
            </View>
          )}

          {!!appointmentId && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Appointment ID</Text>
              <Text style={styles.detailValue}>{appointmentId}</Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment Mode</Text>
            <Text style={styles.detailValue}>{paymentMode}</Text>
          </View>

          {!!patientName && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Patient</Text>
              <Text style={styles.detailValue}>{patientName}</Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date & Time</Text>
            <Text style={styles.detailValue}>{formattedDate}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Description</Text>
            <Text style={[styles.detailValue, { flex: 1 }]}>{notesText}</Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  txnCard: {
    backgroundColor: Colors.white,
    borderRadius: fs(16),
    padding: ws(14),
    marginBottom: hs(10),
    borderWidth: 1,
    borderColor: Colors.slate_E2E8F0,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: hs(2) },
    shadowOpacity: 0.03,
    shadowRadius: fs(4),
    elevation: 1,
  },
  txnTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hs(8),
  },
  txnLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(8),
  },
  statusBadgePill: {
    paddingHorizontal: ws(8),
    paddingVertical: hs(3),
    borderRadius: fs(6),
    borderWidth: 1,
  },
  statusBadgePillText: {
    fontSize: fs(11),
    ...TYPOGRAPHY.bold,
  },
  txnRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(4),
  },
  txnAmountText: {
    fontSize: fs(16),
    ...TYPOGRAPHY.bold,
  },
  paymentModeBadge: {
    backgroundColor: Colors.slate_F1F5F9,
    paddingHorizontal: ws(8),
    paddingVertical: hs(3),
    borderRadius: fs(6),
    borderWidth: 1,
    borderColor: Colors.gray_CBD5E1,
  },
  paymentModeBadgeText: {
    fontSize: fs(10),
    ...TYPOGRAPHY.bold,
    color: Colors.secondaryFontColor,
  },
  txnMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginVertical: hs(6),
  },
  txnIdColumn: {
    flex: 1,
    paddingRight: ws(8),
  },
  txnIdLabel: {
    fontSize: fs(11),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
  },
  txnIdValue: {
    fontSize: fs(11),
    ...TYPOGRAPHY.medium,
    color: Colors.primaryFontColor,
  },
  payIdLabel: {
    fontSize: fs(10),
    ...TYPOGRAPHY.bold,
    color: Colors.secondaryFontColor,
    marginTop: hs(2),
  },
  payIdValue: {
    fontSize: fs(10),
    ...TYPOGRAPHY.regular,
    color: Colors.slate_475569,
  },
  txnDateText: {
    fontSize: fs(11),
    ...TYPOGRAPHY.medium,
    color: Colors.secondaryFontColor,
  },
  txnBottomRow: {
    marginTop: hs(6),
    paddingTop: hs(6),
    borderTopWidth: 1,
    borderTopColor: Colors.slate_F1F5F9,
  },
  notesText: {
    fontSize: fs(11),
    ...TYPOGRAPHY.regular,
    color: Colors.secondaryFontColor,
  },
  expandedDetailsBox: {
    marginTop: hs(8),
    paddingTop: hs(8),
  },
  expandedDivider: {
    height: 1,
    backgroundColor: Colors.slate_F1F5F9,
    marginBottom: hs(8),
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: hs(6),
  },
  detailLabel: {
    fontSize: fs(11),
    ...TYPOGRAPHY.medium,
    color: Colors.secondaryFontColor,
    width: ws(110),
  },
  detailValue: {
    fontSize: fs(11),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
    flex: 1,
    textAlign: 'right',
  },
});
