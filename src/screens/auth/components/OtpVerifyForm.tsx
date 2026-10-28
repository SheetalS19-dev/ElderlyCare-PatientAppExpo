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
import { fs, hs, ws } from '../../../utils/metrics';
import { TYPOGRAPHY } from '../../../utils/typography';

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

export const OtpVerifyForm: React.FC<OtpVerifyFormProps> = ({
  otp,
  onOtpChange,
  otpError,
  resendSeconds,
  onResendOtp,
  onSubmit,
  busy,
  onChangePhone,
}) => {
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
          onChangeText={onOtpChange}
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
      <TouchableOpacity
        style={styles.changePhoneBtn}
        onPress={onChangePhone}
      >
        <Text style={styles.changePhoneText}>Change phone number</Text>
      </TouchableOpacity>
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
  otpContainer: {
    position: 'relative',
    marginVertical: hs(12),
  },
  otpBoxesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  otpBox: {
    width: ws(46),
    height: hs(54),
    borderRadius: fs(12),
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBoxFocused: {
    borderColor: Colors.primaryColor,
    backgroundColor: Colors.white,
  },
  otpBoxFilled: {
    borderColor: Colors.primaryColor,
    backgroundColor: '#EFF6FF',
  },
  otpBoxError: {
    borderColor: Colors.redColor,
  },
  otpDigitText: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(20),
    color: Colors.primaryFontColor,
  },
  hiddenOtpInput: {
    ...StyleSheet.absoluteFill,
    opacity: 0,
  },
  fieldErrorText: {
    ...TYPOGRAPHY.medium,
    fontSize: fs(11),
    color: Colors.redColor,
  },
  resendRow: {
    alignItems: 'center',
    marginVertical: hs(14),
  },
  timerText: {
    ...TYPOGRAPHY.regular,
    fontSize: fs(13),
    color: Colors.secondaryFontColor,
  },
  boldTimer: {
    ...TYPOGRAPHY.bold,
    color: Colors.primaryColor,
  },
  resendBtnText: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(13),
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
  changePhoneBtn: {
    alignItems: 'center',
    marginTop: hs(16),
  },
  changePhoneText: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(13),
    color: Colors.secondaryFontColor,
  },
});
