import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppCard, AppHeader } from '../../components';
import { AppConstants, Colors, Typography } from '../../constants';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Privacy'>;

export const PrivacyScreen = ({ navigation }: Props) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <AppHeader title="Privacy Policy" onBackPress={() => navigation.goBack()} />

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
              <MaterialIcons name="security" size={28} color={Colors.primaryColor} />
            </View>
            <View style={styles.heroTextWrapper}>
              <Text style={styles.heroTitle}>Privacy Policy</Text>
              <Text style={styles.heroSubtitle}>
                {AppConstants.appName} Data Protection Guidelines
              </Text>
            </View>
          </View>
          <Text style={styles.dateTag}>Last updated: August 2026</Text>
        </AppCard>

        {/* Content Section 1 */}
        <AppCard style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <MaterialIcons name="info-outline" size={20} color={Colors.primaryColor} />
            <Text style={styles.heading}>1. Commitment to Privacy</Text>
          </View>
          <Text style={styles.paragraph}>
            We value your trust and are dedicated to protecting your personal healthcare information. This Privacy Policy explains how {AppConstants.appName} collects, uses, and safeguards your health data and personal records when you interact with our platform.
          </Text>
        </AppCard>

        {/* Content Section 2 */}
        <AppCard style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <MaterialIcons name="folder-shared" size={20} color={Colors.primaryColor} />
            <Text style={styles.heading}>2. Information We Collect</Text>
          </View>
          <Text style={styles.paragraph}>
            To deliver personalized healthcare support, we collect essential patient information including full name, phone number, email address, date of birth, gender, vitals logs, medical records, doctor consultation notes, and prescription history.
          </Text>
        </AppCard>

        {/* Content Section 3 */}
        <AppCard style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <MaterialIcons name="lock-outline" size={20} color={Colors.primaryColor} />
            <Text style={styles.heading}>3. End-to-End Encryption & Security</Text>
          </View>
          <Text style={styles.paragraph}>
            Your health records, prescriptions, and financial transactions are protected using industry-standard 256-bit SSL encryption. Data access is strictly restricted to authorized doctors and medical care personnel assigned to your treatment.
          </Text>
        </AppCard>

        {/* Content Section 4 */}
        <AppCard style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <MaterialIcons name="gavel" size={20} color={Colors.primaryColor} />
            <Text style={styles.heading}>4. User Rights & Data Control</Text>
          </View>
          <Text style={styles.paragraph}>
            You retain full control over your healthcare profile. You can view, update, or delete your family member profiles, vital logs, and personal details anytime from your account settings.
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
