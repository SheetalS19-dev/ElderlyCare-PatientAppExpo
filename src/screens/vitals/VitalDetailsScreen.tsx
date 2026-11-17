import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import {
  FlatList,
  Keyboard,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AppDatePickerModal,
  AppHeader,
  EmptyState,
  ErrorState,
  LoadingIndicator,
} from '../../components';
import { Colors } from '../../constants';
import type { VitalModel } from '../../types';
import {
  DateTimeUtils,
  fs,
  getVitalStatus,
  hs,
  renderVitalValue,
  TYPOGRAPHY,
  ws,
} from '../../utils';
import {
  AddEditVitalModal,
  VitalDateFilterModal,
  VitalHistoryItemCard,
  VitalLatestSummaryCard,
  VitalMemberSelector,
  VitalTrendChart,
} from './components';
import { useVitalDetails } from './useVitalDetails';

export const VitalDetailsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const {
    navigation,
    vitalName,
    deduplicatedFamilyList,
    selectedFamilyId,
    setSelectedFamilyId,
    showMemberDropdown,
    setShowMemberDropdown,
    selectedMemberDisplayName,
    activeFilter,
    setActiveFilter,
    customFilterDate,
    setCustomFilterDate,
    showFilterPickerModal,
    setShowFilterPickerModal,
    showCalendarFilterModal,
    setShowCalendarFilterModal,
    isLoading,
    isError,
    refetch,
    historyVitals,
    latestVital,
    iconInfo,
    latestStatus,
    heroWeightTrend,
    chartPoints,
    yTicks,
    chartW,
    chartH,
    openAddModal,
    showModal,
    setShowModal,
    isAdding,
    selectedDate,
    setSelectedDate,
    selectedTime,
    setSelectedTime,
    showDatePicker,
    setShowDatePicker,
    showTimePicker,
    setShowTimePicker,
    systolic,
    setSystolic,
    diastolic,
    setDiastolic,
    value,
    setValue,
    sugarRandom,
    setSugarRandom,
    fieldErrors,
    handleModalSubmit,
    handleDelete,
  } = useVitalDetails();

  return (
    <View style={styles.container}>
      <AppHeader title={`${vitalName} Tracker`} onBackPress={() => navigation.goBack()} />

      <VitalMemberSelector
        familyList={deduplicatedFamilyList}
        activeFamilyId={selectedFamilyId}
        selectedMemberDisplayName={selectedMemberDisplayName}
        showMemberDropdown={showMemberDropdown}
        onToggleDropdown={() => setShowMemberDropdown((prev) => !prev)}
        onSelectMember={(id) => {
          setSelectedFamilyId(id);
          setShowMemberDropdown(false);
        }}
        getMemberDisplayName={() => selectedMemberDisplayName}
      />

      {/* Date Filter Bar */}
      <View style={styles.dateFilterRow}>
        <TouchableOpacity
          style={styles.filterDropdownBtn}
          onPress={() => setShowFilterPickerModal(true)}
          activeOpacity={0.8}
        >
          <MaterialIcons name="calendar-today" size={ws(15)} color={Colors.primaryColor} />
          <Text style={styles.filterDropdownBtnText}>
            {activeFilter === 'Custom' && customFilterDate
              ? DateTimeUtils.getDataFormat(customFilterDate)
              : activeFilter === '7 Days'
                ? 'Last 7 Days'
                : activeFilter === '30 Days'
                  ? 'Last 30 Days'
                  : activeFilter === 'Today'
                    ? 'Today'
                    : 'All Records'}
          </Text>
          <MaterialIcons name="keyboard-arrow-down" size={ws(18)} color={Colors.primaryColor} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.filterCalendarBtn}
          onPress={() => setShowCalendarFilterModal(true)}
          activeOpacity={0.8}
        >
          <MaterialIcons name="event" size={ws(16)} color={Colors.secondaryFontColor} />
          <Text style={styles.filterCalendarBtnText}>View Calendar</Text>
        </TouchableOpacity>

        {(activeFilter !== 'All' || !!customFilterDate) && (
          <TouchableOpacity
            style={styles.filterResetQuickBtn}
            onPress={() => {
              setActiveFilter('All');
              setCustomFilterDate('');
            }}
            activeOpacity={0.8}
          >
            <MaterialIcons name="restart-alt" size={ws(14)} color={Colors.primaryColor} />
            <Text style={styles.filterResetQuickText}>Reset</Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <LoadingIndicator />
      ) : isError ? (
        <ErrorState message="Couldn't load vital history" onRetry={refetch} />
      ) : (
        <FlatList
          data={historyVitals}
          keyExtractor={(item, index) => `v-${item.id ?? index}`}
          contentContainerStyle={[
            styles.listContent,
            { flexGrow: 1, paddingBottom: hs(140) + Math.max(insets.bottom, hs(24)) },
          ]}
          ListHeaderComponent={
            <View>
              {latestVital && (
                <VitalLatestSummaryCard
                  latestVital={latestVital}
                  vitalName={vitalName}
                  iconInfo={iconInfo}
                  latestStatus={latestStatus}
                  heroWeightTrend={heroWeightTrend}
                  onDelete={handleDelete}
                  renderVitalValue={(it) => renderVitalValue(vitalName, it)}
                />
              )}

              {vitalName === 'Weight' && (
                <VitalTrendChart
                  records={historyVitals}
                  chartPoints={chartPoints}
                  yTicks={yTicks}
                  chartW={chartW}
                  chartH={chartH}
                />
              )}

              {historyVitals.length > 0 && (
                <View style={styles.historySectionHeaderRow}>
                  <Text style={styles.historySectionTitle}>
                    {vitalName === 'Temperature'
                      ? 'Temperature History'
                      : vitalName === 'Weight'
                        ? `Recent Entries (${historyVitals.length} Entries)`
                        : `${vitalName} History`}
                  </Text>
                </View>
              )}
            </View>
          }
          ListEmptyComponent={
            latestVital ? null : (
              <EmptyState message={`No ${vitalName} records found.`} />
            )
          }
          renderItem={({ item }) => {
            const itemStatus = getVitalStatus(vitalName, item);
            let prevEntry: VitalModel | undefined;
            if (vitalName === 'Weight') {
              const itemTime = new Date(item.date || item.created_at || 0).getTime();
              prevEntry = historyVitals.find((v) => {
                const t = new Date(v.date || v.created_at || 0).getTime();
                return t < itemTime && (v.weight || (v as any)?.value);
              });
            }

            return (
              <VitalHistoryItemCard
                item={item}
                vitalName={vitalName}
                iconInfo={iconInfo}
                itemStatus={itemStatus}
                prevEntry={prevEntry}
                onDelete={handleDelete}
                renderVitalValue={(it) => renderVitalValue(vitalName, it)}
              />
            );
          }}
        />
      )}

      {/* FAB Add Reading Button */}
      <TouchableOpacity
        style={[styles.fab, { bottom: hs(24) + Math.max(insets.bottom, hs(16)) }]}
        activeOpacity={0.85}
        onPress={openAddModal}
      >
        <MaterialIcons name="add" size={ws(28)} color={Colors.white} />
      </TouchableOpacity>

      {/* Add Vital Modal */}
      <AddEditVitalModal
        visible={showModal}
        vitalName={vitalName}
        selectedMemberDisplayName={selectedMemberDisplayName}
        selectedDate={selectedDate}
        onDateChange={(t) => {
          setSelectedDate(t);
        }}
        onOpenDatePicker={() => {
          Keyboard.dismiss();
          setShowDatePicker(true);
        }}
        selectedTime={selectedTime}
        onTimeChange={(t) => {
          setSelectedTime(t);
        }}
        onOpenTimePicker={() => {
          Keyboard.dismiss();
          setShowTimePicker(true);
        }}
        systolic={systolic}
        onChangeSystolic={(t) => {
          setSystolic(t);
        }}
        diastolic={diastolic}
        onChangeDiastolic={(t) => {
          setDiastolic(t);
        }}
        value={value}
        onChangeValue={(t) => {
          setValue(t);
        }}
        sugarRandom={sugarRandom}
        onChangeSugarRandom={(t) => {
          setSugarRandom(t);
        }}
        fieldErrors={fieldErrors}
        onSubmit={handleModalSubmit}
        onClose={() => setShowModal(false)}
        isSubmitting={isAdding}
        showDatePicker={showDatePicker}
        onCloseDatePicker={() => setShowDatePicker(false)}
        onSelectDate={(d) => {
          setSelectedDate(d);
        }}
        showTimePicker={showTimePicker}
        onCloseTimePicker={() => setShowTimePicker(false)}
        onSelectTime={(t) => {
          setSelectedTime(t);
        }}
      />

      {/* Date Filter Menu Modal */}
      <VitalDateFilterModal
        visible={showFilterPickerModal}
        activeFilter={activeFilter}
        onSelectFilter={(f) => {
          setActiveFilter(f);
          setCustomFilterDate('');
        }}
        onClose={() => setShowFilterPickerModal(false)}
      />

      {/* Calendar Filter Modal */}
      <AppDatePickerModal
        visible={showCalendarFilterModal}
        onClose={() => setShowCalendarFilterModal(false)}
        initialDate={customFilterDate || new Date().toISOString().split('T')[0]}
        maxDate={new Date()}
        onSelectDate={(dateStr) => {
          setCustomFilterDate(dateStr);
          setActiveFilter('Custom');
          setShowCalendarFilterModal(false);
        }}
        title="Filter Records by Date"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.containerBgColor,
  },
  dateFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ws(16),
    paddingVertical: hs(8),
    gap: ws(8),
  },
  filterDropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: ws(10),
    paddingVertical: hs(6),
    borderRadius: ws(8),
    borderWidth: 1,
    borderColor: Colors.border,
    gap: ws(6),
  },
  filterDropdownBtnText: {
    ...TYPOGRAPHY.semiBold,
    fontSize: fs(12),
    color: Colors.primaryFontColor,
  },
  filterCalendarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: ws(10),
    paddingVertical: hs(6),
    borderRadius: ws(8),
    borderWidth: 1,
    borderColor: Colors.border,
    gap: ws(6),
  },
  filterCalendarBtnText: {
    ...TYPOGRAPHY.medium,
    fontSize: fs(12),
    color: Colors.secondaryFontColor,
  },
  filterResetQuickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.aquaSoft,
    paddingHorizontal: ws(8),
    paddingVertical: hs(6),
    borderRadius: ws(8),
    gap: ws(4),
  },
  filterResetQuickText: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(11),
    color: Colors.primaryColor,
  },
  listContent: {
    flexGrow: 1,
    padding: ws(16),
  },
  historySectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hs(8),
    marginTop: hs(4),
  },
  historySectionTitle: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(13),
    color: Colors.primaryFontColor,
  },
  fab: {
    position: 'absolute',
    right: ws(20),
    bottom: hs(24),
    width: ws(56),
    height: ws(56),
    borderRadius: ws(28),
    backgroundColor: Colors.primaryColor,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: Colors.primaryColor,
    shadowOffset: { width: 0, height: hs(4) },
    shadowOpacity: 0.3,
    shadowRadius: fs(6),
  },
});
