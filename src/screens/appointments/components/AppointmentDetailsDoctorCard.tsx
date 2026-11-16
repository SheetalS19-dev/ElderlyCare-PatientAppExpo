import React, { memo } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { AppCard, StarRating } from '../../../components';
import { Colors, Typography } from '../../../constants';
import type { AppointmentModel } from '../../../types';
import { formatDoctorName, fs, getImageUrl, hs, TYPOGRAPHY, ws } from '../../../utils';

interface AppointmentDetailsDoctorCardProps {
  appointment: AppointmentModel;
}

export const AppointmentDetailsDoctorCard = memo(({ appointment }: AppointmentDetailsDoctorCardProps) => {
  const specialization =
    appointment.department_name ||
    (appointment as any).dept_name ||
    appointment.dept_title ||
    appointment.doct_specialization;

  const rating = Number(appointment.average_rating ?? 5);
  const reviewCount = appointment.number_of_reviews ?? 0;

  return (
    <AppCard style={styles.doctorCard}>
      <View style={styles.doctorRow}>
        <View style={styles.avatarWrapper}>
          <Image
            source={
              getImageUrl(appointment.doct_image)
                ? { uri: getImageUrl(appointment.doct_image) }
                : require('../../../../assets/icons/user.png')
            }
            style={styles.avatar}
            resizeMode="cover"
          />
        </View>

        <View style={styles.doctorInfo}>
          <Text style={styles.doctorName}>
            {formatDoctorName(appointment.doct_f_name, appointment.doct_l_name)}
          </Text>
          {!!specialization && (
            <View style={styles.specBadge}>
              <Text style={styles.specialization}>{specialization}</Text>
            </View>
          )}
          <View style={styles.ratingRow}>
            <StarRating rating={rating} starSize={13} />
            <Text style={styles.ratingText}>
              {Number(appointment.average_rating ?? 0).toFixed(1)} ({reviewCount} reviews)
            </Text>
          </View>
        </View>
      </View>
    </AppCard>
  );
});

const styles = StyleSheet.create({
  doctorCard: {
    borderRadius: fs(16),
    padding: ws(14),
    marginBottom: hs(12),
  },
  doctorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: ws(14),
  },
  avatar: {
    width: ws(68),
    height: ws(68),
    aspectRatio: 1,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: Colors.inputTextBgColor,
    borderWidth: 2,
    borderColor: Colors.primaryColor,
  },
  doctorInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  doctorName: {
    fontSize: fs(Typography.fontSize.base),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
  },
  specBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.lightBlueTint,
    paddingHorizontal: ws(8),
    paddingVertical: hs(2),
    borderRadius: fs(6),
    marginTop: hs(4),
  },
  specialization: {
    fontSize: fs(11),
    ...TYPOGRAPHY.medium,
    color: Colors.primaryColor,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hs(6),
    gap: ws(6),
  },
  ratingText: {
    fontSize: fs(11),
    ...TYPOGRAPHY.medium,
    color: Colors.secondaryFontColor,
  },
});
