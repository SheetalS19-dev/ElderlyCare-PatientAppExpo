const Palette = {
  // Brand
  primary: '#2563EB',
  secondary: '#F96335',

  // Absolute
  white: '#FFFFFF',
  black: '#000000',

  // Reds
  red: 'red',
  red_FFE8E8: '#FFE8E8',
  red_FFF0F0: '#FFF0F0',
  red_C0392B: '#C0392B',
  red_E57373CC: '#E57373CC',

  // Dark blues (used for dark UI & static headers)
  blue_151835: '#151835',
  blue_151835A6: '#151835A6',
  blue_272B54: '#272B54',
  blue_565FBA: '#565FBA',
  blue_54619F: '#54619F',
  blue_53548F: '#53548F',
  blue_8281AB: '#8281AB',
  blue_1E2547: '#1E2547',
  blue_B0BAF9: '#B0BAF9',
  blue_394180: '#394180',
  blue_263178: '#263178',
  blue_DBEDFF: '#DBEDFF',
  blue_7586ED: '#7586ED',
  blue_3978CD: '#3978CD',
  blue_3AB0FF: '#3AB0FF',
  blue_5B6EE1: '#5B6EE1',
  blue_EEF0FF: '#EEF0FF',
  blue_4A90E2: '#4A90E2',
  blue_EDF5FF: '#EDF5FF',
  blue_232347: '#232347',
  blue_1C1E40: '#1C1E40',

  // Whites with opacity
  white_FFFFFF1A: '#FFFFFF1A',

  // Oranges
  orange_FC9470: '#FC9470',
  orange_D2AEA1: '#D2AEA1',
  orange_FEB790: '#FEB790',
  orange_D06E68: '#D06E68',
  orange_D85C40: '#D85C40',
  orange_FF5317: '#FF5317',
  orange_FFE3D3: '#FFE3D3',
  orange_FFF5DD: '#FFF5DD',
  orange_E98F8C: '#E98F8C',
  orange_F96335: '#F96335',
  orange_E04A4B: '#E04A4B',
  orange_F97316: '#F97316',
  orange_FAC78F: '#FAC78F',
  orange_EB5F39: '#EB5F39',
  orange_EC6B42: '#EC6B42',
  orange_FF7A59: '#FF7A59',
  orange_FFF1EC: '#FFF1EC',

  // Grays
  gray_272B54: '#272B54',
  gray_D9D9D9: '#D9D9D9',
  gray_9098AF: '#9098AF',
  gray_DBDEE7: '#DBDEE7',
  gray_f2f2f2: '#f2f2f2',
  gray_9FA7BC: '#9FA7BC',
  gray_E4D9D4: '#E4D9D4',
  gray_B7BBDF: '#B7BBDF',
  gray_F3F6FC: '#F3F6FC',
  gray_526286: '#526286',
  gray_A2A2A2: '#A2A2A2',
  gray_5C698D: '#5C698D',
  gray_ffffff40: '#FFFFFF40',
  gray_E5E7EB: '#E5E7EB',
  gray_F8FAFC: '#F8FAFC',

  // Others
  offwhite_FAF3F0: '#FAF3F0',
  overlay: '#151835A3',
  sky_blue_DBF1FF: '#DBF1FF',
  purple_E2E4FF: '#E2E4FF',
  green_09A43D: '#09A43D',
  green_1B8A3E: '#1B8A3E',
  green_4DC87ACC: '#4DC87ACC',
  green_22C55E: '#22C55E',
  green_F0FBF4: '#F0FBF4',
  green_49B68D: '#49B68D',
  green_EAF8F1: '#EAF8F1',
  peach_FAF3F0: '#FAF3F0',
  brown_782D26: '#782D26',
  yellow_FFFBEB: '#FFFBEB',
  yellow_FEF3C7: '#FEF3C7',
  yellow_D97706: '#D97706',
  black_00000099_light: 'rgba(0,0,0,0.5)',
};

