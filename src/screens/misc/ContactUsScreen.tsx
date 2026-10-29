import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
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
import { AppConstants, Colors } from '../../constants';
import type { RootStackParamList } from '../../navigation/types';
import { fs, hs, showToast, TYPOGRAPHY, ws } from '../../utils';

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
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom + hs(20), hs(30)) }]}
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
              <MaterialIcons name="support-agent" size={fs(32)} color={Colors.white} />
            </View>
          </View>
        </ImageBackground>

        {/* Section Title & Subtitle */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Get in Touch</Text>
          <Text style={styles.sectionSubtitle}>We're here to help. Reach out to us anytime.</Text>
        </View>

        {/* Phone Support / Emergency Line */}
        <TouchableOpacity activeOpacity={0.85} style={styles.card} onPress={handlePhoneCall}>
          <View style={[styles.iconCircle, { backgroundColor: Colors.lightBlueTint }]}>
            <MaterialIcons name="phone" size={fs(22)} color={Colors.primaryColor} />
          </View>
          <View style={styles.info}>
            <Text style={styles.label}>EMERGENCY LINE / HELPLINE</Text>
            <Text style={styles.value}>{AppConstants.support.helplineFormattedPhone}</Text>
            <Text style={styles.subLabel}>Available 24/7 for urgent support</Text>
          </View>
          <View style={[styles.actionPill, { backgroundColor: Colors.lightBlueTint }]}>
            <Text style={[styles.actionPillText, { color: Colors.primaryColor }]}>Call Now</Text>
            <MaterialIcons name="chevron-right" size={fs(14)} color={Colors.primaryColor} />
          </View>
        </TouchableOpacity>

        {/* Support Email */}
        <TouchableOpacity activeOpacity={0.85} style={styles.card} onPress={handleSupportEmail}>
          <View style={[styles.iconCircle, { backgroundColor: Colors.blue_EEF2FF }]}>
            <MaterialIcons name="email" size={fs(22)} color={Colors.blue_6366F1} />
          </View>
          <View style={styles.info}>
            <Text style={styles.label}>SUPPORT EMAIL</Text>
            <Text style={styles.value}>{AppConstants.support.supportEmail}</Text>
            <Text style={styles.subLabel}>For general support and queries</Text>
          </View>
          <View style={[styles.actionPill, { backgroundColor: Colors.blue_EEF2FF }]}>
            <MaterialIcons name="mail-outline" size={fs(13)} color={Colors.blue_6366F1} style={{ marginRight: ws(3) }} />
            <Text style={[styles.actionPillText, { color: Colors.blue_6366F1 }]}>Write</Text>
            <MaterialIcons name="chevron-right" size={fs(14)} color={Colors.blue_6366F1} />
          </View>
        </TouchableOpacity>

        {/* Info Email */}
        <TouchableOpacity activeOpacity={0.85} style={styles.card} onPress={handleInfoEmail}>
          <View style={[styles.iconCircle, { backgroundColor: Colors.green_ECFDF5 }]}>
            <MaterialIcons name="mail-outline" size={fs(22)} color={Colors.green_10B981} />
          </View>
          <View style={styles.info}>
            <Text style={styles.label}>GENERAL INFO</Text>
            <Text style={styles.value}>{AppConstants.support.infoEmail}</Text>
            <Text style={styles.subLabel}>For information, feedback and more</Text>
          </View>
          <View style={[styles.actionPill, { backgroundColor: Colors.green_ECFDF5 }]}>
            <MaterialIcons name="mail-outline" size={fs(13)} color={Colors.green_10B981} style={{ marginRight: ws(3) }} />
            <Text style={[styles.actionPillText, { color: Colors.green_10B981 }]}>Write</Text>
            <MaterialIcons name="chevron-right" size={fs(14)} color={Colors.green_10B981} />
          </View>
        </TouchableOpacity>

        {/* Address / Visit Us On */}
        <TouchableOpacity activeOpacity={0.85} style={styles.card} onPress={handleOpenMap}>
          <View style={[styles.iconCircle, { backgroundColor: Colors.yellow_FEF3C7 }]}>
            <MaterialIcons name="location-on" size={fs(22)} color={Colors.yellow_F59E0B} />
          </View>
          <View style={styles.info}>
            <Text style={styles.label}>VISIT US ON</Text>
            <Text style={[styles.value, { fontSize: fs(13), lineHeight: fs(18) }]} numberOfLines={2}>
              {AppConstants.support.address}
            </Text>
          </View>
          <View style={[styles.actionPill, { backgroundColor: Colors.yellow_FEF3C7 }]}>
            <Text style={[styles.actionPillText, { color: Colors.yellow_D97706 }]}>Locate</Text>
            <MaterialIcons name="chevron-right" size={fs(14)} color={Colors.yellow_D97706} />
          </View>
        </TouchableOpacity>

        {/* Bottom Banner Card - Your well-being matters */}
        <View style={styles.wellbeingCard}>
          <View style={styles.wellbeingIconBox}>
            <MaterialIcons name="security" size={fs(24)} color={Colors.primaryColor} />
          </View>
          <View style={styles.wellbeingMeta}>
            <Text style={styles.wellbeingTitle}>Your well-being matters</Text>
            <Text style={styles.wellbeingSubtitle}>Our team is always ready to support you.</Text>
          </View>
          <MaterialIcons name="favorite-border" size={fs(22)} color={Colors.blue_60A5FA} />
        </View>
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
    backgroundColor: Colors.primaryColor,
    borderRadius: fs(20),
    padding: ws(20),
    marginBottom: hs(20),
    overflow: 'hidden',
    shadowColor: Colors.primaryColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  heroCardBg: {
    borderRadius: fs(20),
    opacity: 0.95,
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
    fontSize: fs(16),
    ...TYPOGRAPHY.bold,
    color: Colors.white,
    marginBottom: hs(4),
  },
  heroSubtitle: {
    fontSize: fs(12),
    ...TYPOGRAPHY.regular,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: fs(18),
  },
  heroIconCircle: {
    width: ws(52),
    height: hs(52),
    borderRadius: fs(26),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeader: {
    marginBottom: hs(14),
  },
  sectionTitle: {
    fontSize: fs(15),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
  },
  sectionSubtitle: {
    fontSize: fs(12),
    ...TYPOGRAPHY.regular,
    color: Colors.secondaryFontColor,
    marginTop: hs(2),
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: fs(16),
    padding: ws(14),
    marginBottom: hs(12),
    borderWidth: 1,
    borderColor: Colors.borderColor,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  iconCircle: {
    width: ws(44),
    height: hs(44),
    borderRadius: fs(14),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ws(12),
  },
  info: {
    flex: 1,
    paddingRight: ws(8),
  },
  label: {
    fontSize: fs(10),
    ...TYPOGRAPHY.medium,
    color: Colors.secondaryFontColor,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: fs(13.5),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
    marginTop: hs(2),
  },
  subLabel: {
    fontSize: fs(10.5),
    ...TYPOGRAPHY.regular,
    color: Colors.secondaryFontColor,
    marginTop: hs(2),
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lightBlueTint,
    paddingHorizontal: ws(10),
    paddingVertical: hs(6),
    borderRadius: fs(10),
    gap: ws(2),
  },
  actionPillText: {
    fontSize: fs(11),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryColor,
  },
  wellbeingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lightBlueTint,
    borderRadius: fs(16),
    padding: ws(16),
    marginTop: hs(12),
    borderWidth: 1,
    borderColor: Colors.lightBlueBorder,
  },
  wellbeingIconBox: {
    width: ws(40),
    height: hs(40),
    borderRadius: fs(20),
    backgroundColor: Colors.lightBlueBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ws(12),
  },
  wellbeingMeta: {
    flex: 1,
    paddingRight: ws(8),
  },
  wellbeingTitle: {
    fontSize: fs(13),
    ...TYPOGRAPHY.bold,
    color: Colors.blue_1E3A8A,
  },
  wellbeingSubtitle: {
    fontSize: fs(11),
    ...TYPOGRAPHY.regular,
    color: Colors.blue_3B82F6,
    marginTop: hs(2),
  },
  faqCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lightBlueTint,
    borderRadius: fs(16),
    padding: ws(14),
    marginTop: hs(6),
    borderWidth: 1,
    borderColor: Colors.lightBlueBorder,
  },
  faqIconCircle: {
    width: ws(44),
    height: hs(44),
    borderRadius: fs(14),
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ws(12),
  },
  faqTitle: {
    fontSize: fs(14),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
  },
  faqSubtitle: {
    fontSize: fs(11),
    ...TYPOGRAPHY.regular,
    color: Colors.secondaryFontColor,
    marginTop: hs(2),
  },
});
