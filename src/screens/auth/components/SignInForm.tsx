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
import { CountryCodeItem } from '../../../components';
import { Colors } from '../../../constants';
import { fs, hs, ws } from '../../../utils/metrics';
import { TYPOGRAPHY } from '../../../utils/typography';

export interface SignInFormProps {
  countryCode: CountryCodeItem;
  onOpenCountryPicker: () => void;
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

export const SignInForm: React.FC<SignInFormProps> = ({
  countryCode,
  onOpenCountryPicker,
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
}) => {
  return (
    <View style={styles.inputsSection}>
      {/* Phone Number Field */}
      <Text style={styles.inputLabel}>Mobile Phone Number</Text>
      <View
        style={[
          styles.phoneInputContainer,
          phoneError ? styles.inputBorderError : null,
        ]}
      >
        <TouchableOpacity
          style={styles.countryCodePickerBtn}
          onPress={onOpenCountryPicker}
          activeOpacity={0.7}
        >
          <Text style={styles.countryCodeText}>{countryCode.dialCode}</Text>
          <MaterialIcons name="arrow-drop-down" size={fs(20)} color="#4A5568" />
        </TouchableOpacity>

        <View style={styles.phoneDivider} />

        <TextInput
          style={styles.phoneTextInput}
          placeholder="Enter phone number"
          placeholderTextColor="#94A3B8"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={onPhoneChange}
          maxLength={15}
        />
      </View>
      {!!phoneError && <Text style={styles.fieldErrorText}>{phoneError}</Text>}

      {/* Password Field */}
      <View style={styles.passwordSection}>
        <Text style={styles.inputLabel}>Password</Text>
        <View
          style={[
            styles.passwordInputContainer,
            passwordError ? styles.inputBorderError : null,
          ]}
        >
          <TextInput
            style={styles.passwordTextInput}
            placeholder="Enter your password"
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
        {!!passwordError && (
          <Text style={styles.fieldErrorText}>{passwordError}</Text>
        )}
      </View>

      {/* Options Row: Remember Me (Left) & Forgot Password? (Right) */}
      <View style={styles.formOptionsRow}>
        <TouchableOpacity
          style={styles.rememberMeRow}
          activeOpacity={0.8}
          onPress={onToggleRememberMe}
        >
          <View
            style={[
              styles.checkbox,
              rememberMe ? styles.checkboxActive : null,
            ]}
          >
            {rememberMe && (
              <MaterialIcons name="check" size={fs(14)} color={Colors.white} />
            )}
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
      <Text style={styles.switchAuthRow}>
        <Text style={styles.switchAuthPrompt}>Don't have an account? </Text>
        <Text style={styles.switchAuthLink} onPress={onSwitchToRegister}>
          Create Account
        </Text>
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  inputsSection: {
    marginTop: hs(8),
  },
  inputLabel: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(13),
    color: Colors.primaryFontColor,
    marginBottom: hs(6),
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: fs(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: hs(50),
    paddingHorizontal: ws(12),
  },
  countryCodePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: ws(4),
  },
  countryCodeText: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(14),
    color: Colors.primaryFontColor,
  },
  phoneDivider: {
    width: 1,
    height: hs(24),
    backgroundColor: '#CBD5E1',
    marginHorizontal: ws(10),
  },
  phoneTextInput: {
    flex: 1,
    ...TYPOGRAPHY.regular,
    fontSize: fs(14),
    color: Colors.primaryFontColor,
    paddingVertical: 0,
  },
  passwordSection: {
    marginTop: hs(14),
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
  inputBorderError: {
    borderColor: Colors.redColor,
  },
  fieldErrorText: {
    ...TYPOGRAPHY.medium,
    fontSize: fs(11),
    color: Colors.redColor,
    marginTop: hs(4),
  },
  formOptionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: hs(14),
    marginBottom: hs(18),
  },
  rememberMeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: ws(18),
    height: ws(18),
    borderRadius: fs(4),
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: ws(8),
    backgroundColor: Colors.white,
  },
  checkboxActive: {
    backgroundColor: Colors.primaryColor,
    borderColor: Colors.primaryColor,
  },
  rememberMeText: {
    ...TYPOGRAPHY.medium,
    fontSize: fs(12),
    color: Colors.secondaryFontColor,
  },
  forgotPasswordBtn: {
    paddingVertical: hs(4),
  },
  forgotPasswordText: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(12),
    color: Colors.primaryColor,
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
