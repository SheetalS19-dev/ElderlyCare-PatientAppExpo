import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TextStyle, TouchableOpacity, ViewStyle } from 'react-native';
import { Colors } from '../../constants';
import { fs, hs, ws } from '../../utils/metrics';
import { TYPOGRAPHY } from '../../utils/typography';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  isLoading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  title,
  onPress,
  loading = false,
  isLoading,
  disabled = false,
  style,
  textStyle,
}) => {
  const isBtnLoading = loading || isLoading;
  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled || isBtnLoading}
      activeOpacity={0.7}
    >
      {isBtnLoading ? (
        <ActivityIndicator color={Colors.white || '#FFFFFF'} />
      ) : (
        <Text style={[styles.text, textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: Colors.primaryColor || '#2563EB',
    paddingVertical: hs(14),
    paddingHorizontal: ws(24),
    borderRadius: fs(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    color: Colors.white || '#FFFFFF',
    ...TYPOGRAPHY.medium,
    fontSize: fs(14),
  },
});
