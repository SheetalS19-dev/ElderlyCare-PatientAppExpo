import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppCard, AppHeader } from '../../components';
import { AppConstants, Colors, Typography } from '../../constants';
import type { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'AboutUs'>;

export const AboutUsScreen = ({ navigation }: Props) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <AppHeader title="About Us" onBackPress={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + 20, 40) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Brand Banner Card */}
        <AppCard style={styles.brandHeroCard}>
          <View style={styles.brandIconCircle}>
            <MaterialIcons name="local-hospital" size={42} color={Colors.primaryColor} />
          </View>
          <Text style={styles.brandTitle}>{AppConstants.appName}</Text>
          <Text style={styles.brandTagline}>Compassionate Healthcare & Elderly Support</Text>
          <View style={styles.versionChip}>
            <Text style={styles.versionText}>App Version 1.0.0</Text>
          </View>
        </AppCard>

        {/* Our Mission Card */}
        <AppCard style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.sectionIconCircle, { backgroundColor: '#EFF6FF' }]}>
              <MaterialIcons name="flag" size={20} color="#2563EB" />
            </View>
            <Text style={styles.sectionTitle}>Our Mission</Text>
          </View>
          <Text style={styles.paragraph}>
            {AppConstants.appName} is dedicated to connecting senior citizens and their loved ones with certified specialist doctors, home care practitioners, 24/7 vitals monitoring, and digital health records.
          </Text>
        </AppCard>

        {/* App Features & Care Hub Grid */}
        <Text style={styles.groupHeading}>Key Care Features</Text>

        <View style={styles.featureGrid}>
          <AppCard style={styles.gridCard}>
            <View style={[styles.gridIconCircle, { backgroundColor: '#EFF6FF' }]}>
              <MaterialIcons name="event-available" size={22} color={Colors.primaryColor} />
            </View>
            <Text style={styles.gridCardTitle}>Online Bookings</Text>
            <Text style={styles.gridCardDesc}>In-clinic OPD & Video calls with top doctors.</Text>
          </AppCard>

          <AppCard style={styles.gridCard}>
            <View style={[styles.gridIconCircle, { backgroundColor: '#ECFDF5' }]}>
              <MaterialIcons name="favorite" size={22} color="#10B981" />
            </View>
            <Text style={styles.gridCardTitle}>Vitals Tracker</Text>
            <Text style={styles.gridCardDesc}>Monitor BP, Sugar, Pulse & SpO2 history.</Text>
          </AppCard>
        </View>

        <View style={styles.featureGrid}>
          <AppCard style={styles.gridCard}>
            <View style={[styles.gridIconCircle, { backgroundColor: '#EFF6FF' }]}>
              <MaterialIcons name="description" size={22} color="#2563EB" />
            </View>
            <Text style={styles.gridCardTitle}>Digital Vault</Text>
            <Text style={styles.gridCardDesc}>Prescriptions & medical reports in one spot.</Text>
          </AppCard>

          <AppCard style={styles.gridCard}>
            <View style={[styles.gridIconCircle, { backgroundColor: '#FEE2E2' }]}>
              <MaterialIcons name="people" size={22} color="#DC2626" />
            </View>
            <Text style={styles.gridCardTitle}>Family Support</Text>
            <Text style={styles.gridCardDesc}>Manage healthcare for multiple family members.</Text>
          </AppCard>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgColor },
  scrollContent: { padding: 16 },
  brandHeroCard: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 20,
    marginBottom: 16,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  brandIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#DBEAFE',
  },
  brandTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryFontColor,
    textAlign: 'center',
  },
  brandTagline: {
    marginTop: 4,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.secondaryFontColor,
    textAlign: 'center',
  },
  versionChip: {
    marginTop: 12,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  versionText: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryColor,
  },
  card: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  sectionTitle: {
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
  groupHeading: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryFontColor,
    marginBottom: 12,
  },
  featureGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  gridCard: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
  },
  gridIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  gridCardTitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryFontColor,
    marginBottom: 4,
  },
  gridCardDesc: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.secondaryFontColor,
    lineHeight: 16,
  },
});
