import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { memo } from 'react';
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../../constants';
import { fs, getImageUrl, hs, TYPOGRAPHY, ws } from '../../../utils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CLINIC_CARD_WIDTH = Math.floor((SCREEN_WIDTH - ws(32) - ws(10)) / 2);

interface ClinicFeatureCardProps {
  clinic: any;
  onPress: () => void;
}

export const ClinicFeatureCard = memo(({ clinic, onPress }: ClinicFeatureCardProps) => {
  const imageUrl = getImageUrl(clinic.image);

  return (
    <TouchableOpacity style={styles.clinicCard} activeOpacity={0.88} onPress={onPress}>
      {/* Top Image & Verified Badge */}
      <View style={styles.clinicHeader}>
        <View style={styles.clinicImageContainer}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.clinicImg} resizeMode="cover" />
          ) : (
            <View style={styles.clinicImgFallback}>
              <MaterialIcons name="local-hospital" size={26} color={Colors.primaryColor} />
            </View>
          )}
        </View>
        <View style={styles.clinicVerifiedBadge}>
          <MaterialIcons name="verified" size={11} color={Colors.green_10B981} />
          <Text style={styles.clinicVerifiedText}>Verified</Text>
        </View>
      </View>

      {/* Clinic Meta Info */}
      <View style={styles.clinicBody}>
        <Text style={styles.clinicTitle} numberOfLines={1}>
          {clinic.title}
        </Text>
        <View style={styles.clinicAddressRow}>
          <MaterialIcons name="location-on" size={12} color={Colors.primaryColor} />
          <Text style={styles.clinicAddressText} numberOfLines={1}>
            {clinic.address || 'Medical Center'}
          </Text>
        </View>
      </View>

      {/* View Clinic Action Button */}
      <TouchableOpacity style={styles.clinicBookBtn} activeOpacity={0.85} onPress={onPress}>
        <Text style={styles.clinicBookBtnText}>View Clinic</Text>
        <MaterialIcons name="arrow-forward" size={12} color={Colors.white} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  clinicCard: {
    width: CLINIC_CARD_WIDTH,
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
  clinicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: hs(10),
  },
  clinicImageContainer: {
    width: ws(52),
    height: ws(52),
    borderRadius: fs(14),
    overflow: 'hidden',
    backgroundColor: Colors.aquaSoft,
  },
  clinicImg: {
    width: '100%',
    height: '100%',
  },
  clinicImgFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.aquaSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clinicVerifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: ws(6),
    paddingVertical: hs(3),
    borderRadius: fs(12),
    gap: ws(3),
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  clinicVerifiedText: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(10),
    color: Colors.green_10B981,
  },
  clinicBody: {
    marginBottom: hs(12),
  },
  clinicTitle: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(14),
    color: Colors.primaryFontColor,
    marginBottom: hs(4),
  },
  clinicAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(2),
  },
  clinicAddressText: {
    ...TYPOGRAPHY.regular,
    fontSize: fs(11),
    color: Colors.inkSoft,
    flex: 1,
  },
  clinicBookBtn: {
    backgroundColor: Colors.navy,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hs(8),
    borderRadius: fs(10),
    gap: ws(4),
  },
  clinicBookBtnText: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(12),
    color: Colors.white,
  },
});
