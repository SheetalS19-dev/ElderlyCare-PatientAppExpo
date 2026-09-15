import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import {
  LayoutAnimation,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppCard, AppHeader, EmptyState, LoadingIndicator } from '../../components';
import { Colors, Typography } from '../../constants';
import type { RootStackParamList } from '../../navigation/types';
import { useGetFaqQuery } from '../../redux/apis/blogApi';
import { ws, hs, fs, TYPOGRAPHY } from '../../utils';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

const DEFAULT_FAQS: FaqItem[] = [
  {
    id: 'faq-1',
    question: 'What is ElderlyCare Patient App about?',
    answer:
      'ElderlyCare Patient connects elderly individuals and their caregivers with certified specialist doctors, home care services, vital tracking, and digital health records.',
  },
  {
    id: 'faq-2',
    question: 'Is this application free to use?',
    answer:
      'Yes, browsing doctors, clinics, health articles, and basic health tracking features are free. Doctor consultations and specialized home care services are charged per booking.',
  },
  {
    id: 'faq-3',
    question: 'Do I need to create an account to use the app?',
    answer:
      'You can explore doctors and clinics as a guest. Booking appointments, maintaining medical records, and managing family members require a free account.',
  },
  {
    id: 'faq-4',
    question: 'How do I book an in-clinic or video consultation?',
    answer:
      'Select a doctor from the Doctors tab or Care Services Hub, choose In-Clinic or Video Call, pick an available date and time slot, select the patient, and confirm your booking.',
  },
  {
    id: 'faq-5',
    question: 'How can I add and manage family members?',
    answer:
      'Open the side menu Drawer and tap "Family Members". From there you can add loved ones and easily book appointments or record vitals on their behalf.',
  },
  {
    id: 'faq-6',
    question: 'How do I view and download prescriptions and invoices?',
    answer:
      'Go to "Prescriptions" or "Appointments" from the Drawer. You can view full-page previews, download PDFs directly to your phone storage, or share them via WhatsApp or email.',
  },
  {
    id: 'faq-7',
    question: 'Can I track daily health vitals like Blood Pressure and Sugar?',
    answer:
      'Yes! Tap "Vitals Tracker" on the Home Screen or Drawer to record Blood Pressure, Pulse, Glucose, Temperature, and SpO2 levels with interactive health history charts.',
  },
  {
    id: 'faq-8',
    question: 'How do I add money to my wallet for quick payments?',
    answer:
      'Open the Drawer menu and tap "My Wallet". Click "+ Add Money", enter your desired amount, and complete secure payment via Razorpay / UPI / NetBanking.',
  },
  {
    id: 'faq-9',
    question: 'How can I contact customer support?',
    answer:
      'You can contact our 24/7 care helpline at +918840 622 729 or navigate to the "Care Support" page from the Drawer to send us a direct message.',
  },
];

type Props = NativeStackScreenProps<RootStackParamList, 'Faq'>;

