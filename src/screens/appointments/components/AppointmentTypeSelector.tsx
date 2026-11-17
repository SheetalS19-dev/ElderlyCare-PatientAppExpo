import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppConstants, Colors } from '../../../constants';
import { fs, hs, ws } from '../../../utils/metrics';
import { TYPOGRAPHY } from '../../../utils/typography';

export interface AppointmentTypeOption {
  code: '1' | '2' | '3';
  name: 'OPD' | 'Video Consultant' | 'Emergency';
  label: string;
  subtext: string;
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
  if (options.length === 0) {
    return (
      <View style={styles.emptyCard}>
        <MaterialIcons name="event-busy" size={ws(18)} color={Colors.secondaryFontColor} />
        <Text style={styles.emptyText}>
          No consultation modes are currently active for this doctor.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.feeCardsRow}>
      {options.map((opt) => {
        const isSelected = selectedType?.code === opt.code;
        const isEmergency = opt.code === '3';

        return (
          <TouchableOpacity
            key={opt.code}
            style={[
              styles.feeCard,
              isSelected && styles.feeCardSelected,
              isEmergency && styles.feeCardEmergency,
              isEmergency && isSelected && styles.feeCardEmergencySelected,
            ]}
            onPress={() => onSelect(opt)}
            activeOpacity={0.8}
          >
            {isSelected ? (
              <View
                style={[
                  styles.selectedBadgeCorner,
                  isEmergency && { backgroundColor: Colors.redColor },
                ]}
              >
                <MaterialIcons name="check" size={ws(12)} color={Colors.white} />
              </View>
            ) : (
              <View style={styles.unselectedRadioCorner} />
            )}

            <View
              style={[
                styles.feeIconCircle,
                { backgroundColor: isEmergency ? Colors.red_FEE2E2 : Colors.aquaSoft },
              ]}
            >
              {opt.code === '1' ? (
                <MaterialCommunityIcons name="hospital-building" size={ws(20)} color={Colors.primaryColor} />
              ) : opt.code === '2' ? (
                <MaterialIcons name="videocam" size={ws(20)} color={Colors.primaryColor} />
              ) : (
                <MaterialCommunityIcons name="ambulance" size={ws(22)} color={Colors.redColor} />
              )}
            </View>
            <Text style={styles.feeLabel}>{opt.label}</Text>
            <Text style={styles.feeValue}>
              {AppConstants.appCurrency}{Number(opt.fee || 0).toFixed(2)}
            </Text>
            <Text style={styles.feeModeSubtext}>{opt.subtext}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  feeCardsRow: {
    flexDirection: 'row',
    gap: ws(10),
    marginBottom: hs(14),
  },
  feeCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: ws(14),
    padding: ws(10),
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    position: 'relative',
  },
  feeCardSelected: {
    borderColor: Colors.primaryColor,
    backgroundColor: Colors.aquaSoft,
  },
  feeCardEmergency: {
    borderColor: Colors.red_FECACA,
  },
  feeCardEmergencySelected: {
    borderColor: Colors.redColor,
    backgroundColor: Colors.red_FFF5F5,
  },
  selectedBadgeCorner: {
    position: 'absolute',
    top: ws(6),
    right: ws(6),
    width: ws(18),
    height: ws(18),
    borderRadius: ws(9),
    backgroundColor: Colors.primaryColor,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unselectedRadioCorner: {
    position: 'absolute',
    top: ws(6),
    right: ws(6),
    width: ws(16),
    height: ws(16),
    borderRadius: ws(8),
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  feeIconCircle: {
    width: ws(40),
    height: ws(40),
    borderRadius: ws(20),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hs(6),
    marginTop: hs(6),
  },
  feeLabel: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(12),
    color: Colors.primaryFontColor,
    textAlign: 'center',
  },
  feeValue: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(13),
    color: Colors.primaryColor,
    marginTop: hs(2),
  },
  feeModeSubtext: {
    ...TYPOGRAPHY.regular,
    fontSize: fs(9.5),
    color: Colors.secondaryFontColor,
    marginTop: hs(2),
    textAlign: 'center',
  },
  emptyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.slate_F8FAFC,
    padding: ws(12),
    borderRadius: ws(12),
    marginBottom: hs(14),
    gap: ws(8),
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyText: {
    ...TYPOGRAPHY.regular,
    fontSize: fs(12),
    color: Colors.secondaryFontColor,
    flex: 1,
  },
});
