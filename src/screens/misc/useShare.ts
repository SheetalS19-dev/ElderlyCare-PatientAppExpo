import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import { Platform, Share } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ApiEndpoints, AppConstants } from '../../constants';
import type { RootStackParamList } from '../../navigation/types';
import { apiClient } from '../../services/apiClient';
import { showToast } from '../../utils';

export const useShare = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [shareLink, setShareLink] = useState('');
  const [pointsDesc, setPointsDesc] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchShareConfig();
  }, []);

  const fetchShareConfig = async () => {
    setIsLoading(true);
    try {
      const linkKey = Platform.OS === 'ios' ? 'app_store_link' : 'play_store_link';
      const [linkRes, descRes] = await Promise.all([
        apiClient.get(`${ApiEndpoints.getConfigByIdNameApiUrl}/${linkKey}`),
        apiClient.get(`${ApiEndpoints.getConfigByIdNameApiUrl}/s_p_d_p_a`),
      ]);

      if (linkRes?.data?.value) setShareLink(linkRes.data.value);
      if (descRes?.data?.value) setPointsDesc(descRes.data.value);
    } catch (e) {
      console.warn('Share config fetch error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        message: `Download ${AppConstants.appName} care app to manage appointments, vitals & prescriptions: ${shareLink || 'https://elderlycare.life'}`,
        title: AppConstants.appName,
      });
    } catch (error) {
      console.warn('Share error:', error);
    }
  }, [shareLink]);

  const handleCopyLink = useCallback(() => {
    showToast('Link copied to clipboard!');
  }, []);

  return {
    navigation,
    insets,
    shareLink,
    pointsDesc,
    isLoading,
    handleShare,
    handleCopyLink,
  };
};