export const FaqScreen = ({ navigation }: Props) => {
  const insets = useSafeAreaInsets();
  const { data: faqData, isLoading, refetch } = useGetFaqQuery();
  const [expandedId, setExpandedId] = useState<string | null>(DEFAULT_FAQS[0].id);
  const [searchQuery, setSearchQuery] = useState('');

  // Parse HTML body from API into Q&A items
  const parsedFaqs: FaqItem[] = useMemo(() => {
    const rawBody: string =
      faqData?.data?.body || faqData?.body || '';

    if (!rawBody) return DEFAULT_FAQS;

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

    return items.length > 0 ? items : DEFAULT_FAQS;
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

  const toggleAccordion = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Frequently Asked Questions" onBackPress={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + 24, 40) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Hero Banner */}
        <View style={styles.heroCard}>
          <View style={styles.heroIconCircle}>
            <MaterialIcons name="help-outline" size={32} color={Colors.white} />
          </View>
          <Text style={styles.heroTitle}>How can we help you?</Text>
          <Text style={styles.heroSubtitle}>
            Find quick answers to common questions about elderly care, appointments, vitals, and billing.
          </Text>

          {/* Search Box */}
          <View style={styles.searchBar}>
            <MaterialIcons name="search" size={20} color={Colors.secondaryFontColor} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search questions or keywords..."
              placeholderTextColor={Colors.secondaryFontColor}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {!!searchQuery && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <MaterialIcons name="cancel" size={18} color={Colors.secondaryFontColor} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Section title */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>
            {searchQuery ? `Search Results (${filteredFaqs.length})` : 'Popular Questions'}
          </Text>
        </View>

        {isLoading ? (
          <LoadingIndicator />
        ) : filteredFaqs.length === 0 ? (
          <EmptyState message={`No questions found matching "${searchQuery}"`} />
        ) : (
          <View style={styles.faqList}>
            {filteredFaqs.map((faq) => {
              const isExpanded = expandedId === faq.id;
              return (
                <AppCard key={faq.id} style={[styles.faqCard, isExpanded && styles.faqCardExpanded]}>
                  <TouchableOpacity
                    style={styles.faqHeader}
                    activeOpacity={0.8}
                    onPress={() => toggleAccordion(faq.id)}
                  >
                    <View style={styles.questionIconCircle}>
                      <MaterialIcons
                        name="help"
                        size={16}
                        color={isExpanded ? Colors.primaryColor : Colors.secondaryFontColor}
                      />
                    </View>
                    <Text
                      style={[
                        styles.questionText,
                        isExpanded && styles.questionTextExpanded,
                      ]}
                    >
                      {faq.question}
                    </Text>
                    <MaterialIcons
                      name={isExpanded ? 'expand-less' : 'expand-more'}
                      size={24}
                      color={isExpanded ? Colors.primaryColor : Colors.secondaryFontColor}
                    />
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={styles.answerContainer}>
                      <Text style={styles.answerText}>{faq.answer}</Text>
                    </View>
                  )}
                </AppCard>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgColor,
  },
  scrollContent: {
    padding: ws(16),
  },
  heroCard: {
    backgroundColor: Colors.primaryColor,
    borderRadius: fs(20),
    padding: ws(20),
    alignItems: 'center',
    marginBottom: hs(20),
    shadowColor: Colors.primaryColor,
    shadowOffset: { width: 0, height: hs(6) },
    shadowOpacity: 0.25,
    shadowRadius: fs(10),
    elevation: 6,
  },
  heroIconCircle: {
    width: ws(56),
    height: ws(56),
    aspectRatio: 1,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hs(10),
  },
  heroTitle: {
    fontSize: fs(18),
    ...TYPOGRAPHY.bold,
    color: Colors.white,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: fs(12),
    ...TYPOGRAPHY.regular,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    marginTop: hs(4),
    marginBottom: hs(14),
    lineHeight: hs(18),
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: fs(14),
    paddingHorizontal: ws(12),
    minHeight: hs(48),
    height: hs(48),
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: hs(2) },
    shadowOpacity: 0.08,
    shadowRadius: fs(4),
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: ws(8),
    fontSize: fs(Typography.fontSize.sm),
    ...TYPOGRAPHY.medium,
    color: Colors.primaryFontColor,
    paddingVertical: Platform.OS === 'ios' ? hs(10) : hs(6),
    textAlignVertical: 'center',
  },
  sectionHeaderRow: {
    marginBottom: hs(12),
  },
  sectionTitle: {
    fontSize: fs(Typography.fontSize.md),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
  },
  faqList: {
    gap: hs(10),
    marginBottom: hs(20),
  },
  faqCard: {
    padding: ws(14),
    borderRadius: fs(16),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: Colors.white,
  },
  faqCardExpanded: {
    borderColor: Colors.primaryColor,
    backgroundColor: '#FFFDFB',
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  questionIconCircle: {
    width: ws(28),
    height: ws(28),
    aspectRatio: 1,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ws(10),
  },
  questionText: {
    flex: 1,
    fontSize: fs(13),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
    lineHeight: hs(18),
    marginRight: ws(6),
  },
  questionTextExpanded: {
    color: Colors.primaryColor,
  },
  answerContainer: {
    marginTop: hs(12),
    paddingTop: hs(12),
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  answerText: {
    fontSize: fs(12),
    ...TYPOGRAPHY.regular,
    color: Colors.secondaryFontColor,
    lineHeight: hs(20),
  },
  supportCard: {
    backgroundColor: Colors.white,
    borderRadius: fs(18),
    padding: ws(16),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    marginTop: hs(8),
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: hs(2) },
    shadowOpacity: 0.04,
    shadowRadius: fs(6),
    elevation: 2,
  },
  supportIconCircle: {
    width: ws(52),
    height: ws(52),
    aspectRatio: 1,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hs(10),
  },
  supportMeta: {
    alignItems: 'center',
    marginBottom: hs(14),
  },
  supportTitle: {
    fontSize: fs(Typography.fontSize.sm),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
  },
  supportSubtitle: {
    fontSize: fs(11),
    ...TYPOGRAPHY.regular,
    color: Colors.secondaryFontColor,
    textAlign: 'center',
    marginTop: hs(4),
    lineHeight: hs(16),
    paddingHorizontal: ws(10),
  },
  supportBtn: {
    backgroundColor: Colors.primaryColor,
    paddingHorizontal: ws(24),
    paddingVertical: hs(10),
    borderRadius: fs(12),
  },
  supportBtnText: {
    fontSize: fs(12),
    ...TYPOGRAPHY.bold,
    color: Colors.white,
  },
});
