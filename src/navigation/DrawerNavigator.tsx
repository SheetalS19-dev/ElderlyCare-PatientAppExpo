import { createDrawerNavigator, type DrawerNavigationOptions } from '@react-navigation/drawer';
import { useCallback } from 'react';
import { Colors } from '../constants';
import { HomeScreen } from '../screens/home/HomeScreen';
import { DrawerContent } from './DrawerContent';

const Drawer = createDrawerNavigator();

const drawerScreenOptions: DrawerNavigationOptions = {
  headerShown: false,
  drawerType: 'front' as const,
  drawerStyle: {
    width: '84%',
    maxWidth: 340,
    backgroundColor: Colors.white,
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden' as const,
  },
  overlayColor: 'rgba(0, 0, 0, 0.45)',
  swipeEnabled: true,
};

export const DrawerNavigator = () => {
  const renderDrawerContent = useCallback((props: any) => <DrawerContent {...props} />, []);

  return (
    <Drawer.Navigator
      id="RootDrawer"
      drawerContent={renderDrawerContent}
      screenOptions={drawerScreenOptions}
    >
      <Drawer.Screen name="Home" component={HomeScreen} />
    </Drawer.Navigator>
  );
};

export default DrawerNavigator;
