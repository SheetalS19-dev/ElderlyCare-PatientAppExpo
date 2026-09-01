export const validateEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validateName = (name: string): boolean => {
  return !!name && name.trim().length >= 2;
};
