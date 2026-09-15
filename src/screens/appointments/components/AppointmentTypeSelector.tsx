import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../../constants';
import { fs, hs, ws } from '../../../utils/metrics';
import { TYPOGRAPHY } from '../../../utils/typography';

export interface AppointmentTypeOption {
  code: '1' | '2' | '3';
  name: 'OPD' | 'Video Consultant' | 'Emergency';
  label: string;
  enabled: boolean;
  fee?: number | string;
}

interface Props {
  options: AppointmentTypeOption[];
  selectedType: AppointmentTypeOption | null;
  onSelect: (option: AppointmentTypeOption) => void;
}

export const AppointmentTypeSelector: React.FC<Props> = ({
  options,
  selectedType,
  onSelect,
}) => {
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitle}>Select Consultation Type</Text>
      <View style={styles.optionsRow}>
        {options.map((option) => {
          const isSelected = selectedType?.code === option.code;
          const feeNum = Number(option.fee) || 0;

          return (
            <TouchableOpacity
              key={option.code}
              style={[styles.typePill, isSelected && styles.typePillActive]}
              activeOpacity={0.8}
              onPress={() => onSelect(option)}
            >
              <MaterialIcons
                name={
                  option.code === '1'
                    ? 'local-hospital'
                    : option.code === '2'
                    ? 'videocam'
                    : 'medical-services'
                }
                size={ws(18)}
                color={isSelected ? Colors.white : Colors.primaryColor}
              />
              <Text style={[styles.typePillText, isSelected && styles.typePillTextActive]}>
                {option.label}
              </Text>
              <Text style={[styles.feeText, isSelected && styles.feeTextActive]}>
                ₹{feeNum}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: ws(16),
    padding: ws(16),
    marginBottom: hs(14),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: hs(2) },
    shadowOpacity: 0.03,
    shadowRadius: ws(4),
    elevation: 1,
  },
  sectionTitle: {
    fontSize: fs(14),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
    marginBottom: hs(12),
  },
  optionsRow: {
    flexDirection: 'row',
    gap: ws(8),
  },
  typePill: {
    flex: 1,
    paddingVertical: hs(10),
    paddingHorizontal: ws(8),
    borderRadius: ws(12),
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    gap: hs(4),
  },
  typePillActive: {
    backgroundColor: Colors.primaryColor,
    borderColor: Colors.primaryColor,
  },
  typePillText: {
    fontSize: fs(11),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
    textAlign: 'center',
  },
  typePillTextActive: {
    color: Colors.white,
  },
  feeText: {
    fontSize: fs(11),
    ...TYPOGRAPHY.medium,
    color: Colors.secondaryFontColor,
  },
  feeTextActive: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
});
