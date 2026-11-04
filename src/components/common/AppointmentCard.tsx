import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants';
import type { AppointmentModel } from '../../types';
import { DateTimeUtils, formatDoctorName, getImageUrl } from '../../utils';
import { fs, hs, ws } from '../../utils/metrics';
import { TYPOGRAPHY } from '../../utils/typography';

interface AppointmentCardProps {
  appointment: AppointmentModel;
  onPress: () => void;
  onRebook?: () => void;
}

const getMonthAbbrev = (monthNum: number): string => {
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  return months[monthNum - 1] || '---';
};

const parseAppointmentDate = (rawDate?: string) => {
  if (!rawDate) return { yearStr: '----', monthStr: '---', dayStr: '--' };

  const str = String(rawDate).trim();
  const cleanDate = str.split('T')[0].split(' ')[0];
  const parts = cleanDate.split('-');

  if (parts.length >= 3) {
    const yearStr = parts[0];
    const monthNum = parseInt(parts[1], 10);
    const monthStr = getMonthAbbrev(monthNum);
    const dayStr = String(parseInt(parts[2], 10)).padStart(2, '0');
    return { yearStr, monthStr, dayStr };
  }

  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    return {
      yearStr: String(d.getFullYear()),
      monthStr: getMonthAbbrev(d.getMonth() + 1),
      dayStr: String(d.getDate()).padStart(2, '0'),
    };
  }

  return { yearStr: '----', monthStr: '---', dayStr: '--' };
};

const getStatusBadge = (status?: string) => {
  const s = (status || '').toLowerCase().trim();
  if (s === 'approval pending' || s === 'approval_pending' || s === 'approvalpending') {
    return { bg: '#FEF3C7', color: '#D97706', label: 'Approval Pending' };
  }
  if (s === 'pending') {
    return { bg: '#FEF3C7', color: '#D97706', label: 'Pending' };
  }
  if (s === 'rescheduled') {
    return { bg: '#FFEDD5', color: '#EA580C', label: 'Rescheduled' };
  }
  if (s === 'rejected' || s === 'cancelled' || s === 'canceled') {
    return { bg: '#FEE2E2', color: '#DC2626', label: 'Cancelled' };
  }
  if (s === 'confirmed') {
    return { bg: '#DCFCE7', color: '#15803D', label: 'Confirmed' };
  }
  if (s === 'completed' || s === 'visited') {
    return { bg: '#EFF6FF', color: '#2563EB', label: 'Completed' };
  }
  return { bg: '#F1F5F9', color: '#64748B', label: status || 'Scheduled' };
};

