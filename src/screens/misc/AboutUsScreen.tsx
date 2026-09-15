import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppCard, AppHeader } from '../../components';
import { AppConstants, Colors } from '../../constants';
import type { RootStackParamList } from '../../navigation/types';
import { fs, hs, TYPOGRAPHY, ws } from '../../utils';

type Props = NativeStackScreenProps<RootStackParamList, 'AboutUs'>;

export const AboutUsScreen = ({ navigation }: Props) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <AppHeader title="About Us" onBackPress={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + hs(20), hs(40)) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Brand Banner Card */}
        <AppCard style={styles.brandHeroCard}>
          <View style={styles.brandIconCircle}>
            <MaterialIcons name="local-hospital" size={fs(42)} color={Colors.primaryColor} />
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
              <MaterialIcons name="flag" size={fs(20)} color="#2563EB" />
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
              <MaterialIcons name="event-available" size={fs(22)} color={Colors.primaryColor} />
            </View>
            <Text style={styles.gridCardTitle}>Online Bookings</Text>
            <Text style={styles.gridCardDesc}>In-clinic OPD & Video calls with top doctors.</Text>
          </AppCard>

          <AppCard style={styles.gridCard}>
            <View style={[styles.gridIconCircle, { backgroundColor: '#ECFDF5' }]}>
              <MaterialIcons name="favorite" size={fs(22)} color="#10B981" />
            </View>
            <Text style={styles.gridCardTitle}>Vitals Tracker</Text>
            <Text style={styles.gridCardDesc}>Monitor BP, Sugar, Pulse & SpO2 history.</Text>
          </AppCard>
        </View>

        <View style={styles.featureGrid}>
          <AppCard style={styles.gridCard}>
            <View style={[styles.gridIconCircle, { backgroundColor: '#EFF6FF' }]}>
              <MaterialIcons name="description" size={fs(22)} color="#2563EB" />
            </View>
            <Text style={styles.gridCardTitle}>Digital Vault</Text>
            <Text style={styles.gridCardDesc}>Prescriptions & medical reports in one spot.</Text>
          </AppCard>

          <AppCard style={styles.gridCard}>
            <View style={[styles.gridIconCircle, { backgroundColor: '#FEE2E2' }]}>
              <MaterialIcons name="people" size={fs(22)} color="#DC2626" />
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
  scrollContent: { padding: ws(16) },
  brandHeroCard: {
    alignItems: 'center',
    padding: ws(24),
    borderRadius: fs(20),
    marginBottom: hs(16),
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  brandIconCircle: {
    width: ws(80),
    height: hs(80),
    borderRadius: fs(40),
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hs(14),
    borderWidth: 1.5,
    borderColor: '#DBEAFE',
  },
  brandTitle: {
    fontSize: fs(20),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
    textAlign: 'center',
  },
  brandTagline: {
    marginTop: hs(4),
    fontSize: fs(12),
    ...TYPOGRAPHY.medium,
    color: Colors.secondaryFontColor,
    textAlign: 'center',
  },
  versionChip: {
    marginTop: hs(12),
    backgroundColor: '#F1F5F9',
    paddingHorizontal: ws(12),
    paddingVertical: hs(4),
    borderRadius: fs(12),
  },
  versionText: {
    fontSize: fs(11),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryColor,
  },
  card: {
    marginBottom: hs(16),
    padding: ws(16),
    borderRadius: fs(16),
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hs(10),
  },
  sectionIconCircle: {
    width: ws(36),
    height: hs(36),
    borderRadius: fs(18),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ws(10),
  },
  sectionTitle: {
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
  groupHeading: {
    fontSize: fs(16),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
    marginBottom: hs(12),
  },
  featureGrid: {
    flexDirection: 'row',
    gap: ws(12),
    marginBottom: hs(12),
  },
  gridCard: {
    flex: 1,
    padding: ws(14),
    borderRadius: fs(16),
  },
  gridIconCircle: {
    width: ws(40),
    height: hs(40),
    borderRadius: fs(20),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hs(10),
  },
  gridCardTitle: {
    fontSize: fs(14),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
    marginBottom: hs(4),
  },
  gridCardDesc: {
    fontSize: fs(11),
    ...TYPOGRAPHY.regular,
    color: Colors.secondaryFontColor,
    lineHeight: fs(16),
  },
});
