// App Constants converted from Flutter app_constans.dart

export const AppConstants = {
  appName: 'ElderlyCare Patient',
  appCurrency: '₹', // Rupee symbol (\u20B9)
  defaultCountryCode: '+91',
  storageKeys: {
    token: '@user_token',
    userData: '@user_data',
    isLoggedIn: '@is_logged_in',
    themeMode: '@theme_mode',
    uid: '@user_uid',
  },
} as const;

export const CountryCode = '+91';

export interface CountryCode {
  name: string;
  code: string;
  dialCode: string;
  flag: string;
}
