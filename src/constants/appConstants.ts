// App Constants converted from Flutter app_constans.dart

export const AppConstants = {
  appName: 'ElderlyCare Patient',
  appCurrency: '₹', // Rupee symbol (\u20B9)
  defaultCountryCode: '+91',
  support: {
    helplinePhone: '+91 88406 22729',
    helplineFormattedPhone: '+918840 622 729',
    helplineRawPhone: '+918840622729',
    supportEmail: 'praveen@elderlycare.life',
    infoEmail: 'praveen@elderlycare.life',
    address: 'L-3/141, Vinay Khand, Gomti Nagar, Lucknow 226010',
  },
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
