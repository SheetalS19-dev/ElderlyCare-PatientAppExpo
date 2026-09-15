import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { DrawerContentComponentProps } from '@react-navigation/drawer';
import React, { memo } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppConstants, Colors } from '../constants';
import { useAuth } from '../context/AuthContext';
import { getUserFullName } from '../types';
import { getImageUrl } from '../utils';
import { fs, hs, ws } from '../utils/metrics';
import { TYPOGRAPHY } from '../utils/typography';
import type { RootStackParamList } from './types';

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  requiresAuth: boolean;
  navigateTo: keyof RootStackParamList;
  badge?: string;
}

interface MenuGroup {
  title: string;
  items: MenuItem[];
}

const MENU_GROUPS: MenuGroup[] = [
  {
    title: 'Account & Wallet',
    items: [
      { id: '6', label: 'My Profile', icon: 'person', requiresAuth: true, navigateTo: 'EditProfile' },
      { id: '7', label: 'My Wallet', icon: 'account-balance-wallet', requiresAuth: true, navigateTo: 'Wallet' },
      { id: '8', label: 'Notifications', icon: 'notifications-none', requiresAuth: true, navigateTo: 'Notification' },
    ],
  },
  {
    title: 'Health & Care',
    items: [
      { id: '1', label: 'My Appointments', icon: 'calendar-month', requiresAuth: true, navigateTo: 'MyBookings' },
      { id: '2', label: 'Vitals & Health Log', icon: 'favorite', requiresAuth: true, navigateTo: 'Vitals' },
      { id: '3', label: 'Prescriptions', icon: 'description', requiresAuth: true, navigateTo: 'PrescriptionList' },
      { id: '4', label: 'Medical Records & Files', icon: 'folder-shared', requiresAuth: true, navigateTo: 'PatientFile' },
      { id: '5', label: 'Family Members', icon: 'people-alt', requiresAuth: true, navigateTo: 'FamilyMemberList' },
    ],
  },
  {
    title: 'Support & Community',
    items: [
      { id: '9', label: '24/7 Care Support', icon: 'support-agent', requiresAuth: false, navigateTo: 'ContactUs' },
      { id: 'faq', label: 'FAQs & Help Center', icon: 'help-outline', requiresAuth: false, navigateTo: 'Faq' },
      // { id: '10', label: 'Patient Testimonials', icon: 'rate-review', requiresAuth: false, navigateTo: 'Testimonial' },
      { id: '11', label: 'Health Blogs & Tips', icon: 'article', requiresAuth: false, navigateTo: 'BlogList' },
      { id: '12', label: 'About Us', icon: 'info-outline', requiresAuth: false, navigateTo: 'AboutUs' },
    ],
  },
  {
    title: 'Legal & App',
    items: [
      { id: '13', label: 'Privacy Policy', icon: 'verified-user', requiresAuth: false, navigateTo: 'Privacy' },
      { id: '14', label: 'Terms & Conditions', icon: 'gavel', requiresAuth: false, navigateTo: 'TermCond' },
      { id: '15', label: 'Share with Family & Friends', icon: 'share', requiresAuth: false, navigateTo: 'Share' },
    ],
  },
];

