export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export const validatePhoneNumber = (phone: string): ValidationResult => {
  if (!phone || phone.trim().length === 0) {
    return { isValid: false, error: 'Phone number is required' };
  }
  const cleanPhone = phone.trim();
  if (cleanPhone.length < 10) {
    return { isValid: false, error: 'Please enter a valid 10-digit phone number' };
  }
  return { isValid: true };
};

export const validatePhone = validatePhoneNumber;

export const validateOtp = (otp: string): ValidationResult => {
  if (!otp || otp.trim().length === 0) {
    return { isValid: false, error: 'OTP is required' };
  }
  if (otp.trim().length < 4) {
    return { isValid: false, error: 'Please enter a valid OTP' };
  }
  return { isValid: true };
};
