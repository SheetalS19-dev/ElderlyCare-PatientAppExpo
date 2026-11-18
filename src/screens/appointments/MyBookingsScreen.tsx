import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AppHeader,
  AppointmentCard,
  EmptyState,
  ErrorState,
  LoadingIndicator,
  SearchBox,
} from '../../components';
import { Colors } from '../../constants';
import type { AppointmentModel } from '../../types';
import { fs, hs, TYPOGRAPHY, ws } from '../../utils';
import { useMyBookings } from './useMyBookings';

export const MyBookingsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const {
    navigation,
    isAuthenticated,
    tab,
    subFilter,
    setSubFilter,
    searchQuery,
    subFilterOptions,
    paginatedList,
    upcomingAppointments,
    closedAppointments,
    isLoading,
    isFetching,
    isError,
    refetch,
    loadingMore,
    setDisplayedLimit,
    handleLoadMore,
    handleTabChange,
    handleSearchChange,
  } = useMyBookings();

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <AppHeader title="My Appointments" onBackPress={navigation.canGoBack() ? () => navigation.goBack() : undefined} />
        <EmptyState message="Log in to view and manage your doctor consultations" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader
        title="My Appointments"
        onBackPress={navigation.canGoBack() ? () => navigation.goBack() : undefined}
      />

      {/* Segmented Control Bar */}
      <View style={styles.segmentedContainer}>
        <View style={styles.segmentedControl}>
          <TouchableOpacity
            style={[styles.segmentBtn, tab === 'upcoming' && styles.segmentBtnActive]}
            activeOpacity={0.8}
            onPress={() => handleTabChange('upcoming')}
          >
            <MaterialIcons
              name="event-available"
              size={18}
              color={tab === 'upcoming' ? Colors.white : Colors.secondaryFontColor}
            />
            <Text style={[styles.segmentText, tab === 'upcoming' && styles.segmentTextActive]}>
              Upcoming ({upcomingAppointments.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, tab === 'closed' && styles.segmentBtnActive]}
            activeOpacity={0.8}
            onPress={() => handleTabChange('closed')}
          >
            <MaterialIcons
              name="history"
              size={18}
              color={tab === 'closed' ? Colors.white : Colors.secondaryFontColor}
            />
            <Text style={[styles.segmentText, tab === 'closed' && styles.segmentTextActive]}>
              Past & Closed ({closedAppointments.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Input Bar */}
      <View style={styles.searchWrapper}>
        <SearchBox
          value={searchQuery}
          onChangeText={handleSearchChange}
          placeholder="Search patient, doctor, or department"
          containerStyle={styles.searchBarOverride}
        />
      </View>

      {/* Sub-status Filter Chips */}
      <View style={styles.subFilterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.subFilterScroll}
        >
          {subFilterOptions.map((opt) => {
            const isSel = subFilter === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                style={[styles.subFilterChip, isSel && styles.subFilterChipActive]}
                onPress={() => {
                  setSubFilter(opt.key);
                  setDisplayedLimit(15);
                }}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.subFilterText,
                    isSel && styles.subFilterTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {isLoading ? (
        <LoadingIndicator />
      ) : isError ? (
        <ErrorState message="Couldn't load your appointments" onRetry={refetch} />
      ) : (
        <FlatList
          data={paginatedList}
          keyExtractor={(item: AppointmentModel, index: number) => `appt-${item.id ?? index}`}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: hs(60) + insets.bottom },
          ]}
          refreshing={isFetching}
          onRefresh={async () => {
            setDisplayedLimit(15);
            await refetch();
          }}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoaderContainer}>
                <ActivityIndicator size="small" color={Colors.primaryColor} />
                <Text style={styles.footerLoaderText}>Loading more appointments...</Text>
              </View>
            ) : (
              <View style={{ height: hs(24) }} />
            )
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <EmptyState
                message={
                  searchQuery.trim().length > 0
                    ? `No appointments found matching "${searchQuery}"`
                    : tab === 'upcoming'
                      ? 'You have no upcoming consultations scheduled.'
                      : 'No past appointment history found.'
                }
              />
            </View>
          }
          renderItem={({ item }: { item: AppointmentModel }) => {
            const docId =
              item.doct_id ||
              (item as any)?.doctor_id ||
              (item as any)?.doctorId;
            const isUpcoming = ['pending', 'confirmed', 'rescheduled', 'scheduled', 'booked', 'active', 'approved', 'paid', 'in-process'].includes(
              (item.status || '').trim().toLowerCase()
            );

            return (
              <AppointmentCard
                appointment={item}
                onPress={() => navigation.navigate('AppointmentDetails', { appId: String(item.id) })}
                onRebook={() => {
                  if (docId) {
                    const mode = item.type === 'Video Consultant' ? 'video' : item.type === 'Emergency' ? 'emergency' : 'clinic';
                    navigation.navigate('BookAppointment', {
                      doctId: String(docId),
                      clinicId: item.clinic_id,
                      initialMode: mode,
                      initialMemberId: item.patient_id,
                      isReschedule: isUpcoming,
                      rescheduledFromAppId: isUpcoming ? item.id : undefined,
                    });
                  } else {
                    navigation.navigate('Search');
                  }
                }}
              />
            );
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgColor,
  },
  segmentedContainer: {
    paddingHorizontal: ws(16),
    paddingVertical: hs(12),
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: Colors.slate_F1F5F9,
    borderRadius: fs(14),
    padding: ws(4),
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hs(10),
    borderRadius: fs(10),
    gap: ws(6),
  },
  segmentBtnActive: {
    backgroundColor: Colors.primaryColor,
    shadowColor: Colors.primaryColor,
    shadowOffset: { width: 0, height: hs(2) },
    shadowOpacity: 0.2,
    shadowRadius: fs(4),
    elevation: 3,
  },
  segmentText: {
    fontSize: fs(12),
    ...TYPOGRAPHY.medium,
    color: Colors.secondaryFontColor,
  },
  segmentTextActive: {
    color: Colors.white,
    ...TYPOGRAPHY.bold,
  },
  searchWrapper: {
    paddingHorizontal: ws(16),
    paddingTop: hs(12),
    paddingBottom: hs(4),
  },
  searchBarOverride: {
    borderRadius: fs(12),
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: hs(48),
    height: hs(48),
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: hs(1) },
    shadowOpacity: 0.02,
    shadowRadius: fs(3),
    elevation: 1,
  },
  listContent: {
    flexGrow: 1,
    padding: ws(16),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: hs(20),
  },
  bookNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryColor,
    paddingHorizontal: ws(20),
    paddingVertical: hs(11),
    borderRadius: fs(14),
    marginTop: hs(12),
    gap: ws(6),
    shadowColor: Colors.primaryColor,
    shadowOffset: { width: 0, height: hs(3) },
    shadowOpacity: 0.25,
    shadowRadius: fs(6),
    elevation: 3,
  },
  bookNowText: {
    color: Colors.white,
    fontSize: fs(13),
    ...TYPOGRAPHY.bold,
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
  subFilterContainer: {
    backgroundColor: Colors.bgColor,
    paddingTop: hs(6),
    paddingBottom: hs(2),
  },
  subFilterScroll: {
    paddingHorizontal: ws(16),
    gap: ws(8),
    flexDirection: 'row',
    alignItems: 'center',
  },
  subFilterChip: {
    paddingHorizontal: ws(14),
    paddingVertical: hs(6),
    borderRadius: fs(16),
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  subFilterChipActive: {
    backgroundColor: Colors.primaryColor,
    borderColor: Colors.primaryColor,
  },
  subFilterText: {
    fontSize: fs(12),
    ...TYPOGRAPHY.medium,
    color: Colors.secondaryFontColor,
  },
  subFilterTextActive: {
    color: Colors.white,
    ...TYPOGRAPHY.bold,
  },
});
