import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
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
import { fs, hs, ws } from '../../../utils/metrics';
import { TYPOGRAPHY } from '../../../utils/typography';

export interface ForgotPasswordModalProps {
  visible: boolean;
  onClose: () => void;
  forgotEmail: string;
  onEmailChange: (val: string) => void;
  forgotEmailError?: string;
  onSubmit: () => void;
  isSendingReset: boolean;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  visible,
  onClose,
  forgotEmail,
  onEmailChange,
  forgotEmailError,
  onSubmit,
  isSendingReset,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.forgotCard}>
          <View style={styles.forgotHeader}>
            <Text style={styles.forgotTitle}>Forgot Password?</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={fs(22)} color={Colors.slate_718096} />
            </TouchableOpacity>
          </View>
          <Text style={styles.forgotSubtitle}>
            Enter your email and we'll send you a reset link.
          </Text>

          <Text style={[styles.inputLabel, { marginTop: hs(12) }]}>Email Address</Text>
          <TextInput
            style={[styles.singleTextInput, forgotEmailError ? styles.inputBorderError : null]}
            placeholder="test@yopmail.com"
            placeholderTextColor={Colors.slate_94A3B8}
            value={forgotEmail}
            onChangeText={onEmailChange}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {!!forgotEmailError && (
            <Text style={styles.fieldErrorText}>{forgotEmailError}</Text>
          )}

          <View style={styles.forgotBtnRow}>
            <TouchableOpacity
              style={styles.forgotCancelBtn}
              onPress={onClose}
              disabled={isSendingReset}
            >
              <Text style={styles.forgotCancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.forgotSubmitBtn, isSendingReset ? styles.buttonDisabled : null]}
              onPress={onSubmit}
              disabled={isSendingReset}
            >
              {isSendingReset ? (
                <ActivityIndicator color={Colors.white} size="small" />
              ) : (
                <Text style={styles.forgotSubmitText}>Send Reset Link</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: ws(20),
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFill,
  },
  forgotCard: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: fs(20),
    padding: ws(20),
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  forgotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hs(8),
  },
  forgotTitle: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(18),
    color: Colors.primaryFontColor,
  },
  forgotSubtitle: {
    ...TYPOGRAPHY.regular,
    fontSize: fs(13),
    color: Colors.secondaryFontColor,
    lineHeight: fs(18),
  },
  inputLabel: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(13),
    color: Colors.primaryFontColor,
    marginBottom: hs(6),
  },
  singleTextInput: {
    backgroundColor: Colors.inputTextBgColor,
    borderRadius: fs(12),
    borderWidth: 1,
    borderColor: Colors.borderColor,
    height: hs(50),
    paddingHorizontal: ws(14),
    ...TYPOGRAPHY.regular,
    fontSize: fs(14),
    color: Colors.primaryFontColor,
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
  forgotBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: ws(10),
    marginTop: hs(20),
  },
  forgotCancelBtn: {
    paddingHorizontal: ws(16),
    paddingVertical: hs(10),
    borderRadius: fs(10),
  },
  forgotCancelText: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(13),
    color: Colors.secondaryFontColor,
  },
  forgotSubmitBtn: {
    backgroundColor: Colors.primaryColor,
    paddingHorizontal: ws(18),
    paddingVertical: hs(10),
    borderRadius: fs(10),
  },
  buttonDisabled: {
    backgroundColor: Colors.slate_94A3B8,
  },
  forgotSubmitText: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(13),
    color: Colors.white,
  },
});
