import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppCard } from '../../../components';
import { Colors } from '../../../constants';
import type { AppointmentModel } from '../../../types';
import { DateTimeUtils, fs, hs, TYPOGRAPHY, ws } from '../../../utils';

interface AppointmentInfoCardProps {
  appointment: AppointmentModel;
  isVideoCall: boolean;
}

export const AppointmentInfoCard = memo(({ appointment, isVideoCall }: AppointmentInfoCardProps) => {
  return (
    <AppCard style={styles.infoCard}>
      <Text style={styles.infoCardSectionTitle}>Appointment Information</Text>

      <View style={styles.infoGridContainer}>
        {/* Patient Name */}
        <View style={styles.infoItemRow}>
          <View style={[styles.infoIconBox, { backgroundColor: Colors.lightBlueTint }]}>
            <MaterialIcons name="person" size={18} color={Colors.primaryColor} />
          </View>
          <View style={styles.infoItemMeta}>
            <Text style={styles.infoItemLabel}>Patient</Text>
            <Text style={styles.infoItemValue}>
              {`${appointment.patient_f_name ?? ''} ${appointment.patient_l_name ?? ''}`.trim() || '--'}
            </Text>
          </View>
        </View>

        <View style={styles.infoDivider} />

        {/* Date */}
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

        {/* Time */}
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

        {/* Consultation Type */}
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

        {/* Department */}
        <View style={styles.infoItemRow}>
          <View style={[styles.infoIconBox, { backgroundColor: Colors.purple_F3E8FF }]}>
            <MaterialIcons name="medical-services" size={18} color={Colors.purple_9333EA} />
          </View>
          <View style={styles.infoItemMeta}>
            <Text style={styles.infoItemLabel}>Department</Text>
            <Text style={styles.infoItemValue}>{appointment.dept_title ?? '--'}</Text>
          </View>
        </View>
      </View>
    </AppCard>
  );
});

const styles = StyleSheet.create({
  infoCard: {
    padding: ws(16),
    borderRadius: fs(16),
    marginBottom: hs(12),
  },
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
});
