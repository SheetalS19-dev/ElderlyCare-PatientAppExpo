import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../../constants';
import type { AppointmentModel } from '../../../types';
import { formatDoctorName, getImageUrl } from '../../../utils';
import { fs, hs, ws } from '../../../utils/metrics';
import { TYPOGRAPHY } from '../../../utils/typography';

interface Props {
  appointment: AppointmentModel;
}

export const AppointmentDoctorCard: React.FC<Props> = ({ appointment }) => {
  const doctName = formatDoctorName(
    appointment.doctor_name || (appointment as any)?.doct_name || (appointment as any)?.doctor?.name || 'Doctor'
  );
  const doctImg = (appointment as any)?.doctor_image || (appointment as any)?.doctor?.image;
  const deptName = appointment.department_name || (appointment as any)?.doctor?.dept_name || 'General Physician';
  const hospitalAddr = (appointment as any)?.hospital_address || (appointment as any)?.doctor?.hospital_address || '';

  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Doctor Details</Text>

      <View style={styles.row}>
        {doctImg ? (
          <Image source={{ uri: getImageUrl(doctImg) }} style={styles.avatar} />
        ) : (
          <View style={styles.placeholderAvatar}>
            <MaterialIcons name="person" size={ws(36)} color="#94A3B8" />
          </View>
        )}

        <View style={styles.infoCol}>
          <Text style={styles.doctorName}>{doctName}</Text>
          <Text style={styles.deptText}>{deptName}</Text>
        </View>
      </View>

      {!!hospitalAddr && (
        <View style={styles.addressRow}>
          <MaterialIcons name="location-on" size={ws(16)} color={Colors.primaryColor} />
          <Text style={styles.addressText}>{hospitalAddr}</Text>
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
    gap: ws(12),
    alignItems: 'center',
  },
  avatar: {
    width: ws(60),
    height: ws(60),
    aspectRatio: 1,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
  },
  placeholderAvatar: {
    width: ws(60),
    height: ws(60),
    aspectRatio: 1,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCol: {
    flex: 1,
  },
  doctorName: {
    fontSize: fs(15),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
    marginBottom: hs(2),
  },
  deptText: {
    fontSize: fs(12),
    ...TYPOGRAPHY.medium,
    color: Colors.primaryColor,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(6),
    marginTop: hs(12),
    paddingTop: hs(10),
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  addressText: {
    fontSize: fs(11),
    ...TYPOGRAPHY.regular,
    color: Colors.secondaryFontColor,
    flex: 1,
  },
});
