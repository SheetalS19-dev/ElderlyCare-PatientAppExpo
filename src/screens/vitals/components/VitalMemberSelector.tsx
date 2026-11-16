import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { memo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../../constants';
import type { FamilyMemberModel } from '../../../types';
import { fs, hs, TYPOGRAPHY, ws } from '../../../utils';

interface VitalMemberSelectorProps {
  familyList: FamilyMemberModel[];
  activeFamilyId: string;
  selectedMemberDisplayName: string;
  showMemberDropdown: boolean;
  onToggleDropdown: () => void;
  onSelectMember: (id: string) => void;
  getMemberDisplayName: (mem: FamilyMemberModel) => string;
}

export const VitalMemberSelector = memo(({
  familyList,
  activeFamilyId,
  selectedMemberDisplayName,
  showMemberDropdown,
  onToggleDropdown,
  onSelectMember,
  getMemberDisplayName,
}: VitalMemberSelectorProps) => {
  if (!familyList || familyList.length === 0) return null;

  return (
    <View style={styles.memberDropdownSection}>
      <Text style={styles.memberDropdownLabel}>Name</Text>
      <View style={styles.memberDropdownContainer}>
        <TouchableOpacity
          style={[
            styles.memberDropdownField,
            showMemberDropdown && styles.memberDropdownFieldOpen,
          ]}
          activeOpacity={0.85}
          onPress={onToggleDropdown}
        >
          <Text style={styles.memberDropdownFieldText} numberOfLines={1}>
            {selectedMemberDisplayName}
          </Text>
          <MaterialIcons
            name={showMemberDropdown ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
            size={fs(20)}
            color={Colors.primaryColor}
          />
        </TouchableOpacity>

        {showMemberDropdown && (
          <View style={styles.memberDropdownMenuCard}>
            <ScrollView
              nestedScrollEnabled
              bounces={false}
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: hs(220) }}
            >
              {familyList.map((mem) => {
                const isSelected = String(mem.id) === activeFamilyId;
                const displayName = getMemberDisplayName(mem);

                return (
                  <TouchableOpacity
                    key={`dropdown-mem-${mem.id}`}
                    style={[
                      styles.memberDropdownMenuItem,
                      isSelected && styles.memberDropdownMenuItemActive,
                    ]}
                    activeOpacity={0.7}
                    onPress={() => onSelectMember(String(mem.id))}
                  >
                    <Text
                      style={[
                        styles.memberDropdownMenuItemText,
                        isSelected && styles.memberDropdownMenuItemTextActive,
                      ]}
                      numberOfLines={1}
                    >
                      {displayName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  memberDropdownSection: {
    paddingHorizontal: ws(16),
    marginTop: hs(10),
    marginBottom: hs(4),
  },
  memberDropdownLabel: {
    fontSize: fs(12),
    ...TYPOGRAPHY.semiBold,
    color: '#475569',
    marginBottom: hs(5),
    marginLeft: ws(2),
  },
  memberDropdownContainer: {
    position: 'relative',
    zIndex: 100,
  },
  memberDropdownField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: fs(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: ws(14),
    paddingVertical: hs(11),
  },
  memberDropdownFieldOpen: {
    borderColor: Colors.primaryColor,
  },
  memberDropdownFieldText: {
    fontSize: fs(14),
    ...TYPOGRAPHY.medium,
    color: Colors.ink,
    flex: 1,
    marginRight: ws(8),
  },
  memberDropdownMenuCard: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: hs(4),
    backgroundColor: Colors.white,
    borderRadius: fs(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: ws(6),
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: hs(4) },
    shadowOpacity: 0.12,
    shadowRadius: fs(8),
    elevation: 8,
    zIndex: 1000,
  },
  memberDropdownMenuItem: {
    paddingVertical: hs(10),
    paddingHorizontal: ws(12),
    borderRadius: fs(8),
    marginBottom: hs(2),
  },
  memberDropdownMenuItemActive: {
    backgroundColor: Colors.primaryColor,
  },
  memberDropdownMenuItemText: {
    fontSize: fs(13),
    ...TYPOGRAPHY.medium,
    color: Colors.ink,
  },
  memberDropdownMenuItemTextActive: {
    ...TYPOGRAPHY.bold,
    color: Colors.white,
  },
});
