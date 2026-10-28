import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import {
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader } from '../../components';
import { Colors, Typography } from '../../constants';
import type { RootStackParamList } from '../../navigation/types';
import { ws, hs, fs, TYPOGRAPHY } from '../../utils';

type Props = NativeStackScreenProps<RootStackParamList, 'Vitals'>;

interface VitalCategory {
  name: string;
  subtitle: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  color: string;
  bgColor: string;
  unit: string;
  idealRange: string;
}

const VITAL_CATEGORIES: VitalCategory[] = [
  {
    name: 'Blood Pressure',
    subtitle: 'Systolic & Diastolic',
    icon: 'favorite',
    color: '#F97316',
    bgColor: '#FFEDD5',
    unit: 'mmHg',
    idealRange: '120/80 mmHg',
  },
  {
    name: 'Sugar',
    subtitle: 'Fasting & Random Glucose',
    icon: 'opacity',
    color: '#0284C7',
    bgColor: '#E0F2FE',
    unit: 'mg/dL',
    idealRange: '70 - 140 mg/dL',
  },
  {
    name: 'Weight',
    subtitle: 'Body Mass Tracking',
    icon: 'fitness-center',
    color: '#8B5CF6',
    bgColor: '#EDE9FE',
    unit: 'kg',
    idealRange: 'Healthy BMI',
  },
  {
    name: 'Temperature',
    subtitle: 'Body Temperature',
    icon: 'thermostat',
    color: '#EAB308',
    bgColor: '#FEF9C3',
    unit: '°F',
    idealRange: '97.8 - 99.1 °F',
  },
  {
    name: 'SpO2',
    subtitle: 'Blood Oxygen Saturation',
    icon: 'air',
    color: '#10B981',
    bgColor: '#D1FAE5',
    unit: '%',
    idealRange: '95 - 100 %',
  },
];

export const VitalsScreen = ({ navigation }: Props) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <AppHeader title="Health Vitals Tracker" onBackPress={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom + 20, 30) }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Health Banner with container_bg */}
        <ImageBackground
          source={require('../../../assets/icons/container_bg.png')}
          style={styles.heroCard}
          imageStyle={styles.heroCardBg}
          resizeMode="cover"
        >
          <View style={styles.heroRow}>
            <View style={styles.heroTextCol}>
              <Text style={styles.heroTitle}>Daily Health Monitoring</Text>
              <Text style={styles.heroSubtitle}>
                Keep track of vital health parameters for you and your senior family members in real-time.
              </Text>
            </View>
            <View style={styles.heroIconCircle}>
              <MaterialIcons name="health-and-safety" size={32} color={Colors.white} />
            </View>
          </View>
        </ImageBackground>

        {/* Section Title */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Select Parameter to Log</Text>
          <Text style={styles.sectionCount}>5 Vitals Available</Text>
        </View>

        {/* Vitals Grid / List */}
        {VITAL_CATEGORIES.map((item) => (
          <TouchableOpacity
            key={item.name}
            activeOpacity={0.85}
            style={styles.vitalCard}
            onPress={() => navigation.navigate('VitalDetails', { vitalName: item.name })}
          >
            <View style={[styles.iconBox, { backgroundColor: item.bgColor }]}>
              <MaterialIcons name={item.icon} size={28} color={item.color} />
            </View>

            <View style={styles.vitalInfo}>
              <View style={styles.vitalTopRow}>
                <Text style={styles.vitalName}>{item.name}</Text>
                <View style={[styles.unitPill, { backgroundColor: item.bgColor }]}>
                  <Text style={[styles.unitText, { color: item.color }]}>{item.unit}</Text>
                </View>
              </View>

              <Text style={styles.vitalSubtitle}>{item.subtitle}</Text>

              <View style={styles.idealRow}>
                <MaterialIcons name="info-outline" size={12} color={Colors.secondaryFontColor} />
                <Text style={styles.idealText}>Normal Range: {item.idealRange}</Text>
              </View>
            </View>

            <View style={styles.arrowCircle}>
              <MaterialIcons name="chevron-right" size={20} color={Colors.primaryColor} />
            </View>
          </TouchableOpacity>
        ))}

        {/* Health Advisory Card */}
        <View style={styles.advisoryCard}>
          <View style={styles.advisoryHeader}>
            <MaterialIcons name="tips-and-updates" size={20} color={Colors.primaryColor} />
            <Text style={styles.advisoryTitle}>Health Advisory</Text>
          </View>
          <Text style={styles.advisoryBody}>
            Regular vital logging helps your consulting doctor spot trends early and personalize your treatment plan.
          </Text>
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
    shadowOffset: { width: 0, height: hs(4) },
    shadowOpacity: 0.2,
    shadowRadius: fs(8),
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
    lineHeight: hs(18),
  },
  heroIconCircle: {
    width: ws(52),
    height: ws(52),
    aspectRatio: 1,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hs(12),
  },
  sectionTitle: {
    fontSize: fs(Typography.fontSize.sm),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
  },
  sectionCount: {
    fontSize: fs(11),
    ...TYPOGRAPHY.medium,
    color: Colors.secondaryFontColor,
  },
  vitalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: fs(18),
    padding: ws(14),
    marginBottom: hs(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: hs(2) },
    shadowOpacity: 0.04,
    shadowRadius: fs(6),
    elevation: 2,
  },
  iconBox: {
    width: ws(52),
    height: ws(52),
    borderRadius: fs(14),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ws(14),
  },
  vitalInfo: {
    flex: 1,
  },
  vitalTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hs(2),
  },
  vitalName: {
    fontSize: fs(Typography.fontSize.base),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
  },
  unitPill: {
    paddingHorizontal: ws(8),
    paddingVertical: hs(2),
    borderRadius: fs(6),
  },
  unitText: {
    fontSize: fs(10),
    ...TYPOGRAPHY.bold,
  },
  vitalSubtitle: {
    fontSize: fs(11),
    ...TYPOGRAPHY.regular,
    color: Colors.secondaryFontColor,
    marginBottom: hs(4),
  },
  idealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(4),
  },
  idealText: {
    fontSize: fs(10),
    ...TYPOGRAPHY.medium,
    color: Colors.secondaryFontColor,
  },
  arrowCircle: {
    width: ws(32),
    height: ws(32),
    aspectRatio: 1,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: ws(10),
  },
  advisoryCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: fs(16),
    padding: ws(16),
    marginTop: hs(8),
    borderLeftWidth: 4,
    borderLeftColor: Colors.primaryColor,
  },
  advisoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(6),
    marginBottom: hs(4),
  },
  advisoryTitle: {
    fontSize: fs(12),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
  },
  advisoryBody: {
    fontSize: fs(11),
    ...TYPOGRAPHY.regular,
    color: Colors.secondaryFontColor,
    lineHeight: hs(17),
  },
});