export const DrawerContent: React.FC<DrawerContentComponentProps> = memo((props) => {
  const insets = useSafeAreaInsets();
  const { isAuthenticated, user, logout } = useAuth();
  const rootNavigation = props.navigation.getParent() ?? props.navigation;

  const userImage = user?.image || user?.image_url || (user as any)?.imageUrl || '';
  const fullName = getUserFullName(user) || 'User';
  const userPhone = user?.phone || user?.email || '';

  const handlePress = (item: MenuItem) => {
    props.navigation.closeDrawer();
    if (item.requiresAuth && !isAuthenticated) {
      rootNavigation.navigate('Login' as never);
      return;
    }
    rootNavigation.navigate(item.navigateTo as never);
  };

  const handleAuthAction = () => {
    props.navigation.closeDrawer();
    if (isAuthenticated) {
      logout();
    } else {
      rootNavigation.navigate('Login' as never);
    }
  };

  return (
    <View style={styles.container}>
      {/* 1. Header Profile Banner */}
      <View style={[styles.headerBanner, { paddingTop: Math.max(insets.top + 8, 24) }]}>
        <TouchableOpacity
          style={styles.profileRow}
          activeOpacity={0.8}
          onPress={() => {
            props.navigation.closeDrawer();
            rootNavigation.navigate((isAuthenticated ? 'EditProfile' : 'Login') as never);
          }}
        >
          <View style={styles.avatarBorder}>
            {userImage ? (
              <Image source={{ uri: getImageUrl(userImage) }} style={styles.avatarImage} resizeMode="cover" />
            ) : (
              <View style={styles.avatarFallback}>
                <MaterialIcons name="person" size={32} color={Colors.primaryColor} />
              </View>
            )}
          </View>

          <View style={styles.profileMeta}>
            <Text style={styles.userName} numberOfLines={1}>
              {isAuthenticated ? fullName : 'Welcome, Guest'}
            </Text>
            <Text style={styles.userSubtitle} numberOfLines={1}>
              {isAuthenticated
                ? userPhone || 'Verified Patient'
                : `Join ${AppConstants.appName}`}
            </Text>

            <View style={styles.profileActionPill}>
              <Text style={styles.profileActionText}>
                {isAuthenticated ? 'View Profile' : 'Sign In / Register'}
              </Text>
              <MaterialIcons name="chevron-right" size={14} color={Colors.primaryColor} />
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* 2. Scrollable Grouped Menu List */}
      <ScrollView
        style={styles.menuScroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.menuScrollContent}
      >
        {MENU_GROUPS.map((group) => (
          <View key={group.title} style={styles.groupContainer}>
            <Text style={styles.groupTitle}>{group.title}</Text>
            <View style={styles.groupCard}>
              {group.items.map((item, index) => {
                const isLast = index === group.items.length - 1;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.menuItem, !isLast && styles.menuItemBorder]}
                    activeOpacity={0.7}
                    onPress={() => handlePress(item)}
                  >
                    <View style={styles.itemIconContainer}>
                      <MaterialIcons name={item.icon as any} size={18} color={Colors.primaryColor} />
                    </View>
                    <Text style={styles.itemLabel}>{item.label}</Text>
                    <MaterialIcons name="chevron-right" size={18} color="#CBD5E1" />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        {/* 3. Auth Action (Logout / Login) */}
        <View style={styles.authSection}>
          <TouchableOpacity
            style={[styles.authButton, isAuthenticated && styles.logoutButton]}
            activeOpacity={0.8}
            onPress={handleAuthAction}
          >
            <MaterialIcons
              name={isAuthenticated ? 'logout' : 'login'}
              size={18}
              color={isAuthenticated ? Colors.redColor : Colors.primaryColor}
            />
            <Text style={[styles.authButtonText, isAuthenticated && styles.logoutButtonText]}>
              {isAuthenticated ? 'Sign Out' : 'Sign In / Register'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* App Version Info */}
        <View style={styles.footerInfo}>
          <Text style={styles.footerAppName}>{AppConstants.appName}</Text>
          <Text style={styles.footerVersion}>Version 1.0.0 • Senior Healthcare</Text>
        </View>

        <View style={{ height: Math.max(insets.bottom + 10, 20) }} />
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerBanner: {
    backgroundColor: Colors.primaryColor,
    paddingHorizontal: ws(18),
    paddingBottom: hs(18),
    borderBottomLeftRadius: ws(24),
    borderBottomRightRadius: ws(24),
    shadowColor: Colors.primaryColor,
    shadowOffset: { width: 0, height: hs(4) },
    shadowOpacity: 0.2,
    shadowRadius: ws(8),
    elevation: 6,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarBorder: {
    width: ws(56),
    height: ws(56),
    borderRadius: ws(28),
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ws(12),
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileMeta: {
    flex: 1,
  },
  userName: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(16),
    color: Colors.white,
    marginBottom: hs(2),
  },
  userSubtitle: {
    ...TYPOGRAPHY.regular,
    fontSize: fs(12),
    color: 'rgba(255, 255, 255, 0.85)',
  },
  profileActionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingVertical: hs(4),
    paddingHorizontal: ws(10),
    borderRadius: ws(10),
    alignSelf: 'flex-start',
    marginTop: hs(6),
  },
  profileActionText: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(11),
    color: Colors.primaryColor,
    marginRight: ws(2),
  },
  menuScroll: {
    flex: 1,
  },
  menuScrollContent: {
    paddingHorizontal: ws(14),
    paddingTop: hs(14),
  },
  groupContainer: {
    marginBottom: hs(16),
  },
  groupTitle: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(11),
    color: Colors.secondaryFontColor,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: hs(6),
    marginLeft: ws(4),
  },
  groupCard: {
    backgroundColor: Colors.white,
    borderRadius: ws(16),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: hs(2) },
    shadowOpacity: 0.03,
    shadowRadius: ws(4),
    elevation: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hs(11),
    paddingHorizontal: ws(12),
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  itemIconContainer: {
    width: ws(32),
    height: ws(32),
    borderRadius: ws(16),
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ws(12),
  },
  itemLabel: {
    flex: 1,
    ...TYPOGRAPHY.medium,
    fontSize: fs(13),
    color: Colors.primaryFontColor,
  },
  authSection: {
    marginTop: hs(4),
    marginBottom: hs(14),
  },
  authButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: ws(14),
    paddingVertical: hs(12),
    gap: ws(8),
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.25)',
  },
  logoutButton: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  authButtonText: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(13),
    color: Colors.primaryColor,
  },
  logoutButtonText: {
    color: Colors.redColor,
  },
  footerInfo: {
    alignItems: 'center',
    paddingVertical: hs(6),
  },
  footerAppName: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(11),
    color: Colors.secondaryFontColor,
  },
  footerVersion: {
    ...TYPOGRAPHY.regular,
    fontSize: fs(10),
    color: '#94A3B8',
    marginTop: hs(2),
  },
});
