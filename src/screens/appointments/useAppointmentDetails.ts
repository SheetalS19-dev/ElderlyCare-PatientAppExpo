import type { RouteProp } from '@react-navigation/native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { Linking } from 'react-native';
import { ApiEndpoints, Colors } from '../../constants';
import { useAuth } from '../../context/AuthContext';
import type { RootStackParamList } from '../../navigation/types';
import {
  useAddDoctorReviewMutation,
  useGetAppointmentByIdQuery,
} from '../../redux/apis/appointmentApi';
import { useGetDoctorByIdQuery } from '../../redux/apis/doctorApi';
import type { AppointmentModel } from '../../types';
import { DateTimeUtils, formatDoctorName, showToast } from '../../utils';
import {
  downloadInvoicePdf,
  shareInvoicePdf,
  viewInvoicePdf,
  type InvoiceAppointmentInfo,
  type InvoiceData,
} from '../../utils/invoicePdf';

const STATUS_COLORS: Record<string, string> = {
  Pending: Colors.yellow_F5C518,
  'Approval Pending': Colors.amber_D97706,
  'approval pending': Colors.amber_D97706,
  Rescheduled: Colors.orange_FF9800,
  Rejected: Colors.redColor,
  Confirmed: Colors.greenFontColor,
  Completed: Colors.greenFontColor,
  Visited: Colors.greenFontColor,
  Cancelled: Colors.redColor,
};

export const useAppointmentDetails = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'AppointmentDetails'>>();
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
    const trimmedReview = reviewText.trim();
    if (!trimmedReview) {
      showToast('Please share your experience with the doctor');
      return;
    }
    const words = trimmedReview.split(/\s+/).filter(Boolean).length;
    if (words > 300) {
      showToast('Review cannot exceed 300 words');
      return;
    }
    try {
      await addDoctorReview({
        doctor_id: String(appointment.doct_id ?? ''),
        points: String(reviewRating),
        description: trimmedReview,
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

  const statusColor = appointment ? (STATUS_COLORS[appointment.status ?? ''] ?? Colors.secondaryFontColor) : Colors.secondaryFontColor;
  const canReview = appointment ? (appointment.status === 'Completed' || appointment.status === 'Visited') : false;
  const isVideoCall = appointment?.type === 'Video Consultant';

  const appStatusLower = (appointment?.status ?? '').trim().toLowerCase();
  const canReschedule =
    ['pending', 'confirmed', 'rescheduled', 'scheduled', 'booked', 'active', 'approved', 'paid', 'in-process'].includes(appStatusLower) &&
    !['completed', 'visited', 'rejected', 'cancelled', 'canceled'].includes(appStatusLower);

  const handleReschedule = () => {
    if (!appointment) return;
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
      showToast('Doctor details not available for rescheduling');
    }
  };

  return {
    navigation,
    appId,
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
  };
};
