import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { memo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../../constants';
import { DateTimeUtils, fs, hs, TYPOGRAPHY, ws } from '../../../utils';

interface Props {
  selectedDate: string | null;
  selectedTimeStart: string | null;
  onPress: () => void;
}

export const DateTimeSelectorCard: React.FC<Props> = memo(({
  selectedDate,
  selectedTimeStart,
  onPress,
}) => {
  return (
    <View style={styles.dateTimeRow}>
      {/* Date Card */}
      <TouchableOpacity
        style={styles.dateTimeSelectorCard}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Text style={styles.selectorLabel}>Date *</Text>
        <View style={styles.selectorValueRow}>
          <MaterialIcons name="calendar-today" size={ws(15)} color={Colors.primaryColor} />
          <Text style={styles.selectorValueText} numberOfLines={1}>
            {selectedDate ? DateTimeUtils.getDataFormat(selectedDate) : 'Select Date'}
          </Text>
          <MaterialIcons name="chevron-right" size={ws(16)} color={Colors.slate_94A3B8} />
        </View>
      </TouchableOpacity>

      {/* Time Card */}
      <TouchableOpacity
        style={styles.dateTimeSelectorCard}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Text style={styles.selectorLabel}>Time *</Text>
        <View style={styles.selectorValueRow}>
          <MaterialIcons name="access-time" size={ws(15)} color={Colors.primaryColor} />
          <Text style={styles.selectorValueText} numberOfLines={1}>
            {selectedTimeStart
              ? DateTimeUtils.formatTimeToAmPm(selectedTimeStart)
              : 'Select Time'}
          </Text>
          <MaterialIcons name="chevron-right" size={ws(16)} color={Colors.slate_94A3B8} />
        </View>
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  dateTimeRow: {
    flexDirection: 'row',
    gap: ws(12),
    marginBottom: hs(14),
  },
  dateTimeSelectorCard: {
    flex: 1,
    backgroundColor: Colors.white,
    padding: ws(12),
    borderRadius: ws(14),
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
  },
  selectorLabel: {
    ...TYPOGRAPHY.medium,
    fontSize: fs(11),
    color: Colors.secondaryFontColor,
    marginBottom: hs(4),
  },
  selectorValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(6),
  },
  selectorValueText: {
    flex: 1,
    ...TYPOGRAPHY.semiBold,
    fontSize: fs(12.5),
    color: Colors.primaryFontColor,
  },
});
