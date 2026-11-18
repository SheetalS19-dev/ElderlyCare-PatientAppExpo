export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export const validateName = (name: string, required = true, fieldName = 'Name'): ValidationResult => {
  const trimmed = (name || '').trim();
  if (!trimmed) {
    if (!required) return { isValid: true };
    return { isValid: false, error: `${fieldName} is required` };
  }
  if (!/^[A-Za-z\s]+$/.test(trimmed)) {
    return { isValid: false, error: 'Special characters, hyphens, and numbers are not allowed' };
  }
  if (trimmed.length < 3) {
    return { isValid: false, error: `${fieldName} must be at least 3 characters` };
  }
  return { isValid: true };
};

export const validatePhoneNumber = (phone: string, required = true): ValidationResult => {
  if (!phone || phone.trim().length === 0) {
    if (!required) return { isValid: true };
    return { isValid: false, error: 'Mobile number is required' };
  }
  const cleanPhone = phone.trim().replace(/\D/g, '');
  if (cleanPhone.length !== 10) {
    return { isValid: false, error: 'Please enter a valid 10-digit mobile number' };
  }
  if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
    return {
      isValid: false,
      error: 'Please enter a valid Indian mobile number starting with 6, 7, 8 or 9',
    };
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

export const validatePhoneOrEmail = (input: string, required = true): ValidationResult => {
  const trimmed = (input || '').trim();
  if (!trimmed) {
    if (!required) return { isValid: true };
    return { isValid: false, error: 'Phone number or email is required' };
  }

  if (trimmed.includes('@') || /[A-Za-z]/.test(trimmed)) {
    const emailResult = validateEmail(trimmed, true);
    if (!emailResult.isValid) {
      return {
        isValid: false,
        error: trimmed.includes('@')
          ? 'Please enter a valid email address'
          : 'Please enter a valid 10-digit mobile number or email address',
      };
    }
    return { isValid: true };
  }

  if (!/^[\d\s\-()+]+$/.test(trimmed)) {
    return { isValid: false, error: 'Please enter a valid 10-digit mobile number or email address' };
  }

  const cleanPhone = trimmed.replace(/\D/g, '');
  if (cleanPhone.length !== 10) {
    return { isValid: false, error: 'Please enter a valid 10-digit mobile number or email address' };
  }
  if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
    return {
      isValid: false,
      error: 'Please enter a valid Indian mobile number starting with 6, 7, 8 or 9',
    };
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
    if (isNaN(temp) || temp < 25.0 || temp > 45.0) {
      return { isValid: false, error: 'Temperature must be between 25.0 and 45.0 °C' };
    }
  } else if (type === 'SpO2') {
    const spo2 = Number(val1);
    if (isNaN(spo2) || spo2 < 1 || spo2 > 100) {
      return { isValid: false, error: 'SpO2 percentage must be between 1% and 100%' };
    }
  }
  return { isValid: true };
};

export const validateStrongPassword = (password: string): ValidationResult => {
  if (!password || password.trim().length === 0) {
    return { isValid: false, error: 'Password is required' };
  }
  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters' };
  }
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, error: 'Password must include at least one uppercase letter (A-Z)' };
  }
  if (!/[a-z]/.test(password)) {
    return { isValid: false, error: 'Password must include at least one lowercase letter (a-z)' };
  }
  if (!/[0-9]/.test(password)) {
    return { isValid: false, error: 'Password must include at least one number (0-9)' };
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { isValid: false, error: 'Password must include at least one special character (!@#$%^&*)' };
  }
  return { isValid: true };
};
