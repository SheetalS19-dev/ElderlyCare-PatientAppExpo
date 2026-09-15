import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../../constants';
import type { BannerModel } from '../../../redux/apis/doctorApi';
import { getImageUrl } from '../../../utils';
import { ws, hs, fs, getScreenWidth } from '../../../utils/metrics';

export interface HomeBannerCarouselProps {
  banners: BannerModel[];
  onBannerPress?: (banner: BannerModel) => void;
}

export const HomeBannerCarousel: React.FC<HomeBannerCarouselProps> = ({ banners, onBannerPress }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!banners || banners.length === 0) return null;

  const slideWidth = getScreenWidth() - ws(32);

  return (
    <View style={styles.carouselContainer}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onScroll={(e) => {
          const offsetX = e.nativeEvent.contentOffset.x;
          const idx = Math.round(offsetX / slideWidth);
          if (idx !== activeIndex && idx >= 0 && idx < banners.length) {
            setActiveIndex(idx);
          }
        }}
        scrollEventThrottle={16}
      >
        {banners.map((item, index) => {
          const imageUrl = getImageUrl(item.image || (item as any).banner_image || '');
          return (
            <TouchableOpacity
              key={`banner-${item.id ?? index}`}
              style={[styles.slide, { width: slideWidth }]}
              activeOpacity={0.9}
              onPress={() => onBannerPress && onBannerPress(item)}
            >
              <Image source={{ uri: imageUrl }} style={styles.bannerImage} resizeMode="cover" />
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {banners.length > 1 && (
        <View style={styles.indicatorRow}>
          {banners.map((_, idx) => (
            <View
              key={`dot-${idx}`}
              style={[styles.dot, idx === activeIndex ? styles.activeDot : styles.inactiveDot]}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  carouselContainer: {
    marginVertical: hs(8),
  },
  scrollContent: {
    paddingHorizontal: ws(16),
  },
  slide: {
    height: hs(140),
    borderRadius: fs(16),
    overflow: 'hidden',
    marginRight: ws(12),
    backgroundColor: Colors.white,
    elevation: 3,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  indicatorRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: hs(8),
    gap: ws(6),
  },
  dot: {
    height: hs(6),
    borderRadius: fs(3),
  },
  activeDot: {
    width: ws(18),
    backgroundColor: Colors.primaryColor,
  },
  inactiveDot: {
    width: ws(6),
    backgroundColor: '#CBD5E1',
  },
});
