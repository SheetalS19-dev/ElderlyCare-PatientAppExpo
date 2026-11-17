import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import {
  AppCard,
  AppHeader,
  EmptyState,
  GradientFill,
  LoadingIndicator,
  SearchBox,
} from '../../components';
import { Colors } from '../../constants';
import { fs, hs, TYPOGRAPHY, ws } from '../../utils';
import { useFaq } from './useFaq';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export const FaqScreen: React.FC = () => {
  const {
    navigation,
    insets,
    isLoading,
    searchQuery,
    setSearchQuery,
    filteredFaqs,
    expandedId,
    toggleAccordion,
  } = useFaq();

  return (
    <View style={styles.container}>
      <AppHeader title="Frequently Asked Questions" onBackPress={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: hs(80) + Math.max(insets.bottom, hs(24)) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Support Banner (matching navy -> teal theme gradient) */}
        <View style={styles.heroCard}>
          <GradientFill id="faqHeroGrad" colors={Colors.headerGradient} />
          <View style={styles.heroRow}>
            <View style={styles.heroTextCol}>
              <Text style={styles.heroTitle}>How Can We Help?</Text>
              <Text style={styles.heroSubtitle}>
                Find quick answers to common questions about appointments, consultations, and vitals tracking.
              </Text>
            </View>
            <View style={styles.heroIconCircle}>
              <MaterialIcons name="help-outline" size={fs(32)} color={Colors.white} />
            </View>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchWrapper}>
          <SearchBox
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search questions or topics..."
          />
        </View>

        {/* FAQ List */}
        {isLoading ? (
          <LoadingIndicator />
        ) : filteredFaqs.length === 0 ? (
          <EmptyState
            message={
              searchQuery
                ? `No FAQs found matching "${searchQuery}"`
                : 'No FAQs available right now.'
            }
          />
        ) : (
          filteredFaqs.map((faq) => {
            const isExpanded = expandedId === faq.id;
            return (
              <AppCard key={faq.id} style={styles.card}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => toggleAccordion(faq.id)}
                  style={styles.cardTouchable}
                >
                  <View style={styles.questionRow}>
                    <View style={styles.qIconCircle}>
                      <MaterialIcons name="question-answer" size={fs(14)} color={Colors.primaryColor} />
                    </View>
                    <Text style={styles.questionText}>{faq.question}</Text>
                    <View
                      style={[
                        styles.chevronCircle,
                        isExpanded && { backgroundColor: Colors.aquaSoft },
                      ]}
                    >
                      <MaterialIcons
                        name={isExpanded ? 'expand-less' : 'expand-more'}
                        size={fs(20)}
                        color={isExpanded ? Colors.primaryColor : Colors.secondaryFontColor}
                      />
                    </View>
                  </View>
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.answerContainer}>
                    <Text style={styles.answerText}>{faq.answer}</Text>
                  </View>
                )}
              </AppCard>
            );
          })
        )}

        {/* Still Have Questions Box */}
        <View style={styles.contactCard}>
          <View style={styles.contactRow}>
            <View style={styles.contactIconCircle}>
              <MaterialIcons name="support-agent" size={fs(24)} color={Colors.primaryColor} />
            </View>
            <View style={styles.contactTextCol}>
              <Text style={styles.contactTitle}>Still have questions?</Text>
              <Text style={styles.contactDesc}>
                Can't find the answer you're looking for? Reach out to our 24/7 care team.
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.contactBtn}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('ContactUs')}
          >
            <Text style={styles.contactBtnText}>Contact Support</Text>
            <MaterialIcons name="arrow-forward" size={fs(14)} color={Colors.white} />
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
    padding: ws(16),
  },
  heroCard: {
    borderRadius: fs(18),
    overflow: 'hidden',
    padding: ws(18),
    marginBottom: hs(14),
    position: 'relative',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroTextCol: {
    flex: 1,
    paddingRight: ws(12),
  },
  heroTitle: {
    fontSize: fs(18),
    ...TYPOGRAPHY.bold,
    color: Colors.white,
    marginBottom: hs(4),
  },
  heroSubtitle: {
    fontSize: fs(12),
    ...TYPOGRAPHY.regular,
    color: Colors.blue_D6E8F6,
    lineHeight: fs(17),
  },
  heroIconCircle: {
    width: ws(52),
    height: ws(52),
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchWrapper: {
    marginBottom: hs(14),
  },
  card: {
    marginBottom: hs(10),
    borderRadius: fs(14),
    padding: 0,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  cardTouchable: {
    padding: ws(14),
  },
  questionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(10),
  },
  qIconCircle: {
    width: ws(28),
    height: ws(28),
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: Colors.aquaSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  questionText: {
    flex: 1,
    fontSize: fs(13),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
    lineHeight: fs(18),
  },
  chevronCircle: {
    width: ws(28),
    height: ws(28),
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: Colors.slate_F1F5F9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  answerContainer: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: ws(14),
    paddingVertical: hs(12),
    backgroundColor: Colors.bgColor,
  },
  answerText: {
    fontSize: fs(12),
    ...TYPOGRAPHY.regular,
    color: Colors.secondaryFontColor,
    lineHeight: fs(18),
  },
  contactCard: {
    backgroundColor: Colors.aquaSoft,
    borderRadius: fs(16),
    padding: ws(16),
    marginTop: hs(8),
    borderWidth: 1,
    borderColor: Colors.aqua,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hs(12),
  },
  contactIconCircle: {
    width: ws(40),
    height: ws(40),
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ws(12),
  },
  contactTextCol: {
    flex: 1,
  },
  contactTitle: {
    fontSize: fs(13),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryColor,
    marginBottom: hs(2),
  },
  contactDesc: {
    fontSize: fs(11),
    ...TYPOGRAPHY.regular,
    color: Colors.secondaryFontColor,
    lineHeight: fs(16),
  },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryColor,
    paddingVertical: hs(10),
    borderRadius: fs(10),
    gap: ws(6),
  },
  contactBtnText: {
    color: Colors.white,
    fontSize: fs(12),
    ...TYPOGRAPHY.bold,
  },
});
