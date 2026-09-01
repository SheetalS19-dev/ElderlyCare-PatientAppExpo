import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { Colors, Typography } from '../../constants';

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
    backgroundColor: Colors.primaryColor || '#fe8423',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    color: Colors.white || '#FFFFFF',
    fontSize: Typography?.fontSize?.base || 14,
    fontFamily: Typography?.fontFamily?.medium,
  },
});
