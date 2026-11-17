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
import { fs, hs, TYPOGRAPHY, ws } from '../../../utils';

export interface OtpVerifyFormProps {
  otp: string;
  onOtpChange: (val: string) => void;
  otpError?: string;
  resendSeconds: number;
  onResendOtp: () => void;
  onSubmit: () => void;
  busy: boolean;
  onChangePhone: () => void;
}

export const OtpVerifyForm = memo(({
  otp,
  onOtpChange,
  otpError,
  resendSeconds,
  onResendOtp,
  onSubmit,
  busy,
  onChangePhone,
}: OtpVerifyFormProps) => {
  return (
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
                  isFocused && styles.otpBoxFocused,
                  !!digit && styles.otpBoxFilled,
                  !!otpError && styles.otpBoxError,
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
          onChangeText={(text) => onOtpChange(text.replace(/[^0-9]/g, ''))}
          autoFocus
        />
      </View>
      {!!otpError && (
        <Text style={[styles.fieldErrorText, { textAlign: 'center', marginTop: hs(8) }]}>
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
          <TouchableOpacity onPress={onResendOtp} disabled={busy}>
            <Text style={styles.resendBtnText}>Resend OTP</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Submit OTP Button */}
      <TouchableOpacity
        style={[styles.submitButton, busy ? styles.buttonDisabled : null]}
        onPress={onSubmit}
        disabled={busy}
        activeOpacity={0.85}
      >
        {busy ? (
          <ActivityIndicator color={Colors.white} size="small" />
        ) : (
          <Text style={styles.submitButtonText}>Verify & Login</Text>
        )}
      </TouchableOpacity>

      {/* Change Number */}
      <TouchableOpacity style={styles.changePhoneBtn} onPress={onChangePhone}>
        <Text style={styles.changePhoneText}>Change phone number</Text>
      </TouchableOpacity>
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
  otpContainer: {
    alignItems: 'center',
    marginVertical: hs(10),
    position: 'relative',
  },
  otpBoxesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: ws(6),
  },
  otpBox: {
    width: ws(44),
    height: hs(50),
    borderRadius: fs(12),
    borderWidth: 1.5,
    borderColor: Colors.aquaBorder,
    backgroundColor: Colors.blue_F3F8FD,
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpBoxFocused: {
    borderColor: Colors.primaryColor,
    backgroundColor: Colors.white,
  },
  otpBoxFilled: {
    borderColor: Colors.primaryColor,
    backgroundColor: Colors.teal_EDF8FB,
  },
  otpBoxError: {
    borderColor: Colors.redColor,
    backgroundColor: Colors.red_FFF5F5,
  },
  otpDigitText: {
    fontSize: fs(20),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
  },
  hiddenOtpInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    opacity: 0.01,
  },
  fieldErrorText: {
    fontSize: fs(11),
    ...TYPOGRAPHY.medium,
    color: Colors.redColor,
  },
  resendRow: {
    alignItems: 'center',
    marginVertical: hs(8),
  },
  timerText: {
    fontSize: fs(12),
    ...TYPOGRAPHY.regular,
    color: Colors.secondaryFontColor,
  },
  boldTimer: {
    ...TYPOGRAPHY.bold,
    color: Colors.primaryColor,
  },
  resendBtnText: {
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
  changePhoneBtn: {
    alignItems: 'center',
    marginTop: hs(8),
  },
  changePhoneText: {
    fontSize: fs(12),
    ...TYPOGRAPHY.medium,
    color: Colors.secondaryFontColor,
    textDecorationLine: 'underline',
  },
});
