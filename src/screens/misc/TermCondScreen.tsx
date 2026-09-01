import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppCard, AppHeader } from '../../components';
import { AppConstants, Colors, Typography } from '../../constants';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'TermCond'>;

export const TermCondScreen = ({ navigation }: Props) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <AppHeader title="Terms & Conditions" onBackPress={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + 20, 40) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Hero Banner Card */}
        <AppCard style={styles.heroCard}>
          <View style={styles.heroRow}>
            <View style={styles.heroIconCircle}>
              <MaterialIcons name="assignment" size={28} color={Colors.primaryColor} />
            </View>
            <View style={styles.heroTextWrapper}>
              <Text style={styles.heroTitle}>Terms of Service</Text>
              <Text style={styles.heroSubtitle}>
                {AppConstants.appName} Service Rules & Agreements
              </Text>
            </View>
          </View>
          <Text style={styles.dateTag}>Effective Date: August 2026</Text>
        </AppCard>

        {/* Content Section 1 */}
        <AppCard style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <MaterialIcons name="verified-user" size={20} color={Colors.primaryColor} />
            <Text style={styles.heading}>1. Acceptance of Terms</Text>
          </View>
          <Text style={styles.paragraph}>
            By creating an account or accessing services provided through {AppConstants.appName}, you agree to be bound by these terms and conditions. If you do not agree, please discontinue using the application.
          </Text>
        </AppCard>

        {/* Content Section 2 */}
        <AppCard style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <MaterialIcons name="medical-services" size={20} color={Colors.primaryColor} />
            <Text style={styles.heading}>2. Healthcare & Medical Disclaimer</Text>
          </View>
          <Text style={styles.paragraph}>
            {AppConstants.appName} facilitates doctor bookings, prescription management, and health tracking. This app is not a substitute for professional emergency medical evaluation. In life-threatening emergencies, contact local emergency healthcare providers immediately.
          </Text>
        </AppCard>

        {/* Content Section 3 */}
        <AppCard style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <MaterialIcons name="event-available" size={20} color={Colors.primaryColor} />
            <Text style={styles.heading}>3. Booking & Cancellation Rules</Text>
          </View>
          <Text style={styles.paragraph}>
            Appointment slots are reserved upon successful confirmation. Cancellations and rescheduling requests are processed in accordance with individual doctor and clinic cancellation policies. Refundable payments will be credited back to your in-app wallet balance.
          </Text>
        </AppCard>

        {/* Content Section 4 */}
        <AppCard style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <MaterialIcons name="account-balance-wallet" size={20} color={Colors.primaryColor} />
            <Text style={styles.heading}>4. Wallet & Payment Processing</Text>
          </View>
          <Text style={styles.paragraph}>
            Online payments are securely processed via Razorpay integration. Wallet funds can be redeemed for eligible appointments, OPD consultations, and digital health services within the app.
          </Text>
        </AppCard>
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
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF5EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  heroTextWrapper: {
    flex: 1,
  },
  heroTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryFontColor,
  },
  heroSubtitle: {
    marginTop: 2,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.secondaryFontColor,
  },
  dateTag: {
    marginTop: 12,
    fontSize: 11,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primaryColor,
  },
  card: {
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  heading: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryFontColor,
  },
  paragraph: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.secondaryFontColor,
    lineHeight: 22,
  },
});
