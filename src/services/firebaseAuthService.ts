import auth from '@react-native-firebase/auth';

export interface OtpSendResult {
  success: boolean;
  confirmation?: any;
  error?: string;
}

export interface OtpVerifyResult {
  success: boolean;
  error?: string;
}

/**
 * Sends an OTP to the given phone number (with country code, e.g. +911234567890).
 * Mirrors Flutter's FirebaseAuth.instance.verifyPhoneNumber flow.
 */
export const sendOtp = async (phoneNumberWithCode: string): Promise<OtpSendResult> => {
  try {
    const confirmation = await auth().signInWithPhoneNumber(phoneNumberWithCode);
    return { success: true, confirmation };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to send OTP' };
  }
};

/**
 * Confirms the OTP entered by the user against the pending confirmation result.
 */
export const confirmOtp = async (
  confirmation: any,
  code: string,
): Promise<OtpVerifyResult> => {
  try {
    await confirmation.confirm(code);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Invalid OTP' };
  }
};

export const firebaseSignOut = async (): Promise<void> => {
  try {
    await auth().signOut();
  } catch {
    // no-op: user may already be signed out
  }
};