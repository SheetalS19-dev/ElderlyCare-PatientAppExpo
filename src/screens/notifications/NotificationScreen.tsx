import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  AppHeader,
  EmptyState,
  ErrorState,
  LoadingIndicator,
} from '../../components';
import { ApiEndpoints, Colors } from '../../constants';
import { DateTimeUtils, fs, hs, TYPOGRAPHY, ws } from '../../utils';
import { useNotification } from './useNotification';

export const NotificationScreen: React.FC = () => {
  const {
    navigation,
    insets,
    notifications,
    isLoading,
    isFetching,
    isError,
    refetch,
    handleNotificationPress,
    getNotificationIconInfo,
  } = useNotification();

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
          contentContainerStyle={[
            styles.listContainer,
            { paddingBottom: Math.max(insets.bottom + hs(20), hs(30)) },
          ]}
          showsVerticalScrollIndicator={false}
          refreshing={isFetching}
          onRefresh={refetch}
          ListEmptyComponent={<EmptyState message="You haven't received any notifications yet." />}
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
                  <Text style={styles.body} numberOfLines={3}>
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
  container: {
    flex: 1,
    backgroundColor: Colors.bgColor,
  },
  listContainer: {
    padding: ws(16),
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: fs(14),
    padding: ws(12),
    marginBottom: hs(12),
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  iconPlaceholder: {
    width: ws(44),
    height: ws(44),
    borderRadius: 999,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ws(12),
  },
  notificationImage: {
    width: ws(44),
    height: ws(44),
    borderRadius: 999,
    overflow: 'hidden',
    marginRight: ws(12),
    backgroundColor: Colors.slate_F1F5F9,
  },
  contentWrapper: {
    flex: 1,
    marginRight: ws(8),
  },
  title: {
    fontSize: fs(14),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
    marginBottom: hs(2),
  },
  body: {
    fontSize: fs(12),
    ...TYPOGRAPHY.regular,
    color: Colors.secondaryFontColor,
    lineHeight: fs(16),
    marginBottom: hs(4),
  },
  date: {
    fontSize: fs(10),
    ...TYPOGRAPHY.regular,
    color: Colors.slate_94A3B8,
  },
  chevronCircle: {
    width: ws(28),
    height: ws(28),
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: Colors.aquaSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
