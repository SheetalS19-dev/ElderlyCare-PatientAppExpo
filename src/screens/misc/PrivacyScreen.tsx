import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppCard, AppHeader } from '../../components';
import { AppConstants, Colors } from '../../constants';
import type { RootStackParamList } from '../../navigation/types';
import { fs, hs, TYPOGRAPHY, ws } from '../../utils';

type Props = NativeStackScreenProps<RootStackParamList, 'Privacy'>;

export const PrivacyScreen = ({ navigation }: Props) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <AppHeader title="Privacy Policy" onBackPress={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + hs(20), hs(40)) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Hero Banner Card */}
        <AppCard style={styles.heroCard}>
          <View style={styles.heroRow}>
            <View style={styles.heroIconCircle}>
              <MaterialIcons name="security" size={fs(28)} color={Colors.primaryColor} />
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
            <MaterialIcons name="info-outline" size={fs(20)} color={Colors.primaryColor} />
            <Text style={styles.heading}>1. Commitment to Privacy</Text>
          </View>
          <Text style={styles.paragraph}>
            We value your trust and are dedicated to protecting your personal healthcare information. This Privacy Policy explains how {AppConstants.appName} collects, uses, and safeguards your health data and personal records when you interact with our platform.
          </Text>
        </AppCard>

        {/* Content Section 2 */}
        <AppCard style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <MaterialIcons name="folder-shared" size={fs(20)} color={Colors.primaryColor} />
            <Text style={styles.heading}>2. Information We Collect</Text>
          </View>
          <Text style={styles.paragraph}>
            To deliver personalized healthcare support, we collect essential patient information including full name, phone number, email address, date of birth, gender, vitals logs, medical records, doctor consultation notes, and prescription history.
          </Text>
        </AppCard>

        {/* Content Section 3 */}
        <AppCard style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <MaterialIcons name="lock-outline" size={fs(20)} color={Colors.primaryColor} />
            <Text style={styles.heading}>3. End-to-End Encryption & Security</Text>
          </View>
          <Text style={styles.paragraph}>
            Your health records, prescriptions, and financial transactions are protected using industry-standard 256-bit SSL encryption. Data access is strictly restricted to authorized doctors and medical care personnel assigned to your treatment.
          </Text>
        </AppCard>

        {/* Content Section 4 */}
        <AppCard style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <MaterialIcons name="gavel" size={fs(20)} color={Colors.primaryColor} />
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
    padding: ws(16),
  },
  heroCard: {
    padding: ws(16),
    borderRadius: fs(16),
    marginBottom: hs(12),
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroIconCircle: {
    width: ws(48),
    height: ws(48),
    aspectRatio: 1,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ws(12),
  },
  heroTextWrapper: {
    flex: 1,
  },
  heroTitle: {
    fontSize: fs(18),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
  },
  heroSubtitle: {
    marginTop: hs(2),
    fontSize: fs(12),
    ...TYPOGRAPHY.medium,
    color: Colors.secondaryFontColor,
  },
  dateTag: {
    marginTop: hs(12),
    fontSize: fs(11),
    ...TYPOGRAPHY.medium,
    color: Colors.primaryColor,
  },
  card: {
    marginBottom: hs(12),
    padding: ws(16),
    borderRadius: fs(16),
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(8),
    marginBottom: hs(8),
  },
  heading: {
    fontSize: fs(16),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
  },
  paragraph: {
    fontSize: fs(14),
    ...TYPOGRAPHY.regular,
    color: Colors.secondaryFontColor,
    lineHeight: fs(22),
  },
});
