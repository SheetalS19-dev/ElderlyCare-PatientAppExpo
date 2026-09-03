import { validateEmail as validateEmailObj } from './authValidation';

export const validateEmail = (email: string): boolean => {
  return validateEmailObj(email, false).isValid;
};

export const validateName = (name: string): boolean => {
  return !!name && name.trim().length >= 2;
};

