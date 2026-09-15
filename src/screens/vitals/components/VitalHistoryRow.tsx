import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../../constants';
import type { VitalModel } from '../../../types';
import { DateTimeUtils } from '../../../utils';
import { fs, hs, ws } from '../../../utils/metrics';
import { TYPOGRAPHY } from '../../../utils/typography';

interface Props {
  vital: VitalModel;
  vitalName: string;
  onEdit: (vital: VitalModel) => void;
  onDelete: (vital: VitalModel) => void;
}

export const VitalHistoryRow: React.FC<Props> = ({
  vital,
  vitalName,
  onEdit,
  onDelete,
}) => {
  let displayVal = '--';
  let unit = '';

  if (vitalName === 'Blood Pressure') {
    displayVal = `${vital.bp_systolic || '--'}/${vital.bp_diastolic || '--'}`;
    unit = 'mmHg';
  } else if (vitalName === 'Sugar') {
    if (vital.sugar_fasting) {
      displayVal = `Fasting: ${vital.sugar_fasting}`;
      if (vital.sugar_random) displayVal += ` | Random: ${vital.sugar_random}`;
    } else if (vital.sugar_random) {
      displayVal = `Random: ${vital.sugar_random}`;
    }
    unit = 'mg/dL';
  } else if (vitalName === 'Weight') {
    displayVal = String(vital.weight || (vital as any).value || '--');
    unit = 'kg';
  } else if (vitalName === 'Temperature') {
    displayVal = String(vital.temperature || (vital as any).value || '--');
    unit = '°F';
  } else if (vitalName === 'SpO2') {
    displayVal = String(vital.spo2 || (vital as any).value || '--');
    unit = '%';
  }

  const dateFormatted = DateTimeUtils.getDataFormat(vital.date || vital.created_at) || vital.date || '--';
  const timeFormatted = vital.time ? vital.time.slice(0, 5) : '--';

  return (
    <View style={styles.card}>
      <View style={styles.leftCol}>
        <Text style={styles.valText}>
          {displayVal} <Text style={styles.unitText}>{unit}</Text>
        </Text>
        <Text style={styles.dateText}>
          {dateFormatted} at {timeFormatted}
        </Text>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => onEdit(vital)}>
          <MaterialIcons name="edit" size={ws(18)} color={Colors.primaryColor} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => onDelete(vital)}>
          <MaterialIcons name="delete-outline" size={ws(18)} color={Colors.redColor} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: ws(14),
    padding: ws(14),
    marginBottom: hs(10),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: hs(1) },
    shadowOpacity: 0.02,
    shadowRadius: ws(3),
    elevation: 1,
  },
  leftCol: {
    flex: 1,
  },
  valText: {
    fontSize: fs(15),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
  },
  unitText: {
    fontSize: fs(12),
    ...TYPOGRAPHY.medium,
    color: Colors.secondaryFontColor,
  },
  dateText: {
    fontSize: fs(11),
    ...TYPOGRAPHY.regular,
    color: Colors.secondaryFontColor,
    marginTop: hs(2),
  },
  actionsRow: {
    flexDirection: 'row',
    gap: ws(8),
  },
  actionBtn: {
    padding: ws(4),
  },
});
