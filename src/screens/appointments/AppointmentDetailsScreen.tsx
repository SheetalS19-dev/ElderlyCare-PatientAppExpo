import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import QRCode from 'react-native-qrcode-svg';
import { Image, KeyboardAvoidingView, Linking, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  AppButton,
  AppCard,
  AppHeader,
  AppTextField,
  DocumentActionModal,
  ErrorState,
  LoadingIndicator,
  StarRating,
} from '../../components';
import { ApiEndpoints, Colors, Typography } from '../../constants';
import { useAuth } from '../../context/AuthContext';
import type { RootStackParamList } from '../../navigation/types';
import {
  useAddCancellationRequestMutation,
  useAddDoctorReviewMutation,
  useDeleteCancellationRequestMutation,
  useGetAppointmentByIdQuery,
  useGetCancellationHistoryQuery,
} from '../../redux/apis/appointmentApi';
import { useGetDoctorByIdQuery } from '../../redux/apis/doctorApi';
import type { AppointmentCancellationModel, AppointmentModel } from '../../types';
import { UpcomingStatuses } from '../../types';
import { DateTimeUtils, formatDoctorName, getImageUrl, showToast, fs, hs, ws, TYPOGRAPHY } from '../../utils';
import {
  downloadInvoicePdf,
  shareInvoicePdf,
  viewInvoicePdf,
  type InvoiceAppointmentInfo,
  type InvoiceData,
} from '../../utils/invoicePdf';

type Props = NativeStackScreenProps<RootStackParamList, 'AppointmentDetails'>;

