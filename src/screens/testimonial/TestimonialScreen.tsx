import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo } from 'react';
import { FlatList, Image, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AppCard,
  AppHeader,
  EmptyState,
  ErrorState,
  LoadingIndicator,
  StarRating,
} from '../../components';
import { ApiEndpoints, Colors } from '../../constants';
import type { RootStackParamList } from '../../navigation/types';
import { useGetTestimonialsQuery } from '../../redux/apis/testimonialApi';
import type { TestimonialModel } from '../../types';
import { fs, hs, TYPOGRAPHY, ws } from '../../utils';

type Props = NativeStackScreenProps<RootStackParamList, 'Testimonial'>;

export const TestimonialScreen = ({ navigation }: Props) => {
  const insets = useSafeAreaInsets();
  const { data, isLoading, isError, refetch } = useGetTestimonialsQuery();

  const testimonials: TestimonialModel[] = useMemo(() => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    return [];
  }, [data]);

  return (
    <View style={styles.container}>
      <AppHeader title="Patient Reviews" onBackPress={() => navigation.goBack()} />

      {isLoading ? (
        <LoadingIndicator />
      ) : isError ? (
        <ErrorState message="Could not load testimonials" onRetry={refetch} />
      ) : (
        <FlatList
          data={testimonials}
          keyExtractor={(item, index) => `testi-${item.id ?? index}`}
          contentContainerStyle={[
            styles.listContainer,
            { flexGrow: 1, paddingBottom: Math.max(insets.bottom + hs(20), hs(30)) },
          ]}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            testimonials.length > 0 ? (
              <AppCard style={styles.heroCard}>
                <View style={styles.heroRow}>
                  <View style={styles.heroRatingBox}>
                    <Text style={styles.heroRatingScore}>4.9</Text>
                    <StarRating rating={5} starSize={fs(14)} />
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
            ) : null
          }
          ListEmptyComponent={<EmptyState message="No patient testimonials available yet" />}
          renderItem={({ item }) => (
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
                  <View style={styles.userNameRow}>
                    <Text style={styles.title}>{item.title}</Text>
                    <View style={styles.verifiedTag}>
                      <MaterialIcons name="verified" size={14} color={Colors.primaryColor} />
                    </View>
                  </View>

                  {!!item.sub_title && <Text style={styles.subtitle}>{item.sub_title}</Text>}

                  <View style={styles.ratingRow}>
                    <StarRating rating={Number(item.ratting ?? 5)} starSize={fs(13)} />
                    {!!item.created_at && <Text style={styles.date}>{item.created_at}</Text>}
                  </View>
                </View>
              </View>

              {/* Quote Bubble */}
              <View style={styles.quoteBubble}>
                <Text style={styles.desc}>"{item.desc}"</Text>
              </View>
            </AppCard>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgColor },
  listContainer: { padding: ws(16) },
  heroCard: {
    padding: ws(18),
    borderRadius: fs(18),
    marginBottom: hs(16),
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroRatingBox: {
    alignItems: 'center',
    paddingRight: ws(16),
  },
  heroRatingScore: {
    fontSize: fs(32),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
    lineHeight: fs(36),
  },
  heroRatingSub: {
    marginTop: hs(4),
    fontSize: fs(10),
    ...TYPOGRAPHY.medium,
    color: Colors.secondaryFontColor,
  },
  heroDivider: {
    width: ws(1),
    height: hs(60),
    backgroundColor: '#F1F5F9',
    marginRight: ws(16),
  },
  heroTextCol: {
    flex: 1,
  },
  quoteBadge: {
    width: ws(32),
    height: hs(32),
    borderRadius: fs(16),
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hs(4),
  },
  heroTitle: {
    fontSize: fs(16),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
  },
  heroDesc: {
    marginTop: hs(2),
    fontSize: fs(12),
    ...TYPOGRAPHY.regular,
    color: Colors.secondaryFontColor,
    lineHeight: fs(16),
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: fs(16),
    padding: ws(16),
    marginBottom: hs(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hs(12),
  },
  avatar: {
    width: ws(50),
    height: ws(50),
    aspectRatio: 1,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
  },
  avatarPlaceholder: {
    width: ws(50),
    height: ws(50),
    aspectRatio: 1,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  userMeta: {
    flex: 1,
    marginLeft: ws(12),
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(4),
  },
  title: {
    fontSize: fs(14),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
  },
  verifiedTag: {
    marginTop: hs(1),
  },
  subtitle: {
    fontSize: fs(11),
    ...TYPOGRAPHY.medium,
    color: Colors.primaryColor,
    marginTop: hs(1),
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hs(4),
    gap: ws(8),
  },
  date: {
    fontSize: fs(10),
    ...TYPOGRAPHY.regular,
    color: '#94A3B8',
  },
  quoteBubble: {
    backgroundColor: '#F8FAFC',
    borderRadius: fs(12),
    padding: ws(12),
    borderLeftWidth: ws(3),
    borderLeftColor: Colors.primaryColor,
  },
  desc: {
    fontSize: fs(12),
    ...TYPOGRAPHY.regular,
    color: Colors.primaryFontColor,
    lineHeight: fs(20),
    fontStyle: 'italic',
  },
});
