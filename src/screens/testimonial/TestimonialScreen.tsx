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
import { ApiEndpoints, Colors, Typography } from '../../constants';
import type { RootStackParamList } from '../../navigation/types';
import { useGetTestimonialsQuery } from '../../redux/apis/testimonialApi';
import type { TestimonialModel } from '../../types';

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
            { flexGrow: 1, paddingBottom: Math.max(insets.bottom + 20, 30) },
          ]}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            testimonials.length > 0 ? (
              <AppCard style={styles.heroCard}>
                <View style={styles.heroRow}>
                  <View style={styles.heroRatingBox}>
                    <Text style={styles.heroRatingScore}>4.9</Text>
                    <StarRating rating={5} starSize={14} />
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
                    <StarRating rating={Number(item.ratting ?? 5)} starSize={13} />
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
  listContainer: { padding: 16 },
  heroCard: {
    padding: 18,
    borderRadius: 18,
    marginBottom: 16,
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
    paddingRight: 16,
  },
  heroRatingScore: {
    fontSize: 32,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryFontColor,
    lineHeight: 36,
  },
  heroRatingSub: {
    marginTop: 4,
    fontSize: 10,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.secondaryFontColor,
  },
  heroDivider: {
    width: 1,
    height: 60,
    backgroundColor: '#F1F5F9',
    marginRight: 16,
  },
  heroTextCol: {
    flex: 1,
  },
  quoteBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryFontColor,
  },
  heroDesc: {
    marginTop: 2,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.secondaryFontColor,
    lineHeight: 16,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#F1F5F9' },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  userMeta: {
    flex: 1,
    marginLeft: 12,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  title: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryFontColor,
  },
  verifiedTag: {
    marginTop: 1,
  },
  subtitle: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primaryColor,
    marginTop: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  date: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.regular,
    color: '#94A3B8',
  },
  quoteBubble: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primaryColor,
  },
  desc: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.primaryFontColor,
    lineHeight: 20,
    fontStyle: 'italic',
  },
});