// STATIC COLORS
export const StaticColors = {
  // Header gradient stops
  headerGradientStart: Palette.blue_151835,
  headerGradientEnd: Palette.blue_272B54,

  // HomeHeader gradient stops
  homeHeaderGradientStart: Palette.blue_151835,
  homeHeaderGradientMid: Palette.blue_272B54,
  homeHeaderGradientEnd: Palette.blue_54619F,

  // Text on headers
  headerTitle: Palette.white,
  headerSubtitle: Palette.white,
  headerGreeting: Palette.blue_B0BAF9,

  // Icon buttons inside headers
  headerIconBg: 'rgba(255, 255, 255, 0.08)',
  headerIconBorder: 'rgba(255, 255, 255, 0.12)',

  // Menu button inside HomeHeader
  homeMenuBg: Palette.blue_151835A6,
  homeMenuBorder: Palette.white_FFFFFF1A,
  homeMenuLine: Palette.white,

  // Header shadow / border
  headerShadow: Palette.blue_151835,
  headerBorderBottom: 'rgba(255, 255, 255, 0.08)',

  // Notification badge
  notificationBadgeBg: Palette.orange_FF5317,
  notificationBadgeBorder: Palette.blue_151835,

  // Onboarding / auth screens background (always dark)
  onboardingBg: Palette.blue_151835,
  onboardingCard: Palette.blue_272B54,
  onboardingText: Palette.white,
  onboardingSubText: Palette.blue_B0BAF9,
  onboardingBorder: Palette.blue_565FBA,
  onboardingInputBg: Palette.blue_1E2547,
  onboardingOverlay: Palette.overlay,
};

// ─────────────────────────────────────────────────────────────────────────────
// LIGHT THEME TOKENS
// ─────────────────────────────────────────────────────────────────────────────
const LightTheme = {
  // Backgrounds
  screenBg: '#F4F7FB',
  cardBg: Palette.white,
  cardBgSecondary: '#F8FAFC',
  cardBgTertiary: '#EFF6FF',

  // Modal & bottom-sheet surfaces
  modalBg: Palette.white,
  modalBgSecondary: '#F8FAFC',
  modalHandle: '#CBD5E1',
  modalOverlay: Palette.black_00000099_light,

  // Dropdown / picker
  dropdownBg: Palette.white,
  dropdownOptionBg: Palette.blue_232347,
  dropdownOptionSelectedBg: '#EFF6FF',
  dropdownBorder: '#E2E8F0',
  dropdownSearchBg: '#F8FAFC',

  // Input fields
  inputBg: '#F8FAFC',
  inputBorder: '#E2E8F0',
  inputBorderFocused: Palette.primary,
  inputText: '#0F172A',
  inputPlaceholder: '#94A3B8',
  inputIconTint: '#64748B',

  // Text
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  textLink: Palette.primary,
  textOnAccent: Palette.white,

  // Borders / dividers
  border: '#E2E8F0',
  divider: '#E2E8F0',

  // Skeleton / shimmer
  skeletonBase: '#E2E8F0',
  skeletonHighlight: '#F1F5F9',

  // Icon tints (non-header)
  iconPrimary: '#0F172A',
  iconMuted: '#94A3B8',

  // Status pills & badges (aligned with web Tailwind badges)
  successBg: '#DCFCE7',
  successText: '#15803D',
  successBorder: '#86EFAC',
  warningBg: '#FEF3C7',
  warningText: '#D97706',
  errorBg: '#FEE2E2',
  errorText: '#DC2626',
  infoBg: '#EFF6FF',
  infoText: Palette.primary,

  // Floating action button
  fabBg: Palette.primary,
  fabIcon: Palette.white,

  // Bottom tab bar
  tabBarBg: Palette.white,
  tabBarBorder: '#E2E8F0',
  tabBarActive: Palette.primary,
  tabBarInactive: '#94A3B8',

  // Drawer
  drawerBg: Palette.white,
  drawerItemActive: '#EFF6FF',
  drawerItemText: '#0F172A',

  // Chat bubbles
  chatBubbleSentBg: Palette.primary,
  chatBubbleSentText: Palette.white,
  chatBubbleReceivedBg: Palette.white,
  chatBubbleReceivedText: '#0F172A',
  chatBubbleBorder: '#E2E8F0',

  // Cards with accent left-border (e.g. checklist, journal)
  accentCard: '#EFF6FF',
  accentBrandBorder: '#BFDBFE',
  accentWarmBorder: '#FED7AA',

  // Switch
  switchTrackOn: Palette.primary,
  switchTrackOff: '#CBD5E1',
  switchThumb: Palette.white,
};

