import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../../constants';
import type { AppointmentModel } from '../../../types';
import { fs, hs, ws } from '../../../utils/metrics';
import { TYPOGRAPHY } from '../../../utils/typography';

interface Props {
  appointment: AppointmentModel;
}

export const AppointmentPatientCard: React.FC<Props> = ({ appointment }) => {
  const patientName =
    appointment.patient_name ||
    (appointment as any)?.user_name ||
    `${(appointment as any)?.patient_f_name ?? ''} ${(appointment as any)?.patient_l_name ?? ''}`.trim() ||
    'Patient';

  const phone = (appointment as any)?.phone || (appointment as any)?.user_phone || '--';
  const age = (appointment as any)?.age || (appointment as any)?.patient_age || '--';
  const gender = (appointment as any)?.gender || (appointment as any)?.patient_gender || '--';
  const problemNotes = (appointment as any)?.problem || (appointment as any)?.description || '';

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Patient Information</Text>

      <View style={styles.row}>
        <View style={styles.iconCircle}>
          <MaterialIcons name="person" size={ws(22)} color={Colors.primaryColor} />
        </View>

        <View style={styles.infoCol}>
          <Text style={styles.patientName}>{patientName}</Text>
          <Text style={styles.metaText}>
            Phone: {phone} {age !== '--' ? `• Age: ${age}` : ''} {gender !== '--' ? `• ${gender}` : ''}
          </Text>
        </View>
      </View>

      {!!problemNotes && (
        <View style={styles.problemBox}>
          <Text style={styles.problemLabel}>Reason for Visit / Symptoms:</Text>
          <Text style={styles.problemText}>{problemNotes}</Text>
        </View>
      )}
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
  sectionTitle: {
    fontSize: fs(14),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
    marginBottom: hs(12),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(12),
  },
  iconCircle: {
    width: ws(42),
    height: ws(42),
    borderRadius: ws(21),
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCol: {
    flex: 1,
  },
  patientName: {
    fontSize: fs(14),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
  },
  metaText: {
    fontSize: fs(11),
    ...TYPOGRAPHY.medium,
    color: Colors.secondaryFontColor,
    marginTop: hs(2),
  },
  problemBox: {
    marginTop: hs(12),
    paddingTop: hs(10),
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  problemLabel: {
    fontSize: fs(11),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
    marginBottom: hs(4),
  },
  problemText: {
    fontSize: fs(12),
    ...TYPOGRAPHY.regular,
    color: Colors.secondaryFontColor,
    lineHeight: fs(18),
  },
});
