import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../../constants';
import { fs, hs, ws } from '../../../utils/metrics';
import { TYPOGRAPHY } from '../../../utils/typography';

interface Props {
  patientDisplayName: string;
  hasSelectedMember: boolean;
  onPress: () => void;
}

export const PatientSelectionCard: React.FC<Props> = ({
  patientDisplayName,
  hasSelectedMember,
  onPress,
}) => {
  return (
    <TouchableOpacity
      style={styles.patientSelectorCard}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.patientIconCircle}>
        <MaterialIcons name="person" size={ws(20)} color={Colors.primaryColor} />
      </View>
      <Text style={styles.patientSelectorText} numberOfLines={1}>
        {hasSelectedMember ? patientDisplayName : 'Choose a patient'}
      </Text>
      <MaterialIcons name="chevron-right" size={ws(18)} color={Colors.slate_94A3B8} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  patientSelectorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: ws(12),
    borderRadius: ws(14),
    marginBottom: hs(14),
    borderWidth: 1,
    borderColor: Colors.border,
    gap: ws(10),
  },
  patientIconCircle: {
    width: ws(36),
    height: ws(36),
    borderRadius: ws(18),
    backgroundColor: Colors.aquaSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  patientSelectorText: {
    flex: 1,
    ...TYPOGRAPHY.semiBold,
    fontSize: fs(13),
    color: Colors.primaryFontColor,
  },
});
