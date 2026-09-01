import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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

type RootNavigation = NativeStackNavigationProp<RootStackParamList>;
type TabKey = 'upcoming' | 'closed';

export const MyBookingsScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<RootNavigation>();
  const { isAuthenticated, user } = useAuth();
  const [tab, setTab] = useState<TabKey>('upcoming');

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
        ['pending', 'confirmed', 'rescheduled', 'scheduled'].includes(s) ||
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
            onPress={() => setTab('upcoming')}
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
            onPress={() => setTab('closed')}
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

      {isLoading ? (
        <LoadingIndicator />
      ) : isError ? (
        <ErrorState message="Couldn't load your appointments" onRetry={refetch} />
      ) : (
        <FlatList
          data={currentList}
          keyExtractor={(item: AppointmentModel, index: number) => `appt-${item.id ?? index}`}
          contentContainerStyle={[styles.listContent, { paddingBottom: Math.max(insets.bottom + 20, 40) }]}
          refreshing={isFetching}
          onRefresh={refetch}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <EmptyState
                message={
                  tab === 'upcoming'
                    ? 'You have no upcoming consultations scheduled.'
                    : 'No past appointment history found.'
                }
              />
              {tab === 'upcoming' && (
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 4,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  segmentBtnActive: {
    backgroundColor: Colors.primaryColor,
    shadowColor: Colors.primaryColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  segmentText: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.secondaryFontColor,
  },
  segmentTextActive: {
    color: Colors.white,
    fontFamily: Typography.fontFamily.bold,
  },
  listContent: {
    flexGrow: 1,
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  bookNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryColor,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 14,
    marginTop: 12,
    gap: 6,
    shadowColor: Colors.primaryColor,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  bookNowText: {
    color: Colors.white,
    fontSize: 13,
    fontFamily: Typography.fontFamily.bold,
  },
});
