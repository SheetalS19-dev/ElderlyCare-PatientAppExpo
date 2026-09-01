import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider } from 'react-redux';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { store } from './src/redux/store';
import { ThemeProvider } from './src/context/ThemeContext';
import { AuthProvider } from './src/context/AuthContext';
import { AppNavigator } from './src/navigation';

SplashScreen.preventAutoHideAsync();

export const App = () => {
  const [fontsLoaded, fontError] = useFonts({
    'Poppins-Light': require('./assets/font/Poppins-Light.ttf'),
    'Poppins-Regular': require('./assets/font/Poppins-Regular.ttf'),
    'Poppins-Medium': require('./assets/font/Poppins-Medium.ttf'),
    'Poppins-Bold': require('./assets/font/Poppins-SemiBold.ttf'),
    'Poppins-SemiBold': require('./assets/font/Poppins-SemiBold.ttf'),
  });

  const onLayoutRootView = React.useCallback(async () => {
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
            <AppNavigator />
          </AuthProvider>
        </ThemeProvider>
      </Provider>
    </GestureHandlerRootView>
  );
};

export default App;
