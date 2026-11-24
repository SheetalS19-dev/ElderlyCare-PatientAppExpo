import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  AppHeader,
  DocumentActionModal,
  ErrorState,
  LoadingIndicator,
} from '../../components';
import { Colors } from '../../constants';
import { formatDoctorName, fs, hs, TYPOGRAPHY, ws } from '../../utils';
import {
  AppointmentActionsCard,
  AppointmentContactCard,
  AppointmentDetailsDoctorCard,
  AppointmentInfoCard,
  AppointmentQrModal,
  AppointmentReviewModal,
} from './components';
import { useAppointmentDetails } from './useAppointmentDetails';

export const AppointmentDetailsScreen: React.FC = () => {
  const {
    navigation,
    appointment,
    doctorData,
    isLoading,
    isError,
    refetch,
    showReviewModal,
    setShowReviewModal,
    showQrModal,
    setShowQrModal,
    reviewRating,
    setReviewRating,
    reviewText,
    setReviewText,
    isSubmittingReview,
    isInvoiceModalVisible,
    setIsInvoiceModalVisible,
    isInvoiceProcessing,
    invoiceProcessingMsg,
    statusColor,
    canReview,
    isVideoCall,
    canReschedule,
    handleAddToGoogleCalendar,
    handleSubmitReview,
    handleJoinCall,
    handleOpenInvoiceModal,
    handleViewInvoice,
    handleDownloadInvoice,
    handleShareInvoice,
    handleReschedule,
  } = useAppointmentDetails();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <AppHeader title="Appointment Details" onBackPress={navigation.goBack} />
        <LoadingIndicator />
      </View>
    );
  }

  if (isError || !appointment) {
    return (
      <View style={styles.container}>
        <AppHeader title="Appointment Details" onBackPress={navigation.goBack} />
        <ErrorState message="Couldn't load this appointment" onRetry={refetch} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader title={`Appointment #${appointment.id ?? ''}`} onBackPress={navigation.goBack} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Status & ID Header Bar */}
        <View style={styles.headerStatusCard}>
          <View style={styles.headerStatusLeft}>
            <Text style={styles.headerAppIdLabel}>BOOKING ID</Text>
            <Text style={styles.headerAppIdValue}>#{appointment.id ?? '--'}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}18` }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>{appointment.status ?? '--'}</Text>
          </View>
        </View>

        {/* Doctor Info Card */}
        <AppointmentDetailsDoctorCard appointment={appointment} />

        {/* Structured Info Grid */}
        <AppointmentInfoCard appointment={appointment} isVideoCall={isVideoCall} />

        {/* Action Cards & Video Call Banner */}
        <AppointmentActionsCard
          isVideoCall={isVideoCall}
          meetingLink={appointment.meeting_link}
          status={appointment.status}
          canReview={canReview}
          canReschedule={canReschedule}
          onReschedule={handleReschedule}
          onJoinCall={handleJoinCall}
          onOpenQr={() => setShowQrModal(true)}
          onOpenInvoice={handleOpenInvoiceModal}
          onOpenPrescriptions={() => navigation.navigate('PrescriptionList')}
          onOpenPatientFiles={() => navigation.navigate('PatientFile')}
          onOpenReview={() => setShowReviewModal(true)}
        />

        {/* Contact Us Card */}
        <AppointmentContactCard appointment={appointment} doctorData={doctorData} />

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Review Modal (Commented Out) */}
      {/* <AppointmentReviewModal
        visible={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        doctorName={formatDoctorName(appointment.doct_f_name, appointment.doct_l_name)}
        rating={reviewRating}
        onRatingChange={setReviewRating}
        reviewText={reviewText}
        onChangeReviewText={setReviewText}
        onSubmit={handleSubmitReview}
        isSubmitting={isSubmittingReview}
      /> */}

      {/* Clinic Queue Arrival QR Code Modal */}
      <AppointmentQrModal
        visible={showQrModal}
        onClose={() => setShowQrModal(false)}
        appointment={appointment}
        user={null}
        onAddToCalendar={handleAddToGoogleCalendar}
        onRebook={handleReschedule}
        onBookConsultation={() => navigation.navigate('Search')}
      />

      {/* Document Action Modal for Invoice */}
      <DocumentActionModal
        visible={isInvoiceModalVisible}
        onClose={() => setIsInvoiceModalVisible(false)}
        title={`Invoice #${appointment.id ?? ''}`}
        subtitle={`Receipt for appointment with ${formatDoctorName(appointment.doct_f_name, appointment.doct_l_name)}`}
        onView={handleViewInvoice}
        onDownload={handleDownloadInvoice}
        onShare={handleShareInvoice}
        isLoading={isInvoiceProcessing}
        loadingMessage={invoiceProcessingMsg}
      />
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
    paddingBottom: hs(40),
  },
  headerStatusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: fs(14),
    paddingHorizontal: ws(16),
    paddingVertical: hs(12),
    marginBottom: hs(12),
    borderWidth: 1,
    borderColor: Colors.borderColor,
  },
  headerStatusLeft: {
    justifyContent: 'center',
  },
  headerAppIdLabel: {
    fontSize: fs(10),
    ...TYPOGRAPHY.bold,
    color: Colors.secondaryFontColor,
    letterSpacing: 0.5,
  },
  headerAppIdValue: {
    fontSize: fs(16),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
    marginTop: hs(2),
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ws(12),
    paddingVertical: hs(6),
    borderRadius: fs(20),
    gap: ws(6),
  },
  statusDot: {
    width: ws(8),
    height: ws(8),
    aspectRatio: 1,
    borderRadius: 999,
    overflow: 'hidden',
  },
  statusText: {
    fontSize: fs(13),
    ...TYPOGRAPHY.bold,
  },
  bottomSpacer: {
    height: hs(60),
  },
});
