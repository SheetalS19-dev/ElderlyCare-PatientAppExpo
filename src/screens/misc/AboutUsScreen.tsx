import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
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
          { paddingBottom: Math.max(insets.bottom + hs(80), hs(130)) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Brand Hero Card */}
        <AppCard style={styles.brandHeroCard}>
          <View style={styles.brandIconOuterCircle}>
            <View style={styles.brandIconInnerCircle}>
              <MaterialIcons name="local-hospital" size={fs(36)} color={Colors.primaryColor} />
            </View>
          </View>
          <Text style={styles.brandTitle}>{AppConstants.appName}</Text>
          <Text style={styles.brandTagline}>Compassionate Healthcare & Elderly Support</Text>
          <View style={styles.badgesRow}>
            <View style={styles.versionChip}>
              <Text style={styles.versionText}>App Version 1.0.0</Text>
            </View>
            <View style={styles.verifiedChip}>
              <MaterialIcons name="verified" size={fs(12)} color="#10B981" style={{ marginRight: ws(4) }} />
              <Text style={styles.verifiedText}>Certified Care</Text>
            </View>
          </View>
        </AppCard>

        {/* Our Mission Card */}
        <AppCard style={styles.missionCard}>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.sectionIconCircle, { backgroundColor: '#EFF6FF' }]}>
              <MaterialIcons name="flag" size={fs(18)} color="#2563EB" />
            </View>
            <Text style={styles.sectionTitle}>Our Mission</Text>
          </View>
          <Text style={styles.paragraph}>
            {AppConstants.appName} is dedicated to connecting senior citizens and their loved ones with certified specialist doctors, home care practitioners, 24/7 vitals monitoring, and digital health records.
          </Text>
        </AppCard>

        {/* Key Care Features Heading */}
        <View style={styles.groupHeaderRow}>
          <MaterialIcons name="stars" size={fs(18)} color={Colors.primaryColor} style={{ marginRight: ws(6) }} />
          <Text style={styles.groupHeading}>Key Care Features</Text>
        </View>

        {/* 2x2 Features Grid */}
        <View style={styles.featureGrid}>
          <AppCard style={styles.gridCard}>
              <View style={styles.gridCardHeaderRow}>
                <View style={[styles.gridIconCircle, { backgroundColor: '#EFF6FF' }]}>
                  <MaterialIcons name="event-available" size={fs(18)} color={Colors.primaryColor} />
                </View>
                <Text style={styles.gridCardTitle}>Online Bookings</Text>
              </View>
              <Text style={styles.gridCardDesc}>In-clinic OPD & Video calls with top doctors.</Text>
          </AppCard>

          <AppCard style={styles.gridCard}>
              <View style={styles.gridCardHeaderRow}>
                <View style={[styles.gridIconCircle, { backgroundColor: '#ECFDF5' }]}>
                  <MaterialIcons name="favorite" size={fs(18)} color="#10B981" />
                </View>
                <Text style={styles.gridCardTitle}>Vitals Tracker</Text>
              </View>
              <Text style={styles.gridCardDesc}>Monitor BP, Sugar, Pulse & SpO2 history.</Text>
          </AppCard>
        </View>

        <View style={styles.featureGrid}>
          <AppCard style={styles.gridCard}>
              <View style={styles.gridCardHeaderRow}>
                <View style={[styles.gridIconCircle, { backgroundColor: '#EFF6FF' }]}>
                  <MaterialIcons name="description" size={fs(18)} color="#2563EB" />
                </View>
                <Text style={styles.gridCardTitle}>Digital Vault</Text>
              </View>
              <Text style={styles.gridCardDesc}>Prescriptions & medical reports in one spot.</Text>
          </AppCard>

          <AppCard style={styles.gridCard}>
              <View style={styles.gridCardHeaderRow}>
                <View style={[styles.gridIconCircle, { backgroundColor: '#FEE2E2' }]}>
                  <MaterialIcons name="people" size={fs(18)} color="#DC2626" />
                </View>
                <Text style={styles.gridCardTitle}>Family Support</Text>
              </View>
              <Text style={styles.gridCardDesc}>Manage healthcare for multiple family members.</Text>
          </AppCard>
        </View>

        <Text style={styles.copyrightText}>© 2026 {AppConstants.appName}. All rights reserved.</Text>
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
    paddingHorizontal: ws(16),
    paddingTop: hs(14),
  },
  brandHeroCard: {
    alignItems: 'center',
    paddingVertical: hs(20),
    paddingHorizontal: ws(18),
    borderRadius: fs(18),
    marginBottom: hs(14),
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  brandIconOuterCircle: {
    width: ws(72),
    height: ws(72),
    borderRadius: 999,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hs(12),
    borderWidth: 1.5,
    borderColor: '#DBEAFE',
  },
  brandIconInnerCircle: {
    width: ws(54),
    height: ws(54),
    borderRadius: 999,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: fs(19),
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
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(8),
    marginTop: hs(12),
  },
  versionChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: ws(10),
    paddingVertical: hs(4),
    borderRadius: fs(10),
  },
  versionText: {
    fontSize: fs(11),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryColor,
  },
  verifiedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: ws(10),
    paddingVertical: hs(4),
    borderRadius: fs(10),
  },
  verifiedText: {
    fontSize: fs(11),
    ...TYPOGRAPHY.semiBold,
    color: '#059669',
  },
  missionCard: {
    marginBottom: hs(14),
    padding: ws(16),
    borderRadius: fs(16),
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hs(8),
  },
  sectionIconCircle: {
    width: ws(32),
    height: ws(32),
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ws(10),
  },
  sectionTitle: {
    fontSize: fs(15),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
  },
  paragraph: {
    fontSize: fs(12.5),
    ...TYPOGRAPHY.regular,
    color: '#475569',
    lineHeight: hs(19),
  },
  groupHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hs(10),
    marginTop: hs(4),
  },
  groupHeading: {
    fontSize: fs(14),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
  },
  featureGrid: {
    flexDirection: 'row',
    gap: ws(10),
    marginBottom: hs(10),
  },
  gridCard: {
    flex: 1,
    padding: ws(12),
    borderRadius: fs(14),
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  gridCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(8),
    marginBottom: hs(6),
  },
  gridIconCircle: {
    width: ws(32),
    height: ws(32),
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridCardTitle: {
    flex: 1,
    fontSize: fs(12.5),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
  },
  gridCardDesc: {
    fontSize: fs(11),
    ...TYPOGRAPHY.regular,
    color: '#64748B',
    lineHeight: hs(15),
  },
  copyrightText: {
    fontSize: fs(11),
    ...TYPOGRAPHY.regular,
    color: '#94A3B8',
    textAlign: 'center',
    marginVertical: hs(16),
  },
});
