import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useMemo, useState } from 'react';
import { LayoutAnimation } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../../navigation/types';
import { useGetFaqQuery } from '../../redux/apis/blogApi';

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export const useFaq = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { data: faqData, isLoading, refetch } = useGetFaqQuery();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Parse HTML body from API into Q&A items
  const parsedFaqs: FaqItem[] = useMemo(() => {
    const rawBody: string =
      faqData?.data?.body || faqData?.body || '';

    if (!rawBody) return [];

    const items: FaqItem[] = [];
    const h3Matches = rawBody.matchAll(/<h3>(.*?)<\/h3>[\s\S]*?<p>([\s\S]*?)<\/p>/gi);

    let idx = 1;
    for (const match of h3Matches) {
      const q = match[1].replace(/<[^>]*>?/gm, '').trim();
      const a = match[2]
        .replace(/<[^>]*>?/gm, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (q && a) {
        items.push({
          id: `api-faq-${idx++}`,
          question: q,
          answer: a,
        });
      }
    }

    return items;
  }, [faqData]);

  // Filter by search query
  const filteredFaqs = useMemo(() => {
    if (!searchQuery.trim()) return parsedFaqs;
    const query = searchQuery.toLowerCase().trim();
    return parsedFaqs.filter(
      (item) =>
        item.question.toLowerCase().includes(query) ||
        item.answer.toLowerCase().includes(query)
    );
  }, [parsedFaqs, searchQuery]);

  const toggleAccordion = useCallback((id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  return {
    navigation,
    insets,
    isLoading,
    refetch,
    searchQuery,
    setSearchQuery,
    filteredFaqs,
    expandedId,
    toggleAccordion,
  };
};
