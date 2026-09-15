import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AppHeader,
  EmptyState,
  ErrorState,
  LoadingIndicator,
} from '../../components';
import { ApiEndpoints, AppConstants, Colors, Typography } from '../../constants';
import type { RootStackParamList } from '../../navigation/types';
import { useGetNotificationsByDateQuery } from '../../redux/apis/notificationApi';
import {
  useGetUserProfileQuery,
  useUpdateNotificationSeenMutation,
} from '../../redux/apis/userApi';
import { storageService } from '../../services/storageService';
import type { NotificationModel } from '../../types';
import { DateTimeUtils, ws, hs, fs, TYPOGRAPHY } from '../../utils';

type Props = NativeStackScreenProps<RootStackParamList, 'Notification'>;

export const NotificationScreen = ({ navigation }: Props) => {
  const insets = useSafeAreaInsets();
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    storageService.getItem<string>(AppConstants.storageKeys.uid).then((uid) => {
      if (uid) setUserId(uid);
    });
  }, []);

  const { data: userProfile } = useGetUserProfileQuery(userId, { skip: !userId });
  const [updateNotificationSeen] = useUpdateNotificationSeenMutation();

  const userCreatedAt = useMemo(() => {
    const user = userProfile?.data ?? userProfile;
    return user?.created_at ?? '2020-01-01';
  }, [userProfile]);

  const {
    data: notificationsData,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetNotificationsByDateQuery(
    { uid: userId, date: userCreatedAt },
    { skip: !userId }
  );

  useEffect(() => {
    if (userId) {
      updateNotificationSeen(userId);
    }
  }, [userId, updateNotificationSeen]);

  const notifications: NotificationModel[] = useMemo(() => {
    if (Array.isArray(notificationsData)) return notificationsData;
    if (Array.isArray(notificationsData?.data)) return notificationsData.data;
    return [];
  }, [notificationsData]);

  const handleNotificationPress = async (item: NotificationModel) => {
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
  };

  const getNotificationIconInfo = (item: NotificationModel) => {
    if (item.appointment_id) {
      return { icon: 'event', color: Colors.primaryColor, bg: '#EFF6FF' };
    }
    if (item.prescription_id) {
      return { icon: 'description', color: '#0284C7', bg: '#E0F2FE' };
    }
    if (item.txn_id) {
      return { icon: 'account-balance-wallet', color: '#059669', bg: '#ECFDF5' };
    }
    if (item.file_id) {
      return { icon: 'folder', color: '#8B5CF6', bg: '#EDE9FE' };
    }
    return { icon: 'notifications', color: Colors.primaryColor, bg: '#EFF6FF' };
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Notifications" onBackPress={() => navigation.goBack()} />

      {isLoading ? (
        <LoadingIndicator />
      ) : isError ? (
        <ErrorState message="Could not load notifications" onRetry={refetch} />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item, index) => `notify-${item.id ?? index}`}
          contentContainerStyle={[styles.listContainer, { paddingBottom: Math.max(insets.bottom + hs(20), hs(30)) }]}
          showsVerticalScrollIndicator={false}
          refreshing={isFetching}
          onRefresh={refetch}
          ListEmptyComponent={<EmptyState message="You have no notifications yet" />}
          renderItem={({ item }) => {
            const iconInfo = getNotificationIconInfo(item);
            return (
              <TouchableOpacity
                style={styles.notificationCard}
                activeOpacity={0.85}
                onPress={() => handleNotificationPress(item)}
              >
                {item.image ? (
                  <Image
                    source={{ uri: `${ApiEndpoints.imageUrl}/${item.image}` }}
                    style={styles.notificationImage}
                  />
                ) : (
                  <View style={[styles.iconPlaceholder, { backgroundColor: iconInfo.bg }]}>
                    <MaterialIcons name={iconInfo.icon as any} size={22} color={iconInfo.color} />
                  </View>
                )}

                <View style={styles.contentWrapper}>
                  <Text style={styles.title}>{item.title}</Text>
                  <Text style={styles.body} numberOfLines={2}>
                    {item.body}
                  </Text>
                  {!!item.created_at && (
                    <Text style={styles.date}>
                      {DateTimeUtils.getDataFormat(item.created_at)}
                    </Text>
                  )}
                </View>

                <View style={styles.chevronCircle}>
                  <Ionicons name="chevron-forward" size={16} color={Colors.primaryColor} />
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgColor },
  listContainer: { flexGrow: 1, padding: ws(16) },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: fs(16),
    padding: ws(14),
    marginBottom: hs(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: hs(2) },
    shadowOpacity: 0.04,
    shadowRadius: fs(6),
    elevation: 2,
  },
  notificationImage: {
    width: ws(48),
    height: hs(48),
    borderRadius: fs(12),
    backgroundColor: '#F1F5F9',
  },
  iconPlaceholder: {
    width: ws(48),
    height: ws(48),
    aspectRatio: 1,
    borderRadius: 999,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentWrapper: {
    flex: 1,
    marginLeft: ws(12),
    marginRight: ws(8),
  },
  title: {
    fontSize: fs(Typography.fontSize.sm),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
    marginBottom: hs(2),
  },
  body: {
    fontSize: fs(12),
    ...TYPOGRAPHY.regular,
    color: Colors.secondaryFontColor,
    lineHeight: hs(17),
  },
  date: {
    fontSize: fs(10),
    ...TYPOGRAPHY.medium,
    color: '#94A3B8',
    marginTop: hs(4),
  },
  chevronCircle: {
    width: ws(28),
    height: ws(28),
    aspectRatio: 1,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
