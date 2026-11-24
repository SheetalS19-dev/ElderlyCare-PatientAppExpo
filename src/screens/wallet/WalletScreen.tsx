import React, { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AppHeader,
  EmptyState,
  ErrorState,
  LoadingIndicator,
  RazorpayWebModal,
  SearchBox,
} from '../../components';
import { Colors } from '../../constants';
import type { TxnModel } from '../../types';
import { fs, hs, showToast, TYPOGRAPHY, ws } from '../../utils';
import {
  AddMoneyModal,
  WalletBalanceCard,
  WalletTxnRow,
} from './components';
import { useWallet } from './useWallet';

export const WalletScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const {
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
  } = useWallet();

  const handleBackPress = useCallback(
    () => (navigation.canGoBack() ? navigation.goBack() : undefined),
    [navigation]
  );

  const handleOpenAddMoney = useCallback(() => {
    setAmount('');
    setAmountError(undefined);
    setShowAddMoney(true);
  }, [setAmount, setAmountError, setShowAddMoney]);

  const handleCloseAddMoney = useCallback(() => {
    setShowAddMoney(false);
  }, [setShowAddMoney]);

  const handleAmountChange = useCallback((v: string) => {
    setAmount(v.replace(/[^0-9.]/g, ''));
    if (amountError) setAmountError(undefined);
  }, [setAmount, amountError, setAmountError]);

  const handleCloseRazorpay = useCallback(() => {
    setShowRazorpayWebModal(false);
  }, [setShowRazorpayWebModal]);

  const handleRazorpayFailure = useCallback((err: string) => {
    setShowRazorpayWebModal(false);
    showToast(err || 'Payment failed');
  }, [setShowRazorpayWebModal]);

  const keyExtractor = useCallback((item: TxnModel, index: number) => `txn-${item.id ?? index}`, []);

  const renderItem = useCallback(({ item }: { item: TxnModel }) => <WalletTxnRow txn={item} />, []);

  const listFooter = useMemo(() => {
    if (displayedLimit < filteredTxnList.length) {
      return (
        <View style={styles.footerLoaderContainer}>
          <ActivityIndicator size="small" color={Colors.primaryColor} />
          <Text style={styles.footerLoaderText}>
            Showing {paginatedTxnList.length} of {filteredTxnList.length} — Scroll for more
          </Text>
        </View>
      );
    }
    return <View style={{ height: hs(24) }} />;
  }, [displayedLimit, filteredTxnList.length, paginatedTxnList.length]);

  const listEmpty = useMemo(() => {
    if (isLoading) {
      return <LoadingIndicator />;
    }
    if (isError) {
      return <ErrorState message="Could not load transaction history" onRetry={refetch} />;
    }
    if (searchQuery.trim().length > 0) {
      return <EmptyState message={`No transactions found matching "${searchQuery}"`} />;
    }
    return <EmptyState message="No transactions recorded in your wallet yet." />;
  }, [isLoading, isError, refetch, searchQuery]);

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <AppHeader title="Wallet" onBackPress={handleBackPress} />
        <EmptyState message="Log in to view your wallet and transaction history" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader title="My Wallet" onBackPress={handleBackPress} />

      <View style={styles.fixedCardWrapper}>
        <WalletBalanceCard
          walletBalance={walletBalance}
          totalCredited={totalCredited}
          totalSpent={totalSpent}
          onAddMoneyPress={handleOpenAddMoney}
        />
      </View>

      {processing ? (
        <LoadingIndicator />
      ) : (
        <FlatList
          data={paginatedTxnList}
          keyExtractor={keyExtractor}
          refreshing={isManualRefreshing}
          onRefresh={handleRefresh}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.35}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom + hs(32), hs(48)) },
          ]}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <>
              {/* Transaction Search Bar */}
              <SearchBox
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search transactions..."
                containerStyle={styles.searchBarWrapper}
              />

              {/* Transactions Section Title */}
              <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionTitle}>
                  {isLoading && txnList.length === 0
                    ? 'Transaction History'
                    : `Transaction History (${paginatedTxnList.length} of ${filteredTxnList.length})`}
                </Text>
                {isFetching && !isLoading && !isManualRefreshing && (
                  <View style={styles.syncPill}>
                    <ActivityIndicator size="small" color={Colors.primaryColor} />
                    <Text style={styles.syncText}>Updating...</Text>
                  </View>
                )}
              </View>
            </>
          }
          ListFooterComponent={listFooter}
          ListEmptyComponent={listEmpty}
          renderItem={renderItem}
        />
      )}

      {/* Add Money Bottom Sheet Modal */}
      <AddMoneyModal
        visible={showAddMoney}
        onClose={handleCloseAddMoney}
        walletBalance={walletBalance}
        selectedMethod={selectedMethod}
        onSelectMethod={setSelectedMethod}
        amount={amount}
        onAmountChange={handleAmountChange}
        amountError={amountError}
        processing={processing}
        onProcess={handleProcess}
      />

      {/* Razorpay Web Checkout Modal */}
      {gateway && (
        <RazorpayWebModal
          visible={showRazorpayWebModal}
          onClose={handleCloseRazorpay}
          onSuccess={handleRazorpaySuccess}
          onFailure={handleRazorpayFailure}
          keyId={gateway.api_key || gateway.key || ''}
          orderId={pendingPaymentInfo?.orderId}
          amount={pendingPaymentInfo ? pendingPaymentInfo.numericAmount : 0}
          name="Elderly Care"
          description={pendingPaymentInfo?.description || 'Wallet Recharge'}
          prefillName={`${user?.f_name ?? ''} ${user?.l_name ?? ''}`.trim() || 'Patient'}
          prefillPhone={user?.phone || ''}
          prefillEmail={user?.email || ''}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.containerBgColor,
  },
  fixedCardWrapper: {
    paddingHorizontal: ws(16),
    paddingTop: hs(14),
  },
  scrollContent: {
    paddingHorizontal: ws(16),
    paddingTop: hs(6),
    flexGrow: 1,
  },
  searchBarWrapper: {
    marginTop: hs(6),
    marginBottom: hs(14),
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hs(12),
  },
  sectionTitle: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(14),
    color: Colors.primaryFontColor,
  },
  syncPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(6),
    backgroundColor: Colors.aquaSoft,
    paddingHorizontal: ws(8),
    paddingVertical: hs(4),
    borderRadius: ws(12),
  },
  syncText: {
    ...TYPOGRAPHY.medium,
    fontSize: fs(11),
    color: Colors.primaryColor,
  },
  footerLoaderContainer: {
    paddingVertical: hs(16),
    alignItems: 'center',
    gap: hs(6),
  },
  footerLoaderText: {
    ...TYPOGRAPHY.regular,
    fontSize: fs(12),
    color: Colors.secondaryFontColor,
  },
});