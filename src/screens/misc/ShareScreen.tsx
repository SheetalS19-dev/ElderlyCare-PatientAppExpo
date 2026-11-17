import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { AppButton, AppCard, AppHeader, LoadingIndicator } from '../../components';
import { AppConstants, Colors } from '../../constants';
import { fs, hs, TYPOGRAPHY, ws } from '../../utils';
import { useShare } from './useShare';

export const ShareScreen: React.FC = () => {
  const {
    navigation,
    insets,
    pointsDesc,
    isLoading,
    handleShare,
  } = useShare();

  return (
    <View style={styles.container}>
      <AppHeader title="Share App" onBackPress={() => navigation.goBack()} />

      {isLoading ? (
        <LoadingIndicator />
      ) : (
        <View style={styles.flexContainer}>
          <ScrollView
            style={styles.scrollContainer}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: Math.max(insets.bottom + hs(80), hs(90)) },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* Hero Banner Card */}
            <AppCard style={styles.heroCard}>
              <View style={styles.heroIconCircle}>
                <MaterialIcons name="share" size={fs(36)} color={Colors.primaryColor} />
              </View>
              <Text style={styles.heroTitle}>Invite Family & Friends</Text>
              <Text style={styles.heroSubtitle}>
                {pointsDesc ||
                  'Share ElderlyCare Patient app with family members so they can schedule consultations and monitor vitals easily.'}
              </Text>
            </AppCard>

            {/* Share Features List */}
            <Text style={styles.sectionTitle}>Why Share {AppConstants.appName}?</Text>

            <AppCard style={styles.featureCard}>
              <View style={styles.featureRow}>
                <View style={[styles.featureIconBox, { backgroundColor: Colors.aquaSoft }]}>
                  <MaterialIcons name="favorite" size={fs(22)} color={Colors.primaryColor} />
                </View>
                <View style={styles.featureInfo}>
                  <Text style={styles.featureTitle}>Family Vitals Tracking</Text>
                  <Text style={styles.featureDesc}>Keep track of blood pressure, sugar & heart rate for elders.</Text>
                </View>
              </View>
            </AppCard>

            <AppCard style={styles.featureCard}>
              <View style={styles.featureRow}>
                <View style={[styles.featureIconBox, { backgroundColor: Colors.green_ECFDF5 }]}>
                  <MaterialIcons name="event-available" size={fs(22)} color={Colors.green_10B981} />
                </View>
                <View style={styles.featureInfo}>
                  <Text style={styles.featureTitle}>Instant Appointments</Text>
                  <Text style={styles.featureDesc}>Book specialist doctors and video consultations in seconds.</Text>
                </View>
              </View>
            </AppCard>

            <AppCard style={styles.featureCard}>
              <View style={styles.featureRow}>
                <View style={[styles.featureIconBox, { backgroundColor: Colors.aquaSoft }]}>
                  <MaterialIcons name="description" size={fs(22)} color={Colors.primaryColor} />
                </View>
                <View style={styles.featureInfo}>
                  <Text style={styles.featureTitle}>Digital Prescriptions & Vault</Text>
                  <Text style={styles.featureDesc}>Access medical records & prescriptions anywhere, anytime.</Text>
                </View>
              </View>
            </AppCard>
          </ScrollView>

          {/* Sticky Bottom Bar */}
          <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom + hs(12), hs(16)) }]}>
            <AppButton
              title="Share Link Now"
              height={hs(50)}
              onPress={handleShare}
            />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgColor,
  },
  flexContainer: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: ws(16),
  },
  heroCard: {
    alignItems: 'center',
    padding: ws(24),
    borderRadius: fs(20),
    marginBottom: hs(20),
    backgroundColor: Colors.white,
  },
  heroIconCircle: {
    width: ws(72),
    height: ws(72),
    aspectRatio: 1,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: Colors.aquaSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hs(16),
    borderWidth: 1.5,
    borderColor: Colors.aqua,
  },
  heroTitle: {
    fontSize: fs(18),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
    textAlign: 'center',
    marginBottom: hs(8),
  },
  heroSubtitle: {
    fontSize: fs(14),
    ...TYPOGRAPHY.regular,
    color: Colors.secondaryFontColor,
    textAlign: 'center',
    lineHeight: fs(22),
  },
  sectionTitle: {
    fontSize: fs(16),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
    marginBottom: hs(12),
  },
  featureCard: {
    marginBottom: hs(10),
    padding: ws(14),
    borderRadius: fs(14),
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIconBox: {
    width: ws(44),
    height: hs(44),
    borderRadius: fs(22),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ws(14),
  },
  featureInfo: {
    flex: 1,
  },
  featureTitle: {
    fontSize: fs(14),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
  },
  featureDesc: {
    marginTop: hs(2),
    fontSize: fs(12),
    ...TYPOGRAPHY.regular,
    color: Colors.secondaryFontColor,
    lineHeight: fs(18),
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.white,
    paddingHorizontal: ws(16),
    paddingTop: hs(12),
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    elevation: 8,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
});
