import React from 'react';
import { View, Text, Image, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { AppHeader, LoadingIndicator, ErrorState } from '../../components';
import { Colors, Typography, ApiEndpoints } from '../../constants';
import { useGetNotificationByIdQuery } from '../../redux/apis/notificationApi';
import type { NotificationModel } from '../../types';

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
  scrollContent: { padding: 16 },
  bannerImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#F1F5F9',
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.mainFontColor,
    marginBottom: 8,
  },
  body: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.secondaryFontColor,
    lineHeight: 22,
    marginBottom: 12,
  },
  date: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.secondaryFontColor,
  },
});
