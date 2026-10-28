import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../../../constants';
import { DateTimeUtils } from '../../../utils';
import { fs, hs, ws } from '../../../utils/metrics';
import { TYPOGRAPHY } from '../../../utils/typography';

export interface RegisterFormProps {
  firstName: string;
  onFirstNameChange: (val: string) => void;
  lastName: string;
  onLastNameChange: (val: string) => void;
  email: string;
  onEmailChange: (val: string) => void;
  phone: string;
  onPhoneChange: (val: string) => void;
  gender: string;
  onOpenGenderModal: () => void;
  dob: string;
  onOpenDatePicker: () => void;
  password: string;
  onPasswordChange: (val: string) => void;
  showPassword: boolean;
  onToggleShowPassword: () => void;
  confirmPassword: string;
  onConfirmPasswordChange: (val: string) => void;
  showConfirmPassword: boolean;
  onToggleShowConfirmPassword: () => void;
  regErrors: Record<string, string>;
  onSubmit: () => void;
  busy: boolean;
  onSwitchToLogin: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  firstName,
  onFirstNameChange,
  lastName,
  onLastNameChange,
  email,
  onEmailChange,
  phone,
  onPhoneChange,
  gender,
  onOpenGenderModal,
  dob,
  onOpenDatePicker,
  password,
  onPasswordChange,
  showPassword,
  onToggleShowPassword,
  confirmPassword,
  onConfirmPasswordChange,
  showConfirmPassword,
  onToggleShowConfirmPassword,
  regErrors,
  onSubmit,
  busy,
  onSwitchToLogin,
}) => {
  return (
    <View style={styles.inputsSection}>
      {/* First Name */}
      <View style={styles.fullWidthCol}>
        <Text style={styles.inputLabel}>First Name</Text>
        <TextInput
          style={[styles.singleTextInput, regErrors.firstName ? styles.inputBorderError : null]}
          placeholder="First Name"
          placeholderTextColor="#94A3B8"
          value={firstName}
          onChangeText={onFirstNameChange}
          autoCapitalize="words"
        />
        {!!regErrors.firstName && <Text style={styles.fieldErrorText}>{regErrors.firstName}</Text>}
      </View>

      {/* Last Name */}
      <View style={styles.fullWidthCol}>
        <Text style={styles.inputLabel}>Last Name</Text>
        <TextInput
          style={[styles.singleTextInput, regErrors.lastName ? styles.inputBorderError : null]}
          placeholder="Last Name"
          placeholderTextColor="#94A3B8"
          value={lastName}
          onChangeText={onLastNameChange}
          autoCapitalize="words"
        />
        {!!regErrors.lastName && <Text style={styles.fieldErrorText}>{regErrors.lastName}</Text>}
      </View>

      {/* Email Address */}
      <View style={styles.fullWidthCol}>
        <Text style={styles.inputLabel}>Email Address</Text>
        <TextInput
          style={[styles.singleTextInput, regErrors.email ? styles.inputBorderError : null]}
          placeholder="Email Address"
          placeholderTextColor="#94A3B8"
          value={email}
          onChangeText={onEmailChange}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        {!!regErrors.email && <Text style={styles.fieldErrorText}>{regErrors.email}</Text>}
      </View>

      {/* Phone Number */}
      <View style={styles.fullWidthCol}>
        <Text style={styles.inputLabel}>Phone Number</Text>
        <TextInput
          style={[styles.singleTextInput, regErrors.phone ? styles.inputBorderError : null]}
          placeholder="Phone Number"
          placeholderTextColor="#94A3B8"
          value={phone}
          onChangeText={onPhoneChange}
          keyboardType="phone-pad"
        />
        {!!regErrors.phone && <Text style={styles.fieldErrorText}>{regErrors.phone}</Text>}
      </View>

      {/* Gender */}
      <View style={styles.fullWidthCol}>
        <Text style={styles.inputLabel}>Gender</Text>
        <TouchableOpacity
          style={styles.dropdownSelector}
          activeOpacity={0.8}
          onPress={onOpenGenderModal}
        >
          <Text style={styles.dropdownSelectorText}>{gender || 'Select Gender'}</Text>
          <MaterialIcons name="keyboard-arrow-down" size={fs(20)} color="#718096" />
        </TouchableOpacity>
      </View>

      {/* Date Of Birth */}
      <View style={styles.fullWidthCol}>
        <Text style={styles.inputLabel}>Date Of Birth</Text>
        <TouchableOpacity
          style={[styles.dropdownSelector, regErrors.dob ? styles.inputBorderError : null]}
          activeOpacity={0.8}
          onPress={onOpenDatePicker}
        >
          <Text style={[styles.dropdownSelectorText, !dob && styles.placeholderText]}>
            {dob ? DateTimeUtils.getDataFormat(dob) || dob : 'Select Date Of Birth'}
          </Text>
          <MaterialIcons name="calendar-today" size={fs(16)} color="#718096" />
        </TouchableOpacity>
        {!!regErrors.dob && <Text style={styles.fieldErrorText}>{regErrors.dob}</Text>}
      </View>

      {/* Password */}
      <View style={styles.fullWidthCol}>
        <Text style={styles.inputLabel}>Password</Text>
        <View style={[styles.passwordInputContainer, regErrors.password ? styles.inputBorderError : null]}>
          <TextInput
            style={styles.passwordTextInput}
            placeholder="Password"
            placeholderTextColor="#94A3B8"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={onPasswordChange}
          />
          <TouchableOpacity
            style={styles.eyeIconBtn}
            onPress={onToggleShowPassword}
            activeOpacity={0.7}
          >
            <Ionicons
              name={showPassword ? 'eye-outline' : 'eye-off-outline'}
              size={fs(20)}
              color="#718096"
            />
          </TouchableOpacity>
        </View>
        {!!regErrors.password && <Text style={styles.fieldErrorText}>{regErrors.password}</Text>}
      </View>

      {/* Confirm Password */}
      <View style={styles.fullWidthCol}>
        <Text style={styles.inputLabel}>Confirm Password</Text>
        <View style={[styles.passwordInputContainer, regErrors.confirmPassword ? styles.inputBorderError : null]}>
          <TextInput
            style={styles.passwordTextInput}
            placeholder="Confirm Password"
            placeholderTextColor="#94A3B8"
            secureTextEntry={!showConfirmPassword}
            value={confirmPassword}
            onChangeText={onConfirmPasswordChange}
          />
          <TouchableOpacity
            style={styles.eyeIconBtn}
            onPress={onToggleShowConfirmPassword}
            activeOpacity={0.7}
          >
            <Ionicons
              name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
              size={fs(20)}
              color="#718096"
            />
          </TouchableOpacity>
        </View>
        {!!regErrors.confirmPassword && <Text style={styles.fieldErrorText}>{regErrors.confirmPassword}</Text>}
      </View>

      {/* Submit Register Button */}
      <TouchableOpacity
        style={[styles.submitButton, { marginTop: hs(16) }, busy ? styles.buttonDisabled : null]}
        onPress={onSubmit}
        disabled={busy}
        activeOpacity={0.85}
      >
        {busy ? (
          <ActivityIndicator color={Colors.white} size="small" />
        ) : (
          <Text style={styles.submitButtonText}>Create Account</Text>
        )}
      </TouchableOpacity>

      {/* Switch to Login */}
      <Text style={styles.switchAuthRow}>
        <Text style={styles.switchAuthPrompt}>Already have an account? </Text>
        <Text style={styles.switchAuthLink} onPress={onSwitchToLogin}>
          Login
        </Text>
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  inputsSection: {
    marginTop: hs(8),
  },
  fullWidthCol: {
    marginBottom: hs(12),
  },
  inputLabel: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(13),
    color: Colors.primaryFontColor,
    marginBottom: hs(6),
  },
  singleTextInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: fs(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: hs(50),
    paddingHorizontal: ws(14),
    ...TYPOGRAPHY.regular,
    fontSize: fs(14),
    color: Colors.primaryFontColor,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: fs(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: hs(50),
    paddingHorizontal: ws(12),
  },
  passwordTextInput: {
    flex: 1,
    ...TYPOGRAPHY.regular,
    fontSize: fs(14),
    color: Colors.primaryFontColor,
    paddingVertical: 0,
  },
  eyeIconBtn: {
    padding: ws(6),
  },
  dropdownSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: fs(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: hs(50),
    paddingHorizontal: ws(14),
  },
  dropdownSelectorText: {
    ...TYPOGRAPHY.regular,
    fontSize: fs(14),
    color: Colors.primaryFontColor,
  },
  placeholderText: {
    color: '#94A3B8',
  },
  inputBorderError: {
    borderColor: Colors.redColor,
  },
  fieldErrorText: {
    ...TYPOGRAPHY.medium,
    fontSize: fs(11),
    color: Colors.redColor,
    marginTop: hs(4),
  },
  submitButton: {
    backgroundColor: Colors.primaryColor,
    borderRadius: fs(14),
    height: hs(50),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primaryColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: '#94A3B8',
    elevation: 0,
    shadowOpacity: 0,
  },
  submitButtonText: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(15),
    color: Colors.white,
  },
  switchAuthRow: {
    textAlign: 'center',
    marginTop: hs(18),
  },
  switchAuthPrompt: {
    ...TYPOGRAPHY.regular,
    fontSize: fs(13),
    color: Colors.secondaryFontColor,
  },
  switchAuthLink: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(13),
    color: Colors.primaryColor,
  },
});
