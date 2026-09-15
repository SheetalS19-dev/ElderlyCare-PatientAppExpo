import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../../constants';
import type { AppointmentModel } from '../../../types';
import { DateTimeUtils } from '../../../utils';
import { fs, hs, ws } from '../../../utils/metrics';
import { TYPOGRAPHY } from '../../../utils/typography';

interface Props {
  appointment: AppointmentModel;
}

export const AppointmentStatusCard: React.FC<Props> = ({ appointment }) => {
  const statusStr = (appointment.status || (appointment as any)?.appointment_status || 'Pending').toLowerCase();
  const isApproved = statusStr === 'approved' || statusStr === 'confirmed' || statusStr === '1';
  const isCancelled = statusStr === 'cancelled' || statusStr === 'canceled' || statusStr === '2';
  const isCompleted = statusStr === 'completed' || statusStr === '3';

  const statusColor = isCompleted
    ? '#10B981'
    : isApproved
    ? '#3B82F6'
    : isCancelled
    ? '#EF4444'
    : '#F59E0B';

  const statusBg = isCompleted
    ? '#ECFDF5'
    : isApproved
    ? '#EFF6FF'
    : isCancelled
    ? '#FEF2F2'
    : '#FFFBEB';

  const statusLabel = isCompleted
    ? 'Completed'
    : isApproved
    ? 'Confirmed'
    : isCancelled
    ? 'Cancelled'
    : 'Pending Approval';

  const dateFormatted = DateTimeUtils.getDataFormat(appointment.date) || appointment.date || '--';
  const timeFormatted = (appointment as any)?.time || (appointment as any)?.start_time || '--';

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.tokenPill}>
          <Text style={styles.tokenLabel}>Token No.</Text>
          <Text style={styles.tokenValue}>
            #{(appointment as any)?.token_no || (appointment as any)?.token_number || appointment.id}
          </Text>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: statusBg, borderColor: statusColor }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.dateTimeRow}>
        <View style={styles.dateTimeItem}>
          <MaterialIcons name="event" size={ws(18)} color={Colors.primaryColor} />
          <View>
            <Text style={styles.itemLabel}>Date</Text>
            <Text style={styles.itemValue}>{dateFormatted}</Text>
          </View>
        </View>

        <View style={styles.verticalLine} />

        <View style={styles.dateTimeItem}>
          <MaterialIcons name="schedule" size={ws(18)} color={Colors.primaryColor} />
          <View>
            <Text style={styles.itemLabel}>Time Slot</Text>
            <Text style={styles.itemValue}>{timeFormatted}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: ws(16),
    padding: ws(16),
    marginBottom: hs(14),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: hs(2) },
    shadowOpacity: 0.03,
    shadowRadius: ws(4),
    elevation: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tokenPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(6),
  },
  tokenLabel: {
    fontSize: fs(12),
    ...TYPOGRAPHY.regular,
    color: Colors.secondaryFontColor,
  },
  tokenValue: {
    fontSize: fs(14),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
  },
  statusBadge: {
    paddingHorizontal: ws(10),
    paddingVertical: hs(4),
    borderRadius: ws(8),
    borderWidth: 1,
  },
  statusText: {
    fontSize: fs(11),
    ...TYPOGRAPHY.bold,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: hs(12),
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  dateTimeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(10),
  },
  verticalLine: {
    width: 1,
    height: hs(28),
    backgroundColor: '#E2E8F0',
  },
  itemLabel: {
    fontSize: fs(10),
    ...TYPOGRAPHY.regular,
    color: Colors.secondaryFontColor,
  },
  itemValue: {
    fontSize: fs(12),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
    marginTop: hs(1),
  },
});
