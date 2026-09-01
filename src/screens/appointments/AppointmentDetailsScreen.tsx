import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
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
import type { AppointmentCancellationModel, AppointmentModel } from '../../types';
import { UpcomingStatuses } from '../../types';
import { DateTimeUtils, formatDoctorName, getImageUrl, showToast } from '../../utils';
import {
  downloadInvoicePdf,
  shareInvoicePdf,
  viewInvoicePdf,
  type InvoiceAppointmentInfo,
  type InvoiceData,
} from '../../utils/invoicePdf';

type Props = NativeStackScreenProps<RootStackParamList, 'AppointmentDetails'>;

const STATUS_COLORS: Record<string, string> = {
  Pending: '#F5C518',
  Rescheduled: '#FF9800',
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
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [isInvoiceModalVisible, setIsInvoiceModalVisible] = useState(false);
  const [isInvoiceProcessing, setIsInvoiceProcessing] = useState(false);
  const [invoiceProcessingMsg, setInvoiceProcessingMsg] = useState('Preparing invoice...');

  const appointment: AppointmentModel | null = React.useMemo(() => {
    if (!rawAppointment) return null;
    let target = (rawAppointment as any)?.data ?? (rawAppointment as any)?.response ?? rawAppointment;
    if (Array.isArray(target)) return target[0] ?? null;
    return target ?? null;
  }, [rawAppointment]);

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
              <View style={[styles.infoIconBox, { backgroundColor: '#EFF6FF' }]}>
                <MaterialIcons name="event" size={18} color="#2563EB" />
              </View>
              <View style={styles.infoItemMeta}>
                <Text style={styles.infoItemLabel}>Date</Text>
                <Text style={styles.infoItemValue}>{DateTimeUtils.getDataFormat(appointment.date)}</Text>
              </View>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.infoItemRow}>
              <View style={[styles.infoIconBox, { backgroundColor: '#F0FDF4' }]}>
                <MaterialIcons name="access-time" size={18} color="#16A34A" />
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
              <View style={[styles.infoIconBox, { backgroundColor: '#FFF5EB' }]}>
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
              <View style={[styles.infoIconBox, { backgroundColor: '#F3E8FF' }]}>
                <MaterialIcons name="medical-services" size={18} color="#9333EA" />
              </View>
              <View style={styles.infoItemMeta}>
                <Text style={styles.infoItemLabel}>Department</Text>
                <Text style={styles.infoItemValue}>{appointment.dept_title ?? '--'}</Text>
              </View>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.infoItemRow}>
              <View style={[styles.infoIconBox, { backgroundColor: '#FEF3C7' }]}>
                <MaterialIcons name="person" size={18} color="#D97706" />
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
              <MaterialIcons name="videocam" size={24} color="#FFFFFF" />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.videoBannerTitle}>Video Consultation Ready</Text>
                <Text style={styles.videoBannerSub}>Tap to join doctor on video call</Text>
              </View>
            </View>
            <AppButton title="Join Video Call" onPress={handleJoinCall} style={styles.videoBannerBtn} />
          </View>
        )}

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

        {/* Review Trigger Card */}
        {canReview && (
          <TouchableOpacity style={styles.reviewCard} activeOpacity={0.85} onPress={() => setShowReviewModal(true)}>
            <View style={styles.reviewIconCircle}>
              <MaterialIcons name="star-outline" size={22} color="#D97706" />
            </View>
            <View style={styles.reviewMeta}>
              <Text style={styles.reviewTitle}>Rate & Review Doctor</Text>
              <Text style={styles.reviewSubtitle}>Share your feedback to help others</Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color="#D97706" />
          </TouchableOpacity>
        )}

        {/* Cancellation Section */}
        {isCancellable && (
          <View style={styles.cancelSection}>
            {activeCancelReq ? (
              <TouchableOpacity style={styles.cancelBannerPending} onPress={handleWithdrawCancel} disabled={isWithdrawing}>
                <MaterialIcons name="hourglass-empty" size={18} color="#D97706" />
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
  scrollContent: { padding: 16, paddingBottom: 40 },
  headerStatusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerStatusLeft: {
    justifyContent: 'center',
  },
  headerAppIdLabel: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.secondaryFontColor,
    letterSpacing: 0.5,
  },
  headerAppIdValue: {
    fontSize: 16,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryFontColor,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 13, fontFamily: Typography.fontFamily.bold },
  doctorCard: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  doctorRow: { flexDirection: 'row', alignItems: 'center' },
  avatarWrapper: {
    position: 'relative',
    marginRight: 14,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colors.inputTextBgColor,
    borderWidth: 2,
    borderColor: Colors.primaryColor,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderRadius: 8,
  },
  doctorInfo: { flex: 1, justifyContent: 'center' },
  doctorName: { fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.bold, color: Colors.primaryFontColor },
  specBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF5EB',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  specialization: { fontSize: 11, fontFamily: Typography.fontFamily.medium, color: Colors.primaryColor },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 6 },
  ratingText: { fontSize: 11, fontFamily: Typography.fontFamily.medium, color: Colors.secondaryFontColor },
  infoCard: { padding: 16, borderRadius: 16, marginBottom: 12 },
  infoCardSectionTitle: {
    fontSize: 14,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryFontColor,
    marginBottom: 12,
  },
  infoGridContainer: {
    gap: 10,
  },
  infoItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoItemMeta: {
    flex: 1,
  },
  infoItemLabel: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.secondaryFontColor,
  },
  infoItemValue: {
    fontSize: 13,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryFontColor,
    marginTop: 1,
  },
  infoDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 2,
  },
  videoBanner: {
    backgroundColor: Colors.primaryColor,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  videoBannerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  videoBannerTitle: {
    fontSize: 15,
    fontFamily: Typography.fontFamily.bold,
    color: '#FFFFFF',
  },
  videoBannerSub: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.regular,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  videoBannerBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
  },
  invoiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  invoiceIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFF5EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  invoiceMeta: {
    flex: 1,
  },
  invoiceTitle: {
    fontSize: 13,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryFontColor,
  },
  invoiceSubtitle: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.secondaryFontColor,
    marginTop: 2,
  },
  reviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  reviewIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reviewMeta: { flex: 1 },
  reviewTitle: { fontSize: 13, fontFamily: Typography.fontFamily.bold, color: Colors.primaryFontColor },
  reviewSubtitle: { marginTop: 2, fontSize: 11, fontFamily: Typography.fontFamily.regular, color: Colors.secondaryFontColor },
  cancelSection: { marginTop: 8, alignItems: 'center' },
  cancelBannerPending: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  cancelBtnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  cancelText: { fontSize: 13, fontFamily: Typography.fontFamily.bold, color: Colors.redColor },
  withdrawText: { fontSize: 13, fontFamily: Typography.fontFamily.medium, color: '#D97706' },
  bottomSpacer: { height: 20 },
  dialogOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  dialogBox: { backgroundColor: Colors.white, borderRadius: 16, padding: 20 },
  dialogHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  dialogIconBox: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center' },
  dialogTitle: { fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.bold, color: Colors.primaryFontColor },
  dialogMessage: { marginTop: 4, fontSize: Typography.fontSize.sm, color: Colors.secondaryFontColor, lineHeight: 20 },
  reviewStarsRow: { marginVertical: 14, alignItems: 'center' },
  dialogActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20, gap: 10 },
  dialogBtnCancel: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, backgroundColor: '#F1F5F9' },
  dialogBtnConfirm: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, backgroundColor: Colors.primaryColor },
  dialogBtnTextConfirm: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.bold, color: '#FFFFFF' },
  dialogBtnTextMuted: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.medium, color: Colors.secondaryFontColor },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  infoLabel: { fontSize: Typography.fontSize.sm, color: Colors.secondaryFontColor },
  infoValue: { fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.medium, color: Colors.primaryFontColor },
});
