import React, { useCallback } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider } from 'react-redux';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { store } from '@/redux/store';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import { Slot } from 'expo-router';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'Poppins-Light': require('../../assets/font/Poppins-Light.ttf'),
    'Poppins-Regular': require('../../assets/font/Poppins-Regular.ttf'),
    'Poppins-Medium': require('../../assets/font/Poppins-Medium.ttf'),
    'Poppins-Bold': require('../../assets/font/Poppins-SemiBold.ttf'),
    'Poppins-SemiBold': require('../../assets/font/Poppins-SemiBold.ttf'),
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <Provider store={store}>
        <ThemeProvider>
          <AuthProvider>
            <Slot />
          </AuthProvider>
        </ThemeProvider>
      </Provider>
    </GestureHandlerRootView>
  );
}
