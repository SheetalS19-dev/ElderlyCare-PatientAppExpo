import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppCard } from '../../../components';
import { Colors } from '../../../constants';
import type { FamilyMemberModel } from '../../../types';
import { DateTimeUtils, fs, hs, TYPOGRAPHY, ws } from '../../../utils';

interface FamilyMemberCardProps {
  item: FamilyMemberModel;
  onEdit: (item: FamilyMemberModel) => void;
  onDelete: (id: string, name: string) => void;
}

function calculateAge(dobStr?: string): string | null {
  if (!dobStr) return null;
  try {
    const birth = new Date(dobStr);
    if (isNaN(birth.getTime())) return null;
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
      age--;
    }
    return age > 0 && age < 125 ? `${age} yrs` : null;
  } catch {
    return null;
  }
}

export const FamilyMemberCard: React.FC<FamilyMemberCardProps> = ({ item, onEdit, onDelete }) => {
  const memberName = `${item.f_name ?? ''} ${item.l_name ?? ''}`.trim() || 'Family Member';
  const itemDob = item.dob || '';
  const initial = memberName ? memberName.charAt(0).toUpperCase() : 'M';
  const genderVal = item.gender || '';
  const phoneVal = item.phone ? `${item.phone}` : '';

  const rawRelation =
    (item as any).relation ||
    item.relationship ||
    (item as any).relation_name ||
    (item as any).relation_title ||
    '';
  const cleanRelation = typeof rawRelation === 'string' ? rawRelation.trim() : '';
  const isGeneric =
    !cleanRelation ||
    cleanRelation.toLowerCase() === 'family member' ||
    cleanRelation.toLowerCase() === 'self';
  const dbRelation = !isGeneric ? cleanRelation : null;

  const isFemale = (genderVal || '').toLowerCase() === 'female';
  const ageText = calculateAge(itemDob);

  return (
    <AppCard style={styles.card}>
      <TouchableOpacity activeOpacity={0.85} onPress={() => onEdit(item)}>
        <View style={styles.cardHeaderRow}>
          <View
            style={[
              styles.avatarCircle,
              isFemale ? styles.avatarCircleFemale : styles.avatarCircleMale,
            ]}
          >
            <Text
              style={[
                styles.avatarText,
                isFemale ? styles.avatarTextFemale : styles.avatarTextMale,
              ]}
            >
              {initial}
            </Text>
          </View>

          <View style={styles.headerInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>
                {memberName}
              </Text>
              {dbRelation ? (
                <View style={styles.relationDbBadge}>
                  <Text style={styles.relationDbBadgeText}>{dbRelation}</Text>
                </View>
              ) : null}
            </View>

            {/* Compact Meta Chips Row */}
            <View style={styles.metaChipsRow}>
              {!!genderVal && (
                <View style={styles.miniMetaChip}>
                  <MaterialIcons
                    name={isFemale ? 'female' : 'male'}
                    size={fs(12)}
                    color={isFemale ? Colors.pink_E0507A : Colors.primaryColor}
                    style={{ marginRight: ws(2) }}
                  />
                  <Text style={styles.miniMetaText}>{genderVal}</Text>
                </View>
              )}
              {!!itemDob && (
                <View style={styles.miniMetaChip}>
                  <MaterialIcons
                    name="cake"
                    size={fs(12)}
                    color={Colors.amber_D97706}
                    style={{ marginRight: ws(2) }}
                  />
                  <Text style={styles.miniMetaText}>
                    {DateTimeUtils.getDataFormat(itemDob) || itemDob}
                    {ageText ? ` (${ageText})` : ''}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.actionIconBtn}
              onPress={() => onEdit(item)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialIcons name="edit" size={fs(15)} color={Colors.primaryColor} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionIconBtn, styles.deleteIconBtn]}
              onPress={() => onDelete(String(item.id), memberName)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialIcons name="delete-outline" size={fs(15)} color={Colors.redColor} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Phone number row if present */}
        {!!phoneVal && (
          <View style={styles.cardPhoneRow}>
            <Ionicons name="call" size={fs(12)} color={Colors.green_059669} style={{ marginRight: ws(4) }} />
            <Text style={styles.cardPhoneText}>{phoneVal}</Text>
          </View>
        )}
      </TouchableOpacity>
    </AppCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: hs(10),
    borderRadius: fs(14),
    paddingHorizontal: ws(14),
    paddingVertical: hs(12),
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: ws(42),
    height: ws(42),
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ws(10),
    borderWidth: 1.5,
  },
  avatarCircleMale: {
    backgroundColor: Colors.aquaSoft,
    borderColor: Colors.aquaBorder,
  },
  avatarCircleFemale: {
    backgroundColor: Colors.pink_FCEAEF,
    borderColor: Colors.pink_FCEAEF,
  },
  avatarText: {
    fontSize: fs(16),
    ...TYPOGRAPHY.bold,
  },
  avatarTextMale: {
    color: Colors.primaryColor,
  },
  avatarTextFemale: {
    color: Colors.pink_E0507A,
  },
  headerInfo: {
    flex: 1,
    marginRight: ws(6),
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: ws(6),
    marginBottom: hs(2),
  },
  name: {
    fontSize: fs(14),
    ...TYPOGRAPHY.bold,
    color: Colors.slate_1E293B,
  },
  relationDbBadge: {
    backgroundColor: Colors.aquaSoft,
    borderWidth: 1,
    borderColor: Colors.aquaBorder,
    paddingHorizontal: ws(6),
    paddingVertical: hs(2),
    borderRadius: fs(5),
  },
  relationDbBadgeText: {
    fontSize: fs(10),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryColor,
  },
  metaChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: ws(8),
    marginTop: hs(2),
  },
  miniMetaChip: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniMetaText: {
    fontSize: fs(11),
    ...TYPOGRAPHY.regular,
    color: Colors.slate_64748B,
  },
  cardPhoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hs(8),
    paddingTop: hs(6),
    borderTopWidth: 1,
    borderTopColor: Colors.slate_F8FAFC,
  },
  cardPhoneText: {
    fontSize: fs(11.5),
    ...TYPOGRAPHY.medium,
    color: Colors.slate_1E293B,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(6),
    flexShrink: 0,
  },
  actionIconBtn: {
    width: ws(30),
    height: ws(30),
    borderRadius: 999,
    backgroundColor: Colors.slate_F1F5F9,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteIconBtn: {
    backgroundColor: Colors.red_FFF0F0,
    borderColor: Colors.red_FEE2E2,
  },
});
