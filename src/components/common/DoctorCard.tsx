import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { Colors, Typography } from '../../constants';
import { formatDoctorName, getImageUrl } from '../../utils';
import { StarRating } from './StarRating';
import type { DoctorModel } from '../../types';

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
              <Ionicons name="person" size={24} color={Colors.primaryColor} />
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
              <StarRating rating={rating} size={12} />
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
              <Ionicons name="person" size={32} color={Colors.primaryColor} />
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
            <StarRating rating={rating} size={13} />
            <Text style={styles.ratingText}>
              {rating > 0 ? rating.toFixed(1) : '0.0'} ({reviewCount} review{reviewCount === 1 ? '' : 's'})
            </Text>
          </View>

          {/* Experience Row */}
          {exYear != null && exYear !== '' && (
            <View style={styles.metaRow}>
              <FontAwesome5
                name="briefcase"
                size={11}
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
            size={14}
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
              size={13}
              color={Colors.primaryColor}
              style={{ marginTop: 2 }}
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
            size={13}
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
    borderRadius: 14,
    padding: 14,
    marginVertical: 6,
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
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#EEF2FF',
  },
  avatarPlaceholder: {
    width: 68,
    height: 68,
    borderRadius: 34,
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
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  info: {
    marginLeft: 14,
    flex: 1,
  },
  name: {
    fontSize: Typography?.fontSize?.md || 15,
    fontFamily: Typography?.fontFamily?.bold || 'System',
    fontWeight: '700',
    color: Colors.mainFontColor || '#1E293B',
  },
  specialty: {
    fontSize: Typography?.fontSize?.xs || 12,
    fontFamily: Typography?.fontFamily?.medium || 'System',
    color: Colors.primaryColor,
    marginTop: 2,
    fontWeight: '500',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  ratingText: {
    fontSize: Typography?.fontSize?.xs || 11,
    color: Colors.secondaryFontColor || '#64748B',
    marginLeft: 6,
    fontFamily: Typography?.fontFamily?.regular,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  metaText: {
    fontSize: Typography?.fontSize?.xs || 11,
    color: Colors.secondaryFontColor || '#64748B',
    fontFamily: Typography?.fontFamily?.regular,
  },
  stopBookingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    marginTop: 8,
    gap: 6,
  },
  stopBookingText: {
    fontSize: 11,
    color: Colors.redColor,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  clinicRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
  },
  clinicDetails: {
    flex: 1,
  },
  clinicTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.mainFontColor,
  },
  clinicAddress: {
    fontSize: 11,
    color: Colors.secondaryFontColor,
    marginTop: 1,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  doneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
  },
  doneText: {
    fontSize: 11,
    color: Colors.secondaryFontColor,
    fontWeight: '500',
  },
  bookButton: {
    backgroundColor: Colors.primaryColor,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookButtonDisabled: {
    backgroundColor: Colors.disabled || '#CBD5E1',
  },
  bookButtonText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
  },

  // Simple variant
  simpleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 10,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  simpleAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF2FF',
  },
  simpleInfo: {
    marginLeft: 12,
    flex: 1,
  },
});
