import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { memo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../../constants';
import { fs, hs, TYPOGRAPHY, ws } from '../../../utils';

export interface ConsultationModeItem {
  id: string;
  label: string;
  fee: string;
  subtext: string;
  icon: string;
  isCommunity?: boolean;
}

interface DoctorConsultationModesProps {
  consultationModes: ConsultationModeItem[];
  selectedMode: string;
  onSelectMode: (id: string) => void;
}

export const DoctorConsultationModes = memo(({
  consultationModes,
  selectedMode,
  onSelectMode,
}: DoctorConsultationModesProps) => {
  return (
    <>
      <Text style={styles.sectionTitle}>Consultation Modes & Fees</Text>
      {consultationModes.length > 0 ? (
        <View style={styles.feeCardsRow}>
          {consultationModes.map((mode) => {
            const isSelected = selectedMode === mode.id;
            const isEmergency = mode.id === 'emergency';
            return (
              <TouchableOpacity
                key={`mode-${mode.id}`}
                style={[
                  styles.feeCard,
                  isSelected && styles.feeCardSelected,
                  isEmergency && styles.feeCardEmergency,
                  isEmergency && isSelected && styles.feeCardEmergencySelected,
                ]}
                onPress={() => onSelectMode(mode.id)}
                activeOpacity={0.8}
              >
                {isSelected ? (
                  <View
                    style={[
                      styles.selectedBadgeCorner,
                      isEmergency && { backgroundColor: Colors.redColor },
                    ]}
                  >
                    <MaterialIcons name="check" size={12} color={Colors.white} />
                  </View>
                ) : (
                  <View style={styles.unselectedRadioCorner} />
                )}

                <View
                  style={[
                    styles.feeIconCircle,
                    {
                      backgroundColor: isEmergency ? Colors.red_FEE2E2 : Colors.aquaSoft,
                    },
                  ]}
                >
                  {isEmergency ? (
                    <MaterialCommunityIcons
                      name="ambulance"
                      size={22}
                      color={Colors.redColor}
                    />
                  ) : mode.isCommunity ? (
                    <MaterialCommunityIcons
                      name={mode.icon as any}
                      size={20}
                      color={Colors.primaryColor}
                    />
                  ) : (
                    <MaterialIcons
                      name={mode.icon as any}
                      size={20}
                      color={Colors.primaryColor}
                    />
                  )}
                </View>

                <Text style={styles.feeLabel}>{mode.label}</Text>
                <Text style={styles.feeValue}>{mode.fee}</Text>
                <Text style={styles.feeModeSubtext}>{mode.subtext}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : (
        <View style={styles.emptyInfoCard}>
          <MaterialIcons name="event-busy" size={18} color={Colors.slate_64748B} />
          <Text style={styles.emptyInfoText}>
            Consultation modes and fees are currently unavailable for this doctor.
          </Text>
        </View>
      )}
    </>
  );
});

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: fs(14),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
    marginBottom: hs(10),
  },
  feeCardsRow: {
    flexDirection: 'row',
    gap: ws(10),
    marginBottom: hs(14),
  },
  feeCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: fs(14),
    padding: ws(12),
    borderWidth: 1.5,
    borderColor: Colors.borderColor,
    alignItems: 'center',
    position: 'relative',
  },
  feeCardSelected: {
    borderColor: Colors.primaryColor,
    backgroundColor: Colors.teal_CCFBF1,
  },
  feeCardEmergency: {
    borderColor: Colors.red_FFE8E8,
  },
  feeCardEmergencySelected: {
    borderColor: Colors.redColor,
    backgroundColor: Colors.red_FFF0F0,
  },
  selectedBadgeCorner: {
    position: 'absolute',
    top: hs(6),
    right: ws(6),
    width: ws(18),
    height: hs(18),
    borderRadius: fs(9),
    backgroundColor: Colors.primaryColor,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unselectedRadioCorner: {
    position: 'absolute',
    top: hs(6),
    right: ws(6),
    width: ws(16),
    height: hs(16),
    borderRadius: fs(8),
    borderWidth: 1.5,
    borderColor: Colors.gray_CBD5E1,
  },
  feeIconCircle: {
    width: ws(40),
    height: hs(40),
    borderRadius: fs(20),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hs(8),
    marginTop: hs(4),
  },
  feeLabel: {
    fontSize: fs(12),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
    textAlign: 'center',
    marginBottom: hs(2),
  },
  feeValue: {
    fontSize: fs(14),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryColor,
    textAlign: 'center',
    marginBottom: hs(2),
  },
  feeModeSubtext: {
    fontSize: fs(10),
    ...TYPOGRAPHY.medium,
    color: Colors.secondaryFontColor,
    textAlign: 'center',
  },
  emptyInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(8),
    backgroundColor: Colors.slate_F8FAFC,
    borderRadius: fs(12),
    padding: ws(14),
    marginBottom: hs(14),
    borderWidth: 1,
    borderColor: Colors.slate_E2E8F0,
  },
  emptyInfoText: {
    flex: 1,
    fontSize: fs(12),
    ...TYPOGRAPHY.medium,
    color: Colors.slate_64748B,
  },
});
