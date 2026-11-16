import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { memo } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../../../constants';
import { DateTimeUtils, fs, hs, TYPOGRAPHY, ws } from '../../../utils';

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

export const RegisterForm = memo(({
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
}: RegisterFormProps) => {
  return (
    <View style={styles.inputsSection}>
      {/* First Name */}
      <View style={styles.fullWidthCol}>
        <Text style={styles.inputLabel}>
          First Name <Text style={styles.requiredAsterisk}>*</Text>
        </Text>
        <TextInput
          style={[styles.singleTextInput, regErrors.firstName ? styles.inputBorderError : null]}
          placeholder="Enter your first name"
          placeholderTextColor={Colors.inkSoft}
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
          placeholder="Enter your last name"
          placeholderTextColor={Colors.inkSoft}
          value={lastName}
          onChangeText={onLastNameChange}
          autoCapitalize="words"
        />
        {!!regErrors.lastName && <Text style={styles.fieldErrorText}>{regErrors.lastName}</Text>}
      </View>

      {/* Email Address */}
      <View style={styles.fullWidthCol}>
        <Text style={styles.inputLabel}>
          Email Address <Text style={styles.requiredAsterisk}>*</Text>
        </Text>
        <TextInput
          style={[styles.singleTextInput, regErrors.email ? styles.inputBorderError : null]}
          placeholder="Enter your email ID"
          placeholderTextColor={Colors.inkSoft}
          value={email}
          onChangeText={onEmailChange}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        {!!regErrors.email && <Text style={styles.fieldErrorText}>{regErrors.email}</Text>}
      </View>

      {/* Phone Number */}
      <View style={styles.fullWidthCol}>
        <Text style={styles.inputLabel}>
          Phone Number <Text style={styles.requiredAsterisk}>*</Text>
        </Text>
        <TextInput
          style={[styles.singleTextInput, regErrors.phone ? styles.inputBorderError : null]}
          placeholder="Enter your mobile number"
          placeholderTextColor={Colors.inkSoft}
          value={phone}
          onChangeText={(text) => onPhoneChange(text.replace(/[^0-9]/g, ''))}
          keyboardType="phone-pad"
          maxLength={10}
        />
        {!!regErrors.phone && <Text style={styles.fieldErrorText}>{regErrors.phone}</Text>}
      </View>

      {/* Gender */}
      <View style={styles.fullWidthCol}>
        <Text style={styles.inputLabel}>
          Gender <Text style={styles.requiredAsterisk}>*</Text>
        </Text>
        <TouchableOpacity
          style={[styles.dropdownSelector, regErrors.gender ? styles.inputBorderError : null]}
          activeOpacity={0.8}
          onPress={onOpenGenderModal}
        >
          <Text style={[styles.dropdownSelectorText, !gender && styles.placeholderText]}>
            {gender || 'Select Gender'}
          </Text>
          <MaterialIcons name="keyboard-arrow-down" size={20} color={Colors.inkSoft} />
        </TouchableOpacity>
        {!!regErrors.gender && <Text style={styles.fieldErrorText}>{regErrors.gender}</Text>}
      </View>

      {/* Date Of Birth */}
      <View style={styles.fullWidthCol}>
        <Text style={styles.inputLabel}>
          Date Of Birth <Text style={styles.requiredAsterisk}>*</Text>
        </Text>
        <TouchableOpacity
          style={[styles.dropdownSelector, regErrors.dob ? styles.inputBorderError : null]}
          activeOpacity={0.8}
          onPress={onOpenDatePicker}
        >
          <Text style={[styles.dropdownSelectorText, !dob && styles.placeholderText]}>
            {dob ? DateTimeUtils.formatDob(dob) : DateTimeUtils.DOB_PLACEHOLDER}
          </Text>
          <MaterialIcons name="calendar-today" size={16} color={Colors.inkSoft} />
        </TouchableOpacity>
        {!!regErrors.dob && <Text style={styles.fieldErrorText}>{regErrors.dob}</Text>}
      </View>

      {/* Password */}
      <View style={styles.fullWidthCol}>
        <Text style={styles.inputLabel}>
          Password <Text style={styles.requiredAsterisk}>*</Text>
        </Text>
        <View style={[styles.passwordInputContainer, regErrors.password ? styles.inputBorderError : null]}>
          <TextInput
            style={styles.passwordTextInput}
            placeholder="Enter your password"
            placeholderTextColor={Colors.inkSoft}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="password"
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
              size={20}
              color={Colors.inkSoft}
            />
          </TouchableOpacity>
        </View>
        {!!regErrors.password && <Text style={styles.fieldErrorText}>{regErrors.password}</Text>}
      </View>

      {/* Confirm Password */}
      <View style={styles.fullWidthCol}>
        <Text style={styles.inputLabel}>
          Confirm Password <Text style={styles.requiredAsterisk}>*</Text>
        </Text>
        <View style={[styles.passwordInputContainer, regErrors.confirmPassword ? styles.inputBorderError : null]}>
          <TextInput
            style={styles.passwordTextInput}
            placeholder="Confirm your password"
            placeholderTextColor={Colors.inkSoft}
            secureTextEntry={!showConfirmPassword}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="password"
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
              size={20}
              color={Colors.inkSoft}
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
      <View style={styles.switchAuthRow}>
        <Text style={styles.switchAuthPrompt}>
          Already have an account?{' '}
          <Text style={styles.switchAuthLink} onPress={onSwitchToLogin}>
            Login
          </Text>
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  inputsSection: {
    gap: hs(12),
  },
  fullWidthCol: {
    width: '100%',
  },
  inputLabel: {
    fontSize: fs(13),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
    marginBottom: hs(4),
  },
  requiredAsterisk: {
    color: '#EF4444',
    ...TYPOGRAPHY.bold,
  },
  singleTextInput: {
    height: hs(44),
    backgroundColor: '#F3F8FD',
    borderRadius: fs(12),
    paddingHorizontal: ws(14),
    fontSize: fs(13),
    ...TYPOGRAPHY.regular,
    color: Colors.primaryFontColor,
    borderWidth: 1,
    borderColor: Colors.aquaBorder,
  },
  dropdownSelector: {
    height: hs(44),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F3F8FD',
    borderRadius: fs(12),
    paddingHorizontal: ws(14),
    borderWidth: 1,
    borderColor: Colors.aquaBorder,
  },
  dropdownSelectorText: {
    fontSize: fs(13),
    ...TYPOGRAPHY.medium,
    color: Colors.primaryFontColor,
  },
  placeholderText: {
    color: Colors.inkSoft,
    ...TYPOGRAPHY.regular,
  },
  passwordInputContainer: {
    height: hs(44),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F8FD',
    borderRadius: fs(12),
    paddingHorizontal: ws(14),
    borderWidth: 1,
    borderColor: Colors.aquaBorder,
  },
  passwordTextInput: {
    flex: 1,
    fontSize: fs(13),
    ...TYPOGRAPHY.regular,
    color: Colors.primaryFontColor,
    paddingVertical: 0,
  },
  eyeIconBtn: {
    padding: ws(4),
  },
  inputBorderError: {
    borderColor: Colors.redColor,
    backgroundColor: '#FFF5F5',
  },
  fieldErrorText: {
    fontSize: fs(11),
    ...TYPOGRAPHY.medium,
    color: Colors.redColor,
    marginTop: hs(2),
  },
  submitButton: {
    backgroundColor: Colors.navy,
    height: hs(48),
    borderRadius: fs(14),
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: fs(14),
    ...TYPOGRAPHY.bold,
    color: Colors.white,
  },
  switchAuthRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: hs(14),
  },
  switchAuthPrompt: {
    fontSize: fs(13),
    ...TYPOGRAPHY.regular,
    color: Colors.secondaryFontColor,
    textAlign: 'center',
  },
  switchAuthLink: {
    fontSize: fs(13),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryColor,
  },
});
