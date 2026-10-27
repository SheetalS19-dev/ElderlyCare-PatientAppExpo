import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { memo, useEffect, useMemo, useState } from 'react';
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
  TextInput,
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
  RazorpayWebModal,
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
import type { TxnModel } from '../../types';
import { DateTimeUtils, fs, hs, showToast, TYPOGRAPHY, ws } from '../../utils';

type RootNavigation = NativeStackNavigationProp<RootStackParamList>;

const QUICK_AMOUNTS = [250, 500, 1000, 1500, 2000];
const MIN_AMOUNT = 100;
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
    refetchOnMountOrArgChange: true,
  });

  const { data: gateway } = useGetActivePaymentGatewayQuery();
  const [createRzOrder] = useCreateRzOrderMutation();
  const [addWalletMoney] = useAddWalletMoneyMutation();
  const {
    data: profileResponse,
    refetch: refetchProfile,
  } = useGetUserProfileQuery(uid, {
    skip: !uid,
    refetchOnMountOrArgChange: true,
  });

  const freshProfileData = useMemo(() => {
    if (!profileResponse) return null;
    return (profileResponse as any)?.data ?? profileResponse;
  }, [profileResponse]);

  useEffect(() => {
    if (freshProfileData && typeof freshProfileData === 'object' && freshProfileData.id) {
      updateUser({ ...(user || {}), ...freshProfileData });
    }
  }, [freshProfileData]);

  const [showAddMoney, setShowAddMoney] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodOption>('Net Banking');
  const [amount, setAmount] = useState('');
  const [amountError, setAmountError] = useState<string | undefined>();
  const [processing, setProcessing] = useState(false);

  const [showRazorpayWebModal, setShowRazorpayWebModal] = useState(false);
  const [pendingPaymentInfo, setPendingPaymentInfo] = useState<{
    numericAmount: number;
    description: string;
    methodParam: string;
    orderId?: string;
  } | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const PAGE_SIZE = 10;
  const [displayedLimit, setDisplayedLimit] = useState(PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);

  const txnList: TxnModel[] = useMemo(() => {
    if (Array.isArray(transactions)) return transactions;
    if (Array.isArray((transactions as any)?.data)) return (transactions as any).data;
    if (Array.isArray((transactions as any)?.result)) return (transactions as any).result;
    return [];
  }, [transactions]);

  const walletTxnList: TxnModel[] = useMemo(() => {
    return txnList.filter((item: any) => {
      return (
        Number(item.is_wallet_txn) === 1 ||
        String(item.is_wallet_txn) === '1'
      );
    });
  }, [txnList]);

  const filteredTxnList: TxnModel[] = useMemo(() => {
    if (!searchQuery.trim()) return walletTxnList;

    const query = searchQuery.trim().toLowerCase();
    return walletTxnList.filter((item: any) => {
      const txnId = String(item.id ?? '');
      const payId = String(item.payment_transaction_id || item.transaction_id || '').toLowerCase();
      const amount = String(item.amount ?? '');
      const type = String(item.transaction_type || item.type || '').toLowerCase();
      const method = String(item.payment_method || item.payment_mode || item.method || '').toLowerCase();
      const patient = `${item.patient_f_name ?? ''} ${item.patient_l_name ?? ''} ${item.user_f_name ?? ''} ${item.user_l_name ?? ''}`.toLowerCase();
      const notes = String(item.notes || item.description || '').toLowerCase();

      return (
        txnId.includes(query) ||
        payId.includes(query) ||
        amount.includes(query) ||
        type.includes(query) ||
        method.includes(query) ||
        patient.includes(query) ||
        notes.includes(query)
      );
    });
  }, [walletTxnList, searchQuery]);

  const paginatedTxnList = useMemo(() => {
    return filteredTxnList.slice(0, displayedLimit);
  }, [filteredTxnList, displayedLimit]);

  const totalCredited = useMemo(() => {
    return txnList.reduce((acc, item: any) => {
      const type = (item.transaction_type || item.type || '').toLowerCase();
      if (type === 'credited' || type === 'credit') {
        return acc + (Number(item.amount) || 0);
      }
      return acc;
    }, 0);
  }, [txnList]);

  const totalSpent = useMemo(() => {
    const debits = txnList.reduce((acc, item: any) => {
      const type = (item.transaction_type || item.type || '').toLowerCase();
      const isDebited = type === 'debited' || type === 'debit';
      const isWalletTxn =
        Number(item.is_wallet_txn) === 1 ||
        (item.payment_method || '').trim().toLowerCase() === 'wallet';
      if (isDebited && isWalletTxn) {
        return acc + (Number(item.amount) || 0);
      }
      return acc;
    }, 0);
    return debits;
  }, [txnList]);

  const walletBalance = useMemo(() => {
    const rawVal =
      freshProfileData?.wallet_amount ??
      freshProfileData?.wallet_balance ??
      freshProfileData?.wallet ??
      user?.wallet_amount ??
      (user as any)?.wallet_balance;

    if (rawVal !== undefined && rawVal !== null && rawVal !== '') {
      return Number(rawVal) || 0;
    }

    return Math.max(0, totalCredited - totalSpent);
  }, [freshProfileData, user, totalCredited, totalSpent]);

  const handleLoadMore = () => {
    if (loadingMore || isFetching || displayedLimit >= txnList.length) return;
    setLoadingMore(true);
    setTimeout(() => {
      setDisplayedLimit((prev) => prev + PAGE_SIZE);
      setLoadingMore(false);
    }, 500);
  };

  const handleRefresh = async () => {
    setDisplayedLimit(PAGE_SIZE);
    await Promise.all([refetch(), refetchProfile()]);
  };

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

    let methodParam = 'Online';
    if (selectedMethod === 'Net Banking') methodParam = 'NetBanking';
    else if (selectedMethod === 'Card') methodParam = 'Card';
    else if (selectedMethod === 'Wallet') methodParam = 'Wallet';
    else if (selectedMethod === 'UPI / GPay / PhonePe') methodParam = 'UPI';

    let orderId: string | undefined = undefined;
    try {
      setProcessing(true);
      const orderRes = await createRzOrder({
        amount: String(numeric),
        type: 'Wallet',
        user_id: uid,
      }).unwrap();
      if (orderRes) {
        orderId = orderRes.id || orderRes.order_id || (orderRes as any)?.data?.id || (orderRes as any)?.data?.order_id;
      }
    } catch (err) {
      console.warn('Could not pre-create Razorpay order, falling back to standard checkout:', err);
    } finally {
      setProcessing(false);
    }

    setPendingPaymentInfo({
      numericAmount: numeric,
      description: `Wallet top-up via ${selectedMethod}`,
      methodParam,
      orderId,
    });
    setShowRazorpayWebModal(true);
  };

  const handleRazorpaySuccess = async (paymentTxnId: string) => {
    setShowRazorpayWebModal(false);
    if (!pendingPaymentInfo) return;

    setProcessing(true);
    try {
      const addMoneyPayload = {
        user_id: uid,
        amount: String(pendingPaymentInfo.numericAmount),
        payment_transaction_id: paymentTxnId,
        payment_method: pendingPaymentInfo.methodParam,
        transaction_type: 'Credited',
        type: 'Credited',
        description: 'Wallet Transaction',
        notes: 'Wallet Transaction',
        is_wallet_txn: '1',
      };

      await addWalletMoney(addMoneyPayload).unwrap();
      showToast('Amount credited to wallet successfully!');

      const profileRes = await refetchProfile();
      if (profileRes?.data) {
        const freshData = (profileRes.data as any)?.data ?? profileRes.data;
        await updateUser({ ...(user || {}), ...freshData });
      }
      refetch();
    } catch (e: any) {
      showToast(e?.data?.message || e?.message || 'Failed to credit money to wallet.');
    } finally {
      setProcessing(false);
      setPendingPaymentInfo(null);
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
          data={paginatedTxnList}
          keyExtractor={(item: TxnModel, index: number) => `txn-${item.id ?? index}`}
          refreshing={isFetching && !loadingMore}
          onRefresh={handleRefresh}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          contentContainerStyle={[styles.listContent, { paddingBottom: Math.max(insets.bottom + 20, 30) }]}
          ListHeaderComponent={
            <>
              {/* Main Balance Card */}
              <ImageBackground
                source={require('../../../assets/icons/container_bg.png')}
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

              {/* Stat Summary Cards Row (Web Wallet Matching) */}
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

              {/* Transaction Search Bar */}
              <View style={styles.searchBarWrapper}>
                <MaterialIcons name="search" size={20} color={Colors.secondaryFontColor} style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search transactions..."
                  placeholderTextColor={Colors.secondaryFontColor}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setSearchQuery('')}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <MaterialIcons name="close" size={18} color={Colors.secondaryFontColor} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Transactions Section Title */}
              <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionTitle}>
                  Transaction History ({paginatedTxnList.length} of {filteredTxnList.length})
                </Text>
              </View>
            </>
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoaderContainer}>
                <ActivityIndicator size="small" color={Colors.primaryColor} />
                <Text style={styles.footerLoaderText}>Loading more transactions...</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            isLoading ? (
              <LoadingIndicator />
            ) : isError ? (
              <ErrorState message="Could not load transaction history" onRetry={refetch} />
            ) : searchQuery.trim().length > 0 ? (
              <EmptyState message={`No transactions found matching "${searchQuery}"`} />
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
                          <MaterialIcons name="check" size={12} color={Colors.white} />
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
              <Text style={styles.hintText}>Minimum 100 ₹ required to place this order</Text>

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
      {/* Razorpay WebView Payment Modal */}
      <RazorpayWebModal
        visible={showRazorpayWebModal}
        onClose={() => {
          setShowRazorpayWebModal(false);
          setPendingPaymentInfo(null);
        }}
        onSuccess={handleRazorpaySuccess}
        onFailure={(errorMsg) => {
          setShowRazorpayWebModal(false);
          setPendingPaymentInfo(null);
          showToast(errorMsg || 'Payment failed');
        }}
        // NOTE: RazorpayWebModal currently has FORCE_TEST_MODE = true, so it
        // ignores this prop and always uses its own TEST_KEY_ID constant.
        // Once you've confirmed the gateway-provided key works reliably,
        // flip FORCE_TEST_MODE to false in RazorpayWebModal.tsx to go live.
        keyId={
          (gateway as any)?.razorpay_key ||
          (gateway as any)?.key_id ||
          (gateway as any)?.key ||
          (gateway as any)?.razorpay_key_id ||
          'rzp_test_R6kmrnO91ID9yH'
        }
        amount={pendingPaymentInfo?.numericAmount || 0}
        description={pendingPaymentInfo?.description || 'Wallet Top-up'}
        prefillEmail={(user as any)?.email || ''}
        prefillPhone={(user as any)?.phone || (user as any)?.mobile || ''}
        prefillName={`${(user as any)?.first_name ?? (user as any)?.f_name ?? ''} ${(user as any)?.last_name ?? (user as any)?.l_name ?? ''}`.trim() || 'Patient'}
        orderId={pendingPaymentInfo?.orderId || ''}
      />
    </View>
  );
};

