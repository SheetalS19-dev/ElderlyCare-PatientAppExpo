import type { RouteProp } from '@react-navigation/native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import { Linking } from 'react-native';
import { AppConstants } from '../../constants';
import { useAuth } from '../../context/AuthContext';
import type { RootStackParamList } from '../../navigation/types';
import { useGetDoctorByIdQuery, useGetDoctorReviewsQuery } from '../../redux/apis/doctorApi';
import type { DoctorModel, DoctorReviewModel } from '../../types';
import { formatDoctorName, getImageUrl, showToast } from '../../utils';
import type { ConsultationModeItem } from './components';

export type ConsultationMode = 'clinic' | 'video' | 'emergency';

export const useDoctorDetails = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'DoctorDetails'>>();
  const { doctId, isReschedule, rescheduledFromAppId } = route.params;
  const { isAuthenticated } = useAuth();

  const [selectedMode, setSelectedMode] = useState<ConsultationMode>('clinic');

  const { data: rawDoctor, isLoading, isError, refetch } = useGetDoctorByIdQuery(
    doctId,
    { refetchOnMountOrArgChange: true }
  );
  const { data: rawReviews, refetch: refetchReviews } = useGetDoctorReviewsQuery(
    doctId,
    { refetchOnMountOrArgChange: true }
  );

  const doctor: DoctorModel | null = useMemo(() => {
    if (!rawDoctor) return null;
    let target = (rawDoctor as any)?.data ?? (rawDoctor as any)?.response ?? rawDoctor;
    if (Array.isArray(target)) return target[0] ?? null;
    return target ?? null;
  }, [rawDoctor]);

  const reviews: DoctorReviewModel[] = useMemo(() => {
    if (!rawReviews) return [];
    let list: any[] = [];
    if (Array.isArray(rawReviews)) list = rawReviews;
    else if (Array.isArray((rawReviews as any)?.data)) list = (rawReviews as any).data;
    else if (Array.isArray((rawReviews as any)?.response)) list = (rawReviews as any).response;
    return list.filter((r) => !r.doctor_id || String(r.doctor_id) === String(doctId));
  }, [rawReviews, doctId]);

  const reviewCount = useMemo(() => {
    // 1. Direct from doctor API if available
    if (doctor?.number_of_reviews != null && Number(doctor.number_of_reviews) >= 0) {
      return Number(doctor.number_of_reviews);
    }
    const rawApiCount = (rawReviews as any)?.number_of_reviews ?? (rawReviews as any)?.total_record;
    if (rawApiCount != null && Number(rawApiCount) >= 0) {
      return Number(rawApiCount);
    }
    if (reviews.length > 0) {
      return reviews.length;
    }
    return 0;
  }, [doctor?.number_of_reviews, rawReviews, reviews.length]);

  const rating = useMemo(() => {
    // 1. Direct from doctor API if available
    if (doctor?.average_rating != null && Number(doctor.average_rating) > 0) {
      return Number(doctor.average_rating);
    }
    const rawApiRating = (rawReviews as any)?.average_rating;
    if (rawApiRating != null && Number(rawApiRating) > 0) {
      return Number(rawApiRating);
    }
    if (reviews.length > 0) {
      const sum = reviews.reduce((acc, r) => acc + Number(r.points ?? r.rating ?? 0), 0);
      if (sum > 0) return sum / reviews.length;
    }
    return 0;
  }, [doctor?.average_rating, rawReviews, reviews]);

  const consultationModes: ConsultationModeItem[] = useMemo(() => {
    if (!doctor) return [];
    const items: (ConsultationModeItem | null)[] = [
      Number(doctor.clinic_appointment) === 1 || Boolean(doctor.opd_fee)
        ? {
          id: 'clinic',
          label: 'Clinic Visit',
          fee: doctor.opd_fee != null ? `${AppConstants.appCurrency}${Number(doctor.opd_fee).toFixed(2)}` : '--',
          subtext: '(In-person)',
          icon: 'hospital-building',
          isCommunity: true,
        }
        : null,
      Number(doctor.video_appointment) === 1 || Boolean(doctor.video_fee)
        ? {
          id: 'video',
          label: 'Video Consultation',
          fee: doctor.video_fee != null ? `${AppConstants.appCurrency}${Number(doctor.video_fee).toFixed(2)}` : '--',
          subtext: '(Online)',
          icon: 'videocam',
          isCommunity: false,
        }
        : null,
      Number(doctor.emergency_appointment) === 1 || (doctor.emergency_appointment as any) === '1'
        ? {
          id: 'emergency',
          label: 'Emergency',
          fee: doctor.emg_fee != null ? `${AppConstants.appCurrency}${Number(doctor.emg_fee).toFixed(2)}` : '--',
          subtext: '(In-person only)',
          icon: 'ambulance',
          isCommunity: true,
        }
        : null,
    ];
    return items.filter(Boolean) as ConsultationModeItem[];
  }, [doctor]);

  useEffect(() => {
    if (consultationModes.length > 0 && !consultationModes.some((m) => m.id === selectedMode)) {
      setSelectedMode(consultationModes[0].id as ConsultationMode);
    }
  }, [consultationModes, selectedMode]);

  const handleOpenUrl = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        showToast('Cannot open link on this device');
      }
    } catch {
      showToast('Action could not be completed');
    }
  };

  const handleOpenDirections = (addressQuery: string) => {
    const query = encodeURIComponent(addressQuery);
    handleOpenUrl(`https://www.google.com/maps/search/?api=1&query=${query}`);
  };

  const fullName = doctor ? formatDoctorName(doctor.f_name, doctor.l_name) : '';
  const reviewCountText = `${rating > 0 ? rating.toFixed(1) : '0.0'} (${reviewCount} ${reviewCount === 1 ? 'Review' : 'Reviews'})`;
  const bookingDisabled = doctor?.stop_booking === 1;

  const clinicTitle = doctor ? (doctor.clinic_title || doctor.clinic_name || (doctor as any).clinics_name || '') : '';
  const clinicPhone = doctor ? ((doctor as any).clinic_phone || doctor.phone || (doctor as any).clinics_phone || '') : '';
  const clinicWhatsapp = doctor ? ((doctor as any).clinic_whatsapp || (doctor as any).whatsapp || (doctor as any).clinics_whatsapp || '') : '';
  const clinicEmail = doctor ? ((doctor as any).clinic_email || doctor.email || (doctor as any).clinics_email || '') : '';
  const clinicAddress = doctor ? (doctor.clinics_address || doctor.clinic_address || '') : '';

  const clinicImgRaw = doctor ? (Array.isArray(doctor.clinic_image)
    ? doctor.clinic_image[0]
    : doctor.clinic_image || doctor.clinic_thumb_image || (doctor as any).clinics_image) : null;
  const clinicImgUrl = getImageUrl(clinicImgRaw);

  const hasClinicSection = Boolean(clinicTitle || clinicPhone || clinicWhatsapp || clinicEmail || clinicAddress);
  const expValue = doctor ? (doctor.ex_year ?? doctor.experience) : undefined;
  const patientsCount = doctor ? (doctor.total_appointment_done ?? (doctor as any).patients_served) : undefined;

  const handleBookNow = () => {
    if (!isAuthenticated) {
      showToast('Please log in to book a consultation');
      navigation.navigate('Login');
      return;
    }
    const targetId = String((doctor as any)?.user_id || (doctor as any)?.doct_id || doctor?.id || doctId);
    navigation.navigate('BookAppointment', {
      doctId: targetId,
      clinicId: doctor?.clinic_id,
      initialMode: selectedMode,
      isReschedule,
      rescheduledFromAppId,
    });
  };

  return {
    navigation,
    doctId,
    isReschedule,
    rescheduledFromAppId,
    isAuthenticated,
    doctor,
    reviews,
    reviewCount,
    rating,
    consultationModes,
    selectedMode,
    setSelectedMode,
    isLoading,
    isError,
    refetch,
    fullName,
    reviewCountText,
    bookingDisabled,
    clinicTitle,
    clinicPhone,
    clinicWhatsapp,
    clinicEmail,
    clinicAddress,
    clinicImgUrl,
    hasClinicSection,
    expValue,
    patientsCount,
    handleOpenUrl,
    handleOpenDirections,
    handleBookNow,
  };
};
