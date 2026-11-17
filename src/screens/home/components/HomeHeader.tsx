import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { memo } from 'react';
import { Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { HeaderBackdrop } from '../../../components/common/ThemeBackdrop';
import { Colors } from '../../../constants';
import { fs, getImageUrl, hs, TYPOGRAPHY, ws } from '../../../utils';

interface HomeHeaderProps {
  userImage?: string;
  greetingName: string;
  hasUnreadNotifications: boolean;
  search: string;
  onChangeSearch: (val: string) => void;
  onSubmitSearch: () => void;
  onOpenLocationModal: () => void;
  hasCityFilter: boolean;
  activeCityName?: string;
  isDetectingLocation?: boolean;
  onNavigateNotifications: () => void;
  onNavigateProfile: () => void;
  topInset: number;
}

export const HomeHeader = memo(({
  userImage,
  greetingName,
  hasUnreadNotifications,
  search,
  onChangeSearch,
  onSubmitSearch,
  onOpenLocationModal,
  hasCityFilter,
  activeCityName,
  isDetectingLocation = false,
  onNavigateNotifications,
  onNavigateProfile,
  topInset,
}: HomeHeaderProps) => {
  const locationLabel = isDetectingLocation
    ? 'Detecting location'
    : activeCityName && activeCityName !== 'All' && activeCityName !== 'All Cities'
      ? `Location: ${activeCityName}`
      : 'Select Your Location';
  return (
    <View style={styles.headerWrapper}>
      {/* 1. Header (navy -> teal gradient) */}
      <View style={[styles.headerContainer, { paddingTop: Math.max(topInset + 10, 26) }]}>
        <HeaderBackdrop id="homeHeaderGrad" />
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            style={styles.userInfoButton}
            activeOpacity={0.8}
            onPress={onNavigateProfile}
          >
            <View style={styles.avatarBorder}>
              {userImage ? (
                <Image source={{ uri: getImageUrl(userImage) }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarFallback}>
                  <MaterialIcons name="person" size={fs(28)} color={Colors.navy} />
                </View>
              )}
            </View>
            <View style={styles.greetingMeta}>
              <Text style={styles.greetingSubtitle}>Welcome back 👋</Text>
              <Text style={styles.greetingTitle} numberOfLines={1}>
                Hi, {greetingName}
              </Text>
              <Text style={styles.greetingTagline} numberOfLines={1}>
                Your health, our priority
              </Text>
              <View style={styles.greetingUnderline} />
            </View>
          </TouchableOpacity>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerActionBtn}
              activeOpacity={0.8}
              onPress={onOpenLocationModal}
              accessibilityRole="button"
              accessibilityLabel={locationLabel}
            >
              <MaterialIcons name="location-on" size={fs(22)} color={Colors.white} />
              {hasCityFilter && <View style={[styles.actionBadgeDot, styles.locationDot]} />}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.headerActionBtn}
              activeOpacity={0.8}
              onPress={onNavigateNotifications}
              accessibilityRole="button"
              accessibilityLabel="Notifications"
            >
              <MaterialIcons name="notifications-none" size={fs(24)} color={Colors.white} />
              {hasUnreadNotifications && <View style={[styles.actionBadgeDot, styles.notificationDot]} />}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Search pill overlapping the header curve */}
      <View style={styles.searchWrapper}>
        <MaterialIcons name="search" size={fs(22)} color={Colors.primaryColor} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={onChangeSearch}
          placeholder="Search doctors, specialties, clinics..."
          placeholderTextColor={Colors.inkSoft}
          returnKeyType="search"
          onSubmitEditing={onSubmitSearch}
        />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  headerWrapper: {
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  headerContainer: {
    paddingHorizontal: ws(16),
    paddingBottom: hs(42),
    borderBottomLeftRadius: fs(30),
    borderBottomRightRadius: fs(30),
    overflow: 'hidden',
    backgroundColor: Colors.navy,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userInfoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: ws(10),
  },
  avatarBorder: {
    width: ws(56),
    height: ws(56),
    aspectRatio: 1,
    borderRadius: 999,
    borderWidth: 2.5,
    borderColor: 'rgba(255, 255, 255, 0.92)',
    overflow: 'hidden',
    backgroundColor: Colors.aqua,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.aqua,
    justifyContent: 'center',
    alignItems: 'center',
  },
  greetingMeta: {
    marginLeft: ws(12),
    flex: 1,
  },
  greetingSubtitle: {
    fontSize: fs(12),
    ...TYPOGRAPHY.regular,
    color: Colors.blue_D6E8F6,
  },
  greetingTitle: {
    fontSize: fs(20),
    ...TYPOGRAPHY.bold,
    color: Colors.white,
    marginTop: hs(1),
  },
  greetingTagline: {
    fontSize: fs(11),
    ...TYPOGRAPHY.regular,
    fontStyle: 'italic',
    color: Colors.teal_BFE0F2,
    marginTop: hs(2),
  },
  greetingUnderline: {
    width: ws(96),
    height: 2,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    marginTop: hs(2),
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(8),
  },
  headerActionBtn: {
    width: ws(42),
    height: ws(42),
    aspectRatio: 1,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.38)',
    position: 'relative',
  },
  actionBadgeDot: {
    width: ws(9),
    height: ws(9),
    aspectRatio: 1,
    borderRadius: 999,
    position: 'absolute',
    top: hs(7),
    right: ws(9),
    borderWidth: 1.5,
    borderColor: Colors.navy,
  },
  locationDot: {
    backgroundColor: Colors.sky_38BDF8,
  },
  notificationDot: {
    backgroundColor: Colors.red_FF1F2D,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: ws(16),
    marginTop: -hs(26),
    height: hs(52),
    paddingHorizontal: ws(14),
    backgroundColor: Colors.white,
    borderRadius: fs(26),
    borderWidth: 1,
    borderColor: Colors.border_E3EDF7,
    shadowColor: Colors.navy,
    shadowOffset: { width: 0, height: hs(4) },
    shadowOpacity: 0.12,
    shadowRadius: fs(10),
    elevation: 6,
    zIndex: 5,
  },
  searchInput: {
    flex: 1,
    marginLeft: ws(10),
    fontSize: fs(13),
    ...TYPOGRAPHY.regular,
    color: Colors.ink,
    paddingVertical: 0,
  },
});