const TxnRow = memo(({ txn }: { txn: TxnModel | any }) => {
  const [expanded, setExpanded] = useState(false);

  const rawType = (txn.transaction_type || txn.type || 'Credited').trim();
  const isCredit = rawType.toLowerCase() === 'credited' || rawType.toLowerCase() === 'credit';
  const color = isCredit ? '#10B981' : '#EF4444';
  const bg = isCredit ? '#ECFDF5' : '#FEF2F2';
  const border = isCredit ? '#A7F3D0' : '#FCA5A5';

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
            size={20}
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
              <Text style={styles.detailLabel}>Patient Name</Text>
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
  container: {
    flex: 1,
    backgroundColor: Colors.bgColor,
  },
  listContent: {
    padding: ws(16),
  },
  filterTabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(8),
    marginBottom: hs(10),
  },
  filterTabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(6),
    paddingHorizontal: ws(12),
    paddingVertical: hs(7),
    borderRadius: fs(20),
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterTabPillActive: {
    backgroundColor: Colors.primaryColor,
    borderColor: Colors.primaryColor,
  },
  filterTabText: {
    fontSize: fs(11),
    ...TYPOGRAPHY.bold,
    color: Colors.secondaryFontColor,
  },
  filterTabTextActive: {
    color: Colors.white,
  },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: fs(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: ws(12),
    height: hs(44),
    marginBottom: hs(14),
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: hs(1) },
    shadowOpacity: 0.02,
    shadowRadius: fs(3),
    elevation: 1,
  },
  searchIcon: {
    marginRight: ws(8),
  },
  searchInput: {
    flex: 1,
    fontSize: fs(13),
    ...TYPOGRAPHY.medium,
    color: Colors.primaryFontColor,
    paddingVertical: 0,
  },
  balanceCard: {
    borderRadius: fs(20),
    backgroundColor: Colors.primaryColor,
    padding: ws(20),
    marginBottom: hs(20),
    overflow: 'hidden',
    shadowColor: Colors.primaryColor,
    shadowOffset: { width: 0, height: hs(6) },
    shadowOpacity: 0.25,
    shadowRadius: fs(10),
    elevation: 6,
  },
  balanceCardBgImage: {
    borderRadius: fs(20),
    opacity: 0.95,
  },
  balanceHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hs(16),
  },
  balanceLabel: {
    fontSize: fs(12),
    ...TYPOGRAPHY.medium,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  balanceValue: {
    marginTop: hs(4),
    fontSize: fs(28),
    ...TYPOGRAPHY.bold,
    color: Colors.white,
  },
  walletIconCircle: {
    width: ws(54),
    height: ws(54),
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
    paddingVertical: hs(10),
    paddingHorizontal: ws(16),
    borderRadius: fs(12),
    gap: ws(6),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: hs(2) },
    shadowOpacity: 0.08,
    shadowRadius: fs(4),
    elevation: 2,
  },
  addMoneyBtnText: {
    fontSize: fs(13),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryColor,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hs(12),
    marginTop: hs(4),
  },
  sectionTitle: {
    fontSize: fs(Typography.fontSize.md),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
  },
  summaryStatsGrid: {
    flexDirection: 'row',
    gap: ws(12),
    marginBottom: hs(12),
  },
  statSummaryCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: fs(16),
    padding: ws(14),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: hs(2) },
    shadowOpacity: 0.03,
    shadowRadius: fs(4),
    elevation: 1,
  },
  statSummaryLabel: {
    fontSize: fs(11),
    ...TYPOGRAPHY.medium,
    color: Colors.secondaryFontColor,
    marginBottom: hs(4),
  },
  statSummaryValue: {
    fontSize: fs(18),
    ...TYPOGRAPHY.bold,
  },
  totalTxnBanner: {
    backgroundColor: Colors.white,
    borderRadius: fs(16),
    padding: ws(14),
    marginBottom: hs(16),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalTxnBannerLabel: {
    fontSize: fs(12),
    ...TYPOGRAPHY.medium,
    color: Colors.secondaryFontColor,
  },
  totalTxnBannerValue: {
    fontSize: fs(16),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
  },
  txnCard: {
    backgroundColor: Colors.white,
    borderRadius: fs(16),
    padding: ws(14),
    marginBottom: hs(10),
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    marginBottom: hs(6),
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
  txnAmountText: {
    fontSize: fs(16),
    ...TYPOGRAPHY.bold,
  },
  paymentModeBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: ws(8),
    paddingVertical: hs(3),
    borderRadius: fs(6),
    borderWidth: 1,
    borderColor: '#CBD5E1',
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
    color: '#475569',
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
    borderTopColor: '#F1F5F9',
  },
  txnRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(4),
  },
  expandedDetailsBox: {
    marginTop: hs(8),
    paddingTop: hs(8),
  },
  expandedDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
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
  notesText: {
    fontSize: fs(11),
    ...TYPOGRAPHY.regular,
    color: Colors.secondaryFontColor,
  },
  txnBottomLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: hs(4),
  },
  txnDate: {
    fontSize: fs(11),
    ...TYPOGRAPHY.regular,
    color: Colors.secondaryFontColor,
  },
  methodBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: ws(6),
    paddingVertical: hs(2),
    borderRadius: fs(6),
  },
  methodBadgeText: {
    fontSize: fs(9),
    ...TYPOGRAPHY.bold,
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
    borderTopLeftRadius: fs(24),
    borderTopRightRadius: fs(24),
    paddingHorizontal: ws(20),
    paddingTop: hs(10),
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: hs(-4) },
    shadowOpacity: 0.12,
    shadowRadius: fs(10),
    elevation: 12,
  },
  sheetHandle: {
    width: ws(36),
    height: hs(4),
    borderRadius: fs(2),
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: hs(12),
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hs(16),
    paddingBottom: hs(12),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  sheetHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(10),
  },
  sheetIconCircle: {
    width: ws(40),
    height: ws(40),
    aspectRatio: 1,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetTitle: {
    fontSize: fs(16),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
  },
  balancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hs(2),
  },
  balancePillLabel: {
    fontSize: fs(11),
    ...TYPOGRAPHY.regular,
    color: Colors.secondaryFontColor,
  },
  balancePillValue: {
    fontSize: fs(11),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryColor,
  },
  closeHeaderBtn: {
    width: ws(30),
    height: hs(30),
    borderRadius: fs(15),
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputSectionLabel: {
    fontSize: fs(13),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
    marginTop: hs(8),
    marginBottom: hs(10),
  },
  methodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ws(10),
    marginBottom: hs(14),
  },
  methodCard: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ws(10),
    paddingVertical: hs(10),
    borderRadius: fs(12),
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: ws(8),
    position: 'relative',
  },
  methodCardActive: {
    backgroundColor: '#EFF6FF',
    borderColor: Colors.primaryColor,
  },
  methodIconBox: {
    width: ws(32),
    height: hs(32),
    borderRadius: fs(8),
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  methodIconBoxActive: {
    backgroundColor: Colors.primaryColor,
  },
  methodCardText: {
    fontSize: fs(11),
    ...TYPOGRAPHY.medium,
    color: Colors.primaryFontColor,
    flex: 1,
  },
  methodCardTextActive: {
    color: Colors.primaryColor,
    ...TYPOGRAPHY.bold,
  },
  selectedCheckBadge: {
    width: ws(18),
    height: hs(18),
    borderRadius: fs(9),
    backgroundColor: Colors.primaryColor,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hintText: {
    fontSize: fs(11),
    ...TYPOGRAPHY.regular,
    color: Colors.secondaryFontColor,
    marginTop: hs(-8),
    marginBottom: hs(14),
  },
  quickAmountLabel: {
    fontSize: fs(13),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
    marginTop: hs(4),
    marginBottom: hs(8),
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ws(8),
    marginBottom: hs(20),
  },
  chip: {
    paddingHorizontal: ws(14),
    paddingVertical: hs(10),
    borderRadius: fs(10),
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: Colors.primaryColor,
  },
  chipText: {
    fontSize: fs(12),
    ...TYPOGRAPHY.medium,
    color: Colors.primaryFontColor,
  },
  chipTextActive: {
    color: Colors.primaryColor,
    ...TYPOGRAPHY.bold,
  },
  sheetActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(12),
    marginTop: hs(12),
    marginBottom: hs(8),
    width: '100%',
  },
  closeBtn: {
    flex: 1,
    height: hs(48),
    borderRadius: fs(12),
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: fs(14),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
    textAlign: 'center',
  },
  confirmAddBtn: {
    flex: 1.5,
    height: hs(48),
    flexDirection: 'row',
    borderRadius: fs(12),
    backgroundColor: Colors.primaryColor,
    justifyContent: 'center',
    alignItems: 'center',
    gap: ws(6),
    shadowColor: Colors.primaryColor,
    shadowOffset: { width: 0, height: hs(2) },
    shadowOpacity: 0.25,
    shadowRadius: fs(4),
    elevation: 3,
  },
  confirmAddBtnDisabled: {
    opacity: 0.7,
  },
  confirmAddBtnText: {
    fontSize: fs(14),
    ...TYPOGRAPHY.bold,
    color: Colors.white,
    textAlign: 'center',
  },
  footerLoaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hs(14),
    gap: ws(8),
  },
  footerLoaderText: {
    fontSize: fs(12),
    ...TYPOGRAPHY.medium,
    color: Colors.secondaryFontColor,
  },
});