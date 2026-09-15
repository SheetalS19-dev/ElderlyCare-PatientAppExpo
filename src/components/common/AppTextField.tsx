import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import { Colors } from '../../constants';
import { fs, hs, ws } from '../../utils/metrics';
import { TYPOGRAPHY } from '../../utils/typography';

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
    marginVertical: hs(8),
  },
  label: {
    ...TYPOGRAPHY.medium,
    fontSize: fs(12),
    color: Colors.primaryFontColor || '#000000',
    marginBottom: hs(6),
  },
  input: {
    backgroundColor: Colors.inputTextBgColor || '#F7F8FA',
    borderRadius: fs(8),
    borderWidth: 1,
    borderColor: Colors.border || '#E0E0E0',
    paddingHorizontal: ws(14),
    paddingVertical: hs(10),
    ...TYPOGRAPHY.regular,
    fontSize: fs(14),
    color: Colors.primaryFontColor || '#000000',
  },
  inputError: {
    borderColor: Colors.redColor || '#EE404C',
  },
  errorText: {
    ...TYPOGRAPHY.regular,
    fontSize: fs(10),
    color: Colors.redColor || '#EE404C',
    marginTop: hs(4),
  },
});

