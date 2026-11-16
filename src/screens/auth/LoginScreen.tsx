import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useRef, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AppDatePickerModal,
  CountryCodeItem,
  HeaderBackdrop,
} from '../../components';
import { AppConstants, Colors, Images } from '../../constants';
import { useAuth } from '../../context/AuthContext';
import type { RootStackParamList } from '../../navigation/types';
import {
  useForgetPasswordMutation,
  useLoginWithPhoneMutation,
  useRegisterUserMutation,
} from '../../redux/apis/authApi';
import { confirmOtp, sendOtp } from '../../services/firebaseAuthService';
import { storageService } from '../../services/storageService';
import { fs, hs, showToast, TYPOGRAPHY, ws } from '../../utils';
import {
  validateDob,
  validateEmail,
  validateName,
  validatePhone,
  validatePhoneOrEmail,
  validateStrongPassword,
} from '../../validation/authValidation';
import {
  ForgotPasswordModal,
  GenderPickerModal,
  OtpVerifyForm,
  RegisterForm,
  SignInForm,
} from './components';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;
type LoginStep = 'form' | 'otp_verify' | 'register';

const REMEMBER_ME_KEY = '@elderly_care_remember_me';
const REMEMBER_PHONE_KEY = '@elderly_care_remember_phone';
const REMEMBER_PASSWORD_KEY = '@elderly_care_remember_password';
const RESEND_SECONDS = 60;

const isNotExistsMessage = (msg?: string) =>
  !!msg && String(msg).toLowerCase().includes('not exist');

