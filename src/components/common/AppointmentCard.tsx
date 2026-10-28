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

  const status = appointment?.status || 'Scheduled';
  const statusBadge = getStatusBadge(status);

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
      <View style={styles.cardHeader}>
        {/* Doctor Profile Picture Avatar */}
        <View style={styles.avatarWrapper}>
          {doctorPhotoUri ? (
            <Image source={{ uri: doctorPhotoUri }} style={styles.doctorAvatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <MaterialIcons name="person" size={fs(28)} color={Colors.primaryColor} />
            </View>
          )}
          <View style={styles.onlineDot} />
        </View>

        {/* Doctor & Department Info */}
        <View style={styles.headerInfo}>
          <View style={styles.topMetaRow}>
            {/* Consultation Type Badge */}
            <View style={[styles.typePill, { backgroundColor: isVideo ? '#EFF6FF' : '#EFF6FF' }]}>
              <MaterialIcons
                name={isVideo ? 'videocam' : 'local-hospital'}
                size={fs(12)}
                color={isVideo ? '#2563EB' : Colors.primaryColor}
              />
              <Text
                style={[
                  styles.typePillText,
                  { color: isVideo ? '#2563EB' : Colors.primaryColor },
                ]}
              >
                {isVideo ? 'Video Call' : 'In-Clinic'}
              </Text>
            </View>

            {/* Status Badge */}
            <View style={[styles.statusPill, { backgroundColor: statusBadge.bg }]}>
              <View style={[styles.statusDot, { backgroundColor: statusBadge.color }]} />
              <Text style={[styles.statusPillText, { color: statusBadge.color }]}>
                {statusBadge.label}
              </Text>
            </View>
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

      {/* Divider */}
      <View style={styles.divider} />

      {/* Footer Info Row */}
      <View style={styles.cardFooter}>
        <View style={styles.footerLeft}>
          <View style={styles.metaRowItem}>
            <MaterialIcons name="person-outline" size={fs(14)} color={Colors.secondaryFontColor} />
            <Text style={styles.metaLabelText} numberOfLines={1}>
              Patient: <Text style={styles.metaValueText}>{patientFullName}</Text>
            </Text>
          </View>

          <View style={styles.metaRowItem}>
            <MaterialIcons name="access-time" size={fs(14)} color={Colors.secondaryFontColor} />
            <Text style={styles.metaLabelText}>{formattedTimeSlot}</Text>
          </View>
        </View>

        {/* Right CTAs */}
        <View style={styles.footerActions}>
          {onRebook && (
            <TouchableOpacity
              style={styles.rebookBtn}
              activeOpacity={0.8}
              onPress={onRebook}
            >
              <MaterialIcons name="replay" size={fs(13)} color={Colors.white} />
              <Text style={styles.rebookBtnText}>Rebook</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.detailsChevron}
            onPress={onPress}
            activeOpacity={0.7}
          >
            <Text style={styles.detailsLinkText}>Details</Text>
            <MaterialIcons name="chevron-right" size={fs(16)} color={Colors.primaryColor} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: Colors.white,
    borderRadius: fs(18),
    padding: ws(14),
    marginBottom: hs(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: ws(12),
  },
  doctorAvatar: {
    width: ws(54),
    height: ws(54),
    aspectRatio: 1,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: Colors.primaryColor,
  },
  avatarPlaceholder: {
    width: ws(54),
    height: ws(54),
    aspectRatio: 1,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#DBEAFE',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: ws(12),
    height: ws(12),
    aspectRatio: 1,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  headerInfo: {
    flex: 1,
    marginRight: ws(8),
  },
  topMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(6),
    marginBottom: hs(4),
  },
  typePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ws(8),
    paddingVertical: hs(3),
    borderRadius: fs(6),
    gap: ws(4),
  },
  typePillText: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(10),
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ws(8),
    paddingVertical: hs(3),
    borderRadius: fs(6),
    gap: ws(4),
  },
  statusDot: {
    width: ws(6),
    height: ws(6),
    borderRadius: ws(3),
  },
  statusPillText: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(10),
  },
  doctorName: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(14),
    color: Colors.primaryFontColor,
  },
  deptText: {
    ...TYPOGRAPHY.regular,
    fontSize: fs(11),
    color: Colors.secondaryFontColor,
    marginTop: hs(2),
  },
  dateBadge: {
    width: ws(52),
    height: hs(56),
    borderRadius: fs(12),
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  dateMonth: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(9),
    color: Colors.primaryColor,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateDay: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(18),
    color: Colors.primaryColor,
    lineHeight: fs(20),
  },
  dateYear: {
    ...TYPOGRAPHY.medium,
    fontSize: fs(8),
    color: Colors.secondaryFontColor,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: hs(10),
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerLeft: {
    flex: 1,
    gap: hs(4),
  },
  metaRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(5),
  },
  metaLabelText: {
    ...TYPOGRAPHY.regular,
    fontSize: fs(11),
    color: Colors.secondaryFontColor,
  },
  metaValueText: {
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(8),
  },
  rebookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(4),
    backgroundColor: Colors.primaryColor,
    paddingHorizontal: ws(10),
    paddingVertical: hs(6),
    borderRadius: fs(8),
  },
  rebookBtnText: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(11),
    color: Colors.white,
  },
  detailsChevron: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(2),
    paddingVertical: hs(4),
  },
  detailsLinkText: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(11),
    color: Colors.primaryColor,
  },
});
