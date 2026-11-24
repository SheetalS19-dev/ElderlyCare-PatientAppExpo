import type { RouteProp } from '@react-navigation/native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import type { RootStackParamList } from '../../navigation/types';
import { useGetAppointmentsQuery } from '../../redux/apis/appointmentApi';
import type { AppointmentModel } from '../../types';
import { loadRescheduledAppointmentIds, sortAppointmentsDescending } from '../../utils';

export type TabKey = 'upcoming' | 'closed';
const PAGE_SIZE = 15;

export const useMyBookings = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'MyBookings'>>();
  const { user, isAuthenticated } = useAuth();

  const [tab, setTab] = useState<TabKey>(route.params?.initialTab ?? 'upcoming');
  const [subFilter, setSubFilter] = useState<string>(
    route.params?.initialSubFilter === 'rescheduled' ? 'all' : (route.params?.initialSubFilter ?? 'all')
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [rescheduledIds, setRescheduledIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (route.params?.initialTab) {
      setTab(route.params.initialTab);
    }
    if (route.params?.initialSubFilter) {
      setSubFilter(route.params.initialSubFilter === 'rescheduled' ? 'all' : route.params.initialSubFilter);
    }
  }, [route.params]);

  useEffect(() => {
    loadRescheduledAppointmentIds().then((ids) => {
      setRescheduledIds(new Set(ids));
    });
  }, []);

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

    const mapped = list.map((item) => {
      const idStr = String(item.id ?? '').trim();
      const isLocalRescheduled = rescheduledIds.has(idStr);
      const serverStatus = (item.status || '').trim().toLowerCase();
      if (isLocalRescheduled && serverStatus !== 'rescheduled') {
        return {
          ...item,
          status: 'Rescheduled',
        };
      }
      return item;
    });

    return sortAppointmentsDescending(mapped);
  }, [rawData, rescheduledIds]);

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

  // Sub-filter counts
  const subFilterOptions = useMemo(() => {
    if (tab === 'closed') {
      const completedCount = closedAppointments.filter((a) =>
        ['completed', 'visited'].includes((a.status || '').trim().toLowerCase())
      ).length;
      const cancelledCount = closedAppointments.filter((a) =>
        ['rejected', 'cancelled', 'canceled'].includes((a.status || '').trim().toLowerCase())
      ).length;
      const missedCount = closedAppointments.filter((a) =>
        ['missed', 'no-show'].includes((a.status || '').trim().toLowerCase())
      ).length;

      return [
        { key: 'all', label: `All (${closedAppointments.length})` },
        { key: 'completed', label: `Completed (${completedCount})` },
        { key: 'cancelled', label: `Cancelled (${cancelledCount})` },
        { key: 'missed', label: `Missed (${missedCount})` },
      ];
    } else {
      const confirmedCount = upcomingAppointments.filter((a) =>
        ['confirmed', 'booked', 'active', 'approved', 'scheduled'].includes((a.status || '').trim().toLowerCase())
      ).length;
      const pendingCount = upcomingAppointments.filter((a) =>
        ['pending', 'in-process', 'paid'].includes((a.status || '').trim().toLowerCase())
      ).length;

      return [
        { key: 'all', label: `All (${upcomingAppointments.length})` },
        { key: 'confirmed', label: `Confirmed (${confirmedCount})` },
        { key: 'pending', label: `Pending (${pendingCount})` },
      ];
    }
  }, [tab, closedAppointments, upcomingAppointments]);

  const currentList = useMemo(() => {
    const base = tab === 'upcoming' ? upcomingAppointments : closedAppointments;
    if (subFilter === 'all') return base;

    return base.filter((a) => {
      const s = (a.status || '').trim().toLowerCase();
      if (subFilter === 'completed') return ['completed', 'visited'].includes(s);
      if (subFilter === 'cancelled') return ['rejected', 'cancelled', 'canceled'].includes(s);
      if (subFilter === 'missed') return ['missed', 'no-show'].includes(s);
      if (subFilter === 'confirmed') return ['confirmed', 'booked', 'active', 'approved', 'scheduled'].includes(s);
      if (subFilter === 'pending') return ['pending', 'in-process', 'paid'].includes(s);
      if (subFilter === 'rescheduled') return ['rescheduled'].includes(s);
      return true;
    });
  }, [tab, subFilter, upcomingAppointments, closedAppointments]);

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

  const handleLoadMore = useCallback(() => {
    if (loadingMore || isFetching || displayedLimit >= filteredList.length) return;
    setLoadingMore(true);
    setTimeout(() => {
      setDisplayedLimit((prev) => prev + PAGE_SIZE);
      setLoadingMore(false);
    }, 500);
  }, [loadingMore, isFetching, displayedLimit, filteredList.length]);

  const handleTabChange = useCallback((newTab: TabKey) => {
    setTab(newTab);
    setSubFilter('all');
    setDisplayedLimit(PAGE_SIZE);
  }, []);

  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
    setDisplayedLimit(PAGE_SIZE);
  }, []);

  return {
    navigation,
    isAuthenticated,
    tab,
    setTab,
    subFilter,
    setSubFilter,
    searchQuery,
    setSearchQuery,
    subFilterOptions,
    paginatedList,
    filteredList,
    upcomingAppointments,
    closedAppointments,
    isLoading,
    isFetching,
    isError,
    refetch,
    loadingMore,
    displayedLimit,
    setDisplayedLimit,
    handleLoadMore,
    handleTabChange,
    handleSearchChange,
  };
};
