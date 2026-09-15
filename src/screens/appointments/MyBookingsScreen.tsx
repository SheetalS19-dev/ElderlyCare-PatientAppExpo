import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AppHeader,
  AppointmentCard,
  EmptyState,
  ErrorState,
  LoadingIndicator,
} from '../../components';
import { Colors, Typography } from '../../constants';
import { useAuth } from '../../context/AuthContext';
import type { RootStackParamList } from '../../navigation/types';
import { useGetAppointmentsQuery } from '../../redux/apis/appointmentApi';
import type { AppointmentModel } from '../../types';
import { fs, hs, ws, TYPOGRAPHY } from '../../utils';

type RootNavigation = NativeStackNavigationProp<RootStackParamList>;
type TabKey = 'upcoming' | 'closed';

const PAGE_SIZE = 10;

export const MyBookingsScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<RootNavigation>();
  const { isAuthenticated, user } = useAuth();
  const [tab, setTab] = useState<TabKey>('upcoming');
  const [searchQuery, setSearchQuery] = useState('');

  const [displayedLimit, setDisplayedLimit] = useState(PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);

  const userId = String(user?.id ?? (user as any)?.user_id ?? '');

  const {
    data: rawData,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetAppointmentsQuery(userId, {
    skip: !isAuthenticated || !userId,
  });

  const allAppointments: AppointmentModel[] = useMemo(() => {
    let list: AppointmentModel[] = [];
    if (Array.isArray(rawData)) {
      list = rawData;
    } else if (Array.isArray((rawData as any)?.data)) {
      list = (rawData as any).data;
    } else if (Array.isArray((rawData as any)?.response)) {
      list = (rawData as any).response;
    }
    return list;
  }, [rawData]);

  const upcomingAppointments = useMemo(() => {
    return allAppointments.filter((a) => {
      const s = (a.status || '').trim().toLowerCase();
      return (
        ['pending', 'confirmed', 'rescheduled', 'scheduled', 'booked', 'active', 'approved', 'paid', 'in-process'].includes(s) ||
        !['completed', 'visited', 'rejected', 'cancelled', 'canceled'].includes(s)
      );
    });
  }, [allAppointments]);

  const closedAppointments = useMemo(() => {
    return allAppointments.filter((a) => {
      const s = (a.status || '').trim().toLowerCase();
      return ['completed', 'visited', 'rejected', 'cancelled', 'canceled'].includes(s);
    });
  }, [allAppointments]);

  const currentList = tab === 'upcoming' ? upcomingAppointments : closedAppointments;

  const filteredList = useMemo(() => {
    if (!searchQuery.trim()) return currentList;
    const query = searchQuery.trim().toLowerCase();

    return currentList.filter((item: any) => {
      const patientName = `${item.patient_f_name ?? item.f_name ?? ''} ${item.patient_l_name ?? item.l_name ?? ''}`.trim() || String(item.patient_name || item.name || '');
      const docName = `${item.doct_f_name ?? item.doctor?.f_name ?? ''} ${item.doct_l_name ?? item.doctor?.l_name ?? ''}`.trim() || String(item.doctor_name || '');
      const phone = String(item.phone || item.mobile || item.patient_phone || '');
      const dept = String(item.dept_title || item.department_name || item.department || '');
      const apptId = String(item.id ?? '');
      const status = String(item.status ?? '');
      const date = String(item.date ?? '');
      const time = String(item.time_slots ?? '');

      return (
        patientName.toLowerCase().includes(query) ||
        docName.toLowerCase().includes(query) ||
        phone.includes(query) ||
        dept.toLowerCase().includes(query) ||
        apptId.includes(query) ||
        status.toLowerCase().includes(query) ||
        date.includes(query) ||
        time.toLowerCase().includes(query)
      );
    });
  }, [currentList, searchQuery]);

  const paginatedList = useMemo(() => {
    return filteredList.slice(0, displayedLimit);
  }, [filteredList, displayedLimit]);

  const handleLoadMore = () => {
    if (loadingMore || isFetching || displayedLimit >= filteredList.length) return;
    setLoadingMore(true);
    setTimeout(() => {
      setDisplayedLimit((prev) => prev + PAGE_SIZE);
      setLoadingMore(false);
    }, 500);
  };

  const handleTabChange = (newTab: TabKey) => {
    setTab(newTab);
    setDisplayedLimit(PAGE_SIZE);
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    setDisplayedLimit(PAGE_SIZE);
  };

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
      <View style={styles.searchBarWrapper}>
        <MaterialIcons name="search" size={20} color={Colors.secondaryFontColor} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by patient, doctor, phone, dept..."
          placeholderTextColor={Colors.secondaryFontColor}
          value={searchQuery}
          onChangeText={handleSearchChange}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => handleSearchChange('')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialIcons name="close" size={18} color={Colors.secondaryFontColor} />
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <LoadingIndicator />
      ) : isError ? (
        <ErrorState message="Couldn't load your appointments" onRetry={refetch} />
      ) : (
        <FlatList
          data={paginatedList}
          keyExtractor={(item: AppointmentModel, index: number) => `appt-${item.id ?? index}`}
          contentContainerStyle={[styles.listContent, { paddingBottom: Math.max(insets.bottom + 20, 40) }]}
          refreshing={isFetching}
          onRefresh={async () => {
            setDisplayedLimit(PAGE_SIZE);
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
            ) : null
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
              {tab === 'upcoming' && !searchQuery.trim() && (
                <TouchableOpacity
                  style={styles.bookNowBtn}
                  activeOpacity={0.85}
                  onPress={() => navigation.navigate('Search')}
                >
                  <MaterialIcons name="add" size={18} color={Colors.white} />
                  <Text style={styles.bookNowText}>Book a Consultation</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          renderItem={({ item }: { item: AppointmentModel }) => {
            const docId =
              item.doct_id ||
              (item as any)?.doctor_id ||
              (item as any)?.doctorId;
            return (
              <AppointmentCard
                appointment={item}
                onPress={() => navigation.navigate('AppointmentDetails', { appId: String(item.id) })}
                onRebook={() => {
                  if (docId) {
                    navigation.navigate('DoctorDetails', { doctId: String(docId) });
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
    borderBottomColor: '#E2E8F0',
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
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
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: fs(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginHorizontal: ws(16),
    marginTop: hs(12),
    marginBottom: hs(4),
    paddingHorizontal: ws(12),
    minHeight: hs(48),
    height: hs(48),
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
    paddingVertical: Platform.OS === 'ios' ? hs(10) : hs(6),
    textAlignVertical: 'center',
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
});
