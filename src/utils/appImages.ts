const defaultPlaceholder = require('../../assets/icons/placeholder.png');
const defaultLogo = require('../../assets/icons/logo.png');

export const AppImages: Record<string, any> = {
  // Primary Reference Images
  intro: require('../../assets/icons/placeholder.png'),
  logo: defaultLogo,
  emailConfirmation: require('../../assets/icons/placeholder.png'),
  memoryOfTheDay: require('../../assets/icons/placeholder.png'),
  defaultUser: require('../../assets/icons/user.png'),
  securityLoginLight: require('../../assets/icons/placeholder.png'),
  securityLoginDark: require('../../assets/icons/placeholder.png'),
  quickActionsBanner: require('../../assets/icons/container_bg.png'),
  homeBannerScenic: require('../../assets/icons/container_bg.png'),

  // Icons Mapping
  ambulance: require('../../assets/icons/ambulance.png'),
  appointment: require('../../assets/icons/appointment.png'),
  bell: require('../../assets/icons/bell.png'),
  bonds: require('../../assets/icons/bonds.png'),
  check: require('../../assets/icons/check.png'),
  containerBg: require('../../assets/icons/container_bg.png'),
  creditCard: require('../../assets/icons/credit-card.png'),
  crown: require('../../assets/icons/crown.png'),
  facebook: require('../../assets/icons/facebook.png'),
  gmail: require('../../assets/icons/gmail.png'),
  instagram: require('../../assets/icons/instagram.png'),
  lifeline: require('../../assets/icons/lifeline-in-a-heart-outline.png'),
  medicalAppointment: require('../../assets/icons/medical-appointment.png'),
  openFolder: require('../../assets/icons/open-folder.png'),
  placeholder: defaultPlaceholder,
  prescription: require('../../assets/icons/prescription.png'),
  support: require('../../assets/icons/support.png'),
  telephone: require('../../assets/icons/telephone.png'),
  testimonials: require('../../assets/icons/testimonials.png'),
  twitter: require('../../assets/icons/twitter.png'),
  user: require('../../assets/icons/user.png'),
  wallet: require('../../assets/icons/wallet-filled-money-tool.png'),
  whatsapp: require('../../assets/icons/whatsapp.png'),
  youtube: require('../../assets/icons/youtube.png'),
  vitals: require('../../assets/icons/lifeline-in-a-heart-outline.png'),
  familyMember: require('../../assets/icons/bonds.png'),
  notification: require('../../assets/icons/bell.png'),
  contactUs: require('../../assets/icons/support.png'),
  files: require('../../assets/icons/open-folder.png'),
};

export const Images: Record<string, any> = new Proxy(AppImages, {
  get: (target, prop: string) => {
    if (typeof prop === 'string' && prop in target) {
      return target[prop];
    }
    return defaultPlaceholder;
  },
});
