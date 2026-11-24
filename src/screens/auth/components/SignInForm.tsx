import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { memo } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../../../constants';
import { fs, hs, TYPOGRAPHY, ws } from '../../../utils';
import { FIELD_LIMITS } from '../../../validation';

export interface SignInFormProps {
  phone: string;
  onPhoneChange: (val: string) => void;
  phoneError?: string;
  password: string;
  onPasswordChange: (val: string) => void;
  passwordError?: string;
  showPassword: boolean;
  onToggleShowPassword: () => void;
  rememberMe: boolean;
  onToggleRememberMe: () => void;
  onOpenForgotModal: () => void;
  onSubmit: () => void;
  busy: boolean;
  onSwitchToRegister: () => void;
}

export const SignInForm = memo(({
  phone,
  onPhoneChange,
  phoneError,
  password,
  onPasswordChange,
  passwordError,
  showPassword,
  onToggleShowPassword,
  rememberMe,
  onToggleRememberMe,
  onOpenForgotModal,
  onSubmit,
  busy,
  onSwitchToRegister,
}: SignInFormProps) => {
  return (
    <View style={styles.inputsSection}>
      {/* Phone Number or Email Field */}
      <Text style={styles.inputLabel}>
        Phone Number or Email <Text style={styles.requiredAsterisk}>*</Text>
      </Text>
      <TextInput
        style={[styles.singleTextInput, phoneError ? styles.inputBorderError : null]}
        placeholder="Enter phone number or email"
        placeholderTextColor={Colors.inkSoft}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="username"
        textContentType="username"
        value={phone}
        onChangeText={onPhoneChange}
        maxLength={FIELD_LIMITS.EMAIL_MAX}
      />
      {!!phoneError && <Text style={styles.fieldErrorText}>{phoneError}</Text>}

      {/* Password Field */}
      <View style={styles.passwordSection}>
        <Text style={styles.inputLabel}>
          Password <Text style={styles.requiredAsterisk}>*</Text>
        </Text>
        <View style={[styles.passwordInputContainer, passwordError ? styles.inputBorderError : null]}>
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
            maxLength={FIELD_LIMITS.PASSWORD_MAX}
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
        {!!passwordError && <Text style={styles.fieldErrorText}>{passwordError}</Text>}
      </View>

      {/* Options Row: Remember Me (Left) & Forgot Password? (Right) */}
      <View style={styles.formOptionsRow}>
        <TouchableOpacity
          style={styles.rememberMeRow}
          activeOpacity={0.8}
          onPress={onToggleRememberMe}
        >
          <View style={[styles.checkbox, rememberMe ? styles.checkboxActive : null]}>
            {rememberMe && <MaterialIcons name="check" size={14} color={Colors.white} />}
          </View>
          <Text style={styles.rememberMeText}>Remember me</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.forgotPasswordBtn}
          activeOpacity={0.7}
          onPress={onOpenForgotModal}
        >
          <Text style={styles.forgotPasswordText}>Forgot password?</Text>
        </TouchableOpacity>
      </View>

      {/* Submit Login Button */}
      <TouchableOpacity
        style={[styles.submitButton, busy ? styles.buttonDisabled : null]}
        onPress={onSubmit}
        disabled={busy}
        activeOpacity={0.85}
      >
        {busy ? (
          <ActivityIndicator color={Colors.white} size="small" />
        ) : (
          <Text style={styles.submitButtonText}>Login</Text>
        )}
      </TouchableOpacity>

      {/* Switch to Register */}
      <View style={styles.switchAuthRow}>
        <Text style={styles.switchAuthPrompt}>
          Don't have an account?{' '}
          <Text style={styles.switchAuthLink} onPress={onSwitchToRegister}>
            Create Account
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
  inputLabel: {
    fontSize: fs(13),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
    marginBottom: hs(4),
  },
  requiredAsterisk: {
    color: Colors.red_EF4444,
    ...TYPOGRAPHY.bold,
  },
  singleTextInput: {
    height: hs(44),
    backgroundColor: Colors.blue_F3F8FD,
    borderRadius: fs(12),
    paddingHorizontal: ws(14),
    fontSize: fs(13),
    ...TYPOGRAPHY.regular,
    color: Colors.primaryFontColor,
    borderWidth: 1,
    borderColor: Colors.aquaBorder,
  },
  passwordSection: {
    marginTop: hs(4),
  },
  passwordInputContainer: {
    height: hs(44),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.blue_F3F8FD,
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
    backgroundColor: Colors.red_FFF5F5,
  },
  fieldErrorText: {
    fontSize: fs(11),
    ...TYPOGRAPHY.medium,
    color: Colors.redColor,
    marginTop: hs(2),
  },
  formOptionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: hs(2),
    marginBottom: hs(4),
  },
  rememberMeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(8),
  },
  checkbox: {
    width: ws(18),
    height: hs(18),
    borderRadius: fs(4),
    borderWidth: 1.5,
    borderColor: Colors.inkSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: Colors.primaryColor,
    borderColor: Colors.primaryColor,
  },
  rememberMeText: {
    fontSize: fs(12),
    ...TYPOGRAPHY.medium,
    color: Colors.secondaryFontColor,
  },
  forgotPasswordBtn: {
    paddingVertical: hs(4),
  },
  forgotPasswordText: {
    fontSize: fs(12),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryColor,
  },
  submitButton: {
    backgroundColor: Colors.navy,
    height: hs(48),
    borderRadius: fs(14),
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: hs(8),
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
