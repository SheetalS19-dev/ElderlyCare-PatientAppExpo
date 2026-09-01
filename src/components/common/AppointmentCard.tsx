import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, Typography } from '../../constants';
import type { AppointmentModel } from '../../types';
import { DateTimeUtils, formatDoctorName, getImageUrl } from '../../utils';

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
    return { bg: '#EFF6FF', color: '#2563EB', label: 'Pending' };
  }
  if (s === 'rescheduled') {
    return { bg: '#DBEAFE', color: '#EA580C', label: 'Rescheduled' };
  }
  if (s === 'rejected' || s === 'cancelled' || s === 'canceled') {
    return { bg: '#FEE2E2', color: '#DC2626', label: 'Cancelled' };
  }
  if (s === 'confirmed') {
    return { bg: '#ECFDF5', color: '#059669', label: 'Confirmed' };
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
              <MaterialIcons name="person" size={28} color={Colors.primaryColor} />
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
                size={12}
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
            <MaterialIcons name="person-outline" size={14} color={Colors.secondaryFontColor} />
            <Text style={styles.metaLabelText} numberOfLines={1}>
              Patient: <Text style={styles.metaValueText}>{patientFullName}</Text>
            </Text>
          </View>

          <View style={styles.metaRowItem}>
            <MaterialIcons name="access-time" size={14} color={Colors.secondaryFontColor} />
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
              <MaterialIcons name="replay" size={13} color={Colors.white} />
              <Text style={styles.rebookBtnText}>Rebook</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.detailsChevron}
            onPress={onPress}
            activeOpacity={0.7}
          >
            <Text style={styles.detailsLinkText}>Details</Text>
            <MaterialIcons name="chevron-right" size={16} color={Colors.primaryColor} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
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
    marginRight: 12,
  },
  doctorAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: Colors.primaryColor,
  },
  avatarPlaceholder: {
    width: 54,
    height: 54,
    borderRadius: 27,
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
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  headerInfo: {
    flex: 1,
    marginRight: 8,
  },
  topMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  typePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  typePillText: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.bold,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusPillText: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.bold,
  },
  doctorName: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryFontColor,
  },
  deptText: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.secondaryFontColor,
    marginTop: 2,
  },
  dateBadge: {
    width: 52,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  dateMonth: {
    fontSize: 9,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryColor,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateDay: {
    fontSize: 18,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryColor,
    lineHeight: 20,
  },
  dateYear: {
    fontSize: 8,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.secondaryFontColor,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerLeft: {
    flex: 1,
    gap: 4,
  },
  metaRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaLabelText: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.secondaryFontColor,
  },
  metaValueText: {
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryFontColor,
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rebookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryColor,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  rebookBtnText: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
  },
  detailsChevron: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 4,
  },
  detailsLinkText: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryColor,
  },
});
