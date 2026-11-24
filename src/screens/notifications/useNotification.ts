import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ApiEndpoints, AppConstants, Colors } from '../../constants';
import { useAuth } from '../../context/AuthContext';
import type { RootStackParamList } from '../../navigation/types';
import { useGetNotificationsByDateQuery } from '../../redux/apis/notificationApi';
import {
  useGetUserProfileQuery,
  useUpdateNotificationSeenMutation,
} from '../../redux/apis/userApi';
import { storageService } from '../../services/storageService';
import type { NotificationModel } from '../../types';
import {
  extractNotificationsList,
  markNotificationsLocallySeen,
} from '../../utils';

export const useNotification = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user: authUser, updateUser: updateAuthUser } = useAuth();
  const [storedUid, setStoredUid] = useState<string>('');

  useEffect(() => {
    storageService.getItem<string>(AppConstants.storageKeys.uid).then((uid) => {
      if (uid) setStoredUid(String(uid));
    });
  }, []);

  const userId = String(authUser?.id ?? (authUser as any)?.user_id ?? storedUid ?? '');

  const { data: userProfile } = useGetUserProfileQuery(userId, { skip: !userId });
  const [updateNotificationSeen] = useUpdateNotificationSeenMutation();

  const userCreatedAt = useMemo(() => {
    const profileUser = userProfile?.data ?? userProfile;
    return String(profileUser?.created_at ?? authUser?.created_at ?? '');
  }, [userProfile, authUser?.created_at]);

  const {
    data: notificationsData,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetNotificationsByDateQuery(
    { uid: userId, date: userCreatedAt },
    { skip: !userId || !userCreatedAt, refetchOnMountOrArgChange: true }
  );

  const notifications: NotificationModel[] = useMemo(
    () => extractNotificationsList(notificationsData),
    [notificationsData]
  );

  useEffect(() => {
    if (!userId || isLoading) return;
    let isMounted = true;
    const syncSeen = async () => {
      const seenIso = await markNotificationsLocallySeen(userId, notifications);
      if (isMounted && authUser) {
        updateAuthUser({ ...authUser, notification_seen_at: seenIso });
      }
      updateNotificationSeen(userId);
    };
    syncSeen();
    return () => {
      isMounted = false;
    };
  }, [userId, isLoading, notifications.length]);

  const handleNotificationPress = useCallback(async (item: NotificationModel) => {
    if (item.file_id) {
      navigation.navigate('PatientFile');
    } else if (item.prescription_id) {
      navigation.navigate('PrescriptionList');
      const url = `${ApiEndpoints.prescriptionUrl}/${item.prescription_id}`;
      Linking.openURL(url).catch(() => { });
    } else if (item.txn_id) {
      navigation.navigate('Wallet');
    } else if (item.appointment_id) {
      navigation.navigate('AppointmentDetails', { appId: String(item.appointment_id) });
    } else if (item.image || item.id) {
      navigation.navigate('NotificationDetails', { notificationId: String(item.id) });
    }
  }, [navigation]);

  const getNotificationIconInfo = useCallback((item: NotificationModel) => {
    if (item.appointment_id) {
      return { icon: 'event', color: Colors.primaryColor, bg: Colors.aquaSoft };
    }
    if (item.prescription_id) {
      return { icon: 'description', color: Colors.sky_0284C7, bg: Colors.sky_E0F2FE };
    }
    if (item.txn_id) {
      return { icon: 'account-balance-wallet', color: Colors.green_059669, bg: Colors.green_ECFDF5 };
    }
    if (item.file_id) {
      return { icon: 'folder', color: Colors.purple_8B5CF6, bg: Colors.purple_EDE9FE };
    }
    return { icon: 'notifications', color: Colors.primaryColor, bg: Colors.aquaSoft };
  }, []);

  return {
    navigation,
    insets,
    notifications,
    isLoading,
    isFetching,
    isError,
    refetch,
    handleNotificationPress,
    getNotificationIconInfo,
  };
};
