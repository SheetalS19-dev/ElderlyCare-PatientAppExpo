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
    color: '#EF4444',
    bgColor: '#FEE2E2',
    unit: 'mmHg',
    idealRange: '120/80 mmHg',
  },
  {
    name: 'Sugar',
    subtitle: 'Fasting & Random Glucose',
    icon: 'opacity',
    color: '#8B5CF6',
    bgColor: '#EDE9FE',
    unit: 'mg/dL',
    idealRange: '70 - 140 mg/dL',
  },
  {
    name: 'SpO2',
    subtitle: 'Blood Oxygen Saturation',
    icon: 'air',
    color: '#0284C7',
    bgColor: '#E0F2FE',
    unit: '%',
    idealRange: '95 - 100 %',
  },
  {
    name: 'Temperature',
    subtitle: 'Body Temperature',
    icon: 'thermostat',
    color: '#F59E0B',
    bgColor: '#FEF3C7',
    unit: '°F',
    idealRange: '97.8 - 99.1 °F',
  },
  {
    name: 'Weight',
    subtitle: 'Body Mass Tracking',
    icon: 'fitness-center',
    color: '#10B981',
    bgColor: '#D1FAE5',
    unit: 'kg',
    idealRange: 'Healthy BMI',
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryFontColor,
  },
  sectionCount: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.secondaryFontColor,
  },
  vitalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 18,
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
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  vitalInfo: {
    flex: 1,
  },
  vitalTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  vitalName: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryFontColor,
  },
  unitPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  unitText: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.bold,
  },
  vitalSubtitle: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.secondaryFontColor,
    marginBottom: 4,
  },
  idealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  idealText: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.secondaryFontColor,
  },
  arrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF5EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  advisoryCard: {
    backgroundColor: '#FFF5EB',
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primaryColor,
  },
  advisoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  advisoryTitle: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryFontColor,
  },
  advisoryBody: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.secondaryFontColor,
    lineHeight: 17,
  },
});
