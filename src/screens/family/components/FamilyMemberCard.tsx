import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../../constants';
import type { FamilyMemberModel } from '../../../types';
import { fs, hs, ws } from '../../../utils/metrics';
import { TYPOGRAPHY } from '../../../utils/typography';

interface Props {
  member: FamilyMemberModel;
  onEdit?: (member: FamilyMemberModel) => void;
  onDelete?: (member: FamilyMemberModel) => void;
}

export const FamilyMemberCard: React.FC<Props> = ({
  member,
  onEdit,
  onDelete,
}) => {
  const isSelf = (member as any).is_self || (member.relationship || '').toLowerCase() === 'self';
  const fullName = `${member.f_name ?? ''} ${member.l_name ?? ''}`.trim() || 'Family Member';
  const relationLabel = isSelf ? 'Primary Account (Self)' : member.relationship || 'Family Member';

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.avatarCircle}>
          <MaterialIcons name="person" size={ws(24)} color={Colors.primaryColor} />
        </View>

        <View style={styles.infoCol}>
          <View style={styles.nameRelationRow}>
            <Text style={styles.memberName}>{fullName}</Text>
            {isSelf && (
              <View style={styles.selfBadge}>
                <Text style={styles.selfBadgeText}>Self</Text>
              </View>
            )}
          </View>
          <Text style={styles.relationText}>{relationLabel}</Text>
        </View>

        {!isSelf && (
          <View style={styles.actionsRow}>
            {onEdit && (
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => onEdit(member)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialIcons name="edit" size={ws(18)} color={Colors.primaryColor} />
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => onDelete(member)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialIcons name="delete-outline" size={ws(18)} color={Colors.redColor} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      <View style={styles.divider} />

      <View style={styles.detailsGrid}>
        {!!member.phone && (
          <View style={styles.detailItem}>
            <MaterialIcons name="phone" size={ws(14)} color="#64748B" />
            <Text style={styles.detailText}>{member.phone}</Text>
          </View>
        )}
        {!!member.gender && (
          <View style={styles.detailItem}>
            <MaterialIcons name="wc" size={ws(14)} color="#64748B" />
            <Text style={styles.detailText}>{member.gender}</Text>
          </View>
        )}
        {!!member.dob && (
          <View style={styles.detailItem}>
            <MaterialIcons name="cake" size={ws(14)} color="#64748B" />
            <Text style={styles.detailText}>{member.dob}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: ws(16),
    padding: ws(16),
    marginBottom: hs(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: hs(2) },
    shadowOpacity: 0.03,
    shadowRadius: ws(4),
    elevation: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(12),
  },
  avatarCircle: {
    width: ws(44),
    height: ws(44),
    aspectRatio: 1,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCol: {
    flex: 1,
  },
  nameRelationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(8),
  },
  memberName: {
    fontSize: fs(14),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
  },
  selfBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: ws(8),
    paddingVertical: hs(2),
    borderRadius: ws(6),
    borderWidth: 1,
    borderColor: Colors.primaryColor,
  },
  selfBadgeText: {
    fontSize: fs(10),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryColor,
  },
  relationText: {
    fontSize: fs(11),
    ...TYPOGRAPHY.medium,
    color: Colors.secondaryFontColor,
    marginTop: hs(2),
  },
  actionsRow: {
    flexDirection: 'row',
    gap: ws(8),
  },
  actionBtn: {
    padding: ws(4),
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: hs(10),
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ws(12),
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(6),
  },
  detailText: {
    fontSize: fs(11),
    ...TYPOGRAPHY.medium,
    color: Colors.secondaryFontColor,
  },
});
