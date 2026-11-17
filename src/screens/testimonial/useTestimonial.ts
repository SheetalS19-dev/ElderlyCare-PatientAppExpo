import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../../navigation/types';
import { useGetTestimonialsQuery } from '../../redux/apis/testimonialApi';
import type { TestimonialModel } from '../../types';

export const useTestimonial = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { data, isLoading, isError, refetch } = useGetTestimonialsQuery();

  const testimonials: TestimonialModel[] = useMemo(() => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    return [];
  }, [data]);

  const avgRating = useMemo(() => {
    if (testimonials.length === 0) return 0;
    const validRatings = testimonials
      .map((t) => Number((t as any).ratting ?? (t as any).rating ?? 0))
      .filter((r) => !isNaN(r) && r > 0);
    if (validRatings.length === 0) return 0;
    const sum = validRatings.reduce((acc, r) => acc + r, 0);
    return sum / validRatings.length;
  }, [testimonials]);

  return {
    navigation,
    insets,
    testimonials,
    avgRating,
    isLoading,
    isError,
    refetch,
  };
};
