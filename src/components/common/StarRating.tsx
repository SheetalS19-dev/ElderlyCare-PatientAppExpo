import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { fs, ws } from '../../utils/metrics';

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
  const iconSize = fs(starSize ?? size);
  const stars = [];

  for (let i = 1; i <= maxStars; i++) {
    const isFilled = rating >= i;
    const isHalf = !isFilled && rating >= i - 0.5;
    const iconName = isFilled ? 'star' : isHalf ? 'star-half' : 'star-outline';
    const starNode = (
      <MaterialIcons
        name={iconName as any}
        size={iconSize}
        color={isFilled || isHalf ? '#FFC107' : '#CBD5E1'}
        style={{ marginRight: ws(4) }}
      />
    );

    if (!readOnly && onRatingChange) {
      stars.push(
        <TouchableOpacity
          key={i}
          activeOpacity={0.7}
          onPress={() => onRatingChange(i)}
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
        >
          {starNode}
        </TouchableOpacity>
      );
    } else {
      stars.push(<View key={i}>{starNode}</View>);
    }
  }

  return <View style={styles.container}>{stars}</View>;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
