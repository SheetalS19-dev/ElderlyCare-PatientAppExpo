import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppCard, StarRating } from '../../../components';
import { Colors } from '../../../constants';
import type { DoctorModel } from '../../../types';
import { formatDoctorName, fs, getImageUrl, hs, TYPOGRAPHY, ws } from '../../../utils';

interface Props {
  doctor: DoctorModel;
  ratingAverage: number;
  reviewsCount: number;
  onPressClinic?: (clinicId: string) => void;
}

export const BookingDoctorHeaderCard: React.FC<Props> = ({
  doctor,
  ratingAverage,
  reviewsCount,
  onPressClinic,
}) => {
  const doctorImg = doctor.image ? getImageUrl(doctor.image) : '';
  const fullName = formatDoctorName(
    doctor.name || `${doctor.f_name || ''} ${doctor.l_name || ''}`.trim()
  );
  const specialization =
    doctor.department_name ||
    (doctor as any).dept_name ||
    (doctor as any).dept_title ||
    doctor.specialization;

  const patientsCount =
    doctor.total_appointment_done ?? (doctor as any).patients_served;

  const clinicTitle =
    doctor.clinic_title || (doctor as any).clinic_name || (doctor as any).clinics_name;
  const clinicAddress = doctor.clinics_address || (doctor as any).clinic_address;
  const clinicId = (doctor as any).clinic_id || (doctor as any).clinics_id;

  return (
    <>
      <AppCard style={styles.card}>
        <View style={styles.doctorHeaderRow}>
          {doctorImg ? (
            <Image source={{ uri: doctorImg }} style={styles.doctorAvatar} />
          ) : (
            <View style={styles.doctorAvatarFallback}>
              <MaterialIcons name="person" size={ws(36)} color={Colors.primaryColor} />
            </View>
          )}

          <View style={styles.doctorInfoCol}>
            <Text style={styles.doctorNameText}>{fullName || 'Doctor'}</Text>
            {!!specialization && (
              <Text style={styles.doctorSpecializationText}>{specialization}</Text>
            )}

            <View style={styles.doctorRatingRow}>
              <StarRating rating={ratingAverage} starSize={ws(13)} />
              <Text style={styles.doctorRatingCountText}>
                {ratingAverage > 0 ? ratingAverage.toFixed(1) : '0.0'} ({reviewsCount}{' '}
                {reviewsCount === 1 ? 'review' : 'reviews'})
              </Text>
            </View>

            {patientsCount != null && (
              <View style={styles.doctorPatientsRow}>
                <MaterialIcons name="people" size={ws(13)} color={Colors.primaryColor} />
                <Text style={styles.doctorPatientsText}>
                  {patientsCount} Patients Treated
                </Text>
              </View>
            )}
          </View>
        </View>
      </AppCard>

      {/* Clinic Location Info */}
      {clinicTitle ? (
        <TouchableOpacity
          style={styles.clinicCard}
          onPress={() => {
            if (clinicId && onPressClinic) {
              onPressClinic(String(clinicId));
            }
          }}
          activeOpacity={0.8}
        >
          <View style={styles.clinicPinCircle}>
            <MaterialIcons name="location-on" size={ws(18)} color={Colors.primaryColor} />
          </View>
          <View style={styles.clinicMeta}>
            <Text style={styles.clinicTitle}>{clinicTitle}</Text>
            {!!clinicAddress && (
              <Text style={styles.clinicAddress} numberOfLines={2}>
                {clinicAddress}
              </Text>
            )}
          </View>
          <MaterialIcons name="chevron-right" size={ws(20)} color={Colors.slate_94A3B8} />
        </TouchableOpacity>
      ) : (
        <View style={styles.emptyInfoCard}>
          <MaterialIcons name="location-off" size={ws(18)} color={Colors.secondaryFontColor} />
          <Text style={styles.emptyInfoText}>
            Primary clinic information is not listed for this doctor.
          </Text>
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: ws(14),
    marginBottom: hs(12),
    borderRadius: ws(16),
  },
  doctorHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(12),
  },
  doctorAvatar: {
    width: ws(68),
    height: ws(68),
    borderRadius: ws(34),
    backgroundColor: Colors.aquaSoft,
  },
  doctorAvatarFallback: {
    width: ws(68),
    height: ws(68),
    borderRadius: ws(34),
    backgroundColor: Colors.aquaSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doctorInfoCol: {
    flex: 1,
    gap: hs(3),
  },
  doctorNameText: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(15.5),
    color: Colors.primaryFontColor,
  },
  doctorSpecializationText: {
    ...TYPOGRAPHY.medium,
    fontSize: fs(12),
    color: Colors.secondaryFontColor,
  },
  doctorRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(4),
    marginTop: hs(2),
  },
  doctorRatingCountText: {
    ...TYPOGRAPHY.regular,
    fontSize: fs(11),
    color: Colors.secondaryFontColor,
  },
  doctorPatientsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(4),
    marginTop: hs(2),
  },
  doctorPatientsText: {
    ...TYPOGRAPHY.semiBold,
    fontSize: fs(11),
    color: Colors.primaryColor,
  },
  clinicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: ws(12),
    borderRadius: ws(14),
    marginBottom: hs(12),
    gap: ws(10),
    borderWidth: 1,
    borderColor: Colors.border,
  },
  clinicPinCircle: {
    width: ws(36),
    height: ws(36),
    borderRadius: ws(18),
    backgroundColor: Colors.aquaSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clinicMeta: {
    flex: 1,
    gap: hs(2),
  },
  clinicTitle: {
    ...TYPOGRAPHY.semiBold,
    fontSize: fs(13),
    color: Colors.primaryFontColor,
  },
  clinicAddress: {
    ...TYPOGRAPHY.regular,
    fontSize: fs(11.5),
    color: Colors.secondaryFontColor,
  },
  emptyInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.slate_F8FAFC,
    padding: ws(12),
    borderRadius: ws(12),
    marginBottom: hs(12),
    gap: ws(8),
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyInfoText: {
    ...TYPOGRAPHY.regular,
    fontSize: fs(12),
    color: Colors.secondaryFontColor,
    flex: 1,
  },
});
