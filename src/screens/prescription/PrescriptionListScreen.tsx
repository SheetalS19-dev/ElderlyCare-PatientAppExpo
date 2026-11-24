import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useCallback } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  AppCard,
  AppHeader,
  DocumentActionModal,
  EmptyState,
  ErrorState,
  LoadingIndicator,
  SearchBox,
} from '../../components';
import { Colors, Typography } from '../../constants';
import { formatDoctorName, fs, hs, TYPOGRAPHY, ws } from '../../utils';
import { formatRxDateTime, usePrescriptionList } from './usePrescriptionList';

export const PrescriptionListScreen: React.FC = () => {
  const {
    navigation,
    insets,
    search,
    setSearch,
    downloadingId,
    prescriptions,
    isLoading,
    isError,
    refetch,
    selectedPrescriptionItem,
    isActionModalVisible,
    setIsActionModalVisible,
    isProcessing,
    processingMsg,
    handleOpenActionModal,
    handleView,
    handleDownload,
    handleShare,
  } = usePrescriptionList();

  const keyExtractor = useCallback((item: any, index: number) => `rx-${item.id ?? index}`, []);

  const renderPrescriptionItem = useCallback(
    ({ item }: { item: any }) => {
      const displayId = item.id ? `#${item.id}` : (item as any).prescription_id ? `#${(item as any).prescription_id}` : '';
      const doctName =
        formatDoctorName(item.doctor_f_name, item.doctor_l_name) ||
        (item as any).doctor_name ||
        '';

      const formattedDateTime = formatRxDateTime(item.created_at || (item as any).date);

      return (
        <AppCard style={styles.card}>
          <TouchableOpacity
            style={styles.cardTouchable}
            activeOpacity={0.85}
            onPress={() => handleOpenActionModal(item)}
          >
            {/* Prescription Info */}
            <View style={styles.info}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                Prescription {displayId}
              </Text>
              <Text style={styles.cardMetaText} numberOfLines={1}>
                Doctor: {doctName}
              </Text>
              <Text style={styles.cardMetaText} numberOfLines={1}>
                Date: {formattedDateTime}
              </Text>
            </View>

            {/* Quick Actions */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.actionBtnBlue}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                onPress={() => handleView(item)}
                activeOpacity={0.8}
              >
                <MaterialIcons name="visibility" size={18} color={Colors.primaryColor} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionBtnOrange}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                onPress={() => handleDownload(item)}
                activeOpacity={0.8}
                disabled={downloadingId === item.id}
              >
                {downloadingId === item.id ? (
                  <ActivityIndicator size="small" color={Colors.primaryColor} />
                ) : (
                  <MaterialIcons name="file-download" size={18} color={Colors.primaryColor} />
                )}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </AppCard>
      );
    },
    [handleOpenActionModal, handleView, handleDownload, downloadingId]
  );

  return (
    <View style={styles.container}>
      <AppHeader title="Digital Prescriptions" onBackPress={() => navigation.goBack()} />

      {/* Search Input Bar */}
      <View style={styles.searchWrapper}>
        <SearchBox
          value={search}
          onChangeText={setSearch}
          placeholder="Search doctor, clinic or ID..."
        />
      </View>

      {isLoading ? (
        <LoadingIndicator />
      ) : isError ? (
        <ErrorState message="Couldn't load prescriptions" onRetry={refetch} />
      ) : (
        <FlatList
          data={prescriptions}
          keyExtractor={keyExtractor}
          contentContainerStyle={[
            styles.listContent,
            { flexGrow: 1, paddingBottom: Math.max(insets.bottom + 20, 40) },
          ]}
          ListEmptyComponent={
            <EmptyState
              message={search.trim() ? 'No matching prescriptions' : 'No prescriptions found'}
              subtitle={search.trim() ? 'Try searching with a different keyword or doctor name' : 'Doctor issued prescriptions will appear here'}
            />
          }
          renderItem={renderPrescriptionItem}
        />
      )}

      {/* Document Action Modal */}
      <DocumentActionModal
        visible={isActionModalVisible}
        onClose={() => setIsActionModalVisible(false)}
        title={`Prescription #${selectedPrescriptionItem?.id ?? ''}`}
        subtitle={`Prescribed by ${formatDoctorName(selectedPrescriptionItem?.doctor_f_name, selectedPrescriptionItem?.doctor_l_name)}`}
        onView={() => handleView(selectedPrescriptionItem)}
        onDownload={() => handleDownload(selectedPrescriptionItem)}
        onShare={() => handleShare(selectedPrescriptionItem)}
        isLoading={isProcessing}
        loadingMessage={processingMsg}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgColor,
  },
  listContent: {
    padding: ws(16),
  },
  summaryCard: {
    padding: ws(16),
    borderRadius: fs(16),
    marginBottom: hs(16),
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borderColor,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rxIconCircle: {
    width: ws(48),
    height: ws(48),
    aspectRatio: 1,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: Colors.lightBlueTint,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ws(14),
    borderWidth: 1,
    borderColor: Colors.lightBlueBorder,
  },
  summaryInfo: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: fs(Typography.fontSize.base),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
  },
  summarySubtitle: {
    marginTop: hs(2),
    fontSize: fs(Typography.fontSize.xs),
    ...TYPOGRAPHY.medium,
    color: Colors.secondaryFontColor,
  },
  card: {
    marginBottom: hs(12),
    padding: ws(14),
    borderRadius: fs(16),
  },
  cardTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: ws(46),
    height: ws(46),
    aspectRatio: 1,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: Colors.lightBlueTint,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ws(14),
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: fs(14),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
    marginBottom: hs(3),
  },
  cardMetaText: {
    fontSize: fs(12),
    ...TYPOGRAPHY.regular,
    color: Colors.secondaryFontColor,
    marginBottom: hs(2),
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(8),
    marginLeft: ws(8),
  },
  actionBtnBlue: {
    width: ws(36),
    height: ws(36),
    aspectRatio: 1,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: Colors.aquaSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnOrange: {
    width: ws(36),
    height: ws(36),
    aspectRatio: 1,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: Colors.aquaSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchWrapper: {
    paddingHorizontal: ws(16),
    paddingTop: hs(12),
    paddingBottom: hs(4),
  },
});
