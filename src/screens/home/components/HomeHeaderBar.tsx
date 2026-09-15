import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../../constants';
import { getImageUrl } from '../../../utils';
import { ws, hs, fs } from '../../../utils/metrics';
import { TYPOGRAPHY } from '../../../utils/typography';
import type { CityModel } from '../../../types';

export interface HomeHeaderBarProps {
  user: any;
  activeCityName: string;
  isDetectingLocation: boolean;
  onOpenLocationModal: () => void;
  onNavigateNotifications: () => void;
  onNavigateProfile: () => void;
  unreadCount?: number;
}

export const HomeHeaderBar: React.FC<HomeHeaderBarProps> = ({
  user,
  activeCityName,
  isDetectingLocation,
  onOpenLocationModal,
  onNavigateNotifications,
  onNavigateProfile,
  unreadCount = 0,
}) => {
  const rawAvatar = user?.user_image || user?.image || '';
  const avatarUrl = rawAvatar ? getImageUrl(rawAvatar) : '';

  return (
    <View style={styles.headerContainer}>
      <View style={styles.userInfoRow}>
        <TouchableOpacity onPress={onNavigateProfile} activeOpacity={0.8} style={styles.avatarWrap}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <MaterialIcons name="person" size={fs(22)} color={Colors.primaryColor} />
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.userTextCol}>
          <Text style={styles.greetingText}>Welcome back 👋</Text>
          <Text style={styles.userNameText} numberOfLines={1}>
            {user?.f_name ? `${user.f_name} ${user?.l_name || ''}` : 'Patient User'}
          </Text>
        </View>

        <TouchableOpacity style={styles.locationPill} onPress={onOpenLocationModal} activeOpacity={0.75}>
          <MaterialIcons name="location-on" size={fs(14)} color={Colors.primaryColor} />
          <Text style={styles.locationText} numberOfLines={1}>
            {isDetectingLocation ? 'Detecting...' : activeCityName}
          </Text>
          <MaterialIcons name="keyboard-arrow-down" size={fs(14)} color={Colors.secondaryFontColor} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconBtn} onPress={onNavigateNotifications} activeOpacity={0.75}>
          <MaterialIcons name="notifications-none" size={fs(22)} color={Colors.primaryFontColor} />
          {unreadCount > 0 && <View style={styles.badgeDot} />}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: ws(16),
    paddingTop: hs(12),
    paddingBottom: hs(8),
    backgroundColor: Colors.white,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(10),
  },
  avatarWrap: {
    width: ws(42),
    height: ws(42),
    borderRadius: 999,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    overflow: 'hidden',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userTextCol: {
    flex: 1,
  },
  greetingText: {
    ...TYPOGRAPHY.regular,
    fontSize: fs(11),
    color: Colors.secondaryFontColor,
  },
  userNameText: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(14),
    color: Colors.primaryFontColor,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: ws(8),
    paddingVertical: hs(5),
    borderRadius: fs(14),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    maxWidth: ws(120),
    gap: ws(4),
  },
  locationText: {
    ...TYPOGRAPHY.medium,
    fontSize: fs(11),
    color: Colors.primaryFontColor,
    maxWidth: ws(70),
  },
  iconBtn: {
    width: ws(38),
    height: ws(38),
    borderRadius: 999,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
  },
  badgeDot: {
    position: 'absolute',
    top: hs(6),
    right: ws(6),
    width: ws(8),
    height: ws(8),
    borderRadius: 999,
    backgroundColor: '#EF4444',
  },
});
