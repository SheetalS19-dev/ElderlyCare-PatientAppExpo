import React from 'react';
import { View, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Colors } from '../../constants';

interface AppCardProps {
  children?: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  onPress?: () => void;
  activeOpacity?: number;
}

export const AppCard: React.FC<AppCardProps> = ({ children, style, onPress, activeOpacity = 0.7 }) => {
  if (onPress) {
    return (
      <TouchableOpacity style={[styles.card, style]} onPress={onPress} activeOpacity={activeOpacity}>
        {children}
      </TouchableOpacity>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white || '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    shadowColor: Colors.shadow || '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
});
