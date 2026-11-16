import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  AppHeader,
  DocumentActionModal,
  ErrorState,
  LoadingIndicator,
} from '../../components';
import { ApiEndpoints, Colors } from '../../constants';
import { useAuth } from '../../context/AuthContext';
import type { RootStackParamList } from '../../navigation/types';
import {
  useAddDoctorReviewMutation,
  useGetAppointmentByIdQuery,
} from '../../redux/apis/appointmentApi';
import { useGetDoctorByIdQuery } from '../../redux/apis/doctorApi';
import type { AppointmentModel } from '../../types';
import { DateTimeUtils, formatDoctorName, fs, hs, showToast, TYPOGRAPHY, ws } from '../../utils';
import {
  downloadInvoicePdf,
  shareInvoicePdf,
  viewInvoicePdf,
  type InvoiceAppointmentInfo,
  type InvoiceData,
} from '../../utils/invoicePdf';
import {
  AppointmentActionsCard,
  AppointmentContactCard,
  AppointmentDetailsDoctorCard,
  AppointmentInfoCard,
  AppointmentQrModal,
  AppointmentReviewModal,
} from './components';

type Props = NativeStackScreenProps<RootStackParamList, 'AppointmentDetails'>;

const STATUS_COLORS: Record<string, string> = {
  Pending: Colors.yellow_F5C518,
  'Approval Pending': '#D97706',
  'approval pending': '#D97706',
  Rescheduled: Colors.orange_FF9800,
  Rejected: Colors.redColor,
  Confirmed: Colors.greenFontColor,
  Completed: Colors.greenFontColor,
  Visited: Colors.greenFontColor,
  Cancelled: Colors.redColor,
};

