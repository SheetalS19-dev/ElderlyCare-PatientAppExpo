import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { Colors } from '../../constants';
import { fs, hs, ws } from '../../utils/metrics';
import { TYPOGRAPHY } from '../../utils/typography';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  style?: ViewStyle;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ message = 'Something went wrong', onRetry, style }) => {
  return (
    <View style={[styles.container, style]}>
      <MaterialIcons name="error-outline" size={fs(48)} color={Colors.redColor || Colors.red_EE404C} />
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
    padding: ws(32),
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    marginTop: hs(12),
    ...TYPOGRAPHY.regular,
    fontSize: fs(14),
    color: Colors.primaryFontColor || Colors.black,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: hs(16),
    paddingHorizontal: ws(20),
    paddingVertical: hs(10),
    backgroundColor: Colors.primaryColor || Colors.primaryColor,
    borderRadius: fs(8),
  },
  retryText: {
    color: Colors.white,
    ...TYPOGRAPHY.medium,
    fontSize: fs(12),
  },
});
