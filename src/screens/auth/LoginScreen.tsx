import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AppDatePickerModal,
  AppHeader,
  CountryCodeItem,
  CountryCodePicker,
} from '../../components';
import { AppConstants, Colors, Images, Typography } from '../../constants';
import { useAuth } from '../../context/AuthContext';
import type { RootStackParamList } from '../../navigation/types';
import {
  useForgetPasswordMutation,
  useLoginWithPhoneMutation,
  useRegisterUserMutation,
} from '../../redux/apis/authApi';
import { confirmOtp, sendOtp } from '../../services/firebaseAuthService';
import { storageService } from '../../services/storageService';
import { DateTimeUtils, showToast } from '../../utils';
import { validatePhone } from '../../validation/authValidation';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

type LoginStep = 'form' | 'otp_verify' | 'register';
type LoginMode = 'password';

const REMEMBER_ME_KEY = '@elderly_care_remember_me';
const REMEMBER_PHONE_KEY = '@elderly_care_remember_phone';
const RESEND_SECONDS = 60;
const GENDER_OPTIONS = ['Male', 'Female', 'Other'];

export const LoginScreen = ({ navigation, route }: Props) => {
  const insets = useSafeAreaInsets();
  const { login } = useAuth();

  const [step, setStep] = useState<LoginStep>('form');
  const [loginMode, setLoginMode] = useState<LoginMode>('password');

  const [countryCode, setCountryCode] = useState<CountryCodeItem>({
    name: 'India',
    code: 'IN',
    dialCode: AppConstants.defaultCountryCode || '+91',
    flag: '🇮🇳',
  });

  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState<string | undefined>();

  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [showPassword, setShowPassword] = useState(false);

  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | undefined>();
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [rememberMe, setRememberMe] = useState(false);

  // Forgot Password State & Mutation
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotEmailError, setForgotEmailError] = useState<string | undefined>();
  const [forgetPassword, { isLoading: isSendingReset }] = useForgetPasswordMutation();

  // OTP State
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState<string | undefined>();

  // Register Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('Male');
  const [dob, setDob] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [regErrors, setRegErrors] = useState<Record<string, string>>({});

  const [resendSeconds, setResendSeconds] = useState(RESEND_SECONDS);
  const [isBusy, setIsBusy] = useState(false);

  const confirmationRef = useRef<any>(null);
  const timerRef = useRef<any>(null);

  const [loginWithPhone, { isLoading: isLoggingIn }] = useLoginWithPhoneMutation();
  const [registerUser, { isLoading: isRegistering }] = useRegisterUserMutation();

  const fullPhoneNumber = `${countryCode.dialCode}${phone}`;
  const busy = isBusy || isLoggingIn || isRegistering;

  // Load saved remember me data
  useEffect(() => {
    (async () => {
      try {
        const savedRemember = await storageService.getItem(REMEMBER_ME_KEY);
        const savedPhone = await storageService.getItem(REMEMBER_PHONE_KEY);
        if (savedRemember === 'true' && savedPhone) {
          setRememberMe(true);
          setPhone(savedPhone);
        }
      } catch {
        // ignore
      }
    })();
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startResendTimer = () => {
    setResendSeconds(RESEND_SECONDS);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setResendSeconds((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleBack = () => {
    if (step === 'otp_verify') {
      if (timerRef.current) clearInterval(timerRef.current);
      setStep('form');
      setOtp('');
      setOtpError(undefined);
      return;
    }
    if (step === 'register') {
      setStep('form');
      return;
    }
    navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
  };

  // Submit handler
  const handleSubmit = async () => {
    if (step === 'register') {
      await handleSubmitRegister();
      return;
    }

    if (step === 'otp_verify') {
      await handleSubmitOtp();
      return;
    }

    // step === 'form'
    const phoneValid = validatePhone(phone);
    if (!phoneValid.isValid) {
      setPhoneError(phoneValid.error);
      return;
    }
    setPhoneError(undefined);

    if (rememberMe) {
      await storageService.setItem(REMEMBER_ME_KEY, 'true');
      await storageService.setItem(REMEMBER_PHONE_KEY, phone);
    } else {
      await storageService.removeItem(REMEMBER_ME_KEY);
      await storageService.removeItem(REMEMBER_PHONE_KEY);
    }

    if (!password || password.trim().length === 0) {
      setPasswordError('Password is required');
      return;
    }
    setPasswordError(undefined);
    await handlePasswordLogin();
  };

  const handlePasswordLogin = async () => {
    setIsBusy(true);
    try {
      const res = await loginWithPhone({ phone: phone.trim(), password }).unwrap();
      setIsBusy(false);
      if (res?.token && res?.data) {
        showToast('Login Successful');
        await handleSuccessLogin(res.token, res.data);
      } else if (res?.message === 'Not Exists') {
        setStep('register');
      } else {
        showToast(res?.message || 'Login failed. Please check credentials.');
      }
    } catch (e: any) {
      setIsBusy(false);
      const msg = e?.data?.message || e?.error || e?.message || '';
      if (msg === 'Not Exists' || String(msg).toLowerCase().includes('not exist')) {
        setStep('register');
      } else {
        showToast(msg || 'Login failed. Please try again.');
      }
    }
  };

  const handleSendOtp = async () => {
    setIsBusy(true);
    const otpResult = await sendOtp(fullPhoneNumber);
    setIsBusy(false);

    if (otpResult.success && otpResult.confirmation) {
      confirmationRef.current = otpResult.confirmation;
      setOtp('');
      setStep('otp_verify');
      startResendTimer();
      showToast('OTP sent successfully');
    } else {
      showToast(otpResult.error || 'Failed to send OTP');
    }
  };

  const handleResendOtp = async () => {
    if (resendSeconds > 0) return;
    await handleSendOtp();
  };

  const handleSubmitOtp = async () => {
    if (!otp || otp.trim().length < 6) {
      setOtpError('Please enter a valid 6-digit OTP');
      return;
    }
    setOtpError(undefined);

    setIsBusy(true);
    const verifyResult = await confirmOtp(confirmationRef.current, otp.trim());
    if (!verifyResult.success) {
      setIsBusy(false);
      setOtpError(verifyResult.error || 'Invalid OTP');
      return;
    }

    try {
      const res = await loginWithPhone({ phone: phone.trim() }).unwrap();
      setIsBusy(false);
      if (res?.token && res?.data) {
        showToast('Login Successful');
        await handleSuccessLogin(res.token, res.data);
      } else if (res?.message === 'Not Exists') {
        setStep('register');
      } else {
        showToast(res?.message || 'Login failed');
      }
    } catch (e: any) {
      setIsBusy(false);
      const msg = e?.data?.message || e?.error || e?.message || '';
      if (msg === 'Not Exists' || String(msg).toLowerCase().includes('not exist')) {
        setStep('register');
      } else {
        showToast(msg || 'Authentication failed');
      }
    }
  };

  const handleSubmitRegister = async () => {
    const errors: Record<string, string> = {};

    if (!firstName.trim()) errors.firstName = 'First name is required';
    if (!lastName.trim()) errors.lastName = 'Last name is required';
    if (!phone.trim()) errors.phone = 'Phone number is required';
    if (!email.trim()) errors.email = 'Email address is required';
    if (!dob.trim()) errors.dob = 'Date of birth is required';
    if (!password) {
      errors.password = 'Password is required (min 6 chars)';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setRegErrors(errors);
    if (Object.keys(errors).length > 0) {
      showToast('Please fix the errors before continuing');
      return;
    }

    setIsBusy(true);
    try {
      const formData = new FormData();
      formData.append('f_name', firstName.trim());
      formData.append('l_name', lastName.trim());
      formData.append('phone', phone.trim());
      formData.append('isd_code', countryCode.dialCode);
      const formattedGender = gender ? gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase() : 'Male';
      formData.append('gender', formattedGender);
      formData.append('dob', dob.trim());
      formData.append('email', email.trim());
      formData.append('password', password.trim());

      const res = await registerUser(formData).unwrap();

      showToast('Account Created Successfully!');
      if (res?.token && res?.data) {
        setIsBusy(false);
        await handleSuccessLogin(res.token, res.data);
      } else {
        const loginRes = await loginWithPhone({ phone: phone.trim(), password: password.trim() }).unwrap();
        setIsBusy(false);
        if (loginRes?.token && loginRes?.data) {
          await handleSuccessLogin(loginRes.token, loginRes.data);
        } else {
          setStep('form');
        }
      }
    } catch (e: any) {
      setIsBusy(false);
      showToast(e?.data?.message || e?.message || 'Registration failed');
    }
  };

  const handleSendResetLink = async () => {
    if (!forgotEmail.trim()) {
      setForgotEmailError('Please enter your email address');
      return;
    }
    setForgotEmailError(undefined);

    try {
      const res = await forgetPassword({ email: forgotEmail.trim() }).unwrap();
      if (res?.response === 200 || res?.status === true) {
        showToast(res?.message || 'Password reset link sent to your email');
        setShowForgotModal(false);
        setForgotEmail('');
      } else {
        showToast(res?.message || 'Could not send reset link. Please check your email.');
      }
    } catch (e: any) {
      showToast(e?.data?.message || e?.message || 'Could not send reset link. Please try again.');
    }
  };

  const handleSuccessLogin = async (token: string, userData: any) => {
    await login(userData, token);
    const redirectTo = route.params?.redirectTo;
    const redirectParams = route.params?.redirectParams;

    if (redirectTo) {
      navigation.reset({
        index: 1,
        routes: [
          { name: 'Main' },
          { name: redirectTo as any, params: redirectParams },
        ],
      });
    } else {
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Header Bar matching AppHeader */}
      <AppHeader
        title={step === 'register' ? 'Create Account' : step === 'otp_verify' ? 'OTP Verification' : 'Sign In'}
        onBackPress={handleBack}
      />

      <KeyboardAvoidingView
        style={styles.flexOne}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView
          style={styles.flexOne}
          contentContainerStyle={[
            styles.scrollContent,
            { flexGrow: 1, paddingBottom: Math.max(insets.bottom + 40, 60) },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formCard}>
            {/* ElderlyCare Logo */}
            <View style={styles.logoWrapper}>
              <Image source={Images.logo} style={styles.logoImage} resizeMode="contain" />
            </View>

            {/* Title & Subtitle */}
            <Text style={styles.cardTitle}>
              {step === 'register' ? 'Create Account' : step === 'otp_verify' ? 'OTP Verification' : 'Sign In to Your Account'}
            </Text>
            <Text style={styles.cardSubtitle}>
              {step === 'register'
                ? 'Fill in your details to register as a new patient'
                : step === 'otp_verify'
                ? `Enter 6-digit OTP sent to ${fullPhoneNumber}`
                : 'Enter your phone number and password to access your account'}
            </Text>

            {/* Mode Switcher Tabs */}
            {step !== 'otp_verify' && (
              <View style={styles.tabContainer}>
                <TouchableOpacity
                  style={[styles.tabButton, step === 'form' && styles.tabButtonActive]}
                  onPress={() => setStep('form')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.tabText, step === 'form' && styles.tabTextActive]}>Sign In</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tabButton, step === 'register' && styles.tabButtonActive]}
                  onPress={() => setStep('register')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.tabText, step === 'register' && styles.tabTextActive]}>Register</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* STEP 1: LOGIN (Phone & Password) */}
            {step === 'form' && (
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
                    onPress={() => setShowCountryPicker(true)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.countryCodeText}>{countryCode.dialCode}</Text>
                    <MaterialIcons name="arrow-drop-down" size={20} color="#4A5568" />
                  </TouchableOpacity>

                  <View style={styles.phoneDivider} />

                  <TextInput
                    style={styles.phoneTextInput}
                    placeholder="Enter phone number"
                    placeholderTextColor="#94A3B8"
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={(text) => {
                      setPhone(text.replace(/[^0-9]/g, ''));
                      if (phoneError) setPhoneError(undefined);
                    }}
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
                      onChangeText={(text) => {
                        setPassword(text);
                        if (passwordError) setPasswordError(undefined);
                      }}
                    />
                    <TouchableOpacity
                      style={styles.eyeIconBtn}
                      onPress={() => setShowPassword(!showPassword)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                        size={20}
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
                  {/* Left: Remember Me */}
                  <TouchableOpacity
                    style={styles.rememberMeRow}
                    activeOpacity={0.8}
                    onPress={() => setRememberMe(!rememberMe)}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        rememberMe ? styles.checkboxActive : null,
                      ]}
                    >
                      {rememberMe && (
                        <MaterialIcons name="check" size={14} color={Colors.white} />
                      )}
                    </View>
                    <Text style={styles.rememberMeText}>Remember me</Text>
                  </TouchableOpacity>

                  {/* Right: Forgot Password? */}
                  <TouchableOpacity
                    style={styles.forgotPasswordBtn}
                    activeOpacity={0.7}
                    onPress={() => {
                      setForgotEmail('');
                      setForgotEmailError(undefined);
                      setShowForgotModal(true);
                    }}
                  >
                    <Text style={styles.forgotPasswordText}>Forgot password?</Text>
                  </TouchableOpacity>

                  {/* Commented out: Login with OTP / Password toggle */}
                  {/*
                  <TouchableOpacity
                    style={styles.toggleModeBtn}
                    activeOpacity={0.7}
                    onPress={() => {
                      setLoginMode(loginMode === 'otp' ? 'password' : 'otp');
                      setPasswordError(undefined);
                    }}
                  >
                    <Text style={styles.toggleModeText}>
                      {loginMode === 'otp' ? 'Sign in with Password' : 'Sign in with OTP'}
                    </Text>
                  </TouchableOpacity>
                  */}
                </View>

                {/* Submit Login Button */}
                <TouchableOpacity
                  style={[styles.submitButton, busy ? styles.buttonDisabled : null]}
                  onPress={handleSubmit}
                  disabled={busy}
                  activeOpacity={0.85}
                >
                  {busy ? (
                    <ActivityIndicator color={Colors.white} size="small" />
                  ) : (
                    <Text style={styles.submitButtonText}>Sign In</Text>
                  )}
                </TouchableOpacity>

                {/* Switch to Register */}
                <View style={styles.switchAuthRow}>
                  <Text style={styles.switchAuthPrompt}>Don't have an account? </Text>
                  <TouchableOpacity onPress={() => setStep('register')}>
                    <Text style={styles.switchAuthLink}>Create Account</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* STEP 2: OTP VERIFICATION */}
            {step === 'otp_verify' && (
              <View style={styles.inputsSection}>
                <Text style={styles.inputLabel}>Enter 6-digit OTP</Text>
                <View style={styles.otpContainer}>
                  <View style={styles.otpBoxesRow}>
                    {[0, 1, 2, 3, 4, 5].map((index) => {
                      const digit = otp[index] || '';
                      const isFocused = otp.length === index;
                      return (
                        <View
                          key={`otp-box-${index}`}
                          style={[
                            styles.otpBox,
                            isFocused ? styles.otpBoxFocused : null,
                            !!digit ? styles.otpBoxFilled : null,
                            otpError ? styles.otpBoxError : null,
                          ]}
                        >
                          <Text style={styles.otpDigitText}>{digit}</Text>
                        </View>
                      );
                    })}
                  </View>
                  <TextInput
                    style={styles.hiddenOtpInput}
                    keyboardType="number-pad"
                    maxLength={6}
                    value={otp}
                    onChangeText={(text) => {
                      const clean = text.replace(/[^0-9]/g, '');
                      setOtp(clean);
                      if (otpError) setOtpError(undefined);
                    }}
                    autoFocus
                  />
                </View>
                {!!otpError && (
                  <Text style={[styles.fieldErrorText, { textAlign: 'center', marginTop: 8 }]}>
                    {otpError}
                  </Text>
                )}

                {/* Resend OTP */}
                <View style={styles.resendRow}>
                  {resendSeconds > 0 ? (
                    <Text style={styles.timerText}>
                      Resend OTP in <Text style={styles.boldTimer}>{resendSeconds}s</Text>
                    </Text>
                  ) : (
                    <TouchableOpacity onPress={handleResendOtp} disabled={busy}>
                      <Text style={styles.resendBtnText}>Resend OTP</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Submit OTP Button */}
                <TouchableOpacity
                  style={[styles.submitButton, busy ? styles.buttonDisabled : null]}
                  onPress={handleSubmit}
                  disabled={busy}
                  activeOpacity={0.85}
                >
                  {busy ? (
                    <ActivityIndicator color={Colors.white} size="small" />
                  ) : (
                    <Text style={styles.submitButtonText}>Verify & Sign In</Text>
                  )}
                </TouchableOpacity>

                {/* Change Number */}
                <TouchableOpacity
                  style={styles.changePhoneBtn}
                  onPress={() => setStep('form')}
                >
                  <Text style={styles.changePhoneText}>Change phone number</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* STEP 3: CREATE ACCOUNT */}
            {step === 'register' && (
              <View style={styles.inputsSection}>
                {/* First Name */}
                <View style={styles.fullWidthCol}>
                  <Text style={styles.inputLabel}>First Name</Text>
                  <TextInput
                    style={[styles.singleTextInput, regErrors.firstName ? styles.inputBorderError : null]}
                    placeholder="First Name"
                    placeholderTextColor="#94A3B8"
                    value={firstName}
                    onChangeText={(text) => {
                      setFirstName(text);
                      if (regErrors.firstName) setRegErrors((prev) => ({ ...prev, firstName: '' }));
                    }}
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
                    onChangeText={(text) => {
                      setLastName(text);
                      if (regErrors.lastName) setRegErrors((prev) => ({ ...prev, lastName: '' }));
                    }}
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
                    onChangeText={(text) => {
                      setEmail(text);
                      if (regErrors.email) setRegErrors((prev) => ({ ...prev, email: '' }));
                    }}
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
                    onChangeText={(text) => {
                      setPhone(text.replace(/[^0-9]/g, ''));
                      if (regErrors.phone) setRegErrors((prev) => ({ ...prev, phone: '' }));
                    }}
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
                    onPress={() => setShowGenderModal(true)}
                  >
                    <Text style={styles.dropdownSelectorText}>{gender || 'Select Gender'}</Text>
                    <MaterialIcons name="keyboard-arrow-down" size={20} color="#718096" />
                  </TouchableOpacity>
                </View>

                {/* Date Of Birth */}
                <View style={styles.fullWidthCol}>
                  <Text style={styles.inputLabel}>Date Of Birth</Text>
                  <TouchableOpacity
                    style={[styles.dropdownSelector, regErrors.dob ? styles.inputBorderError : null]}
                    activeOpacity={0.8}
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Text style={[styles.dropdownSelectorText, !dob && styles.placeholderText]}>
                      {dob ? DateTimeUtils.getDataFormat(dob) || dob : 'Select Date Of Birth'}
                    </Text>
                    <MaterialIcons name="calendar-today" size={16} color="#718096" />
                  </TouchableOpacity>
                  {!!regErrors.dob && <Text style={styles.fieldErrorText}>{regErrors.dob}</Text>}
                </View>

                {/* Row 4: Password */}
                <View style={styles.fullWidthCol}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <View style={[styles.passwordInputContainer, regErrors.password ? styles.inputBorderError : null]}>
                    <TextInput
                      style={styles.passwordTextInput}
                      placeholder="Password"
                      placeholderTextColor="#94A3B8"
                      secureTextEntry={!showPassword}
                      value={password}
                      onChangeText={(text) => {
                        setPassword(text);
                        if (regErrors.password) setRegErrors((prev) => ({ ...prev, password: '' }));
                      }}
                    />
                    <TouchableOpacity
                      style={styles.eyeIconBtn}
                      onPress={() => setShowPassword(!showPassword)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                        size={20}
                        color="#718096"
                      />
                    </TouchableOpacity>
                  </View>
                  {!!regErrors.password && <Text style={styles.fieldErrorText}>{regErrors.password}</Text>}
                </View>

                {/* Row 5: Confirm Password */}
                <View style={styles.fullWidthCol}>
                  <Text style={styles.inputLabel}>Confirm Password</Text>
                  <View style={[styles.passwordInputContainer, regErrors.confirmPassword ? styles.inputBorderError : null]}>
                    <TextInput
                      style={styles.passwordTextInput}
                      placeholder="Confirm Password"
                      placeholderTextColor="#94A3B8"
                      secureTextEntry={!showConfirmPassword}
                      value={confirmPassword}
                      onChangeText={(text) => {
                        setConfirmPassword(text);
                        if (regErrors.confirmPassword) setRegErrors((prev) => ({ ...prev, confirmPassword: '' }));
                      }}
                    />
                    <TouchableOpacity
                      style={styles.eyeIconBtn}
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                        size={20}
                        color="#718096"
                      />
                    </TouchableOpacity>
                  </View>
                  {!!regErrors.confirmPassword && <Text style={styles.fieldErrorText}>{regErrors.confirmPassword}</Text>}
                </View>

                {/* Submit Register Button */}
                <TouchableOpacity
                  style={[styles.submitButton, { marginTop: 16 }, busy ? styles.buttonDisabled : null]}
                  onPress={handleSubmit}
                  disabled={busy}
                  activeOpacity={0.85}
                >
                  {busy ? (
                    <ActivityIndicator color={Colors.white} size="small" />
                  ) : (
                    <Text style={styles.submitButtonText}>Create Account</Text>
                  )}
                </TouchableOpacity>

                {/* Switch to Sign In */}
                <View style={styles.switchAuthRow}>
                  <Text style={styles.switchAuthPrompt}>Already have an account? </Text>
                  <TouchableOpacity onPress={() => setStep('form')}>
                    <Text style={styles.switchAuthLink}>Sign In</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Forgot Password Modal Matching Screenshot */}
      <Modal
        visible={showForgotModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowForgotModal(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowForgotModal(false)}
        >
          <View style={styles.forgotModalCard}>
            <Text style={styles.forgotModalTitle}>Forgot Password?</Text>
            <Text style={styles.forgotModalSubtitle}>
              Enter your email and we'll send you a reset link.
            </Text>

            <TextInput
              style={[
                styles.forgotEmailInput,
                forgotEmailError ? styles.inputBorderError : null,
              ]}
              placeholder="test@yopmail.com"
              placeholderTextColor="#94A3B8"
              keyboardType="email-address"
              autoCapitalize="none"
              value={forgotEmail}
              onChangeText={(t) => {
                setForgotEmail(t);
                if (forgotEmailError) setForgotEmailError(undefined);
              }}
            />
            {!!forgotEmailError && (
              <Text style={[styles.fieldErrorText, { marginBottom: 8 }]}>
                {forgotEmailError}
              </Text>
            )}

            <View style={styles.forgotModalActions}>
              <TouchableOpacity
                style={[styles.sendResetBtn, isSendingReset && styles.buttonDisabled]}
                activeOpacity={0.85}
                onPress={handleSendResetLink}
                disabled={isSendingReset}
              >
                {isSendingReset ? (
                  <ActivityIndicator color={Colors.white} size="small" />
                ) : (
                  <Text style={styles.sendResetBtnText}>Send Reset Link</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.forgotCancelBtn}
                activeOpacity={0.8}
                onPress={() => setShowForgotModal(false)}
              >
                <Text style={styles.forgotCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Gender Picker Modal */}
      <Modal
        visible={showGenderModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowGenderModal(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowGenderModal(false)}
        >
          <View style={styles.pickerModalContent}>
            <Text style={styles.pickerModalTitle}>Select Gender</Text>
            <View style={styles.pickerOptionsList}>
              {GENDER_OPTIONS.map((item) => {
                const isSelected = gender === item;
                return (
                  <TouchableOpacity
                    key={item}
                    style={[styles.pickerOptionItem, isSelected && styles.pickerOptionSelected]}
                    activeOpacity={0.8}
                    onPress={() => {
                      setGender(item);
                      setShowGenderModal(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.pickerOptionText,
                        isSelected && styles.pickerOptionTextSelected,
                      ]}
                    >
                      {item}
                    </Text>
                    {isSelected && <MaterialIcons name="check" size={18} color={Colors.white} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Country Code Picker Modal */}
      <CountryCodePicker
        visible={showCountryPicker}
        selectedDialCode={countryCode.dialCode}
        onSelect={(item) => {
          setCountryCode(item);
          setShowCountryPicker(false);
        }}
        onClose={() => setShowCountryPicker(false)}
      />

      {/* Date of Birth Picker Modal */}
      <AppDatePickerModal
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        initialDate={dob}
        maxDate={new Date()}
        onSelectDate={(dateStr) => {
          setDob(dateStr);
          setShowDatePicker(false);
        }}
        title="Select Date of Birth"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  flexOne: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBarTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryFontColor,
  },
  scrollContent: {
    padding: 16,
  },
  formCard: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  logoWrapper: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logoImage: {
    width: 140,
    height: 60,
  },
  cardTitle: {
    fontSize: 20,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryFontColor,
    textAlign: 'center',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.secondaryFontColor,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  inputsSection: {
    gap: 12,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 10,
  },
  gridCol: {
    flex: 1,
  },
  fullWidthCol: {},
  inputLabel: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primaryFontColor,
    marginBottom: 5,
  },
  singleTextInput: {
    height: 44,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 13,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.primaryFontColor,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dropdownSelector: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dropdownSelectorText: {
    fontSize: 13,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primaryFontColor,
  },
  placeholderText: {
    color: '#94A3B8',
    fontFamily: Typography.fontFamily.regular,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 46,
  },
  countryCodePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: '100%',
  },
  countryCodeText: {
    fontSize: 13,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryFontColor,
  },
  phoneDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#CBD5E1',
  },
  phoneTextInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 12,
    fontSize: 13,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.primaryFontColor,
  },
  passwordSection: {
    marginTop: 2,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 44,
  },
  passwordTextInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 14,
    fontSize: 13,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.primaryFontColor,
  },
  eyeIconBtn: {
    paddingHorizontal: 12,
  },
  inputBorderError: {
    borderColor: Colors.redColor,
  },
  fieldErrorText: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.redColor,
    marginTop: 3,
  },
  formOptionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  rememberMeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: Colors.primaryColor,
    borderColor: Colors.primaryColor,
  },
  rememberMeText: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.secondaryFontColor,
  },
  forgotPasswordBtn: {
    paddingVertical: 4,
  },
  forgotPasswordText: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryColor,
  },
  toggleModeBtn: {
    paddingVertical: 4,
  },
  toggleModeText: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryColor,
  },
  submitButton: {
    backgroundColor: Colors.primaryColor,
    height: 46,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: Colors.primaryColor,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: 14,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
  },
  switchAuthRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 14,
  },
  switchAuthPrompt: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.secondaryFontColor,
  },
  switchAuthLink: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryColor,
  },
  otpContainer: {
    alignItems: 'center',
    marginVertical: 10,
    position: 'relative',
  },
  otpBoxesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  otpBox: {
    width: 44,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpBoxFocused: {
    borderColor: Colors.primaryColor,
    backgroundColor: '#FFF5EB',
  },
  otpBoxFilled: {
    borderColor: Colors.primaryColor,
  },
  otpBoxError: {
    borderColor: Colors.redColor,
  },
  otpDigitText: {
    fontSize: 18,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryFontColor,
  },
  hiddenOtpInput: {
    position: 'absolute',
    opacity: 0,
    width: '100%',
    height: '100%',
  },
  resendRow: {
    alignItems: 'center',
    marginVertical: 8,
  },
  timerText: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.secondaryFontColor,
  },
  boldTimer: {
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryColor,
  },
  resendBtnText: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryColor,
  },
  changePhoneBtn: {
    alignItems: 'center',
    marginTop: 8,
  },
  changePhoneText: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.secondaryFontColor,
    textDecorationLine: 'underline',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  forgotModalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  forgotModalTitle: {
    fontSize: 18,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryFontColor,
    textAlign: 'center',
    marginBottom: 6,
  },
  forgotModalSubtitle: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.secondaryFontColor,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
  },
  forgotEmailInput: {
    height: 44,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 13,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.primaryFontColor,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  forgotModalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  sendResetBtn: {
    flex: 1.4,
    height: 42,
    borderRadius: 10,
    backgroundColor: Colors.primaryColor,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primaryColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  sendResetBtnText: {
    fontSize: 13,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
  },
  forgotCancelBtn: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  forgotCancelBtnText: {
    fontSize: 13,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryFontColor,
  },
  pickerModalContent: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  pickerModalTitle: {
    fontSize: 14,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryFontColor,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  pickerOptionsList: {
    gap: 6,
  },
  pickerOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  pickerOptionSelected: {
    backgroundColor: Colors.primaryColor,
  },
  pickerOptionText: {
    fontSize: 13,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primaryFontColor,
  },
  pickerOptionTextSelected: {
    color: Colors.white,
    fontFamily: Typography.fontFamily.bold,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },
  tabButtonActive: {
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontFamily: Typography.fontFamily.medium,
    color: '#64748B',
  },
  tabTextActive: {
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryColor,
  },
});
