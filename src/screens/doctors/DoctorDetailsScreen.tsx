import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AppHeader,
  ErrorState,
  LoadingIndicator,
} from '../../components';
import { AppConstants, Colors } from '../../constants';
import { useAuth } from '../../context/AuthContext';
import type { RootStackParamList } from '../../navigation/types';
import { useGetDoctorByIdQuery, useGetDoctorReviewsQuery } from '../../redux/apis/doctorApi';
import type { DoctorModel, DoctorReviewModel } from '../../types';
import {
  formatDoctorName,
  fs,
  getImageUrl,
  hs,
  showToast,
  TYPOGRAPHY,
  ws,
} from '../../utils';
import {
  DoctorAboutCard,
  DoctorClinicContactCard,
  DoctorConsultationModes,
  DoctorHeaderProfileCard,
  DoctorReviewsSection,
  type ConsultationModeItem,
} from './components';

type Props = NativeStackScreenProps<RootStackParamList, 'DoctorDetails'>;
type ConsultationMode = 'clinic' | 'video' | 'emergency';

export const DoctorDetailsScreen = ({ navigation, route }: Props) => {
  const { doctId, isReschedule, rescheduledFromAppId } = route.params;
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();

  const [selectedMode, setSelectedMode] = useState<ConsultationMode>('clinic');

  const { data: rawDoctor, isLoading, isError, refetch } = useGetDoctorByIdQuery(doctId);
  const { data: rawReviews } = useGetDoctorReviewsQuery(doctId);

  const doctor: DoctorModel | null = useMemo(() => {
    if (!rawDoctor) return null;
    let target = (rawDoctor as any)?.data ?? (rawDoctor as any)?.response ?? rawDoctor;
    if (Array.isArray(target)) return target[0] ?? null;
    return target ?? null;
  }, [rawDoctor]);

  const reviews: DoctorReviewModel[] = useMemo(() => {
    if (!rawReviews) return [];
    if (Array.isArray(rawReviews)) return rawReviews;
    if (Array.isArray((rawReviews as any)?.data)) return (rawReviews as any).data;
    if (Array.isArray((rawReviews as any)?.response)) return (rawReviews as any).response;
    return [];
  }, [rawReviews]);

  // Dynamic Consultation Modes verified from database
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

  if (isLoading) {
    return (
      <View style={styles.container}>
        <AppHeader title="Doctor Details" onBackPress={() => navigation.goBack()} />
        <LoadingIndicator variant="detail" />
      </View>
    );
  }

  if (isError || !doctor) {
    return (
      <View style={styles.container}>
        <AppHeader title="Doctor Details" onBackPress={() => navigation.goBack()} />
        <ErrorState message="Couldn't load doctor's details" onRetry={refetch} />
      </View>
    );
  }

  const fullName = formatDoctorName(doctor.f_name, doctor.l_name);
  const rating = Number(doctor.average_rating ?? 0);
  const reviewCount = Number(doctor.number_of_reviews ?? reviews.length);
  const reviewCountText = `${rating > 0 ? rating.toFixed(1) : '0.0'} (${reviewCount} ${reviewCount === 1 ? 'Review' : 'Reviews'})`;

  const bookingDisabled = doctor.stop_booking === 1;

  // Dynamic Clinic Details
  const clinicTitle =
    doctor.clinic_title || doctor.clinic_name || (doctor as any).clinics_name || '';
  const clinicPhone =
    (doctor as any).clinic_phone || doctor.phone || (doctor as any).clinics_phone || '';
  const clinicEmail =
    (doctor as any).clinic_email || doctor.email || (doctor as any).clinics_email || '';
  const clinicAddress =
    doctor.clinics_address || doctor.clinic_address || '';

  const clinicImgRaw = Array.isArray(doctor.clinic_image)
    ? doctor.clinic_image[0]
    : doctor.clinic_image || doctor.clinic_thumb_image || (doctor as any).clinics_image;
  const clinicImgUrl = getImageUrl(clinicImgRaw);

  const hasClinicSection = Boolean(
    clinicTitle || clinicPhone || clinicEmail || clinicAddress
  );

  const expValue = doctor.ex_year ?? doctor.experience;
  const patientsCount = doctor.total_appointment_done ?? (doctor as any).patients_served;

  return (
    <View style={styles.container}>
      {/* Fixed Header */}
      <AppHeader title="Doctor Details" onBackPress={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + hs(80) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Doctor Profile Card */}
        <DoctorHeaderProfileCard
          doctor={doctor}
          fullName={fullName}
          rating={rating}
          reviewCountText={reviewCountText}
          expValue={expValue}
          patientsCount={patientsCount}
        />

        {/* Consultation Modes & Fees Section */}
        <DoctorConsultationModes
          consultationModes={consultationModes}
          selectedMode={selectedMode}
          onSelectMode={(id) => setSelectedMode(id as ConsultationMode)}
        />

        {/* About Section */}
        <DoctorAboutCard description={doctor.description} />

        {/* Dynamic Clinic Contact & Location Section */}
        <DoctorClinicContactCard
          hasClinicSection={hasClinicSection}
          clinicImgUrl={clinicImgUrl}
          clinicTitle={clinicTitle}
          clinicPhone={clinicPhone}
          clinicEmail={clinicEmail}
          clinicAddress={clinicAddress}
          onPressClinicHeader={() => {
            const cId = (doctor as any).clinic_id || (doctor as any).clinics_id;
            if (cId) {
              navigation.navigate('Clinic', { clinicId: String(cId) });
            }
          }}
          onOpenUrl={handleOpenUrl}
          onOpenDirections={handleOpenDirections}
        />

        {/* Dynamic Patient Reviews Section */}
        <DoctorReviewsSection
          reviews={reviews}
          doctorName={fullName}
        />
      </ScrollView>

      {/* Floating Bottom Book Appointment Bar */}
      <View
        style={[
          styles.bookBar,
          { paddingBottom: Math.max(insets.bottom + 8, 12) },
        ]}
      >
        <TouchableOpacity
          style={[styles.bookBtn, bookingDisabled && styles.bookBtnDisabled]}
          disabled={bookingDisabled}
          onPress={() => {
            if (!isAuthenticated) {
              navigation.navigate('Login');
              return;
            }
            navigation.navigate('BookAppointment', {
              doctId,
              initialMode: selectedMode,
              isReschedule,
              rescheduledFromAppId,
            });
          }}
          activeOpacity={0.85}
        >
          <MaterialIcons name="event" size={18} color="#FFFFFF" />
          <Text style={styles.bookBtnText}>
            {bookingDisabled ? 'Not Accepting Appointments' : 'Book Appointment'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgColor,
  },
  scrollContent: {
    padding: ws(16),
  },
  bookBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    paddingHorizontal: ws(16),
    paddingTop: hs(8),
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  bookBtn: {
    height: hs(44),
    borderRadius: fs(10),
    backgroundColor: Colors.primaryColor,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ws(6),
  },
  bookBtnDisabled: {
    opacity: 0.5,
  },
  bookBtnText: {
    fontSize: fs(13),
    ...TYPOGRAPHY.bold,
    color: '#FFFFFF',
  },
});
