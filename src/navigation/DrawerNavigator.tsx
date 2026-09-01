import { createDrawerNavigator } from '@react-navigation/drawer';
import React from 'react';
import { Colors } from '../constants';
import { HomeScreen } from '../screens/home/HomeScreen';
import { DrawerContent } from './DrawerContent';

const Drawer = createDrawerNavigator();

export const DrawerNavigator = () => {
  return (
    <Drawer.Navigator
      id="RootDrawer"
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          width: '84%',
          maxWidth: 340,
          backgroundColor: Colors.white,
          borderTopRightRadius: 24,
          borderBottomRightRadius: 24,
          overflow: 'hidden',
        },
        overlayColor: 'rgba(0, 0, 0, 0.45)',
      }}
    >
      <Drawer.Screen name="Home" component={HomeScreen} />
    </Drawer.Navigator>
  );
};

export default DrawerNavigator;
