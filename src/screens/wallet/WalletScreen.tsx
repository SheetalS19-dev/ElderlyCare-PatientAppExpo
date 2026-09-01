import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { memo, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ImageBackground,
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
import {
  AppHeader,
  AppTextField,
  EmptyState,
  ErrorState,
  LoadingIndicator,
} from '../../components';
import { AppConstants, Colors, Typography } from '../../constants';
import { useAuth } from '../../context/AuthContext';
import type { RootStackParamList } from '../../navigation/types';
import {
  useCreateRzOrderMutation,
  useGetActivePaymentGatewayQuery,
} from '../../redux/apis/bookingApi';
import { useGetUserProfileQuery } from '../../redux/apis/userApi';
import {
  useAddWalletMoneyMutation,
  useGetWalletTransactionsQuery,
} from '../../redux/apis/walletApi';
import { openRazorpayCheckout } from '../../services/razorpayService';
import type { TxnModel } from '../../types';
import { DateTimeUtils, showToast } from '../../utils';

type RootNavigation = NativeStackNavigationProp<RootStackParamList>;

const QUICK_AMOUNTS = [250, 500, 1000, 1500, 2000];
const MIN_AMOUNT = 1;
const MAX_AMOUNT = 5000;

type PaymentMethodOption = 'Net Banking' | 'UPI / GPay / PhonePe' | 'Card' | 'Wallet';

const PAYMENT_METHODS: { key: PaymentMethodOption; label: string; icon: keyof typeof MaterialIcons.glyphMap }[] = [
  { key: 'Net Banking', label: 'Net Banking', icon: 'account-balance' },
  { key: 'UPI / GPay / PhonePe', label: 'UPI / GPay / PhonePe', icon: 'qr-code' },
  { key: 'Card', label: 'Card', icon: 'credit-card' },
  { key: 'Wallet', label: 'Wallet', icon: 'account-balance-wallet' },
];

export const WalletScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<RootNavigation>();
  const { isAuthenticated, user, updateUser } = useAuth();
  const uid = String(user?.id ?? (user as any)?.user_id ?? '');

  const {
    data: transactions,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetWalletTransactionsQuery(uid, {
    skip: !isAuthenticated || !uid,
  });

  const { data: gateway } = useGetActivePaymentGatewayQuery();
  const [createRzOrder] = useCreateRzOrderMutation();
  const [addWalletMoney] = useAddWalletMoneyMutation();
  const { refetch: refetchProfile } = useGetUserProfileQuery(uid, { skip: !uid });

  const [showAddMoney, setShowAddMoney] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodOption>('Net Banking');
  const [amount, setAmount] = useState('');
  const [amountError, setAmountError] = useState<string | undefined>();
  const [processing, setProcessing] = useState(false);

  const walletBalance = Number(user?.wallet_amount ?? (user as any)?.wallet_balance ?? 0);

  const txnList: TxnModel[] = useMemo(() => {
    if (Array.isArray(transactions)) return transactions;
    if (Array.isArray((transactions as any)?.data)) return (transactions as any).data;
    if (Array.isArray((transactions as any)?.result)) return (transactions as any).result;
    return [];
  }, [transactions]);

  const handleProcess = async () => {
    const numeric = Number(amount);
    if (!amount || isNaN(numeric) || numeric < MIN_AMOUNT || numeric > MAX_AMOUNT) {
      setAmountError(
        `Enter amount between ${AppConstants.appCurrency}${MIN_AMOUNT} to ${AppConstants.appCurrency}${MAX_AMOUNT}`
      );
      return;
    }

    setAmountError(undefined);
    setShowAddMoney(false);
    setProcessing(true);

    try {
      let methodParam = 'Online';
      if (selectedMethod === 'Net Banking') methodParam = 'NetBanking';
      else if (selectedMethod === 'Card') methodParam = 'Card';
      else if (selectedMethod === 'Wallet') methodParam = 'Wallet';
      else if (selectedMethod === 'UPI / GPay / PhonePe') methodParam = 'UPI';

      const paymentTxnId = `pay_${Date.now()}`;

      const addMoneyPayload = {
        user_id: uid,
        amount: String(numeric),
        payment_transaction_id: paymentTxnId,
        payment_method: methodParam,
        transaction_type: 'Credited',
        description: `Amount credited via ${selectedMethod}`,
      };

      await addWalletMoney(addMoneyPayload).unwrap();
      showToast('Amount credited to wallet successfully!');

      const profileRes = await refetchProfile();
      if (profileRes?.data) {
        const freshData = (profileRes.data as any)?.data ?? profileRes.data;
        await updateUser({
          ...(user || {}),
          ...freshData,
        });
      }
      refetch();
    } catch (e: any) {
      showToast(e?.data?.message || e?.message || e?.error || 'Failed to add money to wallet');
    } finally {
      setProcessing(false);
      setAmount('');
    }
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <AppHeader title="Wallet" onBackPress={navigation.canGoBack() ? () => navigation.goBack() : undefined} />
        <EmptyState message="Log in to view your wallet and transaction history" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader title="My Wallet" onBackPress={navigation.canGoBack() ? () => navigation.goBack() : undefined} />

      {processing ? (
        <LoadingIndicator />
      ) : (
        <FlatList
          data={txnList}
          keyExtractor={(item: TxnModel, index: number) => `txn-${item.id ?? index}`}
          refreshing={isFetching}
          onRefresh={refetch}
          contentContainerStyle={[styles.listContent, { paddingBottom: Math.max(insets.bottom + 20, 30) }]}
          ListHeaderComponent={
            <>
              {/* Balance Card in Brand Theme with container_bg */}
              <ImageBackground
                source={require('../../../assets/icons/container_bg.png')}
                style={styles.balanceCard}
                imageStyle={styles.balanceCardBgImage}
                resizeMode="cover"
              >
                <View style={styles.balanceHeaderRow}>
                  <View>
                    <Text style={styles.balanceLabel}>Available Balance</Text>
                    <Text style={styles.balanceValue}>
                      {AppConstants.appCurrency}
                      {walletBalance.toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.walletIconCircle}>
                    <MaterialIcons name="account-balance-wallet" size={32} color={Colors.white} />
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.addMoneyBtn}
                  activeOpacity={0.85}
                  onPress={() => setShowAddMoney(true)}
                >
                  <MaterialIcons name="add-circle" size={18} color={Colors.primaryColor} />
                  <Text style={styles.addMoneyBtnText}>Add Money to Wallet</Text>
                </TouchableOpacity>
              </ImageBackground>

              {/* Transactions Section Title */}
              <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionTitle}>Transaction History</Text>
                <Text style={styles.sectionCount}>({txnList.length})</Text>
              </View>
            </>
          }
          ListEmptyComponent={
            isLoading ? (
              <LoadingIndicator />
            ) : isError ? (
              <ErrorState message="Could not load transaction history" onRetry={refetch} />
            ) : (
              <EmptyState message="No transactions recorded in your wallet yet." />
            )
          }
          renderItem={({ item }: { item: TxnModel }) => <TxnRow txn={item} />}
        />
      )}

      {/* Add Money Bottom Sheet Modal */}
      <Modal visible={showAddMoney} transparent animationType="slide" onRequestClose={() => setShowAddMoney(false)}>
        <KeyboardAvoidingView
          style={styles.sheetOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -20}
        >
          <TouchableOpacity
            style={styles.backdropPressable}
            activeOpacity={1}
            onPress={() => setShowAddMoney(false)}
          />
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom + 12, 20) }]}>
            {/* Sheet Handle */}
            <View style={styles.sheetHandle} />

            <View style={styles.sheetHeader}>
              <View style={styles.sheetHeaderLeft}>
                <View style={styles.sheetIconCircle}>
                  <MaterialIcons name="account-balance-wallet" size={22} color={Colors.primaryColor} />
                </View>
                <View>
                  <Text style={styles.sheetTitle}>Add Money To Wallet</Text>
                  <View style={styles.balancePill}>
                    <Text style={styles.balancePillLabel}>Balance: </Text>
                    <Text style={styles.balancePillValue}>{AppConstants.appCurrency}{walletBalance.toFixed(2)}</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity style={styles.closeHeaderBtn} onPress={() => setShowAddMoney(false)}>
                <MaterialIcons name="close" size={18} color={Colors.secondaryFontColor} />
              </TouchableOpacity>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              bounces={false}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 16 }}
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
                      onPress={() => setSelectedMethod(m.key)}
                    >
                      <View style={[styles.methodIconBox, isSelected && styles.methodIconBoxActive]}>
                        <MaterialIcons name={m.icon} size={18} color={isSelected ? Colors.white : Colors.primaryColor} />
                      </View>
                      <Text style={[styles.methodCardText, isSelected && styles.methodCardTextActive]}>
                        {m.label}
                      </Text>
                      {isSelected && (
                        <View style={styles.selectedCheckBadge}>
                          <MaterialIcons name="check" size={10} color={Colors.white} />
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
                onChangeText={(v) => setAmount(v.replace(/[^0-9.]/g, ''))}
                error={amountError}
              />
              <Text style={styles.hintText}>Minimum 1 ₹ required to place this order</Text>

              <Text style={styles.quickAmountLabel}>Quick Select</Text>
              <View style={styles.chipRow}>
                {QUICK_AMOUNTS.map((a) => (
                  <TouchableOpacity
                    key={a}
                    style={[styles.chip, amount === String(a) && styles.chipActive]}
                    activeOpacity={0.75}
                    onPress={() => setAmount(String(a))}
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
                  onPress={() => setShowAddMoney(false)}
                >
                  <Text style={styles.closeBtnText}>Close</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.confirmAddBtn, processing && styles.confirmAddBtnDisabled]}
                  activeOpacity={0.85}
                  disabled={processing}
                  onPress={handleProcess}
                >
                  {processing ? (
                    <ActivityIndicator size="small" color={Colors.white} />
                  ) : (
                    <>
                      <Text style={styles.confirmAddBtnText}>Add Money</Text>
                      <MaterialIcons name="arrow-forward" size={16} color={Colors.white} />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const TxnRow = memo(({ txn }: { txn: TxnModel }) => {
  const rawType = (txn.transaction_type || txn.type || 'Credited').trim();
  const isCredit = rawType.toLowerCase() === 'credited' || rawType.toLowerCase() === 'credit';
  const color = isCredit ? '#10B981' : '#EF4444';
  const paymentId = txn.payment_transaction_id || txn.transaction_id;
  const paymentMethod = txn.payment_method;
  const numAmount = Number(txn.amount ?? 0);

  return (
    <View style={styles.txnCard}>
      <View style={styles.txnRow}>
        <View style={[styles.txnDot, { backgroundColor: isCredit ? '#ECFDF5' : '#FEF2F2' }]}>
          <MaterialIcons
            name={isCredit ? 'arrow-downward' : 'arrow-upward'}
            size={20}
            color={color}
          />
        </View>

        <View style={styles.txnInfo}>
          <View style={styles.txnTopLine}>
            <Text style={styles.txnTitle} numberOfLines={1}>
              {isCredit ? 'Wallet Top-up' : 'Service Payment'}
            </Text>
            <Text style={[styles.txnAmount, { color }]}>
              {isCredit ? '+' : '−'} {AppConstants.appCurrency}{numAmount.toFixed(2)}
            </Text>
          </View>

          {!!paymentId && (
            <Text style={styles.txnIdText} numberOfLines={1}>
              Ref: {paymentId}
            </Text>
          )}

          <View style={styles.txnBottomLine}>
            <Text style={styles.txnDate}>
              {DateTimeUtils.getDataFormatWithTime(txn.created_at)}
            </Text>
            {!!paymentMethod && (
              <View style={styles.methodBadge}>
                <Text style={styles.methodBadgeText}>{paymentMethod}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgColor,
  },
  listContent: {
    padding: 16,
  },
  balanceCard: {
    borderRadius: 20,
    backgroundColor: Colors.primaryColor,
    padding: 20,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: Colors.primaryColor,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  balanceCardBgImage: {
    borderRadius: 20,
    opacity: 0.95,
  },
  balanceHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.medium,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  balanceValue: {
    marginTop: 4,
    fontSize: 28,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
  },
  walletIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addMoneyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  addMoneyBtnText: {
    fontSize: 13,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryColor,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryFontColor,
  },
  sectionCount: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.secondaryFontColor,
  },
  txnCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  txnRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  txnDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  txnInfo: {
    flex: 1,
  },
  txnTopLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  txnTitle: {
    fontSize: 13,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryFontColor,
  },
  txnAmount: {
    fontSize: 14,
    fontFamily: Typography.fontFamily.bold,
  },
  txnIdText: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.secondaryFontColor,
    marginTop: 2,
  },
  txnBottomLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  txnDate: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.secondaryFontColor,
  },
  methodBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  methodBadgeText: {
    fontSize: 9,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.secondaryFontColor,
  },

  /* Sheet */
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 12,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 12,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  sheetHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sheetIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF5EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetTitle: {
    fontSize: 16,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryFontColor,
  },
  balancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  balancePillLabel: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.secondaryFontColor,
  },
  balancePillValue: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryColor,
  },
  closeHeaderBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputSectionLabel: {
    fontSize: 13,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryFontColor,
    marginTop: 8,
    marginBottom: 10,
  },
  methodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  methodCard: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 8,
    position: 'relative',
  },
  methodCardActive: {
    backgroundColor: '#FFF5EB',
    borderColor: Colors.primaryColor,
  },
  methodIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  methodIconBoxActive: {
    backgroundColor: Colors.primaryColor,
  },
  methodCardText: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primaryFontColor,
    flex: 1,
  },
  methodCardTextActive: {
    color: Colors.primaryColor,
    fontFamily: Typography.fontFamily.bold,
  },
  selectedCheckBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.primaryColor,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hintText: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.secondaryFontColor,
    marginTop: -8,
    marginBottom: 14,
  },
  quickAmountLabel: {
    fontSize: 13,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryFontColor,
    marginTop: 4,
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 22,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipActive: {
    backgroundColor: '#FFF5EB',
    borderColor: Colors.primaryColor,
  },
  chipText: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primaryFontColor,
  },
  chipTextActive: {
    color: Colors.primaryColor,
    fontFamily: Typography.fontFamily.bold,
  },
  sheetActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
    marginBottom: 8,
  },
  closeBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: Colors.white,
  },
  closeBtnText: {
    fontSize: 14,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primaryFontColor,
  },
  confirmAddBtn: {
    flexDirection: 'row',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.primaryColor,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    minWidth: 130,
    shadowColor: Colors.primaryColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  confirmAddBtnDisabled: {
    opacity: 0.7,
  },
  confirmAddBtnText: {
    fontSize: 14,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
  },
});
