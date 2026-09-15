import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../../constants';
import type { DoctorModel } from '../../types';
import { formatDoctorName, getImageUrl } from '../../utils';
import { fs, hs, ws } from '../../utils/metrics';
import { TYPOGRAPHY } from '../../utils/typography';
import { StarRating } from './StarRating';

interface DoctorCardProps {
  doctor: DoctorModel | any;
  variant?: 'list' | 'compact' | 'simple';
  onPress?: () => void;
  onBookPress?: () => void;
}

export const DoctorCard: React.FC<DoctorCardProps> = ({
  doctor,
  variant = 'list',
  onPress,
  onBookPress,
}) => {
  const [imageError, setImageError] = useState(false);

  const doctorDisplayName = formatDoctorName(
    doctor?.f_name || doctor?.name || doctor?.fullName,
    doctor?.l_name
  );

  const specialty =
    doctor?.specialization ||
    doctor?.specialty ||
    doctor?.dept_title ||
    doctor?.dept_name ||
    doctor?.categoryName ||
    'General Physician';

  const rawImage = doctor?.image || doctor?.user_image || '';
  const imageUrl = rawImage ? getImageUrl(rawImage) : '';

  const rating = Number(doctor?.average_rating ?? doctor?.rating ?? 0);
  const reviewCount = Number(
    doctor?.number_of_reviews ?? doctor?.numberOfReview ?? 0
  );
  const exYear = doctor?.ex_year ?? doctor?.exYear ?? doctor?.experience;
  const isStopBooking =
    doctor?.stop_booking === 1 || doctor?.stopBooking === 1;
  const clinicTitle =
    doctor?.clinic_title ?? doctor?.clinic_name ?? doctor?.clinics_name;
  const clinicAddress =
    doctor?.clinics_address ?? doctor?.clinic_address ?? doctor?.address;
  const appointmentsDone =
    doctor?.total_appointment_done ?? doctor?.totalAppointmentDone;

  const handleBookPress = () => {
    if (onBookPress) {
      onBookPress();
    } else if (onPress) {
      onPress();
    }
  };

  if (variant === 'simple') {
    return (
      <TouchableOpacity
        style={styles.simpleCard}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.avatarWrapper}>
          {!imageUrl || imageError ? (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={fs(24)} color={Colors.primaryColor} />
            </View>
          ) : (
            <Image
              source={{ uri: imageUrl }}
              style={styles.simpleAvatar}
              onError={() => setImageError(true)}
              resizeMode="cover"
            />
          )}
          <View style={styles.onlineBadge} />
        </View>

        <View style={styles.simpleInfo}>
          <Text style={styles.name} numberOfLines={1}>
            {doctorDisplayName}
          </Text>
          <Text style={styles.specialty} numberOfLines={1}>
            {specialty}
          </Text>
          {rating > 0 && (
            <View style={styles.ratingRow}>
              <StarRating rating={rating} size={fs(12)} />
              <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Top Section: Avatar + Info */}
      <View style={styles.topRow}>
        <View style={styles.avatarWrapper}>
          {!imageUrl || imageError ? (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={fs(32)} color={Colors.primaryColor} />
            </View>
          ) : (
            <Image
              source={{ uri: imageUrl }}
              style={styles.avatar}
              onError={() => setImageError(true)}
              resizeMode="cover"
            />
          )}
          <View style={styles.onlineBadge} />
        </View>

        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {doctorDisplayName}
          </Text>

          <Text style={styles.specialty} numberOfLines={1}>
            {specialty}
          </Text>

          {/* Rating Row */}
          <View style={styles.ratingRow}>
            <StarRating rating={rating} size={fs(13)} />
            <Text style={styles.ratingText}>
              {rating > 0 ? rating.toFixed(1) : '0.0'} ({reviewCount} review{reviewCount === 1 ? '' : 's'})
            </Text>
          </View>

          {/* Experience Row */}
          {exYear != null && exYear !== '' && (
            <View style={styles.metaRow}>
              <FontAwesome5
                name="briefcase"
                size={fs(11)}
                color={Colors.primaryColor}
              />
              <Text style={styles.metaText}>Experience {exYear} Year{Number(exYear) === 1 ? '' : 's'}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Stop Booking Warning */}
      {isStopBooking ? (
        <View style={styles.stopBookingRow}>
          <Ionicons
            name="warning-outline"
            size={fs(14)}
            color={Colors.redColor}
          />
          <Text style={styles.stopBookingText}>
            Currently not accepting appointments
          </Text>
        </View>
      ) : null}

      {/* Clinic Info */}
      {clinicTitle ? (
        <>
          <View style={styles.divider} />
          <View style={styles.clinicRow}>
            <FontAwesome5
              name="hospital"
              size={fs(13)}
              color={Colors.primaryColor}
              style={{ marginTop: hs(2) }}
            />
            <View style={styles.clinicDetails}>
              <Text style={styles.clinicTitle} numberOfLines={1}>
                {clinicTitle}
              </Text>
              {clinicAddress ? (
                <Text style={styles.clinicAddress} numberOfLines={1}>
                  {clinicAddress}
                </Text>
              ) : null}
            </View>
          </View>
        </>
      ) : null}

      {/* Bottom Row: Done Count & Book Now Button */}
      <View style={styles.bottomRow}>
        <View style={styles.doneRow}>
          <FontAwesome5
            name="check-circle"
            size={fs(13)}
            color={Colors.btnColorGreen}
          />
          <Text style={styles.doneText}>
            {appointmentsDone ?? 0} Appointments Done
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.bookButton,
            isStopBooking && styles.bookButtonDisabled,
          ]}
          onPress={handleBookPress}
          disabled={isStopBooking}
          activeOpacity={0.8}
        >
          <Text style={styles.bookButtonText}>Book Now</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: fs(14),
    padding: ws(14),
    marginVertical: hs(6),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: ws(68),
    height: ws(68),
    aspectRatio: 1,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: '#EEF2FF',
  },
  avatarPlaceholder: {
    width: ws(68),
    height: ws(68),
    aspectRatio: 1,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  onlineBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: ws(14),
    height: ws(14),
    aspectRatio: 1,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  info: {
    marginLeft: ws(14),
    flex: 1,
  },
  name: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(15),
    color: Colors.mainFontColor || '#1E293B',
  },
  specialty: {
    ...TYPOGRAPHY.medium,
    fontSize: fs(12),
    color: Colors.primaryColor,
    marginTop: hs(2),
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hs(5),
  },
  ratingText: {
    ...TYPOGRAPHY.regular,
    fontSize: fs(11),
    color: Colors.secondaryFontColor || '#64748B',
    marginLeft: ws(6),
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hs(4),
    gap: ws(6),
  },
  metaText: {
    ...TYPOGRAPHY.regular,
    fontSize: fs(11),
    color: Colors.secondaryFontColor || '#64748B',
  },
  stopBookingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: ws(8),
    paddingVertical: hs(5),
    borderRadius: fs(6),
    marginTop: hs(8),
    gap: ws(6),
  },
  stopBookingText: {
    ...TYPOGRAPHY.medium,
    fontSize: fs(11),
    color: Colors.redColor,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: hs(10),
  },
  clinicRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: ws(8),
    marginBottom: hs(6),
  },
  clinicDetails: {
    flex: 1,
  },
  clinicTitle: {
    ...TYPOGRAPHY.semiBold,
    fontSize: fs(12),
    color: Colors.mainFontColor,
  },
  clinicAddress: {
    ...TYPOGRAPHY.regular,
    fontSize: fs(11),
    color: Colors.secondaryFontColor,
    marginTop: hs(1),
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: hs(8),
    paddingTop: hs(8),
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  doneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(5),
    flex: 1,
  },
  doneText: {
    ...TYPOGRAPHY.medium,
    fontSize: fs(11),
    color: Colors.secondaryFontColor,
  },
  bookButton: {
    backgroundColor: Colors.primaryColor,
    paddingHorizontal: ws(16),
    paddingVertical: hs(7),
    borderRadius: fs(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookButtonDisabled: {
    backgroundColor: Colors.disabled || '#CBD5E1',
  },
  bookButtonText: {
    ...TYPOGRAPHY.bold,
    color: Colors.white,
    fontSize: fs(12),
  },

  // Simple variant
  simpleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: fs(12),
    padding: ws(10),
    marginVertical: hs(4),
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  simpleAvatar: {
    width: ws(48),
    height: ws(48),
    aspectRatio: 1,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: '#EEF2FF',
  },
  simpleInfo: {
    marginLeft: ws(12),
    flex: 1,
  },
});
