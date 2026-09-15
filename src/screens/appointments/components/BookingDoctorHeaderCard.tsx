import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { StarRating } from '../../../components';
import { Colors } from '../../../constants';
import type { DoctorModel } from '../../../types';
import { formatDoctorName, getImageUrl } from '../../../utils';
import { fs, hs, ws } from '../../../utils/metrics';
import { TYPOGRAPHY } from '../../../utils/typography';

interface Props {
  doctor: DoctorModel;
  ratingAverage: string;
  reviewsCount: number;
}

export const BookingDoctorHeaderCard: React.FC<Props> = ({
  doctor,
  ratingAverage,
  reviewsCount,
}) => {
  const doctorImage = doctor.image ? getImageUrl(doctor.image) : '';

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        {doctorImage ? (
          <Image source={{ uri: doctorImage }} style={styles.doctorImage} />
        ) : (
          <View style={styles.placeholderImage}>
            <MaterialIcons name="person" size={ws(36)} color="#94A3B8" />
          </View>
        )}

        <View style={styles.infoCol}>
          <Text style={styles.doctorName}>{formatDoctorName(doctor.name)}</Text>
          <Text style={styles.deptText}>
            {(doctor as any).clinic_name || (doctor as any).hospital_name || (doctor as any).hospital_address || 'Clinic / Hospital'}
          </Text>
          <Text style={styles.expText}>
            {doctor.experience ? `${doctor.experience} yrs exp.` : 'Experienced Specialist'}
          </Text>

          {/* Rating */}
          <View style={styles.ratingRow}>
            <StarRating rating={Number(ratingAverage) || 5} size={ws(14)} />
            <Text style={styles.ratingText}>
              {ratingAverage} ({reviewsCount} reviews)
            </Text>
          </View>
        </View>
      </View>

      {/* Address */}
      {!!(doctor as any)?.hospital_address && (
        <View style={styles.addressRow}>
          <MaterialIcons name="location-on" size={ws(14)} color={Colors.primaryColor} />
          <Text style={styles.addressText} numberOfLines={1}>
            {(doctor as any).hospital_address}
          </Text>
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
  row: {
    flexDirection: 'row',
    gap: ws(12),
  },
  doctorImage: {
    width: ws(70),
    height: ws(70),
    borderRadius: ws(35),
    backgroundColor: '#F1F5F9',
  },
  placeholderImage: {
    width: ws(70),
    height: ws(70),
    borderRadius: ws(35),
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCol: {
    flex: 1,
    justifyContent: 'center',
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
    marginBottom: hs(2),
  },
  expText: {
    fontSize: fs(11),
    ...TYPOGRAPHY.regular,
    color: Colors.secondaryFontColor,
    marginBottom: hs(4),
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(6),
  },
  ratingText: {
    fontSize: fs(11),
    ...TYPOGRAPHY.medium,
    color: Colors.secondaryFontColor,
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
