import type { RouteProp } from '@react-navigation/native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useRef, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { CountryCodeItem } from '../../components';
import { AppConstants } from '../../constants';
import { useAuth } from '../../context/AuthContext';
import type { RootStackParamList } from '../../navigation/types';
import {
  useForgetPasswordMutation,
  useLoginWithPhoneMutation,
  useRegisterUserMutation,
} from '../../redux/apis/authApi';
import { confirmOtp, sendOtp } from '../../services/firebaseAuthService';
import { storageService } from '../../services/storageService';
import { showToast } from '../../utils';
import {
  validateDob,
  validateEmail,
  validateName,
  validatePhone,
  validatePhoneOrEmail,
  validateStrongPassword,
} from '../../validation/authValidation';

export type LoginStep = 'form' | 'otp_verify' | 'register';

const REMEMBER_ME_KEY = '@elderly_care_remember_me';
const REMEMBER_PHONE_KEY = '@elderly_care_remember_phone';
const REMEMBER_PASSWORD_KEY = '@elderly_care_remember_password';
const RESEND_SECONDS = 60;

const isNotExistsMessage = (msg?: string) =>
  !!msg && String(msg).toLowerCase().includes('not exist');

export const useLogin = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'Login'>>();
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
    if (!phone) {
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

    const lNameRes = validateName(lastName, false, 'Last name');
    if (!lNameRes.isValid) {
      errors.lastName = lNameRes.error!;
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

      setIsBusy(false);
      resetRegisterForm();
      setPhone(cleanPhone);
      setPassword(cleanPassword);
      setPhoneError(undefined);
      setPasswordError(undefined);
      setStep('form');
      showToast('Account created successfully! Please sign in.');
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

  return {
    navigation,
    route,
    insets,
    step,
    setStep,
    countryCode,
    phone,
    setPhone,
    phoneError,
    setPhoneError,
    password,
    setPassword,
    passwordError,
    setPasswordError,
    showPassword,
    setShowPassword,
    rememberMe,
    setRememberMe,
    showForgotModal,
    setShowForgotModal,
    forgotEmail,
    setForgotEmail,
    forgotEmailError,
    setForgotEmailError,
    isSendingReset,
    otp,
    setOtp,
    otpError,
    setOtpError,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    email,
    setEmail,
    regPhone,
    setRegPhone,
    gender,
    setGender,
    dob,
    setDob,
    regPassword,
    setRegPassword,
    showRegPassword,
    setShowRegPassword,
    regConfirmPassword,
    setRegConfirmPassword,
    showRegConfirmPassword,
    setShowRegConfirmPassword,
    showDatePicker,
    setShowDatePicker,
    showGenderModal,
    setShowGenderModal,
    regErrors,
    setRegErrors,
    resendSeconds,
    busy,
    fullPhoneNumber,
    handleSwitchToRegister,
    handleSwitchToLogin,
    handleBack,
    handlePasswordLogin,
    handleSendOtp,
    handleResendOtp,
    handleSubmitOtp,
    handleSubmitRegister,
    handleSendResetLink,
  };
};
