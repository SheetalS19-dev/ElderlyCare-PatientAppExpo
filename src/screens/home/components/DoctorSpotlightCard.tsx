import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { memo } from 'react';
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../../constants';
import type { DoctorModel } from '../../../redux/apis/doctorApi';
import { formatDoctorName, fs, getImageUrl, hs, TYPOGRAPHY, ws } from '../../../utils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DOCTOR_CARD_WIDTH = Math.floor((SCREEN_WIDTH - ws(32) - ws(10)) / 2);

interface DoctorSpotlightCardProps {
  doctor: DoctorModel;
  onBook: () => void;
}

export const DoctorSpotlightCard = memo(({ doctor, onBook }: DoctorSpotlightCardProps) => {
  const displayName = formatDoctorName(doctor.f_name || doctor.name, doctor.l_name);
  const specialty =
    doctor.department_name ||
    (doctor as any).dept_name ||
    (doctor as any).dept_title ||
    doctor.specialization ||
    '';
  const rating = Number(doctor.average_rating ?? 0);
  const reviews = doctor.number_of_reviews ?? 0;
  const experience = doctor.ex_year ?? doctor.experience;
  const imageUrl = getImageUrl(doctor.image);

  return (
    <TouchableOpacity
      style={styles.doctorCard}
      activeOpacity={0.88}
      onPress={onBook}
    >
      {/* Top Avatar & Online Indicator */}
      <View style={styles.doctorHeader}>
        <View style={styles.docAvatarContainer}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.docAvatar} resizeMode="cover" />
          ) : (
            <View style={styles.docAvatarFallback}>
              <MaterialIcons name="person" size={24} color={Colors.primaryColor} />
            </View>
          )}
          <View style={styles.doctorOnlineDot} />
        </View>

        <View style={styles.ratingBadge}>
          <MaterialIcons name="star" size={12} color={Colors.yellow_F59E0B} />
          <Text style={styles.ratingBadgeText}>{rating > 0 ? rating.toFixed(1) : '0.0'}</Text>
        </View>
      </View>

      {/* Doctor Meta Info */}
      <View style={styles.doctorBody}>
        <Text style={styles.doctorName} numberOfLines={1}>
          {displayName}
        </Text>
        {specialty ? (
          <View style={styles.specialtyPill}>
            <Text style={styles.specialtyPillText} numberOfLines={1}>
              {specialty}
            </Text>
          </View>
        ) : null}

        <View style={styles.doctorMetaDetails}>
          <Text style={styles.doctorDetailText} numberOfLines={1}>
            {experience ? `${experience} Yrs Exp • ` : ''}{reviews} review{reviews === 1 ? '' : 's'}
          </Text>
        </View>
      </View>

      {/* Book Action */}
      <TouchableOpacity style={styles.doctorBookBtn} activeOpacity={0.85} onPress={onBook}>
        <Text style={styles.doctorBookBtnText}>Book Now</Text>
        <MaterialIcons name="event" size={13} color={Colors.white} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  doctorCard: {
    width: DOCTOR_CARD_WIDTH,
    backgroundColor: Colors.white,
    borderRadius: fs(18),
    padding: ws(12),
    borderWidth: 1,
    borderColor: '#EBF0F5',
    shadowColor: Colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    justifyContent: 'space-between',
  },
  doctorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: hs(10),
  },
  docAvatarContainer: {
    position: 'relative',
  },
  docAvatar: {
    width: ws(52),
    height: ws(52),
    borderRadius: fs(26),
    backgroundColor: Colors.aquaSoft,
  },
  docAvatarFallback: {
    width: ws(52),
    height: ws(52),
    borderRadius: fs(26),
    backgroundColor: Colors.aquaSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doctorOnlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: ws(11),
    height: ws(11),
    borderRadius: 999,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: ws(6),
    paddingVertical: hs(3),
    borderRadius: fs(12),
    gap: ws(3),
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  ratingBadgeText: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(11),
    color: '#B45309',
  },
  doctorBody: {
    marginBottom: hs(12),
  },
  doctorName: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(14),
    color: Colors.primaryFontColor,
    marginBottom: hs(4),
  },
  specialtyPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: ws(6),
    paddingVertical: hs(2),
    borderRadius: fs(6),
    marginBottom: hs(6),
  },
  specialtyPillText: {
    ...TYPOGRAPHY.medium,
    fontSize: fs(10),
    color: Colors.secondaryFontColor,
  },
  doctorMetaDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  doctorDetailText: {
    ...TYPOGRAPHY.regular,
    fontSize: fs(11),
    color: Colors.inkSoft,
  },
  doctorBookBtn: {
    backgroundColor: Colors.primaryColor,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hs(8),
    borderRadius: fs(10),
    gap: ws(4),
  },
  doctorBookBtnText: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(12),
    color: Colors.white,
  },
});
