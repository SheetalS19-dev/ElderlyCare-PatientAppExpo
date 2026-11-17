import {
  validateEmail as validateEmailObj,
  validateName as validateNameObj,
  type ValidationResult,
} from './authValidation';

export const STREET_ADDRESS_MIN = 5;
export const STREET_ADDRESS_MAX = 120;
export const CITY_MIN = 3;
export const CITY_MAX = 50;
export const STATE_MIN = 3;
export const STATE_MAX = 50;

export const validateEmail = (email: string): boolean => {
  return validateEmailObj(email, false).isValid;
};

export const validateName = (name: string, required = true): boolean => {
  return validateNameObj(name, required).isValid;
};

/**
 * Validates street address length (5-120 chars) and ensures meaningful text.
 */
export const validateStreetAddress = (
  value: string,
  required = false
): ValidationResult => {
  const trimmed = (value || '').trim();
  if (!trimmed) {
    return required
      ? { isValid: false, error: 'Street address is required' }
      : { isValid: true };
  }
  if (trimmed.length < STREET_ADDRESS_MIN) {
    return {
      isValid: false,
      error: `Street address must be at least ${STREET_ADDRESS_MIN} characters`,
    };
  }
  if (trimmed.length > STREET_ADDRESS_MAX) {
    return {
      isValid: false,
      error: `Street address must not exceed ${STREET_ADDRESS_MAX} characters`,
    };
  }
  if (!/[A-Za-z]/.test(trimmed)) {
    return {
      isValid: false,
      error: 'Please enter a valid street address',
    };
  }
  if (!/^[A-Za-z0-9\s,.\-\/#&()']+$/.test(trimmed)) {
    return {
      isValid: false,
      error: 'Street address contains unsupported characters',
    };
  }
  return { isValid: true };
};

/**
 * Validates city name length (3-50 chars) and allows valid names such as "Sector 17".
 */
export const validateCityName = (
  value: string,
  required = false
): ValidationResult => {
  const trimmed = (value || '').trim();
  if (!trimmed) {
    return required
      ? { isValid: false, error: 'City is required' }
      : { isValid: true };
  }
  if (trimmed.length < CITY_MIN) {
    return {
      isValid: false,
      error: `City must be at least ${CITY_MIN} characters`,
    };
  }
  if (trimmed.length > CITY_MAX) {
    return {
      isValid: false,
      error: `City must not exceed ${CITY_MAX} characters`,
    };
  }
  if (!/^[A-Za-z][A-Za-z0-9\s.\-']*$/.test(trimmed) || !/[A-Za-z]{2}/.test(trimmed)) {
    return {
      isValid: false,
      error: 'Please enter a valid city name',
    };
  }
  return { isValid: true };
};

/**
 * Validates state name length (2-50 chars), characters, and format.
 */
export const validateStateName = (
  value: string,
  required = false
): ValidationResult => {
  const trimmed = (value || '').trim();
  if (!trimmed) {
    return required
      ? { isValid: false, error: 'State is required' }
      : { isValid: true };
  }
  if (trimmed.length < STATE_MIN) {
    return {
      isValid: false,
      error: `State must be at least ${STATE_MIN} characters`,
    };
  }
  if (trimmed.length > STATE_MAX) {
    return {
      isValid: false,
      error: `State must not exceed ${STATE_MAX} characters`,
    };
  }
  if (!/^[A-Za-z][A-Za-z\s.\-&']*$/.test(trimmed) || !/[A-Za-z]{2}/.test(trimmed)) {
    return {
      isValid: false,
      error: 'Please enter a valid state name (letters only)',
    };
  }
  if (/(.)\1{3,}/i.test(trimmed)) {
    return {
      isValid: false,
      error: 'Please enter a valid state name',
    };
  }
  return { isValid: true };
};

/**
 * Validates 6-digit Indian postal code.
 */
export const validatePostalCode = (
  value: string,
  required = false
): ValidationResult => {
  const trimmed = (value || '').trim();
  if (!trimmed) {
    return required
      ? { isValid: false, error: 'Postal code is required' }
      : { isValid: true };
  }
  const clean = trimmed.replace(/\D/g, '');
  if (clean.length !== 6 || !/^[1-9][0-9]{5}$/.test(clean)) {
    return {
      isValid: false,
      error: 'Please enter a valid 6-digit postal code',
    };
  }
  return { isValid: true };
};

export { validateNameObj };

