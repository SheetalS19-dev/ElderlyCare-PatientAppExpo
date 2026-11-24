import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback } from 'react';
import { Colors } from '../../constants';
import type { RootStackParamList } from '../../navigation/types';

export interface VitalCategory {
  name: string;
  subtitle: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  color: string;
  bgColor: string;
  unit: string;
  idealRange: string;
}

export const VITAL_CATEGORIES: VitalCategory[] = [
  {
    name: 'Blood Pressure',
    subtitle: 'Systolic & Diastolic',
    icon: 'favorite',
    color: Colors.redColor,
    bgColor: Colors.red_FEE2E2,
    unit: 'mmHg',
    idealRange: '120/80 mmHg',
  },
  {
    name: 'Sugar',
    subtitle: 'Fasting & Random Glucose',
    icon: 'opacity',
    color: Colors.purple_8B5CF6,
    bgColor: Colors.purple_EDE9FE,
    unit: 'mg/dL',
    idealRange: '70 - 140 mg/dL',
  },
  {
    name: 'Weight',
    subtitle: 'Body Mass Tracking',
    icon: 'fitness-center',
    color: Colors.green_10B981,
    bgColor: Colors.green_ECFDF5,
    unit: 'kg',
    idealRange: 'Healthy BMI',
  },
  {
    name: 'Temperature',
    subtitle: 'Body Temperature',
    icon: 'thermostat',
    color: Colors.amber_D97706,
    bgColor: Colors.amber_FEF3C7,
    unit: '°C',
    idealRange: '36.1 - 37.2 °C',
  },
  {
    name: 'SpO2',
    subtitle: 'Blood Oxygen Saturation',
    icon: 'air',
    color: Colors.sky_0284C7,
    bgColor: Colors.sky_E0F2FE,
    unit: '%',
    idealRange: '95 - 100 %',
  },
];

export const useVitals = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleVitalPress = useCallback((vitalName: string) => {
    navigation.navigate('VitalDetails', { vitalName });
  }, [navigation]);

  return {
    navigation,
    vitalCategories: VITAL_CATEGORIES,
    handleVitalPress,
  };
};
