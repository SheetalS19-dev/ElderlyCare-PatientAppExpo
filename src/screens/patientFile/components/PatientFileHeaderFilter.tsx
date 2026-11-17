import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SearchBox } from '../../../components';
import { Colors } from '../../../constants';
import type { FamilyMemberModel } from '../../../types';
import { fs, hs, TYPOGRAPHY, ws } from '../../../utils';

interface Props {
  search: string;
  onChangeSearch: (text: string) => void;
  selectedMemberDisplayName: string;
  selectedMemberId: string;
  onSelectMemberId: (id: string) => void;
  showMemberDropdown: boolean;
  onToggleMemberDropdown: () => void;
  onCloseMemberDropdown: () => void;
  familyList: FamilyMemberModel[];
  getMemberDisplayName: (m: FamilyMemberModel) => string;
  getMemberRelationLabel: (m: FamilyMemberModel) => string;
  onUploadPress: () => void;
}

export const PatientFileHeaderFilter: React.FC<Props> = ({
  search,
  onChangeSearch,
  selectedMemberDisplayName,
  selectedMemberId,
  onSelectMemberId,
  showMemberDropdown,
  onToggleMemberDropdown,
  onCloseMemberDropdown,
  familyList,
  getMemberDisplayName,
  getMemberRelationLabel,
  onUploadPress,
}) => {
  return (
    <>
      <View style={styles.topFilterSection}>
        {/* Search Input */}
        <SearchBox
          value={search}
          onChangeText={onChangeSearch}
          placeholder="Search Files..."
          onClear={() => onChangeSearch('')}
        />

        {/* Member Filter Dropdown */}
        <View style={styles.memberDropdownSection}>
          <Text style={styles.dropdownLabel}>Select Member</Text>
          <View style={styles.memberDropdownContainer}>
            <TouchableOpacity
              style={[
                styles.memberDropdownField,
                showMemberDropdown && styles.memberDropdownFieldOpen,
              ]}
              activeOpacity={0.85}
              onPress={onToggleMemberDropdown}
            >
              <Text style={styles.memberDropdownFieldText} numberOfLines={1}>
                {selectedMemberDisplayName}
              </Text>
              <MaterialIcons
                name={showMemberDropdown ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                size={ws(22)}
                color={Colors.primaryColor}
              />
            </TouchableOpacity>

            {/* Dropdown Menu Card */}
            {showMemberDropdown && (
              <View style={styles.memberDropdownMenuCard}>
                <ScrollView
                  nestedScrollEnabled
                  bounces={false}
                  showsVerticalScrollIndicator={false}
                  style={{ maxHeight: hs(220) }}
                >
                  {/* All Members Option */}
                  <TouchableOpacity
                    style={[
                      styles.memberDropdownMenuItem,
                      selectedMemberId === 'all' && styles.memberDropdownMenuItemActive,
                    ]}
                    activeOpacity={0.7}
                    onPress={() => {
                      onSelectMemberId('all');
                      onCloseMemberDropdown();
                    }}
                  >
                    <Text
                      style={[
                        styles.memberDropdownMenuItemText,
                        selectedMemberId === 'all' && styles.memberDropdownMenuItemTextActive,
                      ]}
                      numberOfLines={1}
                    >
                      All Members
                    </Text>
                    {selectedMemberId === 'all' && (
                      <MaterialIcons name="check" size={ws(18)} color={Colors.white} />
                    )}
                  </TouchableOpacity>

                  {/* Individual Family Members */}
                  {familyList.map((mem) => {
                    const isSelected = String(mem.id) === selectedMemberId;
                    const displayName = getMemberDisplayName(mem);
                    const relation = getMemberRelationLabel(mem);

                    return (
                      <TouchableOpacity
                        key={`member-opt-${mem.id}`}
                        style={[
                          styles.memberDropdownMenuItem,
                          isSelected && styles.memberDropdownMenuItemActive,
                        ]}
                        activeOpacity={0.7}
                        onPress={() => {
                          onSelectMemberId(String(mem.id));
                          onCloseMemberDropdown();
                        }}
                      >
                        <View style={styles.menuItemTextRow}>
                          <Text
                            style={[
                              styles.memberDropdownMenuItemText,
                              isSelected && styles.memberDropdownMenuItemTextActive,
                            ]}
                            numberOfLines={1}
                          >
                            {displayName}
                          </Text>
                          {!!relation && (
                            <View
                              style={[
                                styles.relationBadgeSmall,
                                isSelected
                                  ? styles.relationBadgeSmallActive
                                  : relation.toLowerCase() === 'self'
                                  ? styles.relationBadgeSmallSelf
                                  : styles.relationBadgeSmallOther,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.relationBadgeSmallText,
                                  isSelected
                                    ? styles.relationBadgeSmallTextActive
                                    : relation.toLowerCase() === 'self'
                                    ? styles.relationBadgeSmallTextSelf
                                    : styles.relationBadgeSmallTextOther,
                                ]}
                              >
                                {relation}
                              </Text>
                            </View>
                          )}
                        </View>
                        {isSelected && (
                          <MaterialIcons name="check" size={ws(18)} color={Colors.white} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Dismiss backdrop when dropdown is open */}
      {showMemberDropdown && (
        <TouchableWithoutFeedback onPress={onCloseMemberDropdown}>
          <View style={styles.dropdownBackdrop} />
        </TouchableWithoutFeedback>
      )}

      {/* Upload action */}
      <View style={styles.uploadBar}>
        <TouchableOpacity style={styles.uploadButton} activeOpacity={0.85} onPress={onUploadPress}>
          <MaterialIcons name="cloud-upload" size={ws(18)} color={Colors.white} />
          <Text style={styles.uploadButtonText}>Upload File</Text>
        </TouchableOpacity>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  topFilterSection: {
    backgroundColor: Colors.white,
    paddingHorizontal: ws(16),
    paddingTop: hs(14),
    paddingBottom: hs(14),
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    zIndex: 1000,
    elevation: 8,
  },
  memberDropdownSection: {
    marginTop: hs(12),
    position: 'relative',
    zIndex: 1000,
  },
  dropdownLabel: {
    fontSize: fs(13),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
    marginBottom: hs(6),
  },
  memberDropdownContainer: {
    position: 'relative',
    zIndex: 1000,
  },
  memberDropdownField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: ws(12),
    borderWidth: 1.5,
    borderColor: Colors.gray_CBD5E1,
    paddingHorizontal: ws(14),
    height: hs(48),
  },
  memberDropdownFieldOpen: {
    borderColor: Colors.primaryColor,
  },
  memberDropdownFieldText: {
    fontSize: fs(14),
    ...TYPOGRAPHY.medium,
    color: Colors.primaryFontColor,
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
    borderRadius: ws(12),
    borderWidth: 1,
    borderColor: Colors.slate_E2E8F0,
    padding: ws(6),
    shadowColor: Colors.navy,
    shadowOffset: { width: 0, height: hs(4) },
    shadowOpacity: 0.12,
    shadowRadius: ws(10),
    elevation: 12,
    zIndex: 1001,
  },
  memberDropdownMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: hs(11),
    paddingHorizontal: ws(12),
    borderRadius: ws(8),
    marginBottom: hs(2),
  },
  memberDropdownMenuItemActive: {
    backgroundColor: Colors.primaryColor,
  },
  memberDropdownMenuItemText: {
    fontSize: fs(13.5),
    ...TYPOGRAPHY.medium,
    color: Colors.slate_1E293B,
  },
  memberDropdownMenuItemTextActive: {
    ...TYPOGRAPHY.bold,
    color: Colors.white,
  },
  menuItemTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(8),
    flex: 1,
  },
  relationBadgeSmall: {
    paddingHorizontal: ws(6),
    paddingVertical: hs(2),
    borderRadius: ws(6),
    backgroundColor: Colors.aquaSoft,
  },
  relationBadgeSmallActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  relationBadgeSmallSelf: {
    backgroundColor: Colors.badgeSuccessBg,
  },
  relationBadgeSmallOther: {
    backgroundColor: Colors.aquaSoft,
  },
  relationBadgeSmallText: {
    ...TYPOGRAPHY.semiBold,
    fontSize: fs(10),
    color: Colors.primaryColor,
  },
  relationBadgeSmallTextActive: {
    color: Colors.white,
  },
  relationBadgeSmallTextSelf: {
    color: Colors.green_16A34A,
  },
  relationBadgeSmallTextOther: {
    color: Colors.primaryColor,
  },
  dropdownBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  uploadBar: {
    paddingHorizontal: ws(16),
    paddingVertical: hs(12),
    backgroundColor: Colors.bgColor,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryColor,
    paddingVertical: hs(12),
    borderRadius: ws(12),
    gap: ws(8),
    elevation: 2,
    shadowColor: Colors.primaryColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  uploadButtonText: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(14),
    color: Colors.white,
  },
});
