import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import {
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { AppConstants, Colors, Images } from '../../../constants';
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
      {/* Main Balance Card */}
      <ImageBackground
        source={Images.containerBg}
        style={styles.balanceCard}
        imageStyle={styles.balanceCardBgImage}
        resizeMode="cover"
      >
        <View style={styles.balanceHeaderRow}>
          <View>
            <Text style={styles.balanceLabel}>CURRENT BALANCE</Text>
            <Text style={styles.balanceValue}>
              {AppConstants.appCurrency}
              {walletBalance.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
            </Text>
          </View>
          <View style={styles.walletIconCircle}>
            <MaterialIcons name="account-balance-wallet" size={fs(32)} color={Colors.white} />
          </View>
        </View>

        <TouchableOpacity
          style={styles.addMoneyBtn}
          activeOpacity={0.85}
          onPress={onAddMoneyPress}
        >
          <MaterialIcons name="add-circle" size={fs(18)} color={Colors.primaryColor} />
          <Text style={styles.addMoneyBtnText}>Add Money to Wallet</Text>
        </TouchableOpacity>
      </ImageBackground>

      {/* Stat Summary Cards Row */}
      <View style={styles.summaryStatsGrid}>
        <View style={styles.statSummaryCard}>
          <Text style={styles.statSummaryLabel}>Total Credited</Text>
          <Text style={[styles.statSummaryValue, { color: '#10B981' }]}>
            {AppConstants.appCurrency}{totalCredited.toLocaleString('en-IN')}
          </Text>
        </View>

        <View style={styles.statSummaryCard}>
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
    shadowColor: Colors.primaryColor,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  balanceCardBgImage: {
    borderRadius: fs(20),
  },
  balanceHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: hs(20),
  },
  balanceLabel: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(11),
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 1,
  },
  balanceValue: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(32),
    color: Colors.white,
    marginTop: hs(4),
  },
  walletIconCircle: {
    width: ws(52),
    height: ws(52),
    aspectRatio: 1,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addMoneyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderRadius: fs(12),
    paddingVertical: hs(12),
    paddingHorizontal: ws(16),
    gap: ws(8),
  },
  addMoneyBtnText: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(14),
    color: Colors.primaryColor,
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
