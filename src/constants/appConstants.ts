// App Constants converted from Flutter app_constans.dart

export const AppConstants = {
  appName: 'ElderlyCare Patient',
  appCurrency: '₹', // Rupee symbol (\u20B9)
  defaultCountryCode: '+91',
  support: {
    helplinePhone: '+91 88406 22729',
    helplineFormattedPhone: '+918840 622 729',
    helplineRawPhone: '+918840622729',
    supportEmail: 'support@elderlycare.life',
    infoEmail: 'info@elderlycare.life',
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

export const DEPARTMENT_DEFAULT_IMAGES: Record<string | number, string> = {
  2: 'department/2025-06-15-684e87094982d.webp', // Radiology
  3: 'department/2025-06-15-684e8739a6fcc.png',  // Obstetrics & Gastroenterology
  4: 'department/2025-06-15-684e875fa866e.png',  // Cardiology
  5: 'department/2025-06-15-684e87838c52e.png',  // Emergency medicine
  6: 'department/2025-06-15-684eab6a80962.png',  // Neurology
  7: 'department/2025-06-15-684eaaf7b75a3.jpg',  // General Surgery
  8: 'department/2025-11-06-690c7131015d5.png',  // Orthopedics
  radiology: 'department/2025-06-15-684e87094982d.webp',
  'obstetrics & gastroenterology': 'department/2025-06-15-684e8739a6fcc.png',
  gastroenterology: 'department/2025-06-15-684e8739a6fcc.png',
  cardiology: 'department/2025-06-15-684e875fa866e.png',
  'emergency medicine': 'department/2025-06-15-684e87838c52e.png',
  emergency: 'department/2025-06-15-684e87838c52e.png',
  neurology: 'department/2025-06-15-684eab6a80962.png',
  'general surgery': 'department/2025-06-15-684eaaf7b75a3.jpg',
  surgery: 'department/2025-06-15-684eaaf7b75a3.jpg',
  orthopedics: 'department/2025-11-06-690c7131015d5.png',
  orthopaedics: 'department/2025-11-06-690c7131015d5.png',
};

export interface CountryCode {
  name: string;
  code: string;
  dialCode: string;
  flag: string;
}
