import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { memo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants';
import { useAuth } from '../../context/AuthContext';
import type { RootStackParamList } from '../../navigation/types';
import { fs, hs, ws } from '../../utils/metrics';
import { TYPOGRAPHY } from '../../utils/typography';

type RootNavigation = NativeStackNavigationProp<RootStackParamList>;

export const BottomTabBar: React.FC = memo(() => {
  const navigation = useNavigation<RootNavigation>();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();

  const goAuthGated = (route: keyof RootStackParamList) => {
    if (!isAuthenticated) {
      navigation.navigate('Login', { redirectTo: route as any });
      return;
    }
    navigation.navigate(route as any);
  };

  const openMenu = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View style={styles.bar}>
        <TabButton icon="home" label="Home" isActive onPress={() => {}} />
        <TabButton icon="search" label="Search" onPress={() => navigation.navigate('Search', {})} />

        {/* Center space for the floating Bookings button */}
        <View style={styles.fabSpacer} />

        <TabButton
          icon="account-balance-wallet"
          label="Wallet"
          onPress={() => goAuthGated('Wallet')}
        />
        <TabButton icon="menu" label="Menu" onPress={openMenu} />
      </View>

      {/* Floating center button: My Bookings */}
      <View pointerEvents="box-none" style={styles.fabContainer}>
        <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.85}
          onPress={() => goAuthGated('MyBookings')}
        >
          <MaterialIcons name="calendar-month" size={fs(26)} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
});

const TabButton = memo(
  ({
    icon,
    label,
    onPress,
    isActive = false,
  }: {
    icon: string;
    label: string;
    onPress: () => void;
    isActive?: boolean;
  }) => (
    <TouchableOpacity
      style={styles.tabButton}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <MaterialIcons
        name={icon as any}
        size={fs(22)}
        color={isActive ? Colors.primaryColor : Colors.inkSoft}
      />
      <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{label}</Text>
    </TouchableOpacity>
  )
);

const BAR_HEIGHT = hs(62);
const FAB_SIZE = ws(54);

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.white,
    borderTopLeftRadius: fs(20),
    borderTopRightRadius: fs(20),
    shadowColor: Colors.navy,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 12,
  },
  bar: {
    height: BAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: Colors.white,
    borderTopLeftRadius: fs(20),
    borderTopRightRadius: fs(20),
    paddingHorizontal: ws(8),
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hs(4),
  },
  tabLabel: {
    marginTop: hs(3),
    fontSize: fs(10),
    ...TYPOGRAPHY.medium,
    color: Colors.inkSoft,
  },
  tabLabelActive: {
    color: Colors.primaryColor,
    ...TYPOGRAPHY.bold,
  },
  fabSpacer: {
    width: FAB_SIZE + ws(16),
  },
  fabContainer: {
    position: 'absolute',
    top: -FAB_SIZE / 2 + 4,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: Colors.navy,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 3,
    borderColor: Colors.white,
  },
});

