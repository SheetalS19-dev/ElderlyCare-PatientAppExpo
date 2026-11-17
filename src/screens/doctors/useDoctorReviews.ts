import type { RouteProp } from '@react-navigation/native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import type { RootStackParamList } from '../../navigation/types';
import { useGetDoctorByIdQuery, useGetDoctorReviewsQuery } from '../../redux/apis/doctorApi';
import type { DoctorModel, DoctorReviewModel } from '../../types';
import { formatDoctorName } from '../../utils';

export type ReviewFilterKey = 'all' | '5' | '4' | '3' | '2' | '1' | 'with_comments';

export const useDoctorReviews = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'DoctorReviews'>>();
  const { isAuthenticated } = useAuth();

  const doctorId = String(route.params?.doctorId || route.params?.doctId || '');
  const [selectedFilter, setSelectedFilter] = useState<ReviewFilterKey>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const {
    data: reviewsData,
    isLoading: isReviewsLoading,
    isFetching: isReviewsFetching,
    isError: isReviewsError,
    refetch: refetchReviews,
  } = useGetDoctorReviewsQuery(doctorId, {
    skip: !doctorId,
    refetchOnMountOrArgChange: true,
  });

  const { data: rawDoctorData } = useGetDoctorByIdQuery(doctorId, {
    skip: !doctorId,
  });

  const doctor: DoctorModel | null = useMemo(() => {
    if (!rawDoctorData) return null;
    let target = (rawDoctorData as any)?.data ?? (rawDoctorData as any)?.response ?? rawDoctorData;
    if (Array.isArray(target)) {
      const match = target.find(
        (d: any) => String(d.id || d.doct_id || d.user_id) === String(doctorId)
      );
      return match ?? target[0] ?? null;
    }
    return target ?? null;
  }, [rawDoctorData, doctorId]);

  const allReviews: DoctorReviewModel[] = useMemo(() => {
    if (!reviewsData) return [];
    let list: any[] = [];
    if (Array.isArray(reviewsData)) {
      list = reviewsData;
    } else if (Array.isArray((reviewsData as any)?.data)) {
      list = (reviewsData as any).data;
    } else if (Array.isArray((reviewsData as any)?.response)) {
      list = (reviewsData as any).response;
    }
    return list;
  }, [reviewsData]);

  const doctorFullName = useMemo(() => {
    if (route.params?.doctorName) return route.params.doctorName;
    if (doctor) {
      return formatDoctorName(doctor.f_name, doctor.l_name) || (doctor as any).name || 'Doctor';
    }
    return 'Doctor';
  }, [route.params?.doctorName, doctor]);

  const doctorDepartment = useMemo(() => {
    if (route.params?.department) return route.params.department;
    if (doctor) {
      return (
        doctor.department_name ||
        (doctor as any).dept_name ||
        (doctor as any).dept_title ||
        doctor.specialization ||
        'Specialist'
      );
    }
    return 'Specialist';
  }, [route.params?.department, doctor]);

  const doctorImage = useMemo(() => {
    return route.params?.doctorImage || doctor?.image || '';
  }, [route.params?.doctorImage, doctor?.image]);

  // Average Rating calculation prioritizing doctor API data
  const avgRating = useMemo(() => {
    if (doctor?.average_rating != null && Number(doctor.average_rating) > 0) {
      return Number(doctor.average_rating);
    }
    const rawRating = (reviewsData as any)?.average_rating;
    if (rawRating != null && Number(rawRating) > 0) {
      return Number(rawRating);
    }
    if (route.params?.rating && Number(route.params.rating) > 0) {
      return Number(route.params.rating);
    }
    if (allReviews.length > 0) {
      const sum = allReviews.reduce(
        (acc, r) => acc + Number(r.points ?? r.rating ?? 0),
        0
      );
      if (sum > 0) return sum / allReviews.length;
    }
    return 5.0;
  }, [doctor?.average_rating, reviewsData, route.params?.rating, allReviews]);

  // Total reviews count from API
  const totalReviewsCount = useMemo(() => {
    if (doctor?.number_of_reviews != null && Number(doctor.number_of_reviews) >= 0) {
      return Number(doctor.number_of_reviews);
    }
    const rawCount = (reviewsData as any)?.number_of_reviews ?? (reviewsData as any)?.total_record;
    if (rawCount != null && Number(rawCount) >= 0) {
      return Number(rawCount);
    }
    if (route.params?.reviewCount != null && Number(route.params.reviewCount) >= 0) {
      return Number(route.params.reviewCount);
    }
    return allReviews.length;
  }, [doctor?.number_of_reviews, reviewsData, route.params?.reviewCount, allReviews.length]);

  // Distribution breakdown of star ratings
  const distribution = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    allReviews.forEach((r) => {
      const pts = Math.min(5, Math.max(1, Math.round(Number(r.points ?? r.rating ?? 5))));
      if (pts in counts) {
        counts[pts as keyof typeof counts]++;
      }
    });

    const total = allReviews.length || 1;
    return {
      counts,
      percentages: {
        5: Math.round((counts[5] / total) * 100),
        4: Math.round((counts[4] / total) * 100),
        3: Math.round((counts[3] / total) * 100),
        2: Math.round((counts[2] / total) * 100),
        1: Math.round((counts[1] / total) * 100),
      },
    };
  }, [allReviews]);

  // Filtered reviews
  const filteredReviews = useMemo(() => {
    return allReviews.filter((r) => {
      const pts = Math.round(Number(r.points ?? r.rating ?? 5));
      const comment = (r.description || r.comment || (r as any).feedback || '').trim();

      if (selectedFilter === '5' && pts !== 5) return false;
      if (selectedFilter === '4' && pts !== 4) return false;
      if (selectedFilter === '3' && pts !== 3) return false;
      if (selectedFilter === '2' && pts !== 2) return false;
      if (selectedFilter === '1' && pts !== 1) return false;
      if (selectedFilter === 'with_comments' && !comment) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const reviewer = [r.f_name, r.l_name, r.user_name, (r as any).patient_name]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!reviewer.includes(q) && !comment.toLowerCase().includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [allReviews, selectedFilter, searchQuery]);

  const handleBookNow = () => {
    if (!isAuthenticated) {
      navigation.navigate('Login');
      return;
    }
    navigation.navigate('BookAppointment', {
      doctId: doctorId,
      doctorId: doctorId,
    });
  };

  return {
    navigation,
    insets,
    doctorId,
    doctor,
    doctorFullName,
    doctorDepartment,
    doctorImage,
    allReviews,
    filteredReviews,
    avgRating,
    totalReviewsCount,
    distribution,
    selectedFilter,
    setSelectedFilter,
    searchQuery,
    setSearchQuery,
    isLoading: isReviewsLoading,
    isFetching: isReviewsFetching,
    isError: isReviewsError,
    refetch: refetchReviews,
    handleBookNow,
  };
};
