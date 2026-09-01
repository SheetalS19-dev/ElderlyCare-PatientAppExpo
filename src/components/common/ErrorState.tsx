import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Colors, Typography } from '../../constants';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  style?: ViewStyle;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ message = 'Something went wrong', onRetry, style }) => {
  return (
    <View style={[styles.container, style]}>
      <MaterialIcons name="error-outline" size={48} color={Colors.redColor || '#EE404C'} />
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <TouchableOpacity style={styles.retryBtn} onPress={onRetry}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    marginTop: 12,
    fontSize: Typography?.fontSize?.base || 14,
    fontFamily: Typography?.fontFamily?.regular,
    color: Colors.primaryFontColor || '#000000',
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Colors.primaryColor || '#fe8423',
    borderRadius: 8,
  },
  retryText: {
    color: Colors.white || '#FFFFFF',
    fontSize: Typography?.fontSize?.sm || 12,
    fontFamily: Typography?.fontFamily?.medium,
  },
});