export const AppointmentDetailsScreen = ({ navigation, route }: Props) => {
  const { appId } = route.params;
  const { user } = useAuth();
  const { data: rawAppointment, isLoading, isError, refetch } = useGetAppointmentByIdQuery(appId);
  const [addDoctorReview, { isLoading: isSubmittingReview }] = useAddDoctorReviewMutation();

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isInvoiceModalVisible, setIsInvoiceModalVisible] = useState(false);
  const [isInvoiceProcessing, setIsInvoiceProcessing] = useState(false);
  const [invoiceProcessingMsg, setInvoiceProcessingMsg] = useState('Preparing invoice...');

  const appointment: AppointmentModel | null = useMemo(() => {
    if (!rawAppointment) return null;
    let target = (rawAppointment as any)?.data ?? (rawAppointment as any)?.response ?? rawAppointment;
    if (Array.isArray(target)) return target[0] ?? null;
    return target ?? null;
  }, [rawAppointment]);

  const doctId = String(appointment?.doct_id || appointment?.doctor_id || '');
  const { data: rawDoctorData } = useGetDoctorByIdQuery(doctId, { skip: !doctId });
  const doctorData = useMemo(() => {
    if (!rawDoctorData) return null;
    return (rawDoctorData as any)?.data ?? rawDoctorData;
  }, [rawDoctorData]);

  const handleAddToGoogleCalendar = () => {
    if (!appointment) return;
    const doctName = formatDoctorName(appointment.doct_f_name, appointment.doct_l_name);
    const title = encodeURIComponent(`Doctor Appointment - ${doctName}`);
    const details = encodeURIComponent(
      `Appointment ID: #${appointment.id}\nDepartment: ${appointment.dept_title || 'General'}\nType: ${appointment.type || 'Consultation'}\nClinic: ${appointment.clinic_title || 'Elderly Care'}`
    );
    const gCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}`;
    Linking.openURL(gCalUrl).catch(() => showToast('Could not open Google Calendar'));
  };

  const handleSubmitReview = async () => {
    if (!appointment) return;
    if (!reviewRating || reviewRating < 1) {
      showToast('Please select a star rating');
      return;
    }
    try {
      await addDoctorReview({
        doctor_id: String(appointment.doct_id ?? ''),
        points: String(reviewRating),
        description: reviewText,
        appointment_id: appId,
        user_id: String(user?.id ?? ''),
      }).unwrap();
      showToast('Thanks for your review');
      setShowReviewModal(false);
      setReviewRating(0);
      setReviewText('');
      refetch();
    } catch {
      showToast('Could not submit your review');
    }
  };

  const handleJoinCall = () => {
    if (appointment?.meeting_link) {
      Linking.openURL(appointment.meeting_link).catch(() => showToast('Could not open the meeting link'));
    }
  };

  const fetchInvoiceData = async () => {
    if (!appointment) throw new Error('Appointment not found');
    const response = await fetch(`${ApiEndpoints.getInvoiceByAppIdUrl}/${appId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch invoice');
    }

    const result = await response.json();
    const invoice: InvoiceData = result?.data;
    if (!invoice) {
      throw new Error('Invoice data not found');
    }

    const doctorName = formatDoctorName(appointment.doct_f_name, appointment.doct_l_name);
    const appointmentInfo: InvoiceAppointmentInfo = {
      appointmentDate: DateTimeUtils.getDataFormat(appointment.date),
      appointmentTime:
        DateTimeUtils.formatTimeToAmPm(
          appointment.time_slots ||
          (appointment as any).timeSlot ||
          (appointment as any).appointment_time
        ) || '--',
      doctorName,
      doctorSpecialization: appointment.doct_specialization || '',
    };

    return { invoice, appointmentInfo };
  };

  const handleOpenInvoiceModal = () => {
    setIsInvoiceModalVisible(true);
  };

  const handleViewInvoice = async () => {
    try {
      setIsInvoiceProcessing(true);
      setInvoiceProcessingMsg('Opening invoice preview...');
      const { invoice, appointmentInfo } = await fetchInvoiceData();
      setIsInvoiceModalVisible(false);
      await viewInvoicePdf(invoice, appointmentInfo);
    } catch (error) {
      console.error('View invoice error:', error);
      showToast('Could not view invoice PDF');
    } finally {
      setIsInvoiceProcessing(false);
    }
  };

  const handleDownloadInvoice = async () => {
    try {
      setIsInvoiceProcessing(true);
      setInvoiceProcessingMsg('Saving invoice to device...');
      const { invoice, appointmentInfo } = await fetchInvoiceData();
      const res = await downloadInvoicePdf(invoice, appointmentInfo);
      setIsInvoiceModalVisible(false);
      if (res?.success) {
        showToast('Invoice downloaded successfully!');
      } else {
        showToast('Could not save invoice to Downloads');
      }
    } catch (error) {
      console.error('Download invoice error:', error);
      showToast('Could not download invoice PDF');
    } finally {
      setIsInvoiceProcessing(false);
    }
  };

  const handleShareInvoice = async () => {
    try {
      setIsInvoiceProcessing(true);
      setInvoiceProcessingMsg('Sharing invoice...');
      const { invoice, appointmentInfo } = await fetchInvoiceData();
      setIsInvoiceModalVisible(false);
      await shareInvoicePdf(invoice, appointmentInfo);
    } catch (error) {
      console.error('Share invoice error:', error);
      showToast('Could not share invoice PDF');
    } finally {
      setIsInvoiceProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <AppHeader title="Appointment Details" onBackPress={() => navigation.goBack()} />
        <LoadingIndicator />
      </View>
    );
  }

  if (isError || !appointment) {
    return (
      <View style={styles.container}>
        <AppHeader title="Appointment Details" onBackPress={() => navigation.goBack()} />
        <ErrorState message="Couldn't load this appointment" onRetry={refetch} />
      </View>
    );
  }

  const statusColor = STATUS_COLORS[appointment.status ?? ''] ?? Colors.secondaryFontColor;
  const canReview = appointment.status === 'Completed' || appointment.status === 'Visited';
  const isVideoCall = appointment.type === 'Video Consultant';

  const appStatusLower = (appointment.status ?? '').trim().toLowerCase();
  const canReschedule =
    ['pending', 'confirmed', 'rescheduled', 'scheduled', 'booked', 'active', 'approved', 'paid', 'in-process'].includes(appStatusLower) &&
    !['completed', 'visited', 'rejected', 'cancelled', 'canceled'].includes(appStatusLower);

  const handleReschedule = () => {
    const docId =
      appointment.doct_id ||
      (appointment as any)?.doctor_id ||
      (appointment as any)?.doctorId;
    if (docId) {
      const mode = appointment.type === 'Video Consultant' ? 'video' : appointment.type === 'Emergency' ? 'emergency' : 'clinic';
      navigation.navigate('BookAppointment', {
        doctId: String(docId),
        clinicId: appointment.clinic_id,
        initialMode: mode,
        initialMemberId: appointment.patient_id,
        isReschedule: true,
        rescheduledFromAppId: appointment.id,
      });
    } else {
      navigation.navigate('Search');
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader title={`Appointment #${appointment.id ?? ''}`} onBackPress={() => navigation.goBack()} />
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

      {/* Review Modal */}
      <AppointmentReviewModal
        visible={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        doctorName={formatDoctorName(appointment.doct_f_name, appointment.doct_l_name)}
        rating={reviewRating}
        onRatingChange={setReviewRating}
        reviewText={reviewText}
        onChangeReviewText={setReviewText}
        onSubmit={handleSubmitReview}
        isSubmitting={isSubmittingReview}
      />

      {/* Clinic Queue Arrival QR Code Modal */}
      <AppointmentQrModal
        visible={showQrModal}
        onClose={() => setShowQrModal(false)}
        appointment={appointment}
        user={user}
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
