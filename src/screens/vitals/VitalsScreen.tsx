import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { memo, useCallback } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader, GradientFill } from '../../components';
import { Colors } from '../../constants';
import { fs, hs, TYPOGRAPHY, ws } from '../../utils';
import type { VitalCategory } from './useVitals';
import { useVitals } from './useVitals';

const VitalCategoryCard = memo(({
  item,
  onPress,
}: {
  item: VitalCategory;
  onPress: (name: string) => void;
}) => (
  <TouchableOpacity
    activeOpacity={0.85}
    style={styles.vitalCard}
    onPress={() => onPress(item.name)}
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
));

export const VitalsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { navigation, vitalCategories, handleVitalPress } = useVitals();
  const handleBackPress = useCallback(() => navigation.goBack(), [navigation]);

  return (
    <View style={styles.container}>
      <AppHeader title="Health Vitals Tracker" onBackPress={handleBackPress} />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom + 20, 30) }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Health Banner (navy -> teal theme gradient) */}
        <View style={styles.heroCard}>
          <GradientFill id="vitalsHeroGrad" colors={Colors.headerGradient} />
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
        </View>

        {/* Section Title */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Select Parameter to Log</Text>
          <Text style={styles.sectionCount}>{vitalCategories.length} Vitals Available</Text>
        </View>

        {/* Vitals Grid / List */}
        {vitalCategories.map((item) => (
          <VitalCategoryCard
            key={item.name}
            item={item}
            onPress={handleVitalPress}
          />
        ))}
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
    paddingHorizontal: ws(20),
    paddingVertical: hs(22),
    marginBottom: hs(20),
    overflow: 'hidden',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: hs(4) },
    shadowOpacity: 0.15,
    shadowRadius: fs(10),
    elevation: 4,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 1,
  },
  heroTextCol: {
    flex: 1,
    paddingRight: ws(12),
  },
  heroTitle: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(17),
    color: Colors.white,
    marginBottom: hs(4),
  },
  heroSubtitle: {
    ...TYPOGRAPHY.regular,
    fontSize: fs(12),
    color: Colors.white,
    opacity: 0.9,
    lineHeight: fs(17),
  },
  heroIconCircle: {
    width: ws(56),
    height: ws(56),
    borderRadius: ws(28),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hs(14),
    paddingHorizontal: ws(4),
  },
  sectionTitle: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(15),
    color: Colors.primaryFontColor,
  },
  sectionCount: {
    ...TYPOGRAPHY.semiBold,
    fontSize: fs(12),
    color: Colors.primaryColor,
  },
  vitalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: fs(16),
    padding: ws(14),
    marginBottom: hs(12),
    borderWidth: 1,
    borderColor: Colors.borderColor,
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
    marginRight: ws(12),
  },
  vitalInfo: {
    flex: 1,
  },
  vitalTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hs(3),
  },
  vitalName: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(15),
    color: Colors.primaryFontColor,
  },
  unitPill: {
    paddingHorizontal: ws(8),
    paddingVertical: hs(2),
    borderRadius: fs(6),
  },
  unitText: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(10),
  },
  vitalSubtitle: {
    ...TYPOGRAPHY.regular,
    fontSize: fs(12),
    color: Colors.secondaryFontColor,
    marginBottom: hs(4),
  },
  idealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(4),
  },
  idealText: {
    ...TYPOGRAPHY.medium,
    fontSize: fs(11),
    color: Colors.slate_64748B,
  },
  arrowCircle: {
    width: ws(28),
    height: ws(28),
    borderRadius: ws(14),
    backgroundColor: Colors.aquaSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: ws(8),
  },
});
