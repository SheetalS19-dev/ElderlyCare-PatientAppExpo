import React, { memo } from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../../../constants';
import { fs, hs, TYPOGRAPHY, ws } from '../../../utils';

export interface ForgotPasswordModalProps {
  visible: boolean;
  onClose: () => void;
  forgotEmail: string;
  onEmailChange: (val: string) => void;
  forgotEmailError?: string;
  onSubmit: () => void;
  isSendingReset: boolean;
}

export const ForgotPasswordModal = memo(({
  visible,
  onClose,
  forgotEmail,
  onEmailChange,
  forgotEmailError,
  onSubmit,
  isSendingReset,
}: ForgotPasswordModalProps) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalBackdrop}
        activeOpacity={1}
        onPress={onClose}
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
            placeholder="Enter your email ID"
            placeholderTextColor={Colors.inkSoft}
            keyboardType="email-address"
            autoCapitalize="none"
            value={forgotEmail}
            onChangeText={onEmailChange}
          />
          {!!forgotEmailError && (
            <Text style={styles.fieldErrorText}>
              {forgotEmailError}
            </Text>
          )}

          <View style={styles.forgotModalActions}>
            <TouchableOpacity
              style={styles.forgotCancelBtn}
              activeOpacity={0.8}
              onPress={onClose}
            >
              <Text style={styles.forgotCancelBtnText} numberOfLines={1}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sendResetBtn, isSendingReset && styles.buttonDisabled]}
              activeOpacity={0.85}
              onPress={onSubmit}
              disabled={isSendingReset}
            >
              {isSendingReset ? (
                <ActivityIndicator color={Colors.white} size="small" />
              ) : (
                <Text style={styles.sendResetBtnText} numberOfLines={1}>Send Reset Link</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
});

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: ws(24),
  },
  forgotModalCard: {
    width: '100%',
    maxWidth: ws(340),
    backgroundColor: Colors.white,
    borderRadius: fs(20),
    padding: ws(22),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  forgotModalTitle: {
    fontSize: fs(18),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
    textAlign: 'center',
    marginBottom: hs(6),
  },
  forgotModalSubtitle: {
    fontSize: fs(12),
    ...TYPOGRAPHY.regular,
    color: Colors.secondaryFontColor,
    textAlign: 'center',
    lineHeight: fs(18),
    marginBottom: hs(18),
  },
  forgotEmailInput: {
    height: hs(44),
    backgroundColor: '#F3F8FD',
    borderRadius: fs(12),
    paddingHorizontal: ws(14),
    fontSize: fs(13),
    ...TYPOGRAPHY.regular,
    color: Colors.primaryFontColor,
    borderWidth: 1,
    borderColor: Colors.aquaBorder,
    marginBottom: hs(16),
  },
  inputBorderError: {
    borderColor: Colors.redColor,
    backgroundColor: '#FFF5F5',
  },
  fieldErrorText: {
    fontSize: fs(11),
    ...TYPOGRAPHY.medium,
    color: Colors.redColor,
    marginBottom: hs(8),
  },
  forgotModalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(12),
  },
  sendResetBtn: {
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
    height: hs(48),
    borderRadius: fs(12),
    backgroundColor: Colors.navy,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  sendResetBtnText: {
    fontSize: fs(13.5),
    ...TYPOGRAPHY.bold,
    color: Colors.white,
  },
  forgotCancelBtn: {
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
    height: hs(48),
    borderRadius: fs(12),
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  forgotCancelBtnText: {
    fontSize: fs(13.5),
    ...TYPOGRAPHY.bold,
    color: '#64748B',
  },
});
