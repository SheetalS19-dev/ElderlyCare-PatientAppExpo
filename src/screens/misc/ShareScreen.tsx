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
import { ApiEndpoints, AppConstants, Colors, Typography } from '../../constants';
import type { RootStackParamList } from '../../navigation/types';
import { apiClient } from '../../services/apiClient';
import { showToast } from '../../utils';

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
              { paddingBottom: Math.max(insets.bottom + 80, 90) },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* Hero Banner Card */}
            <AppCard style={styles.heroCard}>
              <View style={styles.heroIconCircle}>
                <MaterialIcons name="share" size={36} color={Colors.primaryColor} />
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
                  <MaterialIcons name="favorite" size={22} color="#2563EB" />
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
                  <MaterialIcons name="event-available" size={22} color="#10B981" />
                </View>
                <View style={styles.featureInfo}>
                  <Text style={styles.featureTitle}>Instant Appointments</Text>
                  <Text style={styles.featureDesc}>Book specialist doctors and video consultations in seconds.</Text>
                </View>
              </View>
            </AppCard>

            <AppCard style={styles.featureCard}>
              <View style={styles.featureRow}>
                <View style={[styles.featureIconBox, { backgroundColor: '#FFF5EB' }]}>
                  <MaterialIcons name="description" size={22} color={Colors.primaryColor} />
                </View>
                <View style={styles.featureInfo}>
                  <Text style={styles.featureTitle}>Digital Prescriptions & Vault</Text>
                  <Text style={styles.featureDesc}>Access medical records & prescriptions anywhere, anytime.</Text>
                </View>
              </View>
            </AppCard>
          </ScrollView>

          {/* Sticky Bottom Bar */}
          <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom + 12, 16) }]}>
            <AppButton
              title="Share Link Now"
              height={50}
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
    padding: 16,
  },
  heroCard: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 20,
    marginBottom: 20,
    backgroundColor: Colors.white,
  },
  heroIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFF5EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#FFEDD5',
  },
  heroTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryFontColor,
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.secondaryFontColor,
    textAlign: 'center',
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryFontColor,
    marginBottom: 12,
  },
  featureCard: {
    marginBottom: 10,
    padding: 14,
    borderRadius: 14,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  featureInfo: {
    flex: 1,
  },
  featureTitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryFontColor,
  },
  featureDesc: {
    marginTop: 2,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.secondaryFontColor,
    lineHeight: 18,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.white,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
});
