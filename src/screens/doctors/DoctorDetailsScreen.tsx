import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useCallback } from 'react';
import {
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
import { Colors } from '../../constants';
import { fs, hs, TYPOGRAPHY, ws } from '../../utils';
import {
  DoctorAboutCard,
  DoctorClinicContactCard,
  DoctorConsultationModes,
  DoctorHeaderProfileCard
} from './components';
import { useDoctorDetails, type ConsultationMode } from './useDoctorDetails';

export const DoctorDetailsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const {
    navigation,
    doctId,
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
  } = useDoctorDetails();

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

  const handleOpenReviews = useCallback(() => {
    const targetDocId = String((doctor as any)?.user_id || (doctor as any)?.doct_id || doctor?.id || doctId);
    navigation.navigate('DoctorReviews', {
      doctorId: targetDocId,
      doctId: targetDocId,
      doctorName: fullName,
      doctorImage: doctor?.image,
      department: doctor?.department_name || (doctor as any)?.dept_name,
      rating,
      reviewCount,
    });
  }, [doctor, doctId, navigation, fullName, rating, reviewCount]);

  const handleSelectMode = useCallback((id: string) => {
    setSelectedMode(id as ConsultationMode);
  }, [setSelectedMode]);

  const handlePressClinicHeader = useCallback(() => {
    const cId = (doctor as any).clinic_id || (doctor as any).clinics_id;
    if (cId) {
      navigation.navigate('Clinic', { clinicId: String(cId) });
    }
  }, [doctor, navigation]);

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
        // onPressReviews={handleOpenReviews}
        />

        {/* Consultation Modes & Fees Section */}
        <DoctorConsultationModes
          consultationModes={consultationModes}
          selectedMode={selectedMode}
          onSelectMode={handleSelectMode}
        />

        {/* About Section */}
        <DoctorAboutCard description={doctor.description} />

        {/* Dynamic Clinic Contact & Location Section */}
        <DoctorClinicContactCard
          hasClinicSection={hasClinicSection}
          clinicImgUrl={clinicImgUrl}
          clinicTitle={clinicTitle}
          clinicPhone={clinicPhone}
          clinicWhatsapp={clinicWhatsapp}
          clinicEmail={clinicEmail}
          clinicAddress={clinicAddress}
          onPressClinicHeader={handlePressClinicHeader}
          onOpenUrl={handleOpenUrl}
          onOpenDirections={handleOpenDirections}
        />

        {/* Dynamic Patient Reviews Section (Commented Out) */}
        {/* <DoctorReviewsSection
          reviews={reviews}
          doctorName={fullName}
          reviewCount={reviewCount}
          onPressViewAll={handleOpenReviews}
        /> */}
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
          onPress={handleBookNow}
          activeOpacity={0.85}
        >
          <MaterialIcons name="event" size={18} color={Colors.white} />
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
    shadowColor: Colors.black,
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
    color: Colors.white,
  },
});
