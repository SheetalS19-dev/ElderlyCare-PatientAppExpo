import React from 'react';
import { View, StyleSheet } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Colors } from '../../constants';

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  size?: number;
  starSize?: number;
  readOnly?: boolean;
  onRatingChange?: (rating: number) => void;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating = 0,
  maxStars = 5,
  size = 16,
  starSize,
  readOnly = true,
  onRatingChange,
}) => {
  const iconSize = starSize ?? size;
  const stars = [];
  for (let i = 1; i <= maxStars; i++) {
    let name = 'star-outline';
    if (rating >= i) {
      name = 'star';
    } else if (rating >= i - 0.5) {
      name = 'star-half';
    }
    stars.push(
      <MaterialIcons key={i} name={name as any} size={iconSize} color="#FFC107" style={{ marginRight: 2 }} />
    );
  }
  return <View style={styles.container}>{stars}</View>;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