// ─────────────────────────────────────────────────────────────────────────────
// DARK THEME TOKENS
// ─────────────────────────────────────────────────────────────────────────────
const DarkTheme = {
  // Backgrounds
  screenBg: Palette.blue_151835,
  cardBg: Palette.blue_1E2547,
  cardBgSecondary: Palette.blue_272B54,
  cardBgTertiary: Palette.blue_53548F,

  // Modal & bottom-sheet surfaces
  modalBg: Palette.blue_1E2547,
  modalBgSecondary: Palette.blue_272B54,
  modalHandle: Palette.blue_565FBA,
  modalOverlay: 'rgba(0,0,0,0.65)',

  // Dropdown / picker
  dropdownBg: Palette.blue_1E2547,
  dropdownOptionBg: Palette.blue_1E2547,
  dropdownOptionSelectedBg: Palette.blue_272B54,
  dropdownBorder: Palette.blue_53548F,
  dropdownSearchBg: Palette.blue_272B54,

  // Input fields
  inputBg: Palette.blue_272B54,
  inputBorder: Palette.blue_53548F,
  inputBorderFocused: Palette.blue_7586ED,
  inputText: Palette.white,
  inputPlaceholder: Palette.blue_8281AB,
  inputIconTint: Palette.blue_B0BAF9,

  // Text
  textPrimary: Palette.white,
  textSecondary: Palette.blue_B0BAF9,
  textMuted: Palette.blue_8281AB,
  textLink: Palette.blue_7586ED,
  textOnAccent: Palette.white,

  // Borders / dividers
  border: Palette.blue_53548F,
  divider: Palette.blue_272B54,

  // Skeleton / shimmer
  skeletonBase: Palette.blue_272B54,
  skeletonHighlight: Palette.blue_54619F,

  // Icon tints (non-header)
  iconPrimary: Palette.white,
  iconMuted: Palette.blue_8281AB,

  // Status pills & badges
  successBg: '#0D2E1C',
  successText: Palette.green_22C55E,
  successBorder: Palette.green_1B8A3E,
  warningBg: '#2E2410',
  warningText: Palette.orange_FAC78F,
  errorBg: '#2E1010',
  errorText: '#F87171',
  infoBg: '#0D1C2E',
  infoText: Palette.blue_3AB0FF,

  // Floating action button
  fabBg: Palette.blue_565FBA,
  fabIcon: Palette.white,

  // Bottom tab bar
  tabBarBg: Palette.blue_1E2547,
  tabBarBorder: Palette.blue_272B54,
  tabBarActive: Palette.blue_7586ED,
  tabBarInactive: Palette.blue_8281AB,

  // Drawer
  drawerBg: Palette.blue_1E2547,
  drawerItemActive: Palette.blue_272B54,
  drawerItemText: Palette.white,

  // Chat bubbles
  chatBubbleSentBg: Palette.blue_565FBA,
  chatBubbleSentText: Palette.white,
  chatBubbleReceivedBg: Palette.blue_272B54,
  chatBubbleReceivedText: Palette.white,
  chatBubbleBorder: Palette.blue_53548F,

  // Cards with accent left-border
  accentCard: Palette.blue_272B54,
  accentBrandBorder: Palette.blue_53548F,
  accentWarmBorder: Palette.blue_53548F,

  // Switch
  switchTrackOn: Palette.blue_565FBA,
  switchTrackOff: Palette.blue_272B54,
  switchThumb: Palette.white,
};

const black_00000099_light = 'rgba(0,0,0,0.5)';
(Palette as any).black_00000099_light = black_00000099_light;
(Palette as any).black_232347 = '#232347';
(Palette as any).black_1C1E40 = '#1C1E40';
(Palette as any).primary = '#2563EB';
(Palette as any).black_00000099 = '#00000099';

