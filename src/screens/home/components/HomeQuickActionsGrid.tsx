import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, Images } from '../../../constants';
import type { RootStackParamList } from '../../../navigation/types';
import { ws, hs, fs, getScreenWidth } from '../../../utils/metrics';
import { TYPOGRAPHY } from '../../../utils/typography';

export interface QuickActionItem {
  id: string;
  title: string;
  image: any;
  requiresAuth: boolean;
  route: keyof RootStackParamList;
}

export const QUICK_ACTIONS_DATA: QuickActionItem[] = [
  { id: '1', title: 'Appointments', image: Images.appointment, requiresAuth: true, route: 'MyBookings' },
  { id: '2', title: 'Vitals Log', image: Images.vitals, requiresAuth: true, route: 'Vitals' },
  { id: '3', title: 'Prescriptions', image: Images.prescription, requiresAuth: true, route: 'PrescriptionList' },
  { id: '4', title: 'My Profile', image: Images.user, requiresAuth: true, route: 'EditProfile' },
  { id: '5', title: 'Family Members', image: Images.familyMember, requiresAuth: true, route: 'FamilyMemberList' },
  { id: '6', title: 'My Wallet', image: Images.wallet, requiresAuth: true, route: 'Wallet' },
  { id: '7', title: 'Medical Files', image: Images.files, requiresAuth: true, route: 'PatientFile' },
  { id: '8', title: 'Notifications', image: Images.notification, requiresAuth: true, route: 'Notification' },
  { id: '9', title: 'Care Support', image: Images.contactUs, requiresAuth: false, route: 'ContactUs' },
];

export interface HomeQuickActionsGridProps {
  onActionPress: (item: QuickActionItem) => void;
}

export const HomeQuickActionsGrid: React.FC<HomeQuickActionsGridProps> = ({ onActionPress }) => {
  const tileWidth = (getScreenWidth() - ws(24) - ws(16)) / 3;

  return (
    <View style={styles.gridContainer}>
      {QUICK_ACTIONS_DATA.map((item) => (
        <TouchableOpacity
          key={`quick-${item.id}`}
          style={[styles.tile, { width: tileWidth }]}
          activeOpacity={0.8}
          onPress={() => onActionPress(item)}
        >
          <View style={styles.iconCircle}>
            <Image source={item.image} style={styles.iconImage} resizeMode="contain" />
          </View>
          <Text style={styles.tileLabel} numberOfLines={1}>
            {item.title}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: ws(12),
    gap: ws(8),
    marginVertical: hs(12),
  },
  tile: {
    backgroundColor: Colors.white,
    borderRadius: fs(16),
    paddingVertical: hs(14),
    paddingHorizontal: ws(6),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
  },
  iconCircle: {
    width: ws(46),
    height: ws(46),
    borderRadius: ws(23),
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hs(8),
  },
  iconImage: {
    width: ws(26),
    height: ws(26),
    tintColor: Colors.primaryColor,
  },
  tileLabel: {
    ...TYPOGRAPHY.medium,
    fontSize: fs(11),
    color: Colors.primaryFontColor,
    textAlign: 'center',
  },
});