export const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  onPress,
  onRebook,
}) => {
  const rawDate =
    appointment?.date ||
    appointment?.appointmentDate ||
    appointment?.appointment_date ||
    '';
  const { yearStr, monthStr, dayStr } = parseAppointmentDate(rawDate);

  const pFName = appointment?.patient_f_name || appointment?.patient_name || '';
  const pLName = appointment?.patient_l_name || '';
  const patientFullName = `${pFName} ${pLName}`.trim() || 'Self';

  const rawTimeSlot =
    appointment?.time_slots ||
    appointment?.timeSlot ||
    appointment?.appointment_time ||
    '';
  const formattedTimeSlot = rawTimeSlot
    ? DateTimeUtils.formatTimeToAmPm(rawTimeSlot)
    : '--:--';

  const isCancelApprovalPending =
    (appointment as any)?.current_cancel_req_status?.toString().toLowerCase() === 'pending' ||
    (appointment as any)?.cancellation_status?.toString().toLowerCase() === 'pending' ||
    (appointment?.status || '').toString().toLowerCase() === 'approval pending' ||
    (appointment?.status || '').toString().toLowerCase() === 'approval_pending';

  const displayedStatus = isCancelApprovalPending ? 'Approval Pending' : (appointment?.status || 'Scheduled');
  const statusBadge = getStatusBadge(displayedStatus);

  const doctName = formatDoctorName(
    appointment?.doct_f_name || appointment?.doctorName || appointment?.doctor_name,
    appointment?.doct_l_name
  );

  const doctImage =
    appointment?.doct_image ||
    (appointment as any)?.doctor_image ||
    (appointment as any)?.doctor_image_url ||
    (appointment as any)?.doct_img ||
    (appointment as any)?.image ||
    '';
  const doctorPhotoUri = getImageUrl(doctImage);

  const deptTitle = appointment?.dept_title || appointment?.department_name || 'General Care';
  const isVideo =
    appointment?.type?.toLowerCase().includes('video') ||
    appointment?.type === 'Video Consultant';

  return (
    <TouchableOpacity
      style={styles.cardContainer}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {/* Top Header: Avatar, Info, Date Badge */}
      <View style={styles.cardHeader}>
        {/* Doctor Avatar */}
        <View style={styles.avatarWrapper}>
          {doctorPhotoUri ? (
            <Image source={{ uri: doctorPhotoUri }} style={styles.doctorAvatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <MaterialIcons name="person" size={fs(26)} color={Colors.primaryColor} />
            </View>
          )}
        </View>

        {/* Doctor & Department Info */}
        <View style={styles.headerInfo}>
          {/* Status Badge */}
          <View style={[styles.statusPill, { backgroundColor: statusBadge.bg }]}>
            <View style={[styles.statusDot, { backgroundColor: statusBadge.color }]} />
            <Text style={[styles.statusPillText, { color: statusBadge.color }]}>
              {statusBadge.label}
            </Text>
          </View>

          {/* Doctor Name */}
          <Text style={styles.doctorName} numberOfLines={1}>
            {doctName}
          </Text>

          {/* Department */}
          <Text style={styles.deptText} numberOfLines={1}>
            {deptTitle}
          </Text>
        </View>

        {/* Date Box Pill */}
        <View style={styles.dateBadge}>
          <Text style={styles.dateMonth}>{monthStr}</Text>
          <Text style={styles.dateDay}>{dayStr}</Text>
          <Text style={styles.dateYear}>{yearStr}</Text>
        </View>
      </View>

      {/* Patient & Time Details */}
      <View style={styles.detailsSection}>
        <View style={styles.metaRowItem}>
          <MaterialIcons name="person-outline" size={fs(15)} color="#64748B" />
          <Text style={styles.metaLabelText} numberOfLines={1}>
            Patient: <Text style={styles.metaValueText}>{patientFullName}</Text>
          </Text>
        </View>

        <View style={styles.metaRowItem}>
          <MaterialIcons name="access-time" size={fs(15)} color="#64748B" />
          <Text style={styles.metaLabelText}>
            {formattedTimeSlot}  •
          </Text>
          {isVideo && (
            <MaterialIcons
              name="videocam"
              size={fs(15)}
              color="#2563EB"
              style={{ marginRight: ws(3) }}
            />
          )}
          <Text style={[styles.metaLabelText, isVideo && { color: '#2563EB', ...TYPOGRAPHY.medium }]}>
            {isVideo ? 'Video Consultant' : (appointment?.type || 'Clinic Visit')}
          </Text>
        </View>
      </View>

      {/* Bottom Actions Row */}
      <View style={styles.cardFooter}>
        <TouchableOpacity
          style={styles.rebookBtn}
          activeOpacity={0.8}
          onPress={onRebook || onPress}
        >
          <MaterialIcons name="sync" size={fs(14)} color="#2563EB" />
          <Text style={styles.rebookBtnText}>Rebook</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.detailsChevron}
          onPress={onPress}
          activeOpacity={0.7}
        >
          <Text style={styles.detailsLinkText}>Details</Text>
          <MaterialIcons name="chevron-right" size={fs(16)} color="#2563EB" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: Colors.white,
    borderRadius: fs(14),
    paddingHorizontal: ws(14),
    paddingVertical: hs(10),
    marginBottom: hs(10),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: ws(10),
  },
  doctorAvatar: {
    width: ws(44),
    height: ws(44),
    aspectRatio: 1,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  avatarPlaceholder: {
    width: ws(44),
    height: ws(44),
    aspectRatio: 1,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: ws(16),
    height: ws(16),
    borderRadius: 999,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.white,
  },
  headerInfo: {
    flex: 1,
    marginRight: ws(8),
  },
  statusPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ws(6),
    paddingVertical: hs(2),
    borderRadius: fs(5),
    gap: ws(4),
    marginBottom: hs(2),
  },
  statusDot: {
    width: ws(5),
    height: ws(5),
    borderRadius: ws(2.5),
  },
  statusPillText: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(10),
  },
  doctorName: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(13.5),
    color: '#1E293B',
  },
  deptText: {
    ...TYPOGRAPHY.regular,
    fontSize: fs(11),
    color: '#64748B',
    marginTop: hs(1),
  },
  dateBadge: {
    width: ws(46),
    height: hs(48),
    borderRadius: fs(8),
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dateMonth: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(8.5),
    color: '#64748B',
    textTransform: 'uppercase',
  },
  dateDay: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(17),
    color: '#1E293B',
    lineHeight: fs(19),
  },
  dateYear: {
    ...TYPOGRAPHY.medium,
    fontSize: fs(8.5),
    color: '#94A3B8',
  },
  detailsSection: {
    marginTop: hs(8),
    paddingTop: hs(6),
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    gap: hs(3),
  },
  metaRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(5),
  },
  metaLabelText: {
    ...TYPOGRAPHY.regular,
    fontSize: fs(11),
    color: '#64748B',
  },
  metaValueText: {
    ...TYPOGRAPHY.bold,
    color: '#1E293B',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: hs(8),
    paddingTop: hs(6),
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  rebookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(4),
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    paddingHorizontal: ws(10),
    paddingVertical: hs(4),
    borderRadius: fs(12),
  },
  rebookBtnText: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(11),
    color: '#2563EB',
  },
  detailsChevron: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(2),
    paddingVertical: hs(2),
  },
  detailsLinkText: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(11.5),
    color: '#2563EB',
  },
});
