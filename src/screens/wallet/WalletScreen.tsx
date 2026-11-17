import React from 'react';
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
              {/* Current Balance Card & Summary Stats */}
              <WalletBalanceCard
                walletBalance={walletBalance}
                totalCredited={totalCredited}
                totalSpent={totalSpent}
                onAddMoneyPress={() => {
                  setAmount('');
                  setAmountError(undefined);
                  setShowAddMoney(true);
                }}
              />

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
          ListFooterComponent={
            displayedLimit < filteredTxnList.length ? (
              <View style={styles.footerLoaderContainer}>
                <ActivityIndicator size="small" color={Colors.primaryColor} />
                <Text style={styles.footerLoaderText}>
                  Showing {paginatedTxnList.length} of {filteredTxnList.length} — Scroll for more
                </Text>
              </View>
            ) : (
              <View style={{ height: hs(24) }} />
            )
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
          renderItem={({ item }: { item: TxnModel }) => <WalletTxnRow txn={item} />}
        />
      )}

      {/* Add Money Bottom Sheet Modal */}
      <AddMoneyModal
        visible={showAddMoney}
        onClose={() => setShowAddMoney(false)}
        walletBalance={walletBalance}
        selectedMethod={selectedMethod}
        onSelectMethod={setSelectedMethod}
        amount={amount}
        onAmountChange={(v) => {
          setAmount(v.replace(/[^0-9.]/g, ''));
          if (amountError) setAmountError(undefined);
        }}
        amountError={amountError}
        processing={processing}
        onProcess={handleProcess}
      />

      {/* Razorpay Web Checkout Modal */}
      {gateway && (
        <RazorpayWebModal
          visible={showRazorpayWebModal}
          onClose={() => {
            setShowRazorpayWebModal(false);
          }}
          onSuccess={handleRazorpaySuccess}
          onFailure={(err) => {
            setShowRazorpayWebModal(false);
            showToast(err || 'Payment failed');
          }}
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
  scrollContent: {
    paddingHorizontal: ws(16),
    paddingTop: hs(14),
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
