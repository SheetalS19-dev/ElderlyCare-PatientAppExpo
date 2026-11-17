import React from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppHeader, ErrorState, LoadingIndicator } from '../../components';
import { ApiEndpoints, Colors } from '../../constants';
import { DateTimeUtils, fs, hs, TYPOGRAPHY, ws } from '../../utils';
import { useNotificationDetails } from './useNotificationDetails';

export const NotificationDetailsScreen: React.FC = () => {
  const {
    navigation,
    notification,
    isLoading,
    isError,
    refetch,
  } = useNotificationDetails();

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
            <Text style={styles.date}>{DateTimeUtils.getDataFormat(notification.created_at)}</Text>
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
    backgroundColor: Colors.slate_F1F5F9,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: fs(12),
    padding: ws(16),
    shadowColor: Colors.black,
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
    color: Colors.slate_94A3B8,
  },
});
