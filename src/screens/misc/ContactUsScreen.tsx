import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { AppHeader, GradientFill } from '../../components';
import { AppConstants, Colors } from '../../constants';
import { fs, hs, TYPOGRAPHY, ws } from '../../utils';
import { useContactUs } from './useContactUs';

export const ContactUsScreen: React.FC = () => {
  const {
    navigation,
    insets,
    handlePhoneCall,
    handleWhatsApp,
    handleSupportEmail,
    handleInfoEmail,
    handleOpenMap,
  } = useContactUs();

  return (
    <View style={styles.container}>
      <AppHeader title="Help & Support" onBackPress={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: hs(80) + Math.max(insets.bottom, hs(24)) }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Support Banner (navy -> teal theme gradient) */}
        <View style={styles.heroCard}>
          <GradientFill id="contactHeroGrad" colors={Colors.headerGradient} />
          <View style={styles.heroRow}>
            <View style={styles.heroTextCol}>
              <Text style={styles.heroTitle}>{AppConstants.appName} Support</Text>
              <Text style={styles.heroSubtitle}>
                Our dedicated care team is here 24/7 to assist with your appointments and support queries.
              </Text>
            </View>
            <View style={styles.heroIconCircle}>
              <MaterialIcons name="support-agent" size={fs(32)} color={Colors.white} />
            </View>
          </View>
        </View>

        {/* Section Title & Subtitle */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Get in Touch</Text>
          <Text style={styles.sectionSubtitle}>We're here to help. Reach out to us anytime.</Text>
        </View>

        {/* Phone Support / Emergency Line */}
        <TouchableOpacity activeOpacity={0.85} style={styles.card} onPress={handlePhoneCall}>
          <View style={[styles.iconCircle, { backgroundColor: Colors.aquaSoft }]}>
            <Ionicons name="call" size={fs(20)} color={Colors.primaryColor} />
          </View>
          <View style={styles.info}>
            <Text style={styles.label}>EMERGENCY LINE / HELPLINE</Text>
            <Text style={styles.value}>{AppConstants.support.helplineFormattedPhone}</Text>
            <Text style={styles.subLabel}>Available 24/7 for urgent support</Text>
          </View>
          <View style={[styles.actionPill, { backgroundColor: Colors.aquaSoft }]}>
            <Text style={[styles.actionPillText, { color: Colors.primaryColor }]}>Call Now</Text>
            <MaterialIcons name="chevron-right" size={fs(14)} color={Colors.primaryColor} />
          </View>
        </TouchableOpacity>

        {/* WhatsApp Support */}
        <TouchableOpacity activeOpacity={0.85} style={styles.card} onPress={handleWhatsApp}>
          <View style={[styles.iconCircle, { backgroundColor: Colors.green_ECFDF5 }]}>
            <Ionicons name="logo-whatsapp" size={fs(20)} color={Colors.green_10B981} />
          </View>
          <View style={styles.info}>
            <Text style={styles.label}>WHATSAPP CARE CHAT</Text>
            <Text style={styles.value}>{AppConstants.support.helplineFormattedPhone}</Text>
            <Text style={styles.subLabel}>Chat directly with our support desk</Text>
          </View>
          <View style={[styles.actionPill, { backgroundColor: Colors.green_ECFDF5 }]}>
            <Text style={[styles.actionPillText, { color: Colors.green_10B981 }]}>Chat</Text>
            <MaterialIcons name="chevron-right" size={fs(14)} color={Colors.green_10B981} />
          </View>
        </TouchableOpacity>

        {/* Support Email */}
        <TouchableOpacity activeOpacity={0.85} style={styles.card} onPress={handleSupportEmail}>
          <View style={[styles.iconCircle, { backgroundColor: Colors.aquaSoft }]}>
            <Ionicons name="mail" size={fs(20)} color={Colors.primaryColor} />
          </View>
          <View style={styles.info}>
            <Text style={styles.label}>PATIENT SUPPORT EMAIL</Text>
            <Text style={styles.value}>{AppConstants.support.supportEmail}</Text>
            <Text style={styles.subLabel}>For technical & billing assistance</Text>
          </View>
          <View style={[styles.actionPill, { backgroundColor: Colors.aquaSoft }]}>
            <Text style={[styles.actionPillText, { color: Colors.primaryColor }]}>Email</Text>
            <MaterialIcons name="chevron-right" size={fs(14)} color={Colors.primaryColor} />
          </View>
        </TouchableOpacity>

        {/* General Info Email */}
        <TouchableOpacity activeOpacity={0.85} style={styles.card} onPress={handleInfoEmail}>
          <View style={[styles.iconCircle, { backgroundColor: Colors.aquaSoft }]}>
            <Ionicons name="mail" size={fs(20)} color={Colors.primaryColor} />
          </View>
          <View style={styles.info}>
            <Text style={styles.label}>GENERAL INQUIRIES</Text>
            <Text style={styles.value}>{AppConstants.support.infoEmail}</Text>
            <Text style={styles.subLabel}>Partnerships, clinic network & general info</Text>
          </View>
          <View style={[styles.actionPill, { backgroundColor: Colors.aquaSoft }]}>
            <Text style={[styles.actionPillText, { color: Colors.primaryColor }]}>Inquire</Text>
            <MaterialIcons name="chevron-right" size={fs(14)} color={Colors.primaryColor} />
          </View>
        </TouchableOpacity>

        {/* Office Address Card */}
        <TouchableOpacity activeOpacity={0.85} style={styles.card} onPress={handleOpenMap}>
          <View style={[styles.iconCircle, { backgroundColor: Colors.purple_F3E8FF }]}>
            <Ionicons name="navigate" size={fs(20)} color={Colors.purple_9333EA} />
          </View>
          <View style={styles.info}>
            <Text style={styles.label}>HEADQUARTERS</Text>
            <Text style={styles.addressValue} numberOfLines={3}>
              {AppConstants.support.address}
            </Text>
            <Text style={styles.subLabel}>Tap to view on Google Maps</Text>
          </View>
          <View style={[styles.actionPill, { backgroundColor: Colors.purple_F3E8FF }]}>
            <Text style={[styles.actionPillText, { color: Colors.purple_9333EA }]}>Directions</Text>
            <MaterialIcons name="chevron-right" size={fs(14)} color={Colors.purple_9333EA} />
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
    padding: ws(16),
  },
  heroCard: {
    borderRadius: fs(18),
    overflow: 'hidden',
    padding: ws(20),
    marginBottom: hs(16),
    position: 'relative',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroTextCol: {
    flex: 1,
    paddingRight: ws(12),
  },
  heroTitle: {
    fontSize: fs(20),
    ...TYPOGRAPHY.bold,
    color: Colors.white,
    marginBottom: hs(4),
  },
  heroSubtitle: {
    fontSize: fs(12),
    ...TYPOGRAPHY.regular,
    color: Colors.blue_D6E8F6,
    lineHeight: fs(18),
  },
  heroIconCircle: {
    width: ws(56),
    height: ws(56),
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeader: {
    marginBottom: hs(12),
    marginTop: hs(4),
  },
  sectionTitle: {
    fontSize: fs(16),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
    marginBottom: hs(2),
  },
  sectionSubtitle: {
    fontSize: fs(12),
    ...TYPOGRAPHY.regular,
    color: Colors.secondaryFontColor,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: fs(16),
    padding: ws(14),
    marginBottom: hs(12),
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  iconCircle: {
    width: ws(44),
    height: ws(44),
    aspectRatio: 1,
    borderRadius: 999,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ws(12),
  },
  info: {
    flex: 1,
    marginRight: ws(8),
  },
  label: {
    fontSize: fs(9),
    ...TYPOGRAPHY.bold,
    color: Colors.secondaryFontColor,
    letterSpacing: 0.6,
    marginBottom: hs(2),
  },
  value: {
    fontSize: fs(13),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
    marginBottom: hs(2),
  },
  addressValue: {
    fontSize: fs(12),
    ...TYPOGRAPHY.medium,
    color: Colors.primaryFontColor,
    lineHeight: fs(16),
    marginBottom: hs(2),
  },
  subLabel: {
    fontSize: fs(10),
    ...TYPOGRAPHY.regular,
    color: Colors.slate_94A3B8,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ws(10),
    paddingVertical: hs(6),
    borderRadius: fs(12),
    gap: ws(2),
  },
  actionPillText: {
    fontSize: fs(11),
    ...TYPOGRAPHY.bold,
  },
  faqBanner: {
    backgroundColor: Colors.aquaSoft,
    borderRadius: fs(16),
    padding: ws(16),
    marginTop: hs(6),
    borderWidth: 1,
    borderColor: Colors.aqua,
  },
  faqBannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hs(12),
  },
  faqIconCircle: {
    width: ws(40),
    height: ws(40),
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ws(12),
  },
  faqTextCol: {
    flex: 1,
  },
  faqTitle: {
    fontSize: fs(13),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryColor,
    marginBottom: hs(2),
  },
  faqDesc: {
    fontSize: fs(11),
    ...TYPOGRAPHY.regular,
    color: Colors.secondaryFontColor,
    lineHeight: fs(16),
  },
  faqBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryColor,
    paddingVertical: hs(10),
    borderRadius: fs(10),
    gap: ws(6),
  },
  faqBtnText: {
    color: Colors.white,
    fontSize: fs(12),
    ...TYPOGRAPHY.bold,
  },
});
