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
      'You can contact our 24/7 care helpline at +91 99999 99999 or navigate to the "Care Support" page from the Drawer to send us a direct message.',
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

        {/* Still have questions Support Callout */}
        <View style={styles.supportCard}>
          <View style={styles.supportIconCircle}>
            <MaterialIcons name="support-agent" size={28} color={Colors.primaryColor} />
          </View>
          <View style={styles.supportMeta}>
            <Text style={styles.supportTitle}>Still have questions?</Text>
            <Text style={styles.supportSubtitle}>
              Can't find what you're looking for? Our care team is here to assist 24/7.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.supportBtn}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('ContactUs' as any)}
          >
            <Text style={styles.supportBtnText}>Contact Us</Text>
          </TouchableOpacity>
        </View>
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
    padding: 16,
  },
  heroCard: {
    backgroundColor: Colors.primaryColor,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: Colors.primaryColor,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  heroIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  heroTitle: {
    fontSize: 18,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.regular,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 14,
    lineHeight: 18,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingHorizontal: 12,
    minHeight: 48,
    height: 48,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primaryFontColor,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    textAlignVertical: 'center',
  },
  sectionHeaderRow: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryFontColor,
  },
  faqList: {
    gap: 10,
    marginBottom: 20,
  },
  faqCard: {
    padding: 14,
    borderRadius: 16,
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
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  questionText: {
    flex: 1,
    fontSize: 13,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryFontColor,
    lineHeight: 18,
    marginRight: 6,
  },
  questionTextExpanded: {
    color: Colors.primaryColor,
  },
  answerContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  answerText: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.secondaryFontColor,
    lineHeight: 20,
  },
  supportCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  supportIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  supportMeta: {
    alignItems: 'center',
    marginBottom: 14,
  },
  supportTitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryFontColor,
  },
  supportSubtitle: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.secondaryFontColor,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
    paddingHorizontal: 10,
  },
  supportBtn: {
    backgroundColor: Colors.primaryColor,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
  },
  supportBtnText: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
  },
});
