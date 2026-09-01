import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Colors } from '../../constants';
import { SkeletonCard, SkeletonDetail, SkeletonList } from './SkeletonLoader';

export interface LoadingIndicatorProps {
  message?: string;
  fullScreen?: boolean;
  variant?: 'list' | 'detail' | 'card' | 'inline';
  count?: number;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  fullScreen = false,
  variant = 'list',
  count = 3,
}) => {
  if (fullScreen) {
    return (
      <View style={styles.fullScreenOverlay}>
        <View style={styles.box}>
          <SkeletonCard />
        </View>
      </View>
    );
  }

  if (variant === 'detail') {
    return <SkeletonDetail />;
  }

  if (variant === 'card') {
    return (
      <View style={{ padding: 16 }}>
        <SkeletonCard />
      </View>
    );
  }

  return <SkeletonList count={count} />;
};

const styles = StyleSheet.create({
  fullScreenOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(247, 248, 250, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 999,
  },
  box: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
});
