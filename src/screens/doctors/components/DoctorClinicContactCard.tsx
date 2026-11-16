import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { memo } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppCard } from '../../../components';
import { Colors } from '../../../constants';
import { fs, hs, TYPOGRAPHY, ws } from '../../../utils';

interface DoctorClinicContactCardProps {
  hasClinicSection: boolean;
  clinicImgUrl?: string | null;
  clinicTitle?: string;
  clinicPhone?: string;
  clinicEmail?: string;
  clinicAddress?: string;
  onPressClinicHeader?: () => void;
  onOpenUrl: (url: string) => void;
  onOpenDirections: (address: string) => void;
}

export const DoctorClinicContactCard = memo(({
  hasClinicSection,
  clinicImgUrl,
  clinicTitle,
  clinicPhone,
  clinicEmail,
  clinicAddress,
  onPressClinicHeader,
  onOpenUrl,
  onOpenDirections,
}: DoctorClinicContactCardProps) => {
  return (
    <>
      <Text style={styles.sectionTitle}>Clinic Contact & Location</Text>
      {hasClinicSection ? (
        <AppCard style={styles.clinicContactCard}>
          <TouchableOpacity
            style={styles.clinicHeaderRow}
            onPress={onPressClinicHeader}
            activeOpacity={0.8}
          >
            <View style={styles.clinicIconCircle}>
              {clinicImgUrl ? (
                <Image
                  source={{ uri: clinicImgUrl }}
                  style={styles.clinicLogoImg}
                  resizeMode="cover"
                />
              ) : (
                <MaterialIcons name="local-hospital" size={22} color={Colors.primaryColor} />
              )}
            </View>
            <View style={styles.clinicInfoText}>
              <Text style={styles.clinicTitle}>
                {clinicTitle || 'Consulting Clinic'}
              </Text>
              <Text style={styles.clinicSubtitle}>Primary Consulting Clinic</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color="#94A3B8" />
          </TouchableOpacity>

          <View style={styles.contactDivider} />

          {/* Clickable Phone */}
          {!!clinicPhone && (
            <TouchableOpacity
              style={styles.contactRowItem}
              onPress={() => onOpenUrl(`tel:${clinicPhone}`)}
              activeOpacity={0.7}
            >
              <View style={styles.contactIconCircle}>
                <MaterialIcons name="phone" size={16} color={Colors.primaryColor} />
              </View>
              <View style={styles.contactMeta}>
                <Text style={styles.contactLabel}>Phone</Text>
                <Text style={styles.contactValueLink}>{clinicPhone}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}

          {/* Clickable Email */}
          {!!clinicEmail && (
            <TouchableOpacity
              style={styles.contactRowItem}
              onPress={() => onOpenUrl(`mailto:${clinicEmail}`)}
              activeOpacity={0.7}
            >
              <View style={styles.contactIconCircle}>
                <MaterialIcons name="email" size={16} color={Colors.primaryColor} />
              </View>
              <View style={styles.contactMeta}>
                <Text style={styles.contactLabel}>Email</Text>
                <Text style={styles.contactValueLink}>{clinicEmail}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}

          {/* Clinic Address with consistent Locate pill */}
          {!!clinicAddress && (
            <TouchableOpacity
              style={styles.contactRowItem}
              onPress={() => onOpenDirections(`${clinicTitle || ''}, ${clinicAddress}`)}
              activeOpacity={0.7}
            >
              <View style={styles.contactIconCircle}>
                <MaterialIcons name="location-on" size={16} color={Colors.primaryColor} />
              </View>
              <View style={styles.contactMeta}>
                <Text style={styles.contactLabel}>Clinic Address</Text>
                <Text style={styles.contactValue}>{clinicAddress}</Text>
              </View>
              <View style={styles.locatePill}>
                <Text style={styles.locatePillText}>Locate</Text>
                <MaterialIcons name="chevron-right" size={fs(14)} color={Colors.yellow_D97706} />
              </View>
            </TouchableOpacity>
          )}

          {/* Directions Action Buttons */}
          {!!clinicAddress && (
            <View style={styles.clinicActionButtonsRow}>
              <TouchableOpacity
                style={styles.directionsBtn}
                onPress={() =>
                  onOpenDirections(`${clinicTitle || ''}, ${clinicAddress}`)
                }
                activeOpacity={0.8}
              >
                <MaterialIcons name="directions" size={16} color={Colors.yellow_D97706} />
                <Text style={styles.directionsBtnText}>Get Directions</Text>
                <MaterialIcons name="chevron-right" size={fs(14)} color={Colors.yellow_D97706} />
              </TouchableOpacity>
            </View>
          )}
        </AppCard>
      ) : (
        <View style={styles.emptyInfoCard}>
          <MaterialIcons name="location-off" size={18} color="#64748B" />
          <Text style={styles.emptyInfoText}>
            Primary clinic information is not listed for this doctor.
          </Text>
        </View>
      )}
    </>
  );
});

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: fs(14),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
    marginBottom: hs(10),
  },
  clinicContactCard: {
    padding: ws(16),
    borderRadius: fs(16),
    marginBottom: hs(14),
  },
  clinicHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clinicIconCircle: {
    width: ws(44),
    height: hs(44),
    borderRadius: fs(22),
    backgroundColor: Colors.aquaSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ws(12),
    overflow: 'hidden',
  },
  clinicLogoImg: {
    width: '100%',
    height: '100%',
  },
  clinicInfoText: {
    flex: 1,
  },
  clinicTitle: {
    fontSize: fs(14),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
  },
  clinicSubtitle: {
    fontSize: fs(11),
    ...TYPOGRAPHY.medium,
    color: Colors.secondaryFontColor,
    marginTop: hs(2),
  },
  contactDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: hs(12),
  },
  contactRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hs(8),
  },
  contactIconCircle: {
    width: ws(32),
    height: hs(32),
    borderRadius: fs(16),
    backgroundColor: Colors.aquaSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ws(10),
  },
  contactMeta: {
    flex: 1,
  },
  contactLabel: {
    fontSize: fs(10),
    ...TYPOGRAPHY.medium,
    color: Colors.secondaryFontColor,
  },
  contactValue: {
    fontSize: fs(13),
    ...TYPOGRAPHY.medium,
    color: Colors.primaryFontColor,
    marginTop: hs(1),
  },
  contactValueLink: {
    fontSize: fs(13),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryColor,
    marginTop: hs(1),
  },
  locatePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: ws(8),
    paddingVertical: hs(4),
    borderRadius: fs(6),
    gap: ws(2),
  },
  locatePillText: {
    fontSize: fs(10),
    ...TYPOGRAPHY.bold,
    color: Colors.yellow_D97706,
  },
  clinicActionButtonsRow: {
    marginTop: hs(10),
  },
  directionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ws(6),
    backgroundColor: '#FEF3C7',
    paddingVertical: hs(10),
    borderRadius: fs(10),
  },
  directionsBtnText: {
    fontSize: fs(12),
    ...TYPOGRAPHY.bold,
    color: Colors.yellow_D97706,
  },
  emptyInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(8),
    backgroundColor: '#F8FAFC',
    borderRadius: fs(12),
    padding: ws(14),
    marginBottom: hs(14),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyInfoText: {
    flex: 1,
    fontSize: fs(12),
    ...TYPOGRAPHY.medium,
    color: '#64748B',
  },
});
