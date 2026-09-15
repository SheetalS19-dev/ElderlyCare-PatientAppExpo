import React, { useEffect, useRef } from 'react';
import { Animated, DimensionValue, StyleSheet, View, ViewStyle } from 'react-native';
import { Colors } from '../../constants';
import { ws, hs, fs } from '../../utils/metrics';

export interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height,
  borderRadius,
  style,
}) => {
  const opacity = useRef(new Animated.Value(0.35)).current;
  const scaledHeight = height !== undefined ? (typeof height === 'number' ? hs(height) : height) : hs(16);
  const scaledRadius = borderRadius !== undefined ? fs(borderRadius) : fs(8);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.8,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.35,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height: scaledHeight,
          borderRadius: scaledRadius,
          opacity,
        },
        style,
      ]}
    />
  );
};

export const SkeletonCard: React.FC<{ style?: ViewStyle }> = ({ style }) => {
  return (
    <View style={[styles.cardContainer, style]}>
      <View style={styles.cardHeader}>
        <Skeleton width={ws(52)} height={ws(52)} borderRadius={ws(26)} />
        <View style={styles.cardHeaderRight}>
          <Skeleton width="65%" height={16} borderRadius={6} />
          <Skeleton width="40%" height={12} borderRadius={4} style={{ marginTop: hs(8) }} />
        </View>
      </View>
      <View style={{ marginTop: hs(14) }}>
        <Skeleton width="90%" height={12} borderRadius={4} />
        <Skeleton width="75%" height={12} borderRadius={4} style={{ marginTop: hs(6) }} />
      </View>
    </View>
  );
};

export const SkeletonList: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <View style={styles.listContainer}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={`skel-item-${index}`} />
      ))}
    </View>
  );
};

export const SkeletonDetail: React.FC = () => {
  return (
    <View style={styles.detailContainer}>
      <View style={styles.detailHero}>
        <Skeleton width={ws(90)} height={ws(90)} borderRadius={ws(45)} style={{ alignSelf: 'center' }} />
        <Skeleton width="60%" height={20} borderRadius={8} style={{ alignSelf: 'center', marginTop: hs(16) }} />
        <Skeleton width="40%" height={14} borderRadius={6} style={{ alignSelf: 'center', marginTop: hs(8) }} />
      </View>
      <View style={styles.detailSection}>
        <Skeleton width="35%" height={16} borderRadius={6} style={{ marginBottom: hs(12) }} />
        <Skeleton width="100%" height={80} borderRadius={12} />
      </View>
      <View style={styles.detailSection}>
        <Skeleton width="45%" height={16} borderRadius={6} style={{ marginBottom: hs(12) }} />
        <Skeleton width="100%" height={120} borderRadius={12} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#E2E8F0',
  },
  cardContainer: {
    backgroundColor: Colors.white,
    borderRadius: fs(14),
    padding: ws(16),
    marginBottom: hs(12),
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardHeaderRight: {
    flex: 1,
    marginLeft: ws(14),
  },
  listContainer: {
    padding: ws(16),
  },
  detailContainer: {
    padding: ws(16),
  },
  detailHero: {
    backgroundColor: Colors.white,
    borderRadius: fs(16),
    padding: ws(24),
    marginBottom: hs(16),
    alignItems: 'center',
  },
  detailSection: {
    marginBottom: hs(16),
  },
});
