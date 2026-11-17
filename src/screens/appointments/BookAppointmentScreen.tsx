import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader, ErrorState, LoadingIndicator } from '../../components';
import { Colors } from '../../constants';
import { formatDoctorName, fs, hs, TYPOGRAPHY, ws } from '../../utils';
import {
  AppointmentTypeSelector,
  BookingDoctorHeaderCard,
  BookingReviewBottomBar,
  CouponSectionCard,
  DateTimeSelectorCard,
  DateTimeSheet,
  FamilyMemberSheet,
  PatientSelectionCard,
  PaymentSheet,
  PriceBreakdownCard,
} from './components';
import { useBookAppointment } from './useBookAppointment';

export const BookAppointmentScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const {
    navigation,
    doctId,
    isReschedule,
    rescheduledFromAppId,
    doctor,
    isLoading,
    isError,
    refetch,
    reviewsCount,
    ratingAverage,
    typeOptions,
    selectedType,
    setSelectedType,
    selectedMember,
    setSelectedMember,
    selectedDate,
    setSelectedDate,
    selectedTimeStart,
    setSelectedTimeStart,
    fee,
    taxAmount,
    couponDiscount,
    total,
    walletBalance,
    couponCode,
    setCouponCode,
    appliedCoupon,
    couponError,
    setCouponError,
    isValidatingCoupon,
    showFamilySheet,
    setShowFamilySheet,
    showDateTimeSheet,
    setShowDateTimeSheet,
    showPaymentSheet,
    setShowPaymentSheet,
    handleApplyCoupon,
    handleRemoveCoupon,
    handleSubmitPayment,
  } = useBookAppointment();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <AppHeader title="Book Appointment" onBackPress={() => navigation.goBack()} />
        <LoadingIndicator />
      </View>
    );
  }

  if (isError || !doctor) {
    return (
      <View style={styles.container}>
        <AppHeader title="Book Appointment" onBackPress={() => navigation.goBack()} />
        <ErrorState message="Couldn't load doctor details" onRetry={refetch} />
      </View>
    );
  }

  const isEmergencyType = selectedType?.code === '3';
  const canReview =
    !!selectedType &&
    !!selectedMember &&
    (isEmergencyType || (!!selectedDate && !!selectedTimeStart));

  const patientDisplayName = selectedMember
    ? `${selectedMember.f_name ?? ''} ${selectedMember.l_name ?? ''}`.trim() || (selectedMember as any).name || ''
    : '';

  return (
    <View style={styles.container}>
      <AppHeader
        title={isReschedule ? 'Reschedule Consultation' : 'Book Appointment'}
        onBackPress={() => navigation.goBack()}
      />

      <KeyboardAvoidingView
        style={styles.flexOne}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView
          style={styles.flexOne}
          contentContainerStyle={[
            styles.scrollContent,
            { flexGrow: 1, paddingBottom: Math.max(insets.bottom + hs(100), hs(120)) },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {isReschedule && (
            <View style={styles.rescheduleBanner}>
              <MaterialIcons name="sync" size={fs(18)} color={Colors.orange_EA580C} />
              <View style={{ flex: 1, marginLeft: ws(8) }}>
                <Text style={styles.rescheduleBannerTitle}>Rescheduling Consultation</Text>
                <Text style={styles.rescheduleBannerSub}>
                  {rescheduledFromAppId
                    ? `Booking new slot for consultation #${rescheduledFromAppId}`
                    : 'Select your preferred new date and time slot'}
                </Text>
              </View>
            </View>
          )}

          {/* Doctor Header & Clinic Info Card */}
          <BookingDoctorHeaderCard
            doctor={doctor}
            ratingAverage={ratingAverage}
            reviewsCount={reviewsCount}
            onPressClinic={(clinicId) => navigation.navigate('Clinic', { clinicId })}
          />

          {/* Consultation Type Selector */}
          <Text style={styles.sectionTitle}>Consultation Type</Text>
          <AppointmentTypeSelector
            options={typeOptions}
            selectedType={selectedType}
            onSelect={(opt) => {
              setSelectedType(opt);
              setSelectedDate(null);
              setSelectedTimeStart(null);
            }}
          />

          {/* Date & Time Selector */}
          {selectedType && selectedType.code !== '3' && (
            <>
              <Text style={styles.sectionTitle}>Select Slot *</Text>
              <DateTimeSelectorCard
                selectedDate={selectedDate}
                selectedTimeStart={selectedTimeStart}
                onPress={() => setShowDateTimeSheet(true)}
              />
            </>
          )}

          {/* Patient Selection Card */}
          <Text style={styles.sectionTitle}>Select Patient *</Text>
          <PatientSelectionCard
            patientDisplayName={patientDisplayName}
            hasSelectedMember={Boolean(selectedMember)}
            onPress={() => setShowFamilySheet(true)}
          />

          {/* Coupon Code Section */}
          <Text style={styles.sectionTitle}>Coupon Code</Text>
          <CouponSectionCard
            couponCode={couponCode}
            onChangeCouponCode={(text) => {
              setCouponCode(text);
              if (couponError) setCouponError(undefined);
            }}
            appliedCoupon={appliedCoupon}
            isValidating={isValidatingCoupon}
            couponError={couponError}
            onApply={handleApplyCoupon}
            onRemove={handleRemoveCoupon}
          />

          {/* Price Breakdown */}
          <PriceBreakdownCard
            consultationTypeLabel={selectedType?.label}
            consultationTypeSubtext={selectedType?.subtext}
            isOnlineConsult={selectedType?.code === '2'}
            fee={fee}
            taxAmount={taxAmount}
            couponDiscount={couponDiscount}
            couponCode={appliedCoupon?.code || couponCode}
            total={total}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom Review & Pay Action Bar */}
      <BookingReviewBottomBar
        canReview={canReview}
        total={total}
        onPress={() => setShowPaymentSheet(true)}
      />

      {/* Sheets */}
      <FamilyMemberSheet
        visible={showFamilySheet}
        onClose={() => setShowFamilySheet(false)}
        onSelect={setSelectedMember}
        selectedMemberId={selectedMember?.id}
      />

      {selectedType && (
        <DateTimeSheet
          visible={showDateTimeSheet}
          onClose={() => setShowDateTimeSheet(false)}
          doctId={String(doctId)}
          appointmentType={selectedType.code}
          appointmentTypeName={selectedType.name}
          selectedDate={selectedDate || undefined}
          selectedTimeSlot={selectedTimeStart || undefined}
          onConfirm={(date, timeStart) => {
            setSelectedDate(date);
            setSelectedTimeStart(timeStart);
          }}
        />
      )}

      <PaymentSheet
        visible={showPaymentSheet}
        onClose={() => setShowPaymentSheet(false)}
        doctorName={formatDoctorName(doctor.name || `${doctor.f_name || ''} ${doctor.l_name || ''}`.trim())}
        patientName={patientDisplayName}
        appointmentType={selectedType?.label || selectedType?.name || 'OPD'}
        selectedDate={
          selectedDate ||
          (selectedType?.code === '3' ? new Date().toISOString().split('T')[0] : '')
        }
        selectedTime={
          selectedTimeStart || (selectedType?.code === '3' ? 'Emergency Slot' : '')
        }
        allowPayAtHospital={selectedType?.code === '1'}
        fee={fee}
        taxAmount={taxAmount}
        couponDiscount={couponDiscount}
        total={total}
        walletBalance={walletBalance}
        onSubmit={handleSubmitPayment}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.containerBgColor,
  },
  flexOne: {
    flex: 1,
  },
  scrollContent: {
    padding: ws(16),
  },
  sectionTitle: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(14),
    color: Colors.primaryFontColor,
    marginBottom: hs(8),
    marginTop: hs(6),
  },
  rescheduleBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.orange_FFF7ED,
    borderWidth: 1,
    borderColor: Colors.orange_FED7AA,
    borderRadius: ws(12),
    padding: ws(12),
    marginBottom: hs(14),
  },
  rescheduleBannerTitle: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(13),
    color: Colors.orange_9A3412,
  },
  rescheduleBannerSub: {
    ...TYPOGRAPHY.regular,
    fontSize: fs(11.5),
    color: Colors.orange_C2410C,
    marginTop: hs(2),
  },
});