export const AppColors = {
  // Brand
  primary: Palette.primary,
  primaryColor: Palette.primary,
  secondary: Palette.secondary,
  secondaryColor: Palette.secondary,
  btnColor: Palette.primary,
  btnColorGreen: Palette.green_22C55E,
  btnColorRed: Palette.red_C0392B,
  greyBtnColor: Palette.gray_526286,
  white: Palette.white,
  black: Palette.black,
  disabled: Palette.gray_D9D9D9,
  mainFontColor: Palette.blue_1C1E40,
  primaryFontColor: Palette.blue_1C1E40,
  secondaryFontColor: Palette.gray_526286,
  greenFontColor: Palette.green_1B8A3E,
  redColor: Palette.red_C0392B,
  iconColor: Palette.primary,
  shadow: Palette.blue_151835,

  // Backgrounds & Containers
  bgColor: '#F4F7FB',
  inputTextBgColor: '#F8FAFC',
  containerBgColor: '#F4F7FB',
  cardBgColor: Palette.white,
  borderColor: '#E2E8F0',
  border: '#E2E8F0',
  lightBlueTint: '#EFF6FF',
  lightBlueBorder: '#BFDBFE',
  transparent: 'transparent',
  appBarColor: Palette.primary,
  dashboardNavy: '#0A122C',
  // Theme & Tailwind Neutral / Brand Tokens
  blue_3B82F6: '#3B82F6',
  blue_2563EB: '#2563EB',
  slate_1E293B: '#1E293B',
  slate_475569: '#475569',
  slate_64748B: '#64748B',
  slate_CBD5E1: '#CBD5E1',
  slate_E2E8F0: '#E2E8F0',
  slate_F8FAFC: '#F8FAFC',
  slate_F1F5F9: '#F1F5F9',
  green_10B981: '#10B981',
  green_059669: '#059669',
  green_065F46: '#065F46',
  green_16A34A: '#16A34A',
  green_ECFDF5: '#ECFDF5',
  blue_6366F1: '#6366F1',
  blue_EEF2FF: '#EEF2FF',
  blue_60A5FA: '#60A5FA',
  blue_1E3A8A: '#1E3A8A',
  blue_DBEAFE: '#DBEAFE',
  blue_4285F4: '#4285F4',
  yellow_F5C518: '#F5C518',
  orange_FF9800: '#FF9800',
  purple_F3E8FF: '#F3E8FF',
  purple_9333EA: '#9333EA',
  red_FEE2E2: '#FEE2E2',
  green_00C853: '#00C853',
  green_F0FDF4: '#F0FDF4',
  slate_718096: '#718096',
  slate_94A3B8: '#94A3B8',
  slate_0F172A: '#0F172A',
  badgeSuccessBg: '#DCFCE7',
  badgeSuccessText: '#15803D',

  // Charts
  contentColorCyan: Palette.blue_3AB0FF,
  contentColorBlue: Palette.primary,
  mainGridLineColor: 'rgba(255, 255, 255, 0.1)',

  // Reds
  red: Palette.red,
  red_FFE8E8: Palette.red_FFE8E8,
  red_FFF0F0: Palette.red_FFF0F0,
  red_C0392B: Palette.red_C0392B,
  red_E57373CC: Palette.red_E57373CC,

  // Dark blues
  black_232347: '#232347',
  black_1C1E40: '#1C1E40',
  black_00000099: '#00000099',
  blue_151835: Palette.blue_151835,
  blue_151835A6: Palette.blue_151835A6,
  blue_272B54: Palette.blue_272B54,
  blue_565FBA: Palette.blue_565FBA,
  blue_54619F: Palette.blue_54619F,
  blue_53548F: Palette.blue_53548F,
  blue_8281AB: Palette.blue_8281AB,
  blue_1E2547: Palette.blue_1E2547,
  blue_B0BAF9: Palette.blue_B0BAF9,
  blue_394180: Palette.blue_394180,
  blue_263178: Palette.blue_263178,
  blue_DBEDFF: Palette.blue_DBEDFF,
  blue_7586ED: Palette.blue_7586ED,
  blue_3978CD: Palette.blue_3978CD,
  blue_3AB0FF: Palette.blue_3AB0FF,
  blue_5B6EE1: Palette.blue_5B6EE1,
  blue_EEF0FF: Palette.blue_EEF0FF,
  blue_4A90E2: Palette.blue_4A90E2,
  blue_EDF5FF: Palette.blue_EDF5FF,

  // Whites with opacity
  white_FFFFFF1A: Palette.white_FFFFFF1A,

  // Oranges
  orange_FC9470: Palette.orange_FC9470,
  orange_D2AEA1: Palette.orange_D2AEA1,
  orange_FEB790: Palette.orange_FEB790,
  orange_D06E68: Palette.orange_D06E68,
  orange_D85C40: Palette.orange_D85C40,
  orange_FF5317: Palette.orange_FF5317,
  orange_FFE3D3: Palette.orange_FFE3D3,
  orange_FFF5DD: Palette.orange_FFF5DD,
  orange_E98F8C: Palette.orange_E98F8C,
  orange_F96335: Palette.orange_F96335,
  orange_E04A4B: Palette.orange_E04A4B,
  orange_F97316: Palette.orange_F97316,
  orange_FAC78F: Palette.orange_FAC78F,
  orange_EB5F39: Palette.orange_EB5F39,
  orange_EC6B42: Palette.orange_EC6B42,
  orange_FF7A59: Palette.orange_FF7A59,
  orange_FFF1EC: Palette.orange_FFF1EC,

  // Grays
  gray_272B54: Palette.gray_272B54,
  gray_D9D9D9: Palette.gray_D9D9D9,
  gray_9098AF: Palette.gray_9098AF,
  gray_DBDEE7: Palette.gray_DBDEE7,
  gray_f2f2f2: Palette.gray_f2f2f2,
  gray_9FA7BC: Palette.gray_9FA7BC,
  gray_E4D9D4: Palette.gray_E4D9D4,
  gray_B7BBDF: Palette.gray_B7BBDF,
  gray_F3F6FC: Palette.gray_F3F6FC,
  gray_526286: Palette.gray_526286,
  gray_A2A2A2: Palette.gray_A2A2A2,
  gray_5C698D: Palette.gray_5C698D,
  gray_ffffff40: Palette.gray_ffffff40,
  gray_E5E7EB: Palette.gray_E5E7EB,
  gray_F8FAFC: Palette.gray_F8FAFC,

  // Others
  offwhite_FAF3F0: Palette.offwhite_FAF3F0,
  overlay: Palette.overlay,
  sky_blue_7881FE: Palette.sky_blue_DBF1FF,
  purple_E2E4FF: Palette.purple_E2E4FF,
  purple_8B5CF6: '#8B5CF6',
  green_09A43D: Palette.green_09A43D,
  green_1B8A3E: Palette.green_1B8A3E,
  green_4DC87ACC: Palette.green_4DC87ACC,
  green_22C55E: Palette.green_22C55E,
  green_F0FBF4: Palette.green_F0FBF4,
  green_49B68D: Palette.green_49B68D,
  green_EAF8F1: Palette.green_EAF8F1,
  peach_FAF3F0: Palette.peach_FAF3F0,
  brown_782D26: Palette.brown_782D26,
  yellow_FFFBEB: Palette.yellow_FFFBEB,
  yellow_FEF3C7: Palette.yellow_FEF3C7,
  yellow_FEFCE8: '#FEFCE8',
  yellow_FDE68A: '#FDE68A',
  yellow_F59E0B: '#F59E0B',
  yellow_D97706: Palette.yellow_D97706,
  yellow_B45309: '#B45309',
  yellow_92400E: '#92400E',
  yellow_78350F: '#78350F',
  green_E7F8EE: '#E7F8EE',
  pink_E0507A: '#E0507A',
  pink_FCEAEF: '#FCEAEF',
  blue_818CF8: '#818CF8',
  blue_A5B4FC: '#A5B4FC',
  gray_85929E: '#85929E',
  blue_B9CBE7: '#B9CBE7',
  beige_FFFBF7: '#FFFBF7',
  beige_E6D3C4: '#E6D3C4',
  blue_F0F4F8: '#F0F4F8',
  beige_E2D3C4: '#E2D3C4',
  blue_3A57E8: '#3A57E8',
  blue_1A2E46: '#1A2E46',
  beige_F5ECE3: '#F5ECE3',
};

export type ThemeMode = 'light' | 'dark';
export type ThemeColors = typeof LightTheme;

/** Returns the full set of semantic theme tokens for the given mode */
export function getThemeColors(mode: ThemeMode): ThemeColors {
  return mode === 'dark' ? DarkTheme : LightTheme;
}

export { LightTheme, DarkTheme };
