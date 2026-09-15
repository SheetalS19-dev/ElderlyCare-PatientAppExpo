import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppConstants, Colors } from '../../../constants';
import type { TxnModel } from '../../../types';
import { DateTimeUtils } from '../../../utils';
import { fs, hs, ws } from '../../../utils/metrics';
import { TYPOGRAPHY } from '../../../utils/typography';

export interface WalletTxnRowProps {
  txn: TxnModel;
}

export const WalletTxnRow: React.FC<WalletTxnRowProps> = ({ txn }) => {
  const rawType = (txn.transaction_type || txn.type || '').toLowerCase();
  const isCredit =
    rawType.includes('credit') ||
    rawType.includes('add') ||
    rawType.includes('topup') ||
    rawType === 'credited';

  const amountNum = Number(txn.amount ?? 0);
  const formattedAmount = `${isCredit ? '+' : '-'}${AppConstants.appCurrency}${amountNum.toFixed(2)}`;

  const rawDate = txn.created_at || (txn as any).date || (txn as any).createdAt || '';
  const dateFormatted = rawDate
    ? DateTimeUtils.getDataFormat(rawDate) || rawDate
    : 'Recent';

  const payMethod = txn.payment_method || (txn as any).payment_mode || (txn as any).method || 'Online';
  const payTxnId = txn.payment_transaction_id || txn.transaction_id || (txn.id ? `#${txn.id}` : '');

  const notesText =
    txn.notes ||
    txn.description ||
    (isCredit ? `Wallet Recharged via ${payMethod}` : `Payment for appointment`);

  return (
    <View style={styles.txnCard}>
      <View style={styles.txnRowHeader}>
        <View style={styles.txnLeft}>
          <View style={[styles.iconCircle, isCredit ? styles.iconCircleCredit : styles.iconCircleDebit]}>
            <MaterialIcons
              name={isCredit ? 'arrow-downward' : 'arrow-upward'}
              size={fs(18)}
              color={isCredit ? '#10B981' : '#EF4444'}
            />
          </View>

          <View style={styles.txnMeta}>
            <Text style={styles.txnTitle} numberOfLines={1}>
              {notesText}
            </Text>
            <View style={styles.subMetaRow}>
              <Text style={styles.txnDate}>{dateFormatted}</Text>
              {!!payMethod && (
                <>
                  <Text style={styles.dotSeparator}>•</Text>
                  <Text style={styles.payMethodBadge}>{payMethod}</Text>
                </>
              )}
            </View>
          </View>
        </View>

        <View style={styles.txnRight}>
          <Text style={[styles.amountText, isCredit ? styles.amountCredit : styles.amountDebit]}>
            {formattedAmount}
          </Text>
          {!!payTxnId && (
            <Text style={styles.txnIdText} numberOfLines={1}>
              {payTxnId}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  txnCard: {
    backgroundColor: Colors.white,
    borderRadius: fs(14),
    padding: ws(14),
    marginBottom: hs(10),
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  txnRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  txnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: ws(10),
  },
  iconCircle: {
    width: ws(38),
    height: ws(38),
    aspectRatio: 1,
    borderRadius: 999,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ws(12),
  },
  iconCircleCredit: {
    backgroundColor: '#ECFDF5',
  },
  iconCircleDebit: {
    backgroundColor: '#FEF2F2',
  },
  txnMeta: {
    flex: 1,
  },
  txnTitle: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(13),
    color: Colors.primaryFontColor,
  },
  subMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hs(3),
  },
  txnDate: {
    ...TYPOGRAPHY.medium,
    fontSize: fs(11),
    color: Colors.secondaryFontColor,
  },
  dotSeparator: {
    ...TYPOGRAPHY.regular,
    fontSize: fs(10),
    color: Colors.secondaryFontColor,
    marginHorizontal: ws(6),
  },
  payMethodBadge: {
    ...TYPOGRAPHY.medium,
    fontSize: fs(11),
    color: Colors.primaryColor,
  },
  txnRight: {
    alignItems: 'flex-end',
  },
  amountText: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(14),
  },
  amountCredit: {
    color: '#10B981',
  },
  amountDebit: {
    color: '#EF4444',
  },
  txnIdText: {
    ...TYPOGRAPHY.regular,
    fontSize: fs(10),
    color: Colors.secondaryFontColor,
    marginTop: hs(2),
  },
});
