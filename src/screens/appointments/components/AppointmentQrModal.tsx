import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { memo } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Colors } from '../../../constants';
import type { AppointmentModel } from '../../../types';
import { DateTimeUtils, formatDoctorName, fs, hs, TYPOGRAPHY, ws } from '../../../utils';

interface AppointmentQrModalProps {
  visible: boolean;
  onClose: () => void;
  appointment: AppointmentModel;
  user?: any;
  onAddToCalendar: () => void;
  onRebook?: () => void;
  onBookConsultation?: () => void;
}

export const AppointmentQrModal = memo(({
  visible,
  onClose,
  appointment,
  user,
  onAddToCalendar,
  onRebook,
  onBookConsultation,
}: AppointmentQrModalProps) => {
  const patientName =
    `${appointment.patient_f_name ?? ''} ${appointment.patient_l_name ?? ''}`.trim() ||
    appointment.patient_name ||
    (appointment as any).patientName ||
    (user as any)?.name ||
    user?.f_name ||
    '--';

  const doctorName =
    formatDoctorName(appointment.doct_f_name, appointment.doct_l_name) ||
    appointment.doctor_name ||
    '--';

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
    return DateTimeUtils.getDataFormat(rawDate);
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
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.qrModalOverlay}>
        <View style={styles.qrModalContainer}>
          {/* Header */}
          <View style={styles.qrModalHeader}>
            <Text style={styles.qrModalTitle}>Appointment Status</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <MaterialIcons name="close" size={fs(22)} color={Colors.slate_1E293B} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.qrModalScrollContent}>
            {/* Top Verified & ID */}
            <View style={styles.qrTopSection}>
              <View style={styles.qrConfirmedBadge}>
                <Ionicons name="checkmark-circle" size={fs(16)} color={Colors.green_16A34A} />
                <Text style={styles.qrConfirmedBadgeText}>Confirmed Booking</Text>
              </View>
              <Text style={styles.qrApptIdText}>Appointment ID: #{appointment.id}</Text>
              <View style={styles.qrTypePill}>
                <Text style={styles.qrTypePillText}>{appointment.type || 'Video Consultant'}</Text>
              </View>
            </View>

            {/* QR Code Container */}
            <View style={styles.qrCodeBox}>
              <QRCode
                value={String(appointment.id || 'APPOINTMENT')}
                size={fs(140)}
                color={Colors.black}
                backgroundColor={Colors.white}
                ecl="H"
              />
            </View>

            {/* Success Headline & Instruction */}
            <Text style={styles.qrSuccessTitle}>Your Appointment Booked successfully!</Text>
            <Text style={styles.qrSuccessSub}>
              Visit the clinic and scan the provided QR code to instantly generate your appointment queue number
            </Text>

            {/* Info Rows */}
            <View style={styles.qrDetailsList}>
              {/* Row 1: Patient Name */}
              <View style={styles.qrDetailCard}>
                <Text style={styles.qrDetailLabel}>Patient</Text>
                <Text style={styles.qrDetailValue}>{patientName}</Text>
              </View>

              {/* Row 2: Doctor */}
              <View style={styles.qrDetailCard}>
                <Text style={styles.qrDetailLabel}>Doctor</Text>
                <Text style={styles.qrDetailValue}>{doctorName}</Text>
              </View>

              {/* Row 3: Date & Time */}
              <View style={styles.qrDetailCard}>
                <Text style={styles.qrDetailLabel}>Date & Time</Text>
                <Text style={styles.qrDetailValue}>{dateTimeStr}</Text>
              </View>
            </View>

            {/* Divider & Footer Calendar Buttons */}
            <View style={styles.qrDivider} />
            <View style={styles.qrCalendarRow}>
              <TouchableOpacity style={styles.qrCalBtn} onPress={onAddToCalendar} activeOpacity={0.8}>
                <Ionicons name="logo-google" size={fs(14)} color={Colors.blue_4285F4} />
                <Text style={styles.qrCalBtnText}>Add to Calender</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.qrCalBtn} onPress={onAddToCalendar} activeOpacity={0.8}>
                <Ionicons name="logo-apple" size={fs(14)} color={Colors.black} />
                <Text style={styles.qrCalBtnText}>Add to Calender</Text>
              </TouchableOpacity>
            </View>

            {/* Consultation Result Actions: Rebook & Book a Consultation */}
            {(!!onRebook || !!onBookConsultation) && (
              <View style={styles.qrActionButtonsRow}>
                {!!onRebook && (
                  <TouchableOpacity
                    style={styles.qrRebookBtn}
                    activeOpacity={0.85}
                    onPress={() => {
                      onClose();
                      onRebook();
                    }}
                  >
                    <MaterialIcons name="sync" size={fs(16)} color={Colors.primaryColor} />
                    <Text style={styles.qrRebookBtnText}>Rebook</Text>
                  </TouchableOpacity>
                )}

                {!!onBookConsultation && (
                  <TouchableOpacity
                    style={styles.qrBookConsultationBtn}
                    activeOpacity={0.85}
                    onPress={() => {
                      onClose();
                      onBookConsultation();
                    }}
                  >
                    <MaterialIcons name="add" size={fs(16)} color={Colors.white} />
                    <Text style={styles.qrBookConsultationBtnText}>Book a Consultation</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  qrModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: ws(20),
  },
  qrModalContainer: {
    backgroundColor: Colors.white,
    width: '100%',
    maxHeight: '85%',
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
  qrConfirmedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: ws(12),
    paddingVertical: hs(6),
    borderRadius: fs(20),
    marginBottom: hs(8),
    gap: ws(6),
  },
  qrConfirmedBadgeText: {
    fontSize: fs(12),
    ...TYPOGRAPHY.bold,
    color: Colors.green_16A34A,
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
  qrActionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(10),
    width: '100%',
    marginTop: hs(14),
  },
  qrRebookBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ws(6),
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: Colors.primaryColor,
    paddingVertical: hs(11),
    borderRadius: fs(10),
  },
  qrRebookBtnText: {
    fontSize: fs(13),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryColor,
  },
  qrBookConsultationBtn: {
    flex: 1.3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ws(6),
    backgroundColor: Colors.primaryColor,
    paddingVertical: hs(11),
    borderRadius: fs(10),
    shadowColor: Colors.primaryColor,
    shadowOffset: { width: 0, height: hs(2) },
    shadowOpacity: 0.2,
    shadowRadius: fs(4),
    elevation: 2,
  },
  qrBookConsultationBtnText: {
    fontSize: fs(13),
    ...TYPOGRAPHY.bold,
    color: Colors.white,
  },
});
