import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { memo, useCallback, useMemo } from 'react';
import { FlatList, Image, StyleSheet, Text, View } from 'react-native';
import {
  AppCard,
  AppHeader,
  EmptyState,
  ErrorState,
  LoadingIndicator,
  StarRating,
} from '../../components';
import { ApiEndpoints, Colors } from '../../constants';
import { fs, hs, TYPOGRAPHY, ws } from '../../utils';
import type { TestimonialModel } from '../../types';
import { useTestimonial } from './useTestimonial';

const TestimonialItemCard = memo(({ item }: { item: TestimonialModel }) => (
  <AppCard style={styles.card}>
    <View style={styles.headerRow}>
      {item.image ? (
        <Image
          source={{ uri: `${ApiEndpoints.imageUrl}/${item.image}` }}
          style={styles.avatar}
        />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Ionicons name="person" size={22} color={Colors.primaryColor} />
        </View>
      )}

      <View style={styles.userMeta}>
        <Text style={styles.userName}>{item.title || (item as any).name || 'Patient Review'}</Text>
        <StarRating
          rating={Number((item as any).ratting ?? (item as any).rating ?? 5)}
          starSize={fs(13)}
        />
      </View>
    </View>

    <Text style={styles.description}>{item.desc || (item as any).description || ''}</Text>
  </AppCard>
));

export const TestimonialScreen: React.FC = () => {
  const {
    navigation,
    insets,
    testimonials,
    avgRating,
    isLoading,
    isError,
    refetch,
  } = useTestimonial();

  const handleBackPress = useCallback(() => navigation.goBack(), [navigation]);
  const keyExtractor = useCallback((item: TestimonialModel, index: number) => `testi-${item.id ?? index}`, []);
  const renderItem = useCallback(({ item }: { item: TestimonialModel }) => <TestimonialItemCard item={item} />, []);

  const listHeader = useMemo(() => {
    if (testimonials.length === 0 || avgRating <= 0) return null;
    return (
      <AppCard style={styles.heroCard}>
        <View style={styles.heroRow}>
          <View style={styles.heroRatingBox}>
            <Text style={styles.heroRatingScore}>{avgRating.toFixed(1)}</Text>
            <StarRating rating={avgRating} starSize={fs(14)} />
            <Text style={styles.heroRatingSub}>Patient Satisfaction</Text>
          </View>

          <View style={styles.heroDivider} />

          <View style={styles.heroTextCol}>
            <View style={styles.quoteBadge}>
              <MaterialIcons name="format-quote" size={24} color={Colors.primaryColor} />
            </View>
            <Text style={styles.heroTitle}>Trusted Elderly Care</Text>
            <Text style={styles.heroDesc}>
              Real stories from patients and families experiencing compassionate care.
            </Text>
          </View>
        </View>
      </AppCard>
    );
  }, [testimonials.length, avgRating]);

  const listEmpty = useMemo(() => (
    <EmptyState message="No patient testimonials available yet" />
  ), []);

  return (
    <View style={styles.container}>
      <AppHeader title="Patient Reviews" onBackPress={handleBackPress} />

      {isLoading ? (
        <LoadingIndicator />
      ) : isError ? (
        <ErrorState message="Could not load testimonials" onRetry={refetch} />
      ) : (
        <FlatList
          data={testimonials}
          keyExtractor={keyExtractor}
          contentContainerStyle={[
            styles.listContainer,
            { flexGrow: 1, paddingBottom: Math.max(insets.bottom + hs(20), hs(30)) },
          ]}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={listEmpty}
          renderItem={renderItem}
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
  heroCard: {
    marginBottom: hs(16),
    padding: ws(16),
    backgroundColor: Colors.white,
    borderRadius: fs(16),
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroRatingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: ws(16),
  },
  heroRatingScore: {
    fontSize: fs(32),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryColor,
    marginBottom: hs(2),
  },
  heroRatingSub: {
    fontSize: fs(10),
    ...TYPOGRAPHY.medium,
    color: Colors.secondaryFontColor,
    marginTop: hs(4),
  },
  heroDivider: {
    width: 1,
    height: '80%',
    backgroundColor: Colors.border,
    marginRight: ws(16),
  },
  heroTextCol: {
    flex: 1,
    justifyContent: 'center',
  },
  quoteBadge: {
    width: ws(28),
    height: ws(28),
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: Colors.aquaSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hs(4),
  },
  heroTitle: {
    fontSize: fs(13),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
    marginBottom: hs(2),
  },
  heroDesc: {
    fontSize: fs(11),
    ...TYPOGRAPHY.regular,
    color: Colors.secondaryFontColor,
    lineHeight: fs(15),
  },
  card: {
    marginBottom: hs(12),
    padding: ws(16),
    borderRadius: fs(16),
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hs(12),
  },
  avatar: {
    width: ws(44),
    height: ws(44),
    borderRadius: 999,
    overflow: 'hidden',
    marginRight: ws(12),
    backgroundColor: Colors.slate_F1F5F9,
  },
  avatarPlaceholder: {
    width: ws(44),
    height: ws(44),
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: Colors.aquaSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ws(12),
  },
  userMeta: {
    flex: 1,
  },
  userName: {
    fontSize: fs(14),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
    marginBottom: hs(4),
  },
  description: {
    fontSize: fs(13),
    ...TYPOGRAPHY.regular,
    color: Colors.secondaryFontColor,
    lineHeight: fs(19),
  },
});
