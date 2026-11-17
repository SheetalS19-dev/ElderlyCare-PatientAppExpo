import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { memo } from 'react';
import {
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Colors } from '../../../constants';
import type { BannerModel } from '../../../redux/apis/doctorApi';
import { fs, getImageUrl, hs, TYPOGRAPHY, ws } from '../../../utils';

interface HomeBannerSliderProps {
  bannerList: BannerModel[];
  activeBannerIndex: number;
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
}

export const HomeBannerSlider = memo(({
  bannerList,
  activeBannerIndex,
  onScroll,
}: HomeBannerSliderProps) => {
  if (!bannerList || bannerList.length === 0) return null;

  return (
    <View style={styles.bannerSection}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.bannerScrollContent}
      >
        {bannerList.map((banner, index) => {
          const bannerUri = getImageUrl(banner.image);
          return (
            <View key={`banner-${banner.id || index}`} style={styles.bannerSlide}>
              {bannerUri ? (
                <Image source={{ uri: bannerUri }} style={styles.bannerImage} resizeMode="cover" />
              ) : (
                <View style={styles.promoCardGradient}>
                  <View style={styles.promoCardTextGroup}>
                    <Text style={styles.promoBadge}>SPECIAL CARE</Text>
                    <Text style={styles.promoHeading}>{banner.title || ''}</Text>
                    <Text style={styles.promoSubtext}>Book appointments with top specialists near you</Text>
                  </View>
                  <MaterialIcons
                    name="health-and-safety"
                    size={48}
                    color="rgba(255, 255, 255, 0.8)"
                    style={styles.promoIcon}
                  />
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      {bannerList.length > 1 && (
        <View style={styles.dotsRow}>
          {bannerList.map((_, idx) => (
            <View
              key={`dot-${idx}`}
              style={[styles.dot, activeBannerIndex === idx && styles.dotActive]}
            />
          ))}
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  bannerSection: {
    marginTop: hs(14),
    marginBottom: hs(4),
  },
  bannerScrollContent: {
    paddingHorizontal: ws(16),
    gap: ws(12),
  },
  bannerSlide: {
    width: ws(343),
    height: hs(150),
    borderRadius: fs(20),
    overflow: 'hidden',
    backgroundColor: Colors.navy_0F2E4A,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  promoCardGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ws(20),
    paddingVertical: hs(16),
    backgroundColor: Colors.navy,
  },
  promoCardTextGroup: {
    flex: 1,
    paddingRight: ws(12),
  },
  promoBadge: {
    fontSize: fs(10),
    ...TYPOGRAPHY.bold,
    color: Colors.sky_38BDF8,
    letterSpacing: 1,
    marginBottom: hs(4),
  },
  promoHeading: {
    fontSize: fs(17),
    ...TYPOGRAPHY.bold,
    color: Colors.white,
    marginBottom: hs(4),
  },
  promoSubtext: {
    fontSize: fs(11),
    ...TYPOGRAPHY.regular,
    color: Colors.blue_D6E8F6,
    lineHeight: fs(15),
  },
  promoIcon: {
    opacity: 0.85,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: hs(8),
    gap: ws(6),
  },
  dot: {
    width: ws(6),
    height: ws(6),
    borderRadius: 999,
    backgroundColor: Colors.gray_CBD5E1,
  },
  dotActive: {
    width: ws(18),
    backgroundColor: Colors.primaryColor,
  },
});
