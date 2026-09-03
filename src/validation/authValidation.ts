export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export const validatePhoneNumber = (phone: string, required = true): ValidationResult => {
  if (!phone || phone.trim().length === 0) {
    if (!required) return { isValid: true };
    return { isValid: false, error: 'Phone number is required' };
  }
  const cleanPhone = phone.trim().replace(/\D/g, '');
  if (cleanPhone.length !== 10) {
    return { isValid: false, error: 'Please enter a valid 10-digit phone number' };
  }
  return { isValid: true };
};

export const validatePhone = validatePhoneNumber;

export const validateEmail = (email: string, required = true): ValidationResult => {
  if (!email || email.trim().length === 0) {
    if (!required) return { isValid: true };
    return { isValid: false, error: 'Email address is required' };
  }
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(email.trim())) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }
  return { isValid: true };
};

export const validateDob = (dob?: string | null, required = false): ValidationResult => {
  if (!dob || dob.trim().length === 0) {
    if (!required) return { isValid: true };
    return { isValid: false, error: 'Date of birth is required' };
  }
  const parsedDate = new Date(dob.trim());
  if (isNaN(parsedDate.getTime())) {
    return { isValid: false, error: 'Please enter a valid date' };
  }
  const today = new Date();
  if (parsedDate > today) {
    return { isValid: false, error: 'Date of birth cannot be in the future' };
  }
  return { isValid: true };
};

export const validateOtp = (otp: string): ValidationResult => {
  if (!otp || otp.trim().length === 0) {
    return { isValid: false, error: 'OTP is required' };
  }
  if (otp.trim().length < 4) {
    return { isValid: false, error: 'Please enter a valid OTP' };
  }
  return { isValid: true };
};

export const validateVitalMetric = (
  type: string,
  val1: string,
  val2?: string
): ValidationResult => {
  if (type === 'Blood Pressure') {
    const sys = Number(val1);
    const dia = Number(val2);
    if (!val1 || isNaN(sys) || sys < 40 || sys > 300) {
      return { isValid: false, error: 'Systolic BP must be between 40 and 300 mmHg' };
    }
    if (!val2 || isNaN(dia) || dia < 30 || dia > 200) {
      return { isValid: false, error: 'Diastolic BP must be between 30 and 200 mmHg' };
    }
    if (sys <= dia) {
      return { isValid: false, error: 'Systolic BP must be greater than Diastolic BP' };
    }
  } else if (type === 'Sugar') {
    const fasting = val1 ? Number(val1) : null;
    const random = val2 ? Number(val2) : null;
    if (fasting !== null && (isNaN(fasting) || fasting < 20 || fasting > 1000)) {
      return { isValid: false, error: 'Fasting Sugar must be between 20 and 1000 mg/dL' };
    }
    if (random !== null && (isNaN(random) || random < 20 || random > 1000)) {
      return { isValid: false, error: 'Random Sugar must be between 20 and 1000 mg/dL' };
    }
  } else if (type === 'Weight') {
    const wt = Number(val1);
    if (isNaN(wt) || wt < 1 || wt > 500) {
      return { isValid: false, error: 'Weight must be between 1 and 500 kg' };
    }
  } else if (type === 'Temperature') {
    const temp = Number(val1);
    if (isNaN(temp) || temp < 70 || temp > 115) {
      return { isValid: false, error: 'Temperature must be between 70 and 115 °F' };
    }
  } else if (type === 'SpO2') {
    const spo2 = Number(val1);
    if (isNaN(spo2) || spo2 < 1 || spo2 > 100) {
      return { isValid: false, error: 'SpO2 percentage must be between 1% and 100%' };
    }
  }
  return { isValid: true };
};

