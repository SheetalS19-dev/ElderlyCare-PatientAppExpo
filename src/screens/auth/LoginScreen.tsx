import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
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
import {
  AppDatePickerModal,
  HeaderBackdrop,
} from '../../components';
import { Colors, Images } from '../../constants';
import { fs, hs, TYPOGRAPHY, ws } from '../../utils';
import {
  ForgotPasswordModal,
  GenderPickerModal,
  OtpVerifyForm,
  RegisterForm,
  SignInForm,
} from './components';
import { useLogin } from './useLogin';

export const LoginScreen: React.FC = () => {
  const {
    insets,
    step,
    setStep,
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
    handleResendOtp,
    handleSubmitOtp,
    handleSubmitRegister,
    handleSendResetLink,
    navigation,
  } = useLogin();

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
            {(step !== 'form' || navigation.canGoBack()) && (
              <TouchableOpacity style={styles.heroBackBtn} onPress={handleBack} activeOpacity={0.8}>
                <MaterialIcons name="arrow-back" size={fs(22)} color={Colors.white} />
              </TouchableOpacity>
            )}
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
    color: Colors.blue_D6E8F6,
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
    borderColor: Colors.border_E3EDF7,
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
