import React from 'react';
import { View, Text, Image, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { AppHeader, LoadingIndicator, ErrorState } from '../../components';
import { Colors, ApiEndpoints } from '../../constants';
import { useGetNotificationByIdQuery } from '../../redux/apis/notificationApi';
import type { NotificationModel } from '../../types';
import { fs, hs, TYPOGRAPHY, ws } from '../../utils';

type Props = NativeStackScreenProps<RootStackParamList, 'NotificationDetails'>;

export const NotificationDetailsScreen = ({ navigation, route }: Props) => {
  const { notificationId } = route.params ?? {};

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useGetNotificationByIdQuery(notificationId, { skip: !notificationId });

  const notification: NotificationModel | null = data?.data ?? data ?? null;

  if (isLoading) {
    return (
      <View style={styles.container}>
        <AppHeader title="Notification Details" onBackPress={() => navigation.goBack()} />
        <LoadingIndicator />
      </View>
    );
  }
  if (isError || !notification) {
    return (
      <View style={styles.container}>
        <AppHeader title="Notification Details" onBackPress={() => navigation.goBack()} />
        <ErrorState message="Could not load notification details" onRetry={refetch} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader title="Notification Details" onBackPress={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {!!notification.image && (
          <Image
            source={{ uri: `${ApiEndpoints.imageUrl}/${notification.image}` }}
            style={styles.bannerImage}
            resizeMode="cover"
          />
        )}

        <View style={styles.card}>
          <Text style={styles.title}>{notification.title}</Text>
          <Text style={styles.body}>{notification.body}</Text>
          {!!notification.created_at && (
            <Text style={styles.date}>{notification.created_at}</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgColor },
  scrollContent: { padding: ws(16) },
  bannerImage: {
    width: '100%',
    height: hs(200),
    borderRadius: fs(12),
    marginBottom: hs(16),
    backgroundColor: '#F1F5F9',
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: fs(12),
    padding: ws(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  title: {
    fontSize: fs(18),
    ...TYPOGRAPHY.bold,
    color: Colors.mainFontColor,
    marginBottom: hs(8),
  },
  body: {
    fontSize: fs(14),
    ...TYPOGRAPHY.regular,
    color: Colors.secondaryFontColor,
    lineHeight: fs(22),
    marginBottom: hs(12),
  },
  date: {
    fontSize: fs(12),
    ...TYPOGRAPHY.medium,
    color: Colors.secondaryFontColor,
  },
});
