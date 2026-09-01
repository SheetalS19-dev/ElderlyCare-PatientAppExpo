import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps, ViewStyle } from 'react-native';
import { Colors, Typography } from '../../constants';

interface AppTextFieldProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
}

export const AppTextField: React.FC<AppTextFieldProps> = ({ label, error, containerStyle, style, ...props }) => {
  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[styles.input, error ? styles.inputError : null, style]}
        placeholderTextColor={Colors.secondaryFontColor || '#787878'}
        {...props}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  label: {
    fontSize: Typography?.fontSize?.sm || 12,
    fontFamily: Typography?.fontFamily?.medium,
    color: Colors.primaryFontColor || '#000000',
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.inputTextBgColor || '#F7F8FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border || '#E0E0E0',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: Typography?.fontSize?.base || 14,
    color: Colors.primaryFontColor || '#000000',
  },
  inputError: {
    borderColor: Colors.redColor || '#EE404C',
  },
  errorText: {
    fontSize: Typography?.fontSize?.xs || 10,
    color: Colors.redColor || '#EE404C',
    marginTop: 4,
  },
});
