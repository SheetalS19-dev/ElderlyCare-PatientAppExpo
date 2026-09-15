import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import {
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppButton, AppCard, AppHeader, LoadingIndicator } from '../../components';
import { ApiEndpoints, AppConstants, Colors } from '../../constants';
import type { RootStackParamList } from '../../navigation/types';
import { apiClient } from '../../services/apiClient';
import { fs, hs, showToast, TYPOGRAPHY, ws } from '../../utils';

type Props = NativeStackScreenProps<RootStackParamList, 'Share'>;

export const ShareScreen = ({ navigation }: Props) => {
  const insets = useSafeAreaInsets();
  const [shareLink, setShareLink] = useState('');
  const [pointsDesc, setPointsDesc] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchShareConfig();
  }, []);

  const fetchShareConfig = async () => {
    setIsLoading(true);
    try {
      const linkKey = Platform.OS === 'ios' ? 'app_store_link' : 'play_store_link';
      const [linkRes, descRes] = await Promise.all([
        apiClient.get(`${ApiEndpoints.getConfigByIdNameApiUrl}/${linkKey}`),
        apiClient.get(`${ApiEndpoints.getConfigByIdNameApiUrl}/s_p_d_p_a`),
      ]);

      if (linkRes?.data?.value) setShareLink(linkRes.data.value);
      if (descRes?.data?.value) setPointsDesc(descRes.data.value);
    } catch (e) {
      console.warn('Share config fetch error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Download ${AppConstants.appName} care app to manage appointments, vitals & prescriptions: ${shareLink || 'https://elderlycare.life'}`,
        title: AppConstants.appName,
      });
    } catch (error) {
      console.warn('Share error:', error);
    }
  };

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
                <View style={[styles.featureIconBox, { backgroundColor: '#EFF6FF' }]}>
                  <MaterialIcons name="favorite" size={fs(22)} color="#2563EB" />
                </View>
                <View style={styles.featureInfo}>
                  <Text style={styles.featureTitle}>Family Vitals Tracking</Text>
                  <Text style={styles.featureDesc}>Keep track of blood pressure, sugar & heart rate for elders.</Text>
                </View>
              </View>
            </AppCard>

            <AppCard style={styles.featureCard}>
              <View style={styles.featureRow}>
                <View style={[styles.featureIconBox, { backgroundColor: '#ECFDF5' }]}>
                  <MaterialIcons name="event-available" size={fs(22)} color="#10B981" />
                </View>
                <View style={styles.featureInfo}>
                  <Text style={styles.featureTitle}>Instant Appointments</Text>
                  <Text style={styles.featureDesc}>Book specialist doctors and video consultations in seconds.</Text>
                </View>
              </View>
            </AppCard>

            <AppCard style={styles.featureCard}>
              <View style={styles.featureRow}>
                <View style={[styles.featureIconBox, { backgroundColor: '#EFF6FF' }]}>
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
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hs(16),
    borderWidth: 1.5,
    borderColor: '#DBEAFE',
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
    borderTopColor: '#E2E8F0',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
});
