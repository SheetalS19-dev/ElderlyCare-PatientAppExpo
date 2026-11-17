import type { RouteProp } from '@react-navigation/native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { useGetNotificationByIdQuery } from '../../redux/apis/notificationApi';
import type { NotificationModel } from '../../types';

export const useNotificationDetails = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'NotificationDetails'>>();
  const { notificationId } = route.params ?? {};

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useGetNotificationByIdQuery(notificationId, { skip: !notificationId });

  const notification: NotificationModel | null = data?.data ?? data ?? null;

  return {
    navigation,
    notificationId,
    notification,
    isLoading,
    isError,
    refetch,
  };
};
