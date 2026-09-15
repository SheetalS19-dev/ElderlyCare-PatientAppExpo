import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../../constants';
import { DoctorCard } from '../../../components';
import type { DoctorModel } from '../../../redux/apis/doctorApi';
import { ws, hs, fs } from '../../../utils/metrics';
import { TYPOGRAPHY } from '../../../utils/typography';

export interface HomeDoctorsSectionProps {
  doctors: DoctorModel[];
  onViewAll: () => void;
  onDoctorPress: (doctor: DoctorModel) => void;
}

export const HomeDoctorsSection: React.FC<HomeDoctorsSectionProps> = ({
  doctors,
  onViewAll,
  onDoctorPress,
}) => {
  if (!doctors || doctors.length === 0) return null;

  return (
    <View style={styles.sectionContainer}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Top Doctors</Text>
        <TouchableOpacity onPress={onViewAll} activeOpacity={0.7}>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>

      {doctors.slice(0, 4).map((doctor, index) => (
        <DoctorCard
          key={`doc-${doctor.id ?? index}`}
          doctor={doctor}
          onPress={() => onDoctorPress(doctor)}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    paddingHorizontal: ws(16),
    marginVertical: hs(12),
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hs(10),
  },
  sectionTitle: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(17),
    color: Colors.primaryFontColor,
  },
  viewAllText: {
    ...TYPOGRAPHY.semiBold,
    fontSize: fs(13),
    color: Colors.primaryColor,
  },
});
