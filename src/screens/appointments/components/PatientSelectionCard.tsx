import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../../constants';
import type { FamilyMemberModel, UserModel } from '../../../types';
import { fs, hs, ws } from '../../../utils/metrics';
import { TYPOGRAPHY } from '../../../utils/typography';

interface Props {
  currentUser: UserModel | null;
  selectedMember: FamilyMemberModel | null;
  onOpenFamilySheet: () => void;
}

export const PatientSelectionCard: React.FC<Props> = ({
  currentUser,
  selectedMember,
  onOpenFamilySheet,
}) => {
  const patientName = selectedMember
    ? `${selectedMember.name}`
    : `${currentUser?.f_name ?? ''} ${currentUser?.l_name ?? ''}`.trim() || 'Self';

  const patientRelation = selectedMember
    ? (selectedMember as any).relation || (selectedMember as any).relationship || 'Family Member'
    : 'Primary Account';

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Patient Information</Text>
        <TouchableOpacity activeOpacity={0.8} onPress={onOpenFamilySheet}>
          <Text style={styles.changeLink}>Change Patient</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.patientInfoBox}
        activeOpacity={0.8}
        onPress={onOpenFamilySheet}
      >
        <View style={styles.avatarCircle}>
          <MaterialIcons name="person" size={ws(22)} color={Colors.primaryColor} />
        </View>

        <View style={styles.detailsCol}>
          <Text style={styles.patientName}>{patientName}</Text>
          <Text style={styles.relationText}>{patientRelation}</Text>
        </View>

        <MaterialIcons name="chevron-right" size={ws(20)} color="#94A3B8" />
      </TouchableOpacity>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hs(12),
  },
  sectionTitle: {
    fontSize: fs(14),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
  },
  changeLink: {
    fontSize: fs(12),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryColor,
  },
  patientInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: ws(12),
    padding: ws(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: ws(12),
  },
  avatarCircle: {
    width: ws(40),
    height: ws(40),
    borderRadius: ws(20),
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsCol: {
    flex: 1,
  },
  patientName: {
    fontSize: fs(14),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
  },
  relationText: {
    fontSize: fs(11),
    ...TYPOGRAPHY.medium,
    color: Colors.secondaryFontColor,
    marginTop: hs(2),
  },
});