const STATUS_COLORS: Record<string, string> = {
  Pending: Colors.yellow_F5C518,
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
  const { data: rawCancellationHistory } = useGetCancellationHistoryQuery(appId);
  const [addCancellationRequest, { isLoading: isCancelling }] = useAddCancellationRequestMutation();
  const [deleteCancellationRequest, { isLoading: isWithdrawing }] = useDeleteCancellationRequestMutation();
  const [addDoctorReview, { isLoading: isSubmittingReview }] = useAddDoctorReviewMutation();

  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [isInvoiceModalVisible, setIsInvoiceModalVisible] = useState(false);
  const [isInvoiceProcessing, setIsInvoiceProcessing] = useState(false);
  const [invoiceProcessingMsg, setInvoiceProcessingMsg] = useState('Preparing invoice...');

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


  const appointment: AppointmentModel | null = React.useMemo(() => {
    if (!rawAppointment) return null;
    let target = (rawAppointment as any)?.data ?? (rawAppointment as any)?.response ?? rawAppointment;
    if (Array.isArray(target)) return target[0] ?? null;
    return target ?? null;
  }, [rawAppointment]);

  const doctId = String(appointment?.doct_id || appointment?.doctor_id || '');
  const { data: rawDoctorData } = useGetDoctorByIdQuery(doctId, { skip: !doctId });
  const doctorData = React.useMemo(() => {
    if (!rawDoctorData) return null;
    return (rawDoctorData as any)?.data ?? rawDoctorData;
  }, [rawDoctorData]);

  const cancellationHistory: AppointmentCancellationModel[] = React.useMemo(() => {
    if (!rawCancellationHistory) return [];
    if (Array.isArray(rawCancellationHistory)) return rawCancellationHistory;
    if (Array.isArray((rawCancellationHistory as any)?.data)) return (rawCancellationHistory as any).data;
    return [];
  }, [rawCancellationHistory]);

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
  const isCancellable = UpcomingStatuses.includes(appointment.status ?? '');
  const activeCancelReq = (cancellationHistory ?? []).find(
    (c: AppointmentCancellationModel) => c.status === 'Pending',
  );
  const canReview = appointment.status === 'Completed' || appointment.status === 'Visited';
  const isVideoCall = appointment.type === 'Video Consultant';

  const handleConfirmCancel = async () => {
    try {
      await addCancellationRequest({ appointment_id: appId, status: 'Pending' }).unwrap();
      showToast('Cancellation request sent');
      setShowCancelConfirm(false);
      refetch();
    } catch {
      showToast('Could not submit cancellation request');
    }
  };

  const handleWithdrawCancel = async () => {
    try {
      await deleteCancellationRequest({ appointment_id: appId }).unwrap();
      showToast('Cancellation request withdrawn');
      refetch();
    } catch {
      showToast('Could not withdraw the request');
    }
  };

  const handleSubmitReview = async () => {
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
      setReviewText('');
      refetch();
    } catch {
      showToast('Could not submit your review');
    }
  };

  const handleJoinCall = () => {
    if (appointment.meeting_link) {
      Linking.openURL(appointment.meeting_link).catch(() => showToast('Could not open the meeting link'));
    }
  };

  const fetchInvoiceData = async () => {
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
        <AppCard style={styles.doctorCard}>
          <View style={styles.doctorRow}>
            <View style={styles.avatarWrapper}>
              <Image
                source={
                  getImageUrl(appointment.doct_image)
                    ? { uri: getImageUrl(appointment.doct_image) }
                    : require('../../../assets/icons/user.png')
                }
                style={styles.avatar}
                resizeMode="cover"
              />
              <View style={styles.verifiedBadge}>
                <MaterialIcons name="verified" size={14} color={Colors.primaryColor} />
              </View>
            </View>

            <View style={styles.doctorInfo}>
              <Text style={styles.doctorName}>
                {formatDoctorName(appointment.doct_f_name, appointment.doct_l_name)}
              </Text>
              {!!appointment.doct_specialization && (
                <View style={styles.specBadge}>
                  <Text style={styles.specialization}>{appointment.doct_specialization}</Text>
                </View>
              )}
              <View style={styles.ratingRow}>
                <StarRating rating={Number(appointment.average_rating ?? 5)} starSize={13} />
                <Text style={styles.ratingText}>
                  {Number(appointment.average_rating ?? 0).toFixed(1)} ({appointment.number_of_reviews ?? 0} reviews)
                </Text>
              </View>
            </View>
          </View>
        </AppCard>

        {/* Structured Info Grid */}
        <AppCard style={styles.infoCard}>
          <Text style={styles.infoCardSectionTitle}>Appointment Information</Text>

          <View style={styles.infoGridContainer}>
            <View style={styles.infoItemRow}>
              <View style={[styles.infoIconBox, { backgroundColor: Colors.lightBlueTint }]}>
                <MaterialIcons name="event" size={18} color={Colors.primaryColor} />
              </View>
              <View style={styles.infoItemMeta}>
                <Text style={styles.infoItemLabel}>Date</Text>
                <Text style={styles.infoItemValue}>{DateTimeUtils.getDataFormat(appointment.date)}</Text>
              </View>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.infoItemRow}>
              <View style={[styles.infoIconBox, { backgroundColor: Colors.green_F0FDF4 }]}>
                <MaterialIcons name="access-time" size={18} color={Colors.green_16A34A} />
              </View>
              <View style={styles.infoItemMeta}>
                <Text style={styles.infoItemLabel}>Time</Text>
                <Text style={styles.infoItemValue}>
                  {DateTimeUtils.formatTimeToAmPm(
                    appointment.time_slots ||
                    (appointment as any).timeSlot ||
                    (appointment as any).appointment_time
                  ) || '--'}
                </Text>
              </View>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.infoItemRow}>
              <View style={[styles.infoIconBox, { backgroundColor: Colors.lightBlueTint }]}>
                <MaterialIcons
                  name={isVideoCall ? 'videocam' : 'local-hospital'}
                  size={18}
                  color={Colors.primaryColor}
                />
              </View>
              <View style={styles.infoItemMeta}>
                <Text style={styles.infoItemLabel}>Consultation Type</Text>
                <Text style={styles.infoItemValue}>{appointment.type ?? '--'}</Text>
              </View>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.infoItemRow}>
              <View style={[styles.infoIconBox, { backgroundColor: Colors.purple_F3E8FF }]}>
                <MaterialIcons name="medical-services" size={18} color={Colors.purple_9333EA} />
              </View>
              <View style={styles.infoItemMeta}>
                <Text style={styles.infoItemLabel}>Department</Text>
                <Text style={styles.infoItemValue}>{appointment.dept_title ?? '--'}</Text>
              </View>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.infoItemRow}>
              <View style={[styles.infoIconBox, { backgroundColor: Colors.lightBlueTint }]}>
                <MaterialIcons name="person" size={18} color={Colors.primaryColor} />
              </View>
              <View style={styles.infoItemMeta}>
                <Text style={styles.infoItemLabel}>Patient Name</Text>
                <Text style={styles.infoItemValue}>
                  {`${appointment.patient_f_name ?? ''} ${appointment.patient_l_name ?? ''}`.trim() || '--'}
                </Text>
              </View>
            </View>
          </View>
        </AppCard>

        {/* Video Call Banner */}
        {isVideoCall && appointment.status === 'Confirmed' && !!appointment.meeting_link && (
          <View style={styles.videoBanner}>
            <View style={styles.videoBannerInfo}>
              <MaterialIcons name="videocam" size={24} color={Colors.white} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.videoBannerTitle}>Video Consultation Ready</Text>
                <Text style={styles.videoBannerSub}>Tap to join doctor on video call</Text>
              </View>
            </View>
            <AppButton title="Join Video Call" onPress={handleJoinCall} style={styles.videoBannerBtn} />
          </View>
        )}

        {/* Queue Arrival & QR Code Card (Web Appointment Details Sync) */}
        <TouchableOpacity style={styles.qrCard} activeOpacity={0.85} onPress={() => setShowQrModal(true)}>
          <View style={styles.qrIconCircle}>
            <MaterialIcons name="qr-code-2" size={22} color={Colors.primaryColor} />
          </View>
          <View style={styles.qrMeta}>
            <Text style={styles.qrTitle}>Clinic Queue QR Code</Text>
            <Text style={styles.qrSubtitle}>Scan QR code at clinic for queue number generation</Text>
          </View>
          <MaterialIcons name="chevron-right" size={22} color={Colors.primaryColor} />
        </TouchableOpacity>

        {/* Invoice Action Card */}
        <TouchableOpacity style={styles.invoiceCard} activeOpacity={0.85} onPress={handleOpenInvoiceModal}>
          <View style={styles.invoiceIconCircle}>
            <MaterialIcons name="receipt-long" size={22} color={Colors.primaryColor} />
          </View>
          <View style={styles.invoiceMeta}>
            <Text style={styles.invoiceTitle}>Invoice & Payment Receipt</Text>
            <Text style={styles.invoiceSubtitle}>View, download, or share invoice PDF</Text>
          </View>
          <MaterialIcons name="chevron-right" size={22} color={Colors.primaryColor} />
        </TouchableOpacity>

        {/* Prescription Vault Quick Card */}
        <TouchableOpacity
          style={styles.invoiceCard}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('PrescriptionList')}
        >
          <View style={styles.invoiceIconCircle}>
            <MaterialIcons name="description" size={22} color={Colors.primaryColor} />
          </View>
          <View style={styles.invoiceMeta}>
            <Text style={styles.invoiceTitle}>Issued Digital Prescriptions</Text>
            <Text style={styles.invoiceSubtitle}>View prescriptions for this appointment</Text>
          </View>
          <MaterialIcons name="chevron-right" size={22} color={Colors.primaryColor} />
        </TouchableOpacity>

        {/* Medical Files & Reports Quick Card */}
        <TouchableOpacity
          style={styles.invoiceCard}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('PatientFile')}
        >
          <View style={styles.invoiceIconCircle}>
            <MaterialIcons name="folder-open" size={22} color={Colors.primaryColor} />
          </View>
          <View style={styles.invoiceMeta}>
            <Text style={styles.invoiceTitle}>Patient Files & Medical History</Text>
            <Text style={styles.invoiceSubtitle}>Uploaded diagnostic reports & records</Text>
          </View>
          <MaterialIcons name="chevron-right" size={22} color={Colors.primaryColor} />
        </TouchableOpacity>

        {/* Contact Us Card */}
        {(() => {
          const docPhone =
            (appointment as any).doct_phone ||
            (appointment as any).doct_mobile ||
            (appointment as any).doctor_phone ||
            (appointment as any).phone ||
            doctorData?.phone ||
            doctorData?.mobile ||
            '';

          const docEmail =
            (appointment as any).doct_email ||
            (appointment as any).doctor_email ||
            (appointment as any).email ||
            doctorData?.email ||
            '';

          const clinicName =
            appointment.clinic_title ||
            (appointment as any).clinic_name ||
            (appointment as any).clinicName ||
            doctorData?.clinic_title ||
            doctorData?.clinic_name ||
            '';

          const rawAddress =
            (appointment as any).clinic_address ||
            (appointment as any).clinics_address ||
            doctorData?.clinic_address ||
            doctorData?.address ||
            '';

          const clinicAddr =
            clinicName && rawAddress && !rawAddress.toLowerCase().includes(clinicName.toLowerCase())
              ? `${clinicName}, ${rawAddress}`
              : rawAddress || clinicName;

          if (!docPhone && !docEmail && !clinicAddr) {
            return null;
          }

          return (
            <AppCard style={styles.contactUsCard}>
              <Text style={styles.contactUsTitle}>Contact Us</Text>

              {/* Phone Row */}
              {!!docPhone && (
                <TouchableOpacity
                  style={styles.contactRow}
                  activeOpacity={0.75}
                  onPress={() => {
                    Linking.openURL(`tel:${docPhone}`).catch(() => showToast('Could not initiate call'));
                  }}
                >
                  <View style={styles.contactIconCircle}>
                    <Ionicons name="call-outline" size={fs(18)} color={Colors.primaryColor} />
                  </View>
                  <View style={styles.contactTextGroup}>
                    <Text style={styles.contactLabel}>Phone</Text>
                    <Text style={styles.contactValue}>{docPhone}</Text>
                  </View>
                </TouchableOpacity>
              )}

              {/* Email Row */}
              {!!docEmail && (
                <TouchableOpacity
                  style={styles.contactRow}
                  activeOpacity={0.75}
                  onPress={() => {
                    Linking.openURL(`mailto:${docEmail}`).catch(() => showToast('Could not open mail app'));
                  }}
                >
                  <View style={styles.contactIconCircle}>
                    <Ionicons name="mail-outline" size={fs(18)} color={Colors.primaryColor} />
                  </View>
                  <View style={styles.contactTextGroup}>
                    <Text style={styles.contactLabel}>Email</Text>
                    <Text style={styles.contactValue}>{docEmail}</Text>
                  </View>
                </TouchableOpacity>
              )}

              {/* Clinic Address Row */}
              {!!clinicAddr && (
                <TouchableOpacity
                  style={[styles.contactRow, { marginBottom: 0 }]}
                  activeOpacity={0.75}
                  onPress={() => {
                    Linking.openURL(`http://maps.google.com/maps?q=${encodeURIComponent(clinicAddr)}`).catch(() => showToast('Could not open map'));
                  }}
                >
                  <View style={styles.contactIconCircle}>
                    <Ionicons name="location-outline" size={fs(18)} color={Colors.primaryColor} />
                  </View>
                  <View style={styles.contactTextGroup}>
                    <Text style={styles.contactLabel}>Clinic Address</Text>
                    <Text style={styles.contactValue} numberOfLines={3}>{clinicAddr}</Text>
                  </View>
                </TouchableOpacity>
              )}
            </AppCard>
          );
        })()}


        {/* Review Trigger Card */}
        {canReview && (
          <TouchableOpacity style={styles.reviewCard} activeOpacity={0.85} onPress={() => setShowReviewModal(true)}>
            <View style={styles.reviewIconCircle}>
              <MaterialIcons name="star-outline" size={22} color={Colors.primaryColor} />
            </View>
            <View style={styles.reviewMeta}>
              <Text style={styles.reviewTitle}>Rate & Review Doctor</Text>
              <Text style={styles.reviewSubtitle}>Share your feedback to help others</Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={Colors.primaryColor} />
          </TouchableOpacity>
        )}

        {/* Cancellation Section */}
        {isCancellable && (
          <View style={styles.cancelSection}>
            {activeCancelReq ? (
              <TouchableOpacity style={styles.cancelBannerPending} onPress={handleWithdrawCancel} disabled={isWithdrawing}>
                <MaterialIcons name="hourglass-empty" size={18} color={Colors.primaryColor} />
                <Text style={styles.withdrawText}>
                  {isWithdrawing ? 'Withdrawing request…' : 'Cancellation requested — tap to withdraw'}
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.cancelBtnOutline} onPress={() => setShowCancelConfirm(true)}>
                <MaterialIcons name="cancel" size={16} color={Colors.redColor} />
                <Text style={styles.cancelText}>Cancel Appointment</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Cancel confirmation */}
      <Modal visible={showCancelConfirm} transparent animationType="fade" onRequestClose={() => setShowCancelConfirm(false)}>
        <View style={styles.dialogOverlay}>
          <View style={styles.dialogBox}>
            <View style={styles.dialogHeaderRow}>
              <View style={styles.dialogIconBox}>
                <MaterialIcons name="warning" size={24} color={Colors.redColor} />
              </View>
              <Text style={styles.dialogTitle}>Cancel Appointment?</Text>
            </View>
            <Text style={styles.dialogMessage}>Are you sure you want to cancel this appointment?</Text>
            <View style={styles.dialogActions}>
              <TouchableOpacity style={styles.dialogBtnCancel} onPress={() => setShowCancelConfirm(false)}>
                <Text style={styles.dialogBtnTextMuted}>No, Keep</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dialogBtnConfirm} onPress={handleConfirmCancel} disabled={isCancelling}>
                <Text style={styles.dialogBtnTextConfirm}>{isCancelling ? 'Processing…' : 'Yes, Cancel'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Review modal */}
      <Modal visible={showReviewModal} transparent animationType="slide" onRequestClose={() => setShowReviewModal(false)}>
        <KeyboardAvoidingView style={styles.dialogOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.dialogBox}>
            <Text style={styles.dialogTitle}>Give review to {formatDoctorName(appointment.doct_f_name, appointment.doct_l_name)}</Text>
            <View style={styles.reviewStarsRow}>
              <StarRating rating={reviewRating} starSize={28} readOnly={false} onRatingChange={setReviewRating} />
            </View>
            <AppTextField
              placeholder="Share your experience..."
              value={reviewText}
              onChangeText={setReviewText}
              multiline
              numberOfLines={3}
            />
            <View style={styles.dialogActions}>
              <TouchableOpacity style={styles.dialogBtnCancel} onPress={() => setShowReviewModal(false)}>
                <Text style={styles.dialogBtnTextMuted}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dialogBtnConfirm} onPress={handleSubmitReview} disabled={isSubmittingReview}>
                <Text style={styles.dialogBtnTextConfirm}>{isSubmittingReview ? 'Submitting…' : 'Submit Review'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Clinic Queue Arrival QR Code Modal */}
      <Modal visible={showQrModal} transparent animationType="slide" onRequestClose={() => setShowQrModal(false)}>
        <View style={styles.qrModalOverlay}>
          <View style={styles.qrModalContainer}>
            {/* Header */}
            <View style={styles.qrModalHeader}>
              <Text style={styles.qrModalTitle}>Appointment Status</Text>
              <TouchableOpacity onPress={() => setShowQrModal(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <MaterialIcons name="close" size={fs(22)} color={Colors.slate_1E293B} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.qrModalScrollContent}>
              {/* Top Verified & ID */}
              <View style={styles.qrTopSection}>
                <View style={styles.qrVerifiedIconBox}>
                  <MaterialIcons name="verified" size={fs(32)} color={Colors.primaryColor} />
                </View>
                <Text style={styles.qrApptIdText}>Appointment ID: #{appointment.id}</Text>
                <View style={styles.qrTypePill}>
                  <Text style={styles.qrTypePillText}>{appointment.type || 'Video Consultant'}</Text>
                </View>
              </View>

              {/* QR Code Container */}
              <View style={styles.qrCodeBox}>
                {(() => {
                  const qrPayload = JSON.stringify({
                    appId: appointment.id,
                    doct: formatDoctorName(appointment.doct_f_name, appointment.doct_l_name) || appointment.doctor_name,
                    patient: `${appointment.patient_f_name ?? ''} ${appointment.patient_l_name ?? ''}`.trim() || appointment.patient_name || (user as any)?.name || user?.f_name,
                    date: appointment.date || (appointment as any).appointment_date,
                    time: appointment.time_slots || (appointment as any).appointment_time,
                    type: appointment.type || 'Consultation',
                  });

                  return (
                    <QRCode
                      value={qrPayload || `APPOINTMENT_${appointment.id}`}
                      size={fs(140)}
                      color={Colors.black}
                      backgroundColor={Colors.white}
                    />
                  );
                })()}
              </View>

              {/* Success Headline & Instruction */}
              <Text style={styles.qrSuccessTitle}>Your Appointment Booked successfully!</Text>
              <Text style={styles.qrSuccessSub}>
                Visit the clinic and scan the provided QR code to instantly generate your appointment queue number
              </Text>

              {/* Info Rows */}
              <View style={styles.qrDetailsList}>
                {/* Row 1: Doctor */}
                <View style={styles.qrDetailCard}>
                  <Text style={styles.qrDetailLabel}>Doctor</Text>
                  <Text style={styles.qrDetailValue}>
                    {formatDoctorName(appointment.doct_f_name, appointment.doct_l_name) || appointment.doctor_name || '--'}
                  </Text>
                </View>

                {/* Row 2: Date & Time */}
                {(() => {
                  const rawDateVal =
                    appointment.date ||
                    (appointment as any).appointment_date ||
                    (appointment as any).appointmentDate;

                  const rawTimeVal =
                    appointment.time_slots ||
                    (appointment as any).appointment_time ||
                    (appointment as any).timeSlot ||
                    (appointment as any).time;

                  const formatDisplayDate = (rawDate?: string) => {
                    if (!rawDate) return '';
                    const str = String(rawDate).trim();
                    if (!str) return '';

                    const clean = str.split('T')[0].split(' ')[0];
                    if (clean.includes('-')) {
                      const parts = clean.split('-');
                      if (parts.length === 3 && parts[0].length === 4) {
                        return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
                      }
                    } else if (clean.includes('/')) {
                      const parts = clean.split('/');
                      if (parts.length === 3) {
                        if (parts[0].length === 4) {
                          return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
                        } else if (parts[2].length === 4) {
                          return `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[2]}`;
                        }
                      }
                    }
                    return DateTimeUtils.getDataFormat(str) || str;
                  };

                  const formatDisplayTime = (rawTime?: string) => {
                    if (!rawTime) return '';
                    const str = String(rawTime).trim();
                    if (!str) return '';
                    return DateTimeUtils.formatTimeToAmPm(str) || str;
                  };

                  const dateStr = formatDisplayDate(rawDateVal);
                  const timeStr = formatDisplayTime(rawTimeVal);
                  const dateTimeStr = [dateStr, timeStr].filter(Boolean).join(' | ') || '--';

                  return (
                    <View style={styles.qrDetailCard}>
                      <Text style={styles.qrDetailLabel}>Date & Time</Text>
                      <Text style={styles.qrDetailValue}>{dateTimeStr}</Text>
                    </View>
                  );
                })()}

                {/* Row 3: Patient Name */}
                <View style={styles.qrDetailCard}>
                  <Text style={styles.qrDetailLabel}>Patient Name</Text>
                  <Text style={styles.qrDetailValue}>
                    {`${appointment.patient_f_name ?? ''} ${appointment.patient_l_name ?? ''}`.trim() ||
                      appointment.patient_name ||
                      (appointment as any).patientName ||
                      (user as any)?.name ||
                      user?.f_name ||
                      '--'}
                  </Text>
                </View>
              </View>

              {/* Divider & Footer Calendar Buttons */}
              <View style={styles.qrDivider} />
              <View style={styles.qrCalendarRow}>
                <TouchableOpacity style={styles.qrCalBtn} onPress={handleAddToGoogleCalendar} activeOpacity={0.8}>
                  <Ionicons name="logo-google" size={fs(14)} color={Colors.blue_4285F4} />
                  <Text style={styles.qrCalBtnText}>Add to Calender</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.qrCalBtn} onPress={handleAddToGoogleCalendar} activeOpacity={0.8}>
                  <Ionicons name="logo-apple" size={fs(14)} color={Colors.black} />
                  <Text style={styles.qrCalBtnText}>Add to Calender</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>


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

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgColor },
  scrollContent: { padding: ws(16), paddingBottom: hs(40) },
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
  statusDot: { width: ws(8), height: ws(8), aspectRatio: 1, borderRadius: 999, overflow: 'hidden' },
  statusText: { fontSize: fs(13), ...TYPOGRAPHY.bold },
  doctorCard: {
    borderRadius: fs(16),
    padding: ws(14),
    marginBottom: hs(12),
  },
  doctorRow: { flexDirection: 'row', alignItems: 'center' },
  avatarWrapper: {
    position: 'relative',
    marginRight: ws(14),
  },
  avatar: {
    width: ws(68),
    height: ws(68),
    aspectRatio: 1,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: Colors.inputTextBgColor,
    borderWidth: 2,
    borderColor: Colors.primaryColor,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.white,
    width: ws(20),
    height: ws(20),
    aspectRatio: 1,
    borderRadius: 999,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.white,
    elevation: 2,
  },
  doctorInfo: { flex: 1, justifyContent: 'center' },
  doctorName: { fontSize: fs(Typography.fontSize.base), ...TYPOGRAPHY.bold, color: Colors.primaryFontColor },
  specBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.lightBlueTint,
    paddingHorizontal: ws(8),
    paddingVertical: hs(2),
    borderRadius: fs(6),
    marginTop: hs(4),
  },
  specialization: { fontSize: fs(11), ...TYPOGRAPHY.medium, color: Colors.primaryColor },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: hs(6), gap: ws(6) },
  ratingText: { fontSize: fs(11), ...TYPOGRAPHY.medium, color: Colors.secondaryFontColor },
  infoCard: { padding: ws(16), borderRadius: fs(16), marginBottom: hs(12) },
  infoCardSectionTitle: {
    fontSize: fs(14),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
    marginBottom: hs(12),
  },
  infoGridContainer: {
    gap: hs(10),
  },
  infoItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIconBox: {
    width: ws(36),
    height: hs(36),
    borderRadius: fs(10),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ws(12),
  },
  infoItemMeta: {
    flex: 1,
  },
  infoItemLabel: {
    fontSize: fs(11),
    ...TYPOGRAPHY.medium,
    color: Colors.secondaryFontColor,
  },
  infoItemValue: {
    fontSize: fs(13),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
    marginTop: hs(1),
  },
  infoDivider: {
    height: 1,
    backgroundColor: Colors.slate_F1F5F9,
    marginVertical: hs(2),
  },
  videoBanner: {
    backgroundColor: Colors.primaryColor,
    borderRadius: fs(16),
    padding: ws(16),
    marginBottom: hs(12),
  },
  videoBannerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hs(12),
  },
  videoBannerTitle: {
    fontSize: fs(15),
    ...TYPOGRAPHY.bold,
    color: Colors.white,
  },
  videoBannerSub: {
    fontSize: fs(12),
    ...TYPOGRAPHY.regular,
    color: 'rgba(255,255,255,0.85)',
    marginTop: hs(2),
  },
  videoBannerBtn: {
    backgroundColor: Colors.white,
    borderRadius: fs(10),
  },
  invoiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: fs(16),
    padding: ws(14),
    marginBottom: hs(12),
    borderWidth: 1,
    borderColor: Colors.borderColor,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: hs(2) },
    shadowOpacity: 0.04,
    shadowRadius: fs(4),
    elevation: 2,
  },
  invoiceIconCircle: {
    width: ws(42),
    height: ws(42),
    aspectRatio: 1,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: Colors.lightBlueTint,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ws(12),
  },
  invoiceMeta: {
    flex: 1,
  },
  invoiceTitle: {
    fontSize: fs(13),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
  },
  invoiceSubtitle: {
    fontSize: fs(11),
    ...TYPOGRAPHY.regular,
    color: Colors.secondaryFontColor,
    marginTop: hs(2),
  },
  reviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: fs(16),
    padding: ws(14),
    marginBottom: hs(12),
    borderWidth: 1,
    borderColor: Colors.lightBlueBorder,
  },
  reviewIconCircle: {
    width: ws(42),
    height: ws(42),
    aspectRatio: 1,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: Colors.lightBlueTint,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ws(12),
  },
  reviewMeta: { flex: 1 },
  reviewTitle: { fontSize: fs(13), ...TYPOGRAPHY.bold, color: Colors.primaryFontColor },
  reviewSubtitle: { marginTop: hs(2), fontSize: fs(11), ...TYPOGRAPHY.regular, color: Colors.secondaryFontColor },
  cancelSection: { marginTop: hs(8), alignItems: 'center' },
  cancelBannerPending: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(6),
    backgroundColor: Colors.lightBlueTint,
    paddingHorizontal: ws(14),
    paddingVertical: hs(10),
    borderRadius: fs(10),
  },
  cancelBtnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(6),
    paddingVertical: hs(10),
    paddingHorizontal: ws(16),
  },
  cancelText: { fontSize: fs(13), ...TYPOGRAPHY.bold, color: Colors.redColor },
  withdrawText: { fontSize: fs(13), ...TYPOGRAPHY.medium, color: Colors.primaryColor },
  bottomSpacer: { height: hs(20) },
  dialogOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'center', padding: ws(24) },
  dialogBox: { backgroundColor: Colors.white, borderRadius: fs(16), padding: ws(20) },
  dialogHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: ws(10), marginBottom: hs(8) },
  dialogIconBox: { width: ws(36), height: ws(36), aspectRatio: 1, borderRadius: 999, overflow: 'hidden', backgroundColor: Colors.red_FEE2E2, justifyContent: 'center', alignItems: 'center' },
  dialogTitle: { fontSize: fs(Typography.fontSize.md), ...TYPOGRAPHY.bold, color: Colors.primaryFontColor },
  dialogMessage: { marginTop: hs(4), fontSize: fs(Typography.fontSize.sm), color: Colors.secondaryFontColor, lineHeight: hs(20) },
  reviewStarsRow: { marginVertical: hs(14), alignItems: 'center' },
  dialogActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: hs(20), gap: ws(10) },
  dialogBtnCancel: { paddingHorizontal: ws(16), paddingVertical: hs(10), borderRadius: fs(8), backgroundColor: Colors.slate_F1F5F9 },
  dialogBtnConfirm: { paddingHorizontal: ws(16), paddingVertical: hs(10), borderRadius: fs(8), backgroundColor: Colors.primaryColor },
  dialogBtnTextConfirm: { fontSize: fs(Typography.fontSize.sm), ...TYPOGRAPHY.bold, color: Colors.white },
  dialogBtnTextMuted: { fontSize: fs(Typography.fontSize.sm), ...TYPOGRAPHY.medium, color: Colors.secondaryFontColor },
  infoBtnTextConfirm: { fontSize: fs(Typography.fontSize.sm), ...TYPOGRAPHY.bold, color: Colors.white },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: hs(6) },
  infoLabel: { fontSize: fs(Typography.fontSize.sm), color: Colors.secondaryFontColor },
  infoValue: { fontSize: fs(Typography.fontSize.sm), ...TYPOGRAPHY.medium, color: Colors.primaryFontColor },

  /* QR Code & Web Appointment Sync Styles */
  qrCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lightBlueTint,
    borderRadius: fs(16),
    padding: ws(14),
    marginBottom: hs(12),
    borderWidth: 1,
    borderColor: Colors.lightBlueBorder,
  },
  qrIconCircle: {
    width: ws(42),
    height: ws(42),
    aspectRatio: 1,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ws(12),
  },
  qrMeta: {
    flex: 1,
  },
  qrTitle: {
    fontSize: fs(13),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
  },
  qrSubtitle: {
    fontSize: fs(11),
    ...TYPOGRAPHY.regular,
    color: Colors.secondaryFontColor,
    marginTop: hs(2),
  },
  qrModalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: ws(16),
  },
  qrModalContainer: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: Colors.white,
    borderRadius: fs(20),
    overflow: 'hidden',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: hs(4) },
    shadowOpacity: 0.2,
    shadowRadius: fs(10),
    elevation: 8,
  },
  qrModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ws(18),
    paddingVertical: hs(14),
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderColor,
  },
  qrModalTitle: {
    fontSize: fs(16),
    ...TYPOGRAPHY.bold,
    color: Colors.slate_0F172A,
  },
  qrModalScrollContent: {
    padding: ws(18),
    alignItems: 'center',
  },
  qrTopSection: {
    alignItems: 'center',
    marginBottom: hs(12),
  },
  qrVerifiedIconBox: {
    marginBottom: hs(4),
  },
  qrApptIdText: {
    fontSize: fs(15),
    ...TYPOGRAPHY.bold,
    color: Colors.slate_0F172A,
    marginBottom: hs(6),
  },
  qrTypePill: {
    backgroundColor: Colors.green_00C853,
    paddingHorizontal: ws(10),
    paddingVertical: hs(4),
    borderRadius: fs(6),
  },
  qrTypePillText: {
    fontSize: fs(11),
    ...TYPOGRAPHY.bold,
    color: Colors.white,
  },
  qrCodeBox: {
    width: ws(170),
    height: ws(170),
    aspectRatio: 1,
    borderRadius: fs(16),
    borderWidth: 1,
    borderColor: Colors.borderColor,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: hs(10),
  },
  qrSuccessTitle: {
    fontSize: fs(16),
    ...TYPOGRAPHY.bold,
    color: Colors.slate_0F172A,
    textAlign: 'center',
    marginTop: hs(4),
  },
  qrSuccessSub: {
    fontSize: fs(12),
    ...TYPOGRAPHY.regular,
    color: Colors.slate_64748B,
    textAlign: 'center',
    marginTop: hs(6),
    marginBottom: hs(16),
    lineHeight: hs(18),
    paddingHorizontal: ws(8),
  },
  qrDetailsList: {
    width: '100%',
    gap: hs(8),
    marginBottom: hs(14),
  },
  qrDetailCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: fs(10),
    borderWidth: 1,
    borderColor: Colors.borderColor,
    paddingHorizontal: ws(14),
    paddingVertical: hs(12),
  },
  qrDetailLabel: {
    fontSize: fs(12),
    ...TYPOGRAPHY.medium,
    color: Colors.slate_64748B,
  },
  qrDetailValue: {
    fontSize: fs(13),
    ...TYPOGRAPHY.bold,
    color: Colors.slate_0F172A,
  },
  qrDateTimeValGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qrDivider: {
    width: '100%',
    height: 1,
    backgroundColor: Colors.borderColor,
    marginVertical: hs(12),
  },
  qrCalendarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ws(10),
    width: '100%',
  },
  qrCalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(6),
    backgroundColor: Colors.slate_F1F5F9,
    paddingHorizontal: ws(12),
    paddingVertical: hs(8),
    borderRadius: fs(8),
    borderWidth: 1,
    borderColor: Colors.borderColor,
  },
  qrCalBtnText: {
    fontSize: fs(11),
    ...TYPOGRAPHY.bold,
    color: Colors.slate_0F172A,
  },
  contactUsCard: {
    backgroundColor: Colors.white,
    borderRadius: fs(18),
    padding: ws(18),
    marginBottom: hs(14),
    borderWidth: 1,
    borderColor: Colors.borderColor,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: hs(2) },
    shadowOpacity: 0.04,
    shadowRadius: fs(6),
    elevation: 2,
  },
  contactUsTitle: {
    fontSize: fs(16),
    ...TYPOGRAPHY.bold,
    color: Colors.slate_0F172A,
    marginBottom: hs(16),
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: hs(16),
  },
  contactIconCircle: {
    width: ws(40),
    height: ws(40),
    aspectRatio: 1,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: Colors.lightBlueTint,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ws(14),
  },
  contactTextGroup: {
    flex: 1,
  },
  contactLabel: {
    fontSize: fs(12),
    ...TYPOGRAPHY.medium,
    color: Colors.slate_64748B,
    marginBottom: hs(2),
  },
  contactValue: {
    fontSize: fs(14),
    ...TYPOGRAPHY.bold,
    color: Colors.slate_0F172A,
    lineHeight: hs(20),
  },
  callClinicBtnText: {
    fontSize: fs(12),
    ...TYPOGRAPHY.bold,
    color: Colors.white,
  },
});

