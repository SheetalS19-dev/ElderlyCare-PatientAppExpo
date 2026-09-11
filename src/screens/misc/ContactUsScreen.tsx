import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import {
  ImageBackground,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader } from '../../components';
import { AppConstants, Colors, Typography } from '../../constants';
import type { RootStackParamList } from '../../navigation/types';
import { showToast } from '../../utils';

type Props = NativeStackScreenProps<RootStackParamList, 'ContactUs'>;

export const ContactUsScreen = ({ navigation }: Props) => {
  const insets = useSafeAreaInsets();

  const handlePhoneCall = () => {
    Linking.openURL(`tel:${AppConstants.support.helplineRawPhone}`).catch(() => showToast('Could not place call'));
  };

  const handleWhatsApp = () => {
    Linking.openURL(`https://wa.me/${AppConstants.support.helplineRawPhone}?text=Hello%20Support`).catch(() =>
      showToast('Could not open WhatsApp')
    );
  };

  const handleSupportEmail = () => {
    Linking.openURL(`mailto:${AppConstants.support.supportEmail}`).catch(() =>
      showToast('Could not open email client')
    );
  };

  const handleInfoEmail = () => {
    Linking.openURL(`mailto:${AppConstants.support.infoEmail}`).catch(() =>
      showToast('Could not open email client')
    );
  };

  const handleOpenMap = () => {
    const mapUrl = Platform.select({
      ios: `maps:0,0?q=${encodeURIComponent(AppConstants.support.address)}`,
      android: `geo:0,0?q=${encodeURIComponent(AppConstants.support.address)}`,
      default: `https://maps.google.com/?q=${encodeURIComponent(AppConstants.support.address)}`,
    });
    Linking.openURL(mapUrl).catch(() =>
      Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(AppConstants.support.address)}`).catch(() =>
        showToast('Could not open map')
      )
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Help & Support" onBackPress={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom + 20, 30) }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Support Banner with container_bg */}
        <ImageBackground
          source={require('../../../assets/icons/container_bg.png')}
          style={styles.heroCard}
          imageStyle={styles.heroCardBg}
          resizeMode="cover"
        >
          <View style={styles.heroRow}>
            <View style={styles.heroTextCol}>
              <Text style={styles.heroTitle}>{AppConstants.appName} Support</Text>
              <Text style={styles.heroSubtitle}>
                Our dedicated care team is here 24/7 to assist with your appointments and support queries.
              </Text>
            </View>
            <View style={styles.heroIconCircle}>
              <MaterialIcons name="support-agent" size={32} color={Colors.white} />
            </View>
          </View>
        </ImageBackground>

        {/* Section Title */}
        <Text style={styles.sectionTitle}>Get in Touch</Text>

        {/* Phone Support / Emergency Line */}
        <TouchableOpacity activeOpacity={0.85} style={styles.card} onPress={handlePhoneCall}>
          <View style={[styles.iconCircle, { backgroundColor: '#EFF6FF' }]}>
            <MaterialIcons name="phone" size={22} color="#2563EB" />
          </View>
          <View style={styles.info}>
            <Text style={styles.label}>Emergency Line / Helpline</Text>
            <Text style={styles.value}>{AppConstants.support.helplineFormattedPhone}</Text>
          </View>
          <View style={styles.actionPill}>
            <Text style={styles.actionPillText}>Call Now</Text>
          </View>
        </TouchableOpacity>

        {/* Support Email */}
        <TouchableOpacity activeOpacity={0.85} style={styles.card} onPress={handleSupportEmail}>
          <View style={[styles.iconCircle, { backgroundColor: '#EFF6FF' }]}>
            <MaterialIcons name="email" size={22} color={Colors.primaryColor} />
          </View>
          <View style={styles.info}>
            <Text style={styles.label}>Support Email</Text>
            <Text style={styles.value}>{AppConstants.support.supportEmail}</Text>
          </View>
          <View style={styles.actionPill}>
            <Text style={styles.actionPillText}>Write</Text>
          </View>
        </TouchableOpacity>

        {/* Info Email */}
        <TouchableOpacity activeOpacity={0.85} style={styles.card} onPress={handleInfoEmail}>
          <View style={[styles.iconCircle, { backgroundColor: '#F0FDF4' }]}>
            <MaterialIcons name="mail-outline" size={22} color="#16A34A" />
          </View>
          <View style={styles.info}>
            <Text style={styles.label}>General Info</Text>
            <Text style={styles.value}>{AppConstants.support.infoEmail}</Text>
          </View>
          <View style={[styles.actionPill, { backgroundColor: '#F0FDF4' }]}>
            <Text style={[styles.actionPillText, { color: '#16A34A' }]}>Write</Text>
          </View>
        </TouchableOpacity>

        {/* Address / Visit Us On */}
        <TouchableOpacity activeOpacity={0.85} style={styles.card} onPress={handleOpenMap}>
          <View style={[styles.iconCircle, { backgroundColor: '#FEF3C7' }]}>
            <MaterialIcons name="location-on" size={22} color="#D97706" />
          </View>
          <View style={styles.info}>
            <Text style={styles.label}>Visit Us On</Text>
            <Text style={[styles.value, { fontSize: 13, lineHeight: 18 }]} numberOfLines={2}>
              {AppConstants.support.address}
            </Text>
          </View>
          <View style={[styles.actionPill, { backgroundColor: '#FEF3C7' }]}>
            <Text style={[styles.actionPillText, { color: '#D97706' }]}>Locate</Text>
          </View>
        </TouchableOpacity>
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
    backgroundColor: Colors.primaryColor,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: Colors.primaryColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  heroCardBg: {
    borderRadius: 20,
    opacity: 0.95,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroTextCol: {
    flex: 1,
    paddingRight: 12,
  },
  heroTitle: {
    fontSize: 16,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.regular,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 18,
  },
  heroIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryFontColor,
    marginBottom: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  label: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.secondaryFontColor,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryFontColor,
    marginTop: 2,
  },
  actionPill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionPillText: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryColor,
  },
  faqCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 14,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  faqIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  faqTitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryFontColor,
  },
  faqSubtitle: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.secondaryFontColor,
    marginTop: 2,
  },
});
