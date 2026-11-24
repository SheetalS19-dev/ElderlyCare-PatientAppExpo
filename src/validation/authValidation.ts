import { FIELD_LIMITS } from './fieldLimits';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export const validateName = (
  name: string,
  required = true,
  fieldName = 'Name',
  minLength = FIELD_LIMITS.NAME_MIN,
  maxLength = FIELD_LIMITS.NAME_MAX
): ValidationResult => {
  const trimmed = (name || '').trim();
  if (!trimmed) {
    if (!required) return { isValid: true };
    return { isValid: false, error: `${fieldName} is required` };
  }
  if (!/^[A-Za-z\s]+$/.test(trimmed)) {
    return { isValid: false, error: 'Special characters, hyphens, and numbers are not allowed' };
  }
  if (trimmed.length < minLength) {
    return { isValid: false, error: `${fieldName} must be at least ${minLength} characters` };
  }
  if (trimmed.length > maxLength) {
    return { isValid: false, error: `${fieldName} must not exceed ${maxLength} characters` };
  }
  return { isValid: true };
};

export const validatePhoneNumber = (phone: string, required = true): ValidationResult => {
  if (!phone || phone.trim().length === 0) {
    if (!required) return { isValid: true };
    return { isValid: false, error: 'Mobile number is required' };
  }
  const cleanPhone = phone.trim().replace(/\D/g, '');
  if (cleanPhone.length !== FIELD_LIMITS.PHONE_MAX) {
    return { isValid: false, error: `Please enter a valid ${FIELD_LIMITS.PHONE_MAX}-digit mobile number` };
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
  const trimmed = email.trim();
  if (trimmed.length < FIELD_LIMITS.EMAIL_MIN) {
    return { isValid: false, error: `Email address must be at least ${FIELD_LIMITS.EMAIL_MIN} characters` };
  }
  if (trimmed.length > FIELD_LIMITS.EMAIL_MAX) {
    return { isValid: false, error: `Email address must not exceed ${FIELD_LIMITS.EMAIL_MAX} characters` };
  }
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(trimmed)) {
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

  if (trimmed.length > FIELD_LIMITS.EMAIL_MAX) {
    return { isValid: false, error: `Input must not exceed ${FIELD_LIMITS.EMAIL_MAX} characters` };
  }

  if (trimmed.includes('@') || /[A-Za-z]/.test(trimmed)) {
    const emailResult = validateEmail(trimmed, true);
    if (!emailResult.isValid) {
      return {
        isValid: false,
        error: trimmed.includes('@')
          ? emailResult.error || 'Please enter a valid email address'
          : 'Please enter a valid 10-digit mobile number or email address',
      };
    }
    return { isValid: true };
  }

  if (!/^[\d\s\-()+]+$/.test(trimmed)) {
    return { isValid: false, error: 'Please enter a valid 10-digit mobile number or email address' };
  }

  const cleanPhone = trimmed.replace(/\D/g, '');
  if (cleanPhone.length !== FIELD_LIMITS.PHONE_MAX) {
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
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (parsedDate >= todayStart) {
    return { isValid: false, error: 'Date of birth must be a past date' };
  }
  return { isValid: true };
};

/**
 * Calculates approximate age in full years from a date string (YYYY-MM-DD or DD/MM/YYYY).
 */
export const calculateAgeYearsFromDob = (dobStr?: string | null): number => {
  if (!dobStr) return 0;
  const clean = dobStr.trim().split('T')[0];
  const parts = clean.split(/[-/]/);
  if (parts.length < 3) return 0;
  let y = parseInt(parts[0], 10);
  let m = parseInt(parts[1], 10) - 1;
  let d = parseInt(parts[2], 10);
  if (y < 100) {
    d = parseInt(parts[0], 10);
    m = parseInt(parts[1], 10) - 1;
    y = parseInt(parts[2], 10);
  }
  const birth = new Date(y, m, d);
  if (isNaN(birth.getTime())) return 0;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  return Math.max(0, age);
};

/**
 * Validates relation-specific DOB rules (e.g. parents must be adults, past date, age logic).
 */
export const validateFamilyRelationDob = (
  dob: string,
  relation: string,
  userDob?: string | null
): ValidationResult => {
  const baseDobRes = validateDob(dob, true);
  if (!baseDobRes.isValid) return baseDobRes;

  const memberAge = calculateAgeYearsFromDob(dob);
  const relLower = (relation || '').trim().toLowerCase();
  const userAge = userDob ? calculateAgeYearsFromDob(userDob) : 0;

  if (relLower === 'father' || relLower === 'mother') {
    if (memberAge < 18) {
      return { isValid: false, error: `${relation} must be at least 18 years old` };
    }
    if (userAge > 0 && memberAge <= userAge) {
      return { isValid: false, error: `${relation} must be older than you` };
    }
  } else if (relLower === 'grandfather' || relLower === 'grandmother') {
    if (memberAge < 36) {
      return { isValid: false, error: `${relation} must be at least 36 years old` };
    }
    if (userAge > 0 && memberAge <= userAge + 10) {
      return { isValid: false, error: `${relation} must be older than your parents` };
    }
  } else if (relLower === 'husband' || relLower === 'wife' || relLower === 'spouse') {
    if (memberAge < 18) {
      return { isValid: false, error: 'Spouse must be at least 18 years old' };
    }
  } else if (relLower === 'son' || relLower === 'daughter') {
    if (userAge > 0 && memberAge >= userAge) {
      return { isValid: false, error: `${relation} must be younger than you` };
    }
  }

  return { isValid: true };
};

/**
 * Validates unique family relation limits (e.g. only 1 Father, 1 Mother, 1 Spouse allowed).
 */
export const validateFamilyRelationLimit = (
  relation: string,
  existingMembers: any[],
  editingId?: string | number | null
): ValidationResult => {
  const relClean = (relation || '').trim();
  const relLower = relClean.toLowerCase();

  const SINGLE_RELATIONS = ['father', 'mother', 'husband', 'wife', 'spouse', 'grandfather', 'grandmother'];
  if (!SINGLE_RELATIONS.includes(relLower)) {
    return { isValid: true };
  }

  const conflict = existingMembers.some((m) => {
    if (editingId && String(m.id ?? (m as any).member_id) === String(editingId)) {
      return false;
    }
    const mRel = (m.relation || m.relationship || '').trim().toLowerCase();
    if (relLower === 'husband' || relLower === 'wife' || relLower === 'spouse') {
      return mRel === 'husband' || mRel === 'wife' || mRel === 'spouse';
    }
    return mRel === relLower;
  });

  if (conflict) {
    if (relLower === 'husband' || relLower === 'wife' || relLower === 'spouse') {
      return { isValid: false, error: 'A spouse is already added in your family members' };
    }
    return { isValid: false, error: `${relClean} is already added in your family members` };
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
  if (password.length < FIELD_LIMITS.PASSWORD_MIN) {
    return { isValid: false, error: `Password must be at least ${FIELD_LIMITS.PASSWORD_MIN} characters` };
  }
  if (password.length > FIELD_LIMITS.PASSWORD_MAX) {
    return { isValid: false, error: `Password must not exceed ${FIELD_LIMITS.PASSWORD_MAX} characters` };
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

export const validateReviewText = (
  text: string,
  required = true,
  minChars = FIELD_LIMITS.REVIEW_MIN_CHARS,
  maxChars = FIELD_LIMITS.REVIEW_MAX_CHARS,
  maxWords = FIELD_LIMITS.REVIEW_MAX_WORDS
): ValidationResult => {
  const trimmed = (text || '').trim();
  if (!trimmed) {
    if (!required) return { isValid: true };
    return { isValid: false, error: 'Review text is required' };
  }
  if (trimmed.length < minChars) {
    return { isValid: false, error: `Review must be at least ${minChars} characters` };
  }
  if (trimmed.length > maxChars) {
    return { isValid: false, error: `Review must not exceed ${maxChars} characters` };
  }
  const words = trimmed.split(/\s+/).filter(Boolean).length;
  if (words > maxWords) {
    return { isValid: false, error: `Review must not exceed ${maxWords} words (${words}/${maxWords})` };
  }
  return { isValid: true };
};

export const validateComment = (
  comment: string,
  required = true,
  minChars = FIELD_LIMITS.COMMENT_MIN,
  maxChars = FIELD_LIMITS.COMMENT_MAX
): ValidationResult => {
  const trimmed = (comment || '').trim();
  if (!trimmed) {
    if (!required) return { isValid: true };
    return { isValid: false, error: 'Comment is required' };
  }
  if (trimmed.length < minChars) {
    return { isValid: false, error: `Comment must be at least ${minChars} characters` };
  }
  if (trimmed.length > maxChars) {
    return { isValid: false, error: `Comment must not exceed ${maxChars} characters` };
  }
  return { isValid: true };
};

export const validateCouponCode = (
  code: string,
  required = true,
  minChars = FIELD_LIMITS.COUPON_MIN,
  maxChars = FIELD_LIMITS.COUPON_MAX
): ValidationResult => {
  const trimmed = (code || '').trim();
  if (!trimmed) {
    if (!required) return { isValid: true };
    return { isValid: false, error: 'Coupon code is required' };
  }
  if (trimmed.length < minChars) {
    return { isValid: false, error: `Coupon code must be at least ${minChars} characters` };
  }
  if (trimmed.length > maxChars) {
    return { isValid: false, error: `Coupon code must not exceed ${maxChars} characters` };
  }
  return { isValid: true };
};

export const validateFileTitle = (
  title: string,
  required = true,
  minChars = FIELD_LIMITS.FILE_TITLE_MIN,
  maxChars = FIELD_LIMITS.FILE_TITLE_MAX
): ValidationResult => {
  const trimmed = (title || '').trim();
  if (!trimmed) {
    if (!required) return { isValid: true };
    return { isValid: false, error: 'File title is required' };
  }
  if (trimmed.length < minChars) {
    return { isValid: false, error: `File title must be at least ${minChars} characters` };
  }
  if (trimmed.length > maxChars) {
    return { isValid: false, error: `File title must not exceed ${maxChars} characters` };
  }
  return { isValid: true };
};

export const validateWalletAmount = (
  amount: string | number,
  min = FIELD_LIMITS.AMOUNT_MIN,
  max = FIELD_LIMITS.AMOUNT_MAX_VALUE
): ValidationResult => {
  const num = typeof amount === 'number' ? amount : Number(amount);
  if (isNaN(num) || num <= 0) {
    return { isValid: false, error: 'Please enter a valid amount' };
  }
  if (num < min) {
    return { isValid: false, error: `Minimum amount is ₹${min}` };
  }
  if (num > max) {
    return { isValid: false, error: `Maximum amount is ₹${max.toLocaleString('en-IN')}` };
  }
  return { isValid: true };
};
