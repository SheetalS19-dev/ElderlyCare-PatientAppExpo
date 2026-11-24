import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback } from 'react';
import { Linking, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppConstants } from '../../constants';
import type { RootStackParamList } from '../../navigation/types';
import { showToast } from '../../utils';

export const useContactUs = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handlePhoneCall = useCallback(() => {
    Linking.openURL(`tel:${AppConstants.support.helplineRawPhone}`).catch(() => showToast('Could not place call'));
  }, []);

  const handleWhatsApp = useCallback(() => {
    Linking.openURL(`https://wa.me/${AppConstants.support.helplineRawPhone}?text=Hello%20Support`).catch(() =>
      showToast('Could not open WhatsApp')
    );
  }, []);

  const handleSupportEmail = useCallback(() => {
    Linking.openURL(`mailto:${AppConstants.support.supportEmail}`).catch(() =>
      showToast('Could not open email client')
    );
  }, []);

  const handleInfoEmail = useCallback(() => {
    Linking.openURL(`mailto:${AppConstants.support.infoEmail}`).catch(() =>
      showToast('Could not open email client')
    );
  }, []);

  const handleOpenMap = useCallback(() => {
    const mapUrl = Platform.select({
      ios: `maps:0,0?q=${encodeURIComponent(AppConstants.support.address)}`,
      android: `geo:0,0?q=${encodeURIComponent(AppConstants.support.address)}`,
      default: `https://maps.google.com/?q=${encodeURIComponent(AppConstants.support.address)}`,
    });
    Linking.openURL(mapUrl).catch(() =>
      Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(AppConstants.support.address)}`).catch(() =>
        showToast('Could not open map')
      )
    );
  }, []);

  return {
    navigation,
    insets,
    handlePhoneCall,
    handleWhatsApp,
    handleSupportEmail,
    handleInfoEmail,
    handleOpenMap,
  };
};