export const LoginScreen = ({ navigation, route }: Props) => {
  const insets = useSafeAreaInsets();
  const { login } = useAuth();

  const [step, setStep] = useState<LoginStep>('form');

  const [countryCode] = useState<CountryCodeItem>({
    name: 'India',
    code: 'IN',
    dialCode: AppConstants.defaultCountryCode || '+91',
    flag: '🇮🇳',
  });

  // Sign In Fields
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState<string | undefined>();

  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [showPassword, setShowPassword] = useState(false);

  const [rememberMe, setRememberMe] = useState(false);

  // Forgot Password State & Mutation
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotEmailError, setForgotEmailError] = useState<string | undefined>();
  const [forgetPassword, { isLoading: isSendingReset }] = useForgetPasswordMutation();

  // OTP State
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState<string | undefined>();

  // Register Fields (strictly isolated from Sign In / Remember Me state)
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [gender, setGender] = useState('');
  const [dob, setDob] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
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
        const savedRemember = await storageService.getItem<boolean | string>(REMEMBER_ME_KEY);
        const savedPhone = await storageService.getItem<string>(REMEMBER_PHONE_KEY);
        const savedPassword = await storageService.getItem<string>(REMEMBER_PASSWORD_KEY);
        const isRememberEnabled = savedRemember === true || savedRemember === 'true';
        if (isRememberEnabled && savedPhone) {
          setRememberMe(true);
          setPhone(String(savedPhone));
          if (savedPassword) {
            setPassword(String(savedPassword));
          }
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

  const resetRegisterForm = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setRegPhone('');
    setGender('');
    setDob('');
    setRegPassword('');
    setRegConfirmPassword('');
    setShowRegPassword(false);
    setShowRegConfirmPassword(false);
    setRegErrors({});
  };

  const handleSwitchToRegister = () => {
    resetRegisterForm();
    setPhoneError(undefined);
    setPasswordError(undefined);
    setStep('register');
  };

  const handleSwitchToLogin = async () => {
    setRegErrors({});
    setPhoneError(undefined);
    setPasswordError(undefined);
    setStep('form');
    try {
      const savedRemember = await storageService.getItem<boolean | string>(REMEMBER_ME_KEY);
      const savedPhone = await storageService.getItem<string>(REMEMBER_PHONE_KEY);
      const savedPassword = await storageService.getItem<string>(REMEMBER_PASSWORD_KEY);
      if (savedRemember === true || savedRemember === 'true') {
        if (savedPhone) setPhone(String(savedPhone));
        if (savedPassword) setPassword(String(savedPassword));
      }
    } catch {
      // ignore
    }
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
      handleSwitchToLogin();
      return;
    }
    navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
  };

  const saveOrClearRememberMe = async (cleanPhone: string, cleanPassword: string) => {
    try {
      if (rememberMe) {
        await storageService.setItem(REMEMBER_ME_KEY, 'true');
        await storageService.setItem(REMEMBER_PHONE_KEY, cleanPhone);
        await storageService.setItem(REMEMBER_PASSWORD_KEY, cleanPassword);
      } else {
        await storageService.removeItem(REMEMBER_ME_KEY);
        await storageService.removeItem(REMEMBER_PHONE_KEY);
        await storageService.removeItem(REMEMBER_PASSWORD_KEY);
      }
    } catch {
      // ignore storage errors
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

  const applyLoginErrorMessage = (msg: string) => {
    const normalized = msg.toLowerCase();
    if (normalized.includes('password')) {
      setPasswordError(msg);
    } else {
      setPhoneError(msg);
    }
    showToast(msg);
  };

  const handlePasswordLogin = async () => {
    const identifierValid = validatePhoneOrEmail(phone);
    if (!identifierValid.isValid) {
      setPhoneError(identifierValid.error);
      return;
    }
    setPhoneError(undefined);

    if (!password || password.trim().length === 0) {
      setPasswordError('Password is required');
      return;
    }
    setPasswordError(undefined);

    setIsBusy(true);
    const trimmedIdentifier = phone.trim();
    const cleanIdentifier = trimmedIdentifier.includes('@')
      ? trimmedIdentifier
      : trimmedIdentifier.replace(/\D/g, '');
    const cleanPassword = password.trim();

    try {
      const res = await loginWithPhone({ phone: cleanIdentifier, password: cleanPassword }).unwrap();
      setIsBusy(false);

      if (res?.status !== false && res?.token && res?.data) {
        await saveOrClearRememberMe(cleanIdentifier, cleanPassword);
        showToast('Login Successful');
        await handleSuccessLogin(res.token, res.data);
      } else {
        applyLoginErrorMessage(res?.message || 'Login failed. Please check credentials.');
      }
    } catch (e: any) {
      setIsBusy(false);
      const msg = e?.data?.message || e?.error || e?.message || 'Login failed. Please try again.';
      applyLoginErrorMessage(msg);
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
      } else if (isNotExistsMessage(res?.message)) {
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
    const cleanPhone = regPhone.replace(/\D/g, '');
    const cleanPassword = regPassword.trim();
    const cleanConfirm = regConfirmPassword.trim();

    const fNameRes = validateName(firstName, true, 'First name');
    if (!fNameRes.isValid) {
      errors.firstName = fNameRes.error!;
    }

    if (lastName.trim()) {
      const lNameRes = validateName(lastName, false, 'Last name');
      if (!lNameRes.isValid) {
        errors.lastName = lNameRes.error!;
      }
    }

    const phoneRes = validatePhone(cleanPhone, true);
    if (!phoneRes.isValid) errors.phone = phoneRes.error || 'Invalid phone number';

    const emailRes = validateEmail(email, true);
    if (!emailRes.isValid) errors.email = emailRes.error || 'Invalid email address';

    if (!gender) errors.gender = 'Please select gender';

    const dobRes = validateDob(dob, true);
    if (!dobRes.isValid) errors.dob = dobRes.error || 'Invalid date of birth';

    const passRes = validateStrongPassword(cleanPassword);
    if (!passRes.isValid) {
      errors.password = passRes.error || 'Password must be at least 8 characters with uppercase, lowercase, number, and special character';
    }
    if (cleanPassword !== cleanConfirm) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setRegErrors(errors);
    if (Object.keys(errors).length > 0) {
      showToast('Please fix the errors before continuing');
      return;
    }

    setIsBusy(true);
    try {
      const formattedGender = gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase();

      const payload = {
        f_name: firstName.trim(),
        l_name: lastName ? lastName.trim() : '',
        phone: cleanPhone,
        isd_code: countryCode.dialCode || '+91',
        gender: formattedGender,
        dob: dob.trim(),
        email: email.trim(),
        password: cleanPassword,
      };

      const formData = new FormData();
      Object.entries(payload).forEach(([key, value]) => formData.append(key, value));

      const res = await registerUser(formData).unwrap();

      if (res?.status === false || String(res?.status) === '0') {
        setIsBusy(false);
        showToast(res?.message || 'Registration failed');
        return;
      }

      showToast('Account Created Successfully!');

      if (res?.token && res?.data) {
        resetRegisterForm();
        setIsBusy(false);
        await handleSuccessLogin(res.token, res.data);
      } else {
        try {
          const loginRes = await loginWithPhone({ phone: cleanPhone, password: cleanPassword }).unwrap();
          setIsBusy(false);

          if (loginRes?.status !== false && loginRes?.token && loginRes?.data) {
            resetRegisterForm();
            await handleSuccessLogin(loginRes.token, loginRes.data);
          } else {
            resetRegisterForm();
            setPhone(cleanPhone);
            setPassword('');
            showToast(loginRes?.message || 'Account created! Please sign in.');
            setStep('form');
          }
        } catch (loginErr: any) {
          setIsBusy(false);
          resetRegisterForm();
          setPhone(cleanPhone);
          setPassword('');
          showToast(loginErr?.data?.message || 'Account created! Please sign in.');
          setStep('form');
        }
      }
    } catch (e: any) {
      setIsBusy(false);
      showToast(e?.data?.message || e?.message || 'Registration failed');
    }
  };

  const handleSendResetLink = async () => {
    const emailRes = validateEmail(forgotEmail, true);
    if (!emailRes.isValid) {
      setForgotEmailError(emailRes.error || 'Please enter a valid email address');
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

  return (
    <View style={styles.container}>
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
          {/* Hero header: navy -> teal gradient with logo, title and subtitle */}
          <View style={[styles.heroHeader, { paddingTop: Math.max(insets.top + 8, 24) }]}>
            <HeaderBackdrop id="authHeaderGrad" />
            <TouchableOpacity style={styles.heroBackBtn} onPress={handleBack} activeOpacity={0.8}>
              <MaterialIcons name="arrow-back" size={fs(22)} color={Colors.white} />
            </TouchableOpacity>
            <View style={styles.heroLogoChip}>
              <Image source={Images.logo} style={styles.logoImage} resizeMode="contain" />
            </View>
            <Text style={styles.heroTitle}>
              {step === 'register' ? 'Create Account' : step === 'otp_verify' ? 'OTP Verification' : 'Welcome Back 👋'}
            </Text>
            <Text style={styles.heroSubtitle}>
              {step === 'register'
                ? 'Fill in your details to register as a new patient'
                : step === 'otp_verify'
                  ? `Enter 6-digit OTP sent to ${fullPhoneNumber}`
                  : 'Login to manage your health, appointments and family'}
            </Text>
          </View>

          <View style={styles.formCard}>
            {/* Mode Switcher Tabs */}
            {step !== 'otp_verify' && (
              <View style={styles.tabContainer}>
                <TouchableOpacity
                  style={[styles.tabButton, step === 'form' && styles.tabButtonActive]}
                  onPress={handleSwitchToLogin}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.tabText, step === 'form' && styles.tabTextActive]}>Sign In</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tabButton, step === 'register' && styles.tabButtonActive]}
                  onPress={handleSwitchToRegister}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.tabText, step === 'register' && styles.tabTextActive]}>Register</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* STEP 1: LOGIN (Phone or Email & Password) */}
            {step === 'form' && (
              <SignInForm
                phone={phone}
                onPhoneChange={(val) => {
                  setPhone(val);
                  if (phoneError) setPhoneError(undefined);
                }}
                phoneError={phoneError}
                password={password}
                onPasswordChange={(val) => {
                  setPassword(val);
                  if (passwordError) setPasswordError(undefined);
                }}
                passwordError={passwordError}
                showPassword={showPassword}
                onToggleShowPassword={() => setShowPassword(!showPassword)}
                rememberMe={rememberMe}
                onToggleRememberMe={() => setRememberMe(!rememberMe)}
                onOpenForgotModal={() => {
                  const trimmedPhone = phone.trim();
                  setForgotEmail(trimmedPhone.includes('@') ? trimmedPhone : '');
                  setForgotEmailError(undefined);
                  setShowForgotModal(true);
                }}
                onSubmit={handlePasswordLogin}
                busy={busy}
                onSwitchToRegister={handleSwitchToRegister}
              />
            )}

            {/* STEP 2: OTP VERIFICATION */}
            {step === 'otp_verify' && (
              <OtpVerifyForm
                otp={otp}
                onOtpChange={(val) => {
                  setOtp(val);
                  if (otpError) setOtpError(undefined);
                }}
                otpError={otpError}
                resendSeconds={resendSeconds}
                onResendOtp={handleResendOtp}
                onSubmit={handleSubmitOtp}
                busy={busy}
                onChangePhone={() => setStep('form')}
              />
            )}

            {/* STEP 3: CREATE ACCOUNT */}
            {step === 'register' && (
              <RegisterForm
                firstName={firstName}
                onFirstNameChange={(text) => {
                  setFirstName(text);
                  if (regErrors.firstName) setRegErrors((prev) => ({ ...prev, firstName: '' }));
                }}
                lastName={lastName}
                onLastNameChange={(text) => {
                  setLastName(text);
                  if (regErrors.lastName) setRegErrors((prev) => ({ ...prev, lastName: '' }));
                }}
                email={email}
                onEmailChange={(text) => {
                  setEmail(text);
                  if (regErrors.email) setRegErrors((prev) => ({ ...prev, email: '' }));
                }}
                phone={regPhone}
                onPhoneChange={(val) => {
                  setRegPhone(val);
                  if (regErrors.phone) setRegErrors((prev) => ({ ...prev, phone: '' }));
                }}
                gender={gender}
                onOpenGenderModal={() => setShowGenderModal(true)}
                dob={dob}
                onOpenDatePicker={() => setShowDatePicker(true)}
                password={regPassword}
                onPasswordChange={(text) => {
                  setRegPassword(text);
                  if (regErrors.password) setRegErrors((prev) => ({ ...prev, password: '' }));
                }}
                showPassword={showRegPassword}
                onToggleShowPassword={() => setShowRegPassword((prev) => !prev)}
                confirmPassword={regConfirmPassword}
                onConfirmPasswordChange={(text) => {
                  setRegConfirmPassword(text);
                  if (regErrors.confirmPassword) setRegErrors((prev) => ({ ...prev, confirmPassword: '' }));
                }}
                showConfirmPassword={showRegConfirmPassword}
                onToggleShowConfirmPassword={() => setShowRegConfirmPassword((prev) => !prev)}
                regErrors={regErrors}
                onSubmit={handleSubmitRegister}
                busy={busy}
                onSwitchToLogin={handleSwitchToLogin}
              />
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        visible={showForgotModal}
        onClose={() => setShowForgotModal(false)}
        forgotEmail={forgotEmail}
        onEmailChange={(t) => {
          setForgotEmail(t);
          if (forgotEmailError) setForgotEmailError(undefined);
        }}
        forgotEmailError={forgotEmailError}
        onSubmit={handleSendResetLink}
        isSendingReset={isSendingReset}
      />

      {/* Gender Picker Modal */}
      <GenderPickerModal
        visible={showGenderModal}
        onClose={() => setShowGenderModal(false)}
        selectedGender={gender}
        onSelectGender={setGender}
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
    backgroundColor: Colors.bgColor,
  },
  flexOne: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: hs(24),
  },
  heroHeader: {
    paddingHorizontal: ws(20),
    paddingBottom: hs(56),
    borderBottomLeftRadius: fs(30),
    borderBottomRightRadius: fs(30),
    overflow: 'hidden',
    backgroundColor: Colors.navy,
    alignItems: 'center',
  },
  heroBackBtn: {
    alignSelf: 'flex-start',
    width: ws(40),
    height: ws(40),
    aspectRatio: 1,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.38)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroLogoChip: {
    paddingHorizontal: ws(14),
    paddingVertical: hs(8),
    marginTop: hs(4),
  },
  logoImage: {
    width: ws(140),
    height: hs(60),
  },
  heroTitle: {
    fontSize: fs(22),
    ...TYPOGRAPHY.bold,
    color: Colors.white,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: fs(12),
    ...TYPOGRAPHY.regular,
    color: '#D6E8F6',
    textAlign: 'center',
    lineHeight: fs(18),
    marginTop: hs(4),
    paddingHorizontal: ws(10),
  },
  formCard: {
    backgroundColor: Colors.white,
    borderRadius: fs(24),
    padding: ws(18),
    marginHorizontal: ws(16),
    marginTop: -hs(34),
    borderWidth: 1,
    borderColor: '#E3EDF7',
    shadowColor: Colors.navy,
    shadowOffset: { width: 0, height: hs(4) },
    shadowOpacity: 0.1,
    shadowRadius: fs(12),
    elevation: 5,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.aqua,
    borderRadius: fs(14),
    padding: ws(4),
    marginBottom: hs(20),
  },
  tabButton: {
    flex: 1,
    paddingVertical: hs(10),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: fs(10),
  },
  tabButtonActive: {
    backgroundColor: Colors.navy,
    shadowColor: Colors.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  tabText: {
    fontSize: fs(14),
    ...TYPOGRAPHY.medium,
    color: Colors.navyMid,
  },
  tabTextActive: {
    ...TYPOGRAPHY.bold,
    color: Colors.white,
  },
});
