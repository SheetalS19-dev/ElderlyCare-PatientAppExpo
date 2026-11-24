import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useMemo, useRef, useState } from 'react';
import { AppConstants } from '../../constants';
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
import { showToast } from '../../utils';
import type { PaymentMethodOption } from './components';

type RootNavigation = NativeStackNavigationProp<RootStackParamList>;

export const MIN_WALLET_AMOUNT = 100;
export const MAX_WALLET_AMOUNT = 5000;
const PAGE_SIZE = 15;

export const useWallet = () => {
  const navigation = useNavigation<RootNavigation>();
  const { isAuthenticated, user, updateUser } = useAuth();
  const uid = String(user?.id ?? (user as any)?.user_id ?? '');

  const hasFocusedOnceRef = useRef(false);

  const {
    data: transactions,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetWalletTransactionsQuery(uid, {
    skip: !isAuthenticated || !uid,
    refetchOnMountOrArgChange: 30,
  });

  const { data: gateway } = useGetActivePaymentGatewayQuery();
  const [createRzOrder] = useCreateRzOrderMutation();
  const [addWalletMoney] = useAddWalletMoneyMutation();
  const {
    data: profileResponse,
    refetch: refetchProfile,
  } = useGetUserProfileQuery(uid, {
    skip: !uid,
    refetchOnMountOrArgChange: 30,
  });

  useFocusEffect(
    useCallback(() => {
      if (!hasFocusedOnceRef.current) {
        hasFocusedOnceRef.current = true;
        return;
      }
      if (isAuthenticated && uid) {
        refetch();
        refetchProfile();
      }
    }, [isAuthenticated, uid, refetch, refetchProfile])
  );

  const [showAddMoney, setShowAddMoney] = useState(false);
  const [amount, setAmount] = useState('');
  const [amountError, setAmountError] = useState<string | undefined>();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodOption>('UPI / GPay / PhonePe');
  const [processing, setProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [displayedLimit, setDisplayedLimit] = useState(PAGE_SIZE);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  const [showRazorpayWebModal, setShowRazorpayWebModal] = useState(false);
  const [pendingPaymentInfo, setPendingPaymentInfo] = useState<{
    numericAmount: number;
    description: string;
    methodParam: string;
    orderId?: string;
  } | null>(null);

  const freshProfileData = useMemo(() => {
    return (profileResponse as any)?.data ?? profileResponse ?? null;
  }, [profileResponse]);

  const txnList: TxnModel[] = useMemo(() => {
    let rawList: any[] = [];
    if (Array.isArray(transactions)) {
      rawList = transactions;
    } else if (Array.isArray((transactions as any)?.data)) {
      rawList = (transactions as any).data;
    } else if (Array.isArray((transactions as any)?.transactions)) {
      rawList = (transactions as any).transactions;
    } else if (Array.isArray((transactions as any)?.response)) {
      rawList = (transactions as any).response;
    }

    // Only include transactions that are genuinely related to the in-app wallet:
    // 1) Explicitly marked is_wallet_txn === 1 (or '1' or true)
    // 2) Paid using payment_method === 'Wallet'
    // 3) Wallet top-ups (credited) where is_wallet_txn is not 0
    const walletOnlyList = rawList.filter((item: any) => {
      const isExplicitWallet =
        item.is_wallet_txn === 1 ||
        item.is_wallet_txn === '1' ||
        item.is_wallet_txn === true;

      const isPaymentMethodWallet =
        (item.payment_method || '').toLowerCase() === 'wallet';

      const type = (item.transaction_type || item.type || '').toLowerCase();
      const isCredit = type.includes('credit') || type === 'credited';

      // If it's a debit/spend, it MUST be paid via wallet
      if (!isCredit) {
        return isExplicitWallet || isPaymentMethodWallet;
      }

      // If it's a credit, it's a wallet top-up unless explicitly marked not a wallet txn
      const isExplicitNonWallet =
        item.is_wallet_txn === 0 ||
        item.is_wallet_txn === '0' ||
        item.is_wallet_txn === false;

      return isExplicitWallet || !isExplicitNonWallet;
    });

    return [...walletOnlyList].sort((a, b) => {
      const timeA = new Date(a.created_at || a.date || 0).getTime();
      const timeB = new Date(b.created_at || b.date || 0).getTime();
      return timeB - timeA;
    });
  }, [transactions]);

  const filteredTxnList = useMemo(() => {
    if (!searchQuery.trim()) return txnList;
    const q = searchQuery.trim().toLowerCase();
    return txnList.filter((item) => {
      const type = (item.transaction_type || item.type || '').toLowerCase();
      const notes = (item.notes || item.description || '').toLowerCase();
      const method = (item.payment_method || '').toLowerCase();
      const amountStr = String(item.amount || '');
      const dateStr = String(item.created_at || (item as any).date || '').toLowerCase();
      return (
        type.includes(q) ||
        notes.includes(q) ||
        method.includes(q) ||
        amountStr.includes(q) ||
        dateStr.includes(q)
      );
    });
  }, [txnList, searchQuery]);

  const paginatedTxnList = useMemo(() => {
    return filteredTxnList.slice(0, displayedLimit);
  }, [filteredTxnList, displayedLimit]);

  const totalCredited = useMemo(() => {
    return txnList.reduce((acc, txn) => {
      const rawType = (txn.transaction_type || txn.type || '').toLowerCase();
      if (
        rawType.includes('credit') ||
        rawType.includes('add') ||
        rawType.includes('topup') ||
        rawType === 'credited'
      ) {
        return acc + (Number(txn.amount) || 0);
      }
      return acc;
    }, 0);
  }, [txnList]);

  const totalSpent = useMemo(() => {
    return txnList.reduce((acc, txn) => {
      const rawType = (txn.transaction_type || txn.type || '').toLowerCase();
      if (
        rawType.includes('debit') ||
        rawType.includes('spend') ||
        rawType.includes('paid') ||
        rawType === 'debited'
      ) {
        return acc + (Number(txn.amount) || 0);
      }
      return acc;
    }, 0);
  }, [txnList]);

  const walletBalance = useMemo(() => {
    const rawVal =
      freshProfileData?.wallet_amount ??
      freshProfileData?.wallet_balance ??
      freshProfileData?.wallet ??
      user?.wallet_amount ??
      (user as any)?.wallet_balance;

    const profileBalance =
      rawVal !== undefined && rawVal !== null && rawVal !== ''
        ? Number(rawVal)
        : NaN;

    const calculatedBalance = Math.max(0, totalCredited - totalSpent);

    if (!isNaN(profileBalance) && profileBalance > 0) {
      return profileBalance;
    }

    if (calculatedBalance > 0) {
      return calculatedBalance;
    }

    return !isNaN(profileBalance) ? profileBalance : 0;
  }, [freshProfileData, user, totalCredited, totalSpent]);

  const handleLoadMore = useCallback(() => {
    if (isFetching || displayedLimit >= filteredTxnList.length) return;
    setDisplayedLimit((prev) => Math.min(prev + PAGE_SIZE, filteredTxnList.length));
  }, [isFetching, displayedLimit, filteredTxnList.length]);

  const handleRefresh = useCallback(async () => {
    setIsManualRefreshing(true);
    setDisplayedLimit(PAGE_SIZE);
    try {
      await Promise.all([refetch(), refetchProfile()]);
    } finally {
      setIsManualRefreshing(false);
    }
  }, [refetch, refetchProfile]);

  const handleProcess = useCallback(async () => {
    const numeric = Number(amount);
    if (!amount || isNaN(numeric) || numeric < MIN_WALLET_AMOUNT || numeric > MAX_WALLET_AMOUNT) {
      setAmountError(
        `Enter amount between ${AppConstants.appCurrency}${MIN_WALLET_AMOUNT} and ${AppConstants.appCurrency}${MAX_WALLET_AMOUNT.toLocaleString('en-IN')}`
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
        orderId =
          orderRes.id ||
          orderRes.order_id ||
          (orderRes as any)?.data?.id ||
          (orderRes as any)?.data?.order_id;
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
  }, [amount, selectedMethod, createRzOrder, uid]);

  const handleRazorpaySuccess = useCallback(async (paymentTxnId: string) => {
    setShowRazorpayWebModal(false);
    if (!pendingPaymentInfo) return;

    const creditAmount = pendingPaymentInfo.numericAmount;
    setProcessing(true);
    try {
      const addMoneyPayload = {
        user_id: uid,
        amount: String(creditAmount),
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

      const nextBalance = walletBalance + creditAmount;
      await updateUser({
        ...(user || {}),
        wallet_amount: nextBalance,
        wallet_balance: nextBalance,
      });

      setProcessing(false);
      setPendingPaymentInfo(null);
      setAmount('');
      setAmountError(undefined);

      Promise.all([refetchProfile(), refetch()]).catch((e) =>
        console.warn('Background wallet sync error:', e)
      );
    } catch (e: any) {
      showToast(e?.data?.message || e?.message || 'Failed to credit money to wallet.');
      setProcessing(false);
      setPendingPaymentInfo(null);
      setAmount('');
    }
  }, [pendingPaymentInfo, uid, addWalletMoney, walletBalance, updateUser, user, refetchProfile, refetch]);

  return {
    navigation,
    isAuthenticated,
    user,
    gateway,
    isLoading,
    isFetching,
    isError,
    refetch,
    showAddMoney,
    setShowAddMoney,
    amount,
    setAmount,
    amountError,
    setAmountError,
    selectedMethod,
    setSelectedMethod,
    processing,
    searchQuery,
    setSearchQuery,
    isManualRefreshing,
    showRazorpayWebModal,
    setShowRazorpayWebModal,
    pendingPaymentInfo,
    txnList,
    filteredTxnList,
    paginatedTxnList,
    displayedLimit,
    totalCredited,
    totalSpent,
    walletBalance,
    handleLoadMore,
    handleRefresh,
    handleProcess,
    handleRazorpaySuccess,
  };
};
