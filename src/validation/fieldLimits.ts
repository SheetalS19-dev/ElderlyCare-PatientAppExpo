/**
 * Centralized field length limits (upper and lower bounds)
 * Used across forms for input restrictions (maxLength) and validation.
 */
export const FIELD_LIMITS = {
  // Names (First Name, Last Name, Relative Name, Author Name)
  NAME_MIN: 3,
  NAME_MAX: 30,
  FULL_NAME_MAX: 60,

  // Authentication & Contact
  EMAIL_MIN: 5,
  EMAIL_MAX: 80,
  PHONE_MIN: 10,
  PHONE_MAX: 10,
  PASSWORD_MIN: 8,
  PASSWORD_MAX: 32,
  OTP_LENGTH: 6,

  // Address & Location
  STREET_ADDRESS_MIN: 5,
  STREET_ADDRESS_MAX: 120,
  CITY_MIN: 3,
  CITY_MAX: 50,
  STATE_MIN: 3,
  STATE_MAX: 50,
  POSTAL_CODE_LENGTH: 6,

  // User input content
  FILE_TITLE_MIN: 2,
  FILE_TITLE_MAX: 60,
  REVIEW_MIN_CHARS: 5,
  REVIEW_MAX_CHARS: 500,
  REVIEW_MAX_WORDS: 300,
  COMMENT_MIN: 3,
  COMMENT_MAX: 300,
  COMMENT_MAX_WORDS: 300,
  COUPON_MIN: 3,
  COUPON_MAX: 20,
  SEARCH_MAX: 60,

  // Numbers & Metrics
  VITAL_INPUT_MAX: 6,
  AMOUNT_MIN: 100,
  AMOUNT_MAX_VALUE: 5000,
  AMOUNT_MAX_CHARS: 6,
} as const;

export type FieldLimitsType = typeof FIELD_LIMITS;
