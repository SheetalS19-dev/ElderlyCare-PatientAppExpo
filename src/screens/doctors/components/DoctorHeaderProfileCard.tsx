import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { memo } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { AppCard, StarRating } from '../../../components';
import { Colors } from '../../../constants';
import type { DoctorModel } from '../../../types';
import { fs, getImageUrl, hs, TYPOGRAPHY, ws } from '../../../utils';

interface DoctorHeaderProfileCardProps {
  doctor: DoctorModel;
  fullName: string;
  rating: number;
  reviewCountText: string;
  expValue?: number | string | null;
  patientsCount?: number | string | null;
}

export const DoctorHeaderProfileCard = memo(({
  doctor,
  fullName,
  rating,
  reviewCountText,
  expValue,
  patientsCount,
}: DoctorHeaderProfileCardProps) => {
  const specialization =
    doctor.department_name ||
    (doctor as any).dept_name ||
    (doctor as any).dept_title ||
    doctor.specialization;

  const degree = (doctor as any).degree || (doctor as any).qualification;

  return (
    <AppCard style={styles.profileCard}>
      <View style={styles.profileRow}>
        <View style={styles.avatarWrapper}>
          <Image
            source={
              getImageUrl(doctor.image)
                ? { uri: getImageUrl(doctor.image) }
                : require('../../../../assets/icons/user.png')
            }
            style={styles.avatar}
          />
        </View>

        <View style={styles.profileInfo}>
          <Text style={styles.name}>{fullName || 'Doctor'}</Text>
          {!!specialization && (
            <Text style={styles.specialization}>{specialization}</Text>
          )}
          {!!degree && (
            <Text style={styles.degreeText}>{degree}</Text>
          )}
          {expValue != null && (
            <Text style={styles.experienceText}>
              {expValue}+ Years Experience
            </Text>
          )}

          {/* Ratings */}
          <View style={styles.ratingRow}>
            <StarRating rating={rating} starSize={13} />
            <Text style={styles.ratingText}>{reviewCountText}</Text>
          </View>

          {/* Patients Treated */}
          {patientsCount != null && (
            <View style={styles.patientsRow}>
              <MaterialIcons name="people" size={14} color={Colors.primaryColor} />
              <Text style={styles.patientsText}>
                {patientsCount} Patients Treated
              </Text>
            </View>
          )}
        </View>
      </View>
    </AppCard>
  );
});

const styles = StyleSheet.create({
  profileCard: {
    padding: ws(16),
    marginBottom: hs(14),
    borderRadius: fs(18),
  },
  profileRow: {
    flexDirection: 'row',
  },
  avatarWrapper: {
    marginRight: ws(14),
  },
  avatar: {
    width: ws(88),
    height: ws(88),
    aspectRatio: 1,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: Colors.slate_F1F5F9,
    borderWidth: 2,
    borderColor: Colors.aquaBorder,
  },
  profileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: fs(18),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
    marginBottom: hs(2),
  },
  specialization: {
    fontSize: fs(13),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryColor,
    marginBottom: hs(2),
  },
  degreeText: {
    fontSize: fs(11),
    ...TYPOGRAPHY.medium,
    color: Colors.secondaryFontColor,
    marginBottom: hs(2),
  },
  experienceText: {
    fontSize: fs(11),
    ...TYPOGRAPHY.medium,
    color: Colors.secondaryFontColor,
    marginBottom: hs(4),
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(6),
    marginBottom: hs(4),
  },
  ratingText: {
    fontSize: fs(11),
    ...TYPOGRAPHY.medium,
    color: Colors.secondaryFontColor,
  },
  patientsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(4),
  },
  patientsText: {
    fontSize: fs(11),
    ...TYPOGRAPHY.medium,
    color: Colors.primaryColor,
  },
});
