import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { GradientFill } from '../../../components';
import { AppConstants, Colors } from '../../../constants';
import { fs, hs, ws } from '../../../utils/metrics';
import { TYPOGRAPHY } from '../../../utils/typography';

export interface WalletBalanceCardProps {
  walletBalance: number;
  totalCredited: number;
  totalSpent: number;
  onAddMoneyPress: () => void;
}

export const WalletBalanceCard: React.FC<WalletBalanceCardProps> = ({
  walletBalance,
  totalCredited,
  totalSpent,
  onAddMoneyPress,
}) => {
  return (
    <>
      {/* Main Balance Card (navy -> teal gradient) */}
      <View style={styles.balanceCard}>
        <GradientFill id="walletCardGrad" colors={['#15275B', '#1B4C7C', '#1F6D96']} />
        <View style={styles.balanceGlow} pointerEvents="none" />
        <Text style={styles.balanceLabel}>CURRENT BALANCE</Text>
        <View style={styles.balanceValueRow}>
          <Text style={styles.balanceValue}>
            {AppConstants.appCurrency}
            {walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
          </Text>
          <View style={styles.presentPill}>
            <Text style={styles.presentPillText}>Present Balance</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.addMoneyBtn} activeOpacity={0.85} onPress={onAddMoneyPress}>
          <MaterialIcons name="add" size={fs(16)} color={Colors.white} />
          <Text style={styles.addMoneyBtnText}>Add Money to Wallet</Text>
        </TouchableOpacity>
      </View>

      {/* Stat Summary Cards Row */}
      <View style={styles.summaryStatsGrid}>
        <View style={styles.statSummaryCard}>
          <View style={[styles.statIconCircle, { backgroundColor: '#E3F8EE' }]}>
            <MaterialIcons name="arrow-downward" size={fs(16)} color="#10B981" />
          </View>
          <Text style={styles.statSummaryLabel}>Total Credited</Text>
          <Text style={[styles.statSummaryValue, { color: '#10B981' }]}>
            {AppConstants.appCurrency}{totalCredited.toLocaleString('en-IN')}
          </Text>
        </View>

        <View style={styles.statSummaryCard}>
          <View style={[styles.statIconCircle, { backgroundColor: '#FDE8EA' }]}>
            <MaterialIcons name="arrow-upward" size={fs(16)} color="#EF4444" />
          </View>
          <Text style={styles.statSummaryLabel}>Wallet Spent</Text>
          <Text style={[styles.statSummaryValue, { color: '#EF4444' }]}>
            {AppConstants.appCurrency}{totalSpent.toLocaleString('en-IN')}
          </Text>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  balanceCard: {
    borderRadius: fs(20),
    padding: ws(20),
    marginBottom: hs(16),
    overflow: 'hidden',
    backgroundColor: Colors.navy,
    shadowColor: Colors.navy,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 6,
  },
  balanceGlow: {
    position: 'absolute',
    top: -hs(40),
    right: -ws(20),
    width: ws(190),
    height: ws(190),
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  balanceLabel: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(11),
    color: 'rgba(255, 255, 255, 0.85)',
    letterSpacing: 1.2,
  },
  balanceValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: ws(10),
    marginTop: hs(6),
    marginBottom: hs(14),
  },
  balanceValue: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(32),
    color: Colors.white,
  },
  presentPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: fs(14),
    paddingVertical: hs(4),
    paddingHorizontal: ws(10),
  },
  presentPillText: {
    ...TYPOGRAPHY.semiBold,
    fontSize: fs(10),
    color: Colors.white,
  },
  addMoneyBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.45)',
    borderRadius: fs(10),
    paddingVertical: hs(9),
    paddingHorizontal: ws(14),
    gap: ws(8),
  },
  addMoneyBtnText: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(12.5),
    color: Colors.white,
  },
  statIconCircle: {
    width: ws(32),
    height: ws(32),
    aspectRatio: 1,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hs(8),
  },
  summaryStatsGrid: {
    flexDirection: 'row',
    gap: ws(12),
    marginBottom: hs(16),
  },
  statSummaryCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: fs(14),
    padding: ws(14),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  statSummaryLabel: {
    ...TYPOGRAPHY.medium,
    fontSize: fs(11),
    color: Colors.secondaryFontColor,
  },
  statSummaryValue: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(16),
    marginTop: hs(4),
  },
});
