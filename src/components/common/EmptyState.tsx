import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Colors, Typography } from '../../constants';

interface EmptyStateProps {
  message?: string;
  subtitle?: string;
  icon?: string;
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  message = 'No data available',
  subtitle,
  icon = 'inbox',
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconCircle}>
        <MaterialIcons name={icon as any} size={44} color={Colors.primaryColor} />
      </View>
      <Text style={styles.message}>{message}</Text>
      {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 320,
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    width: '100%',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF5EB',
    borderWidth: 1,
    borderColor: '#FFEDD5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  message: {
    fontSize: Typography?.fontSize?.base || 15,
    fontFamily: Typography?.fontFamily?.bold || 'System',
    color: Colors.primaryFontColor || '#000000',
    textAlign: 'center',
    lineHeight: 22,
  },
  subtitle: {
    marginTop: 6,
    fontSize: Typography?.fontSize?.xs || 12,
    fontFamily: Typography?.fontFamily?.regular || 'System',
    color: Colors.secondaryFontColor || '#787878',
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 18,
  },
});
