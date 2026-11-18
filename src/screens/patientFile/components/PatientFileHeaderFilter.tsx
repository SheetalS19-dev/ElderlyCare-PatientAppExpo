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
        {/* Row 1: Member Filter Dropdown (Flex 1) + Upload Button (Right) */}
        <View style={styles.topActionRow}>
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
                size={ws(20)}
                color={Colors.primaryColor}
              />
            </TouchableOpacity>

            {/* Floating Dropdown Menu Card */}
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
                        <Text
                          style={[
                            styles.memberDropdownMenuItemText,
                            isSelected && styles.memberDropdownMenuItemTextActive,
                          ]}
                          numberOfLines={1}
                        >
                          {displayName}
                        </Text>
                        <View style={styles.menuItemRight}>
                          {!!relation &&
                            relation.toLowerCase() !== 'family member' &&
                            relation.toLowerCase() !== 'patient' &&
                            relation.toLowerCase() !== 'self' && (
                            <View
                              style={[
                                styles.relationBadgeSmall,
                                isSelected && styles.relationBadgeSmallActive,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.relationBadgeSmallText,
                                  isSelected && styles.relationBadgeSmallTextActive,
                                ]}
                              >
                                {relation}
                              </Text>
                            </View>
                          )}
                          {isSelected && (
                            <MaterialIcons name="check" size={ws(18)} color={Colors.white} />
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Compact Upload Button */}
          <TouchableOpacity
            style={styles.uploadBtnCompact}
            activeOpacity={0.85}
            onPress={onUploadPress}
          >
            <MaterialIcons name="cloud-upload" size={ws(18)} color={Colors.white} />
            <Text style={styles.uploadBtnText}>Upload</Text>
          </TouchableOpacity>
        </View>

        {/* Row 2: Search Box (Full Width Below) */}
        <View style={styles.searchRow}>
          <SearchBox
            value={search}
            onChangeText={onChangeSearch}
            placeholder="Search files..."
            onClear={() => onChangeSearch('')}
          />
        </View>
      </View>

      {/* Dismiss backdrop when dropdown is open */}
      {showMemberDropdown && (
        <TouchableWithoutFeedback onPress={onCloseMemberDropdown}>
          <View style={styles.dropdownBackdrop} />
        </TouchableWithoutFeedback>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  topFilterSection: {
    paddingHorizontal: ws(16),
    paddingTop: hs(12),
    paddingBottom: hs(4),
    zIndex: 1000,
  },
  topActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(10),
    marginBottom: hs(10),
    position: 'relative',
    zIndex: 1000,
  },
  memberDropdownContainer: {
    flex: 1,
    position: 'relative',
    zIndex: 1000,
  },
  memberDropdownField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: fs(12),
    borderWidth: 1,
    borderColor: Colors.border_E3EDF7,
    paddingHorizontal: ws(14),
    height: hs(48),
    shadowColor: Colors.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
  uploadBtnCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryColor,
    height: hs(48),
    paddingHorizontal: ws(16),
    borderRadius: fs(12),
    gap: ws(6),
    shadowColor: Colors.primaryColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 3,
  },
  uploadBtnText: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(13.5),
    color: Colors.white,
  },
  searchRow: {
    width: '100%',
    zIndex: 1,
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
    borderColor: Colors.border_E3EDF7,
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
    paddingVertical: hs(10),
    paddingHorizontal: ws(12),
    borderRadius: fs(8),
    marginBottom: hs(2),
  },
  memberDropdownMenuItemActive: {
    backgroundColor: Colors.primaryColor,
  },
  memberDropdownMenuItemText: {
    fontSize: fs(13.5),
    ...TYPOGRAPHY.medium,
    color: Colors.slate_1E293B,
    flex: 1,
    marginRight: ws(6),
  },
  memberDropdownMenuItemTextActive: {
    ...TYPOGRAPHY.bold,
    color: Colors.white,
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(6),
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
  relationBadgeSmallText: {
    ...TYPOGRAPHY.semiBold,
    fontSize: fs(10),
    color: Colors.primaryColor,
  },
  relationBadgeSmallTextActive: {
    color: Colors.white,
  },
  dropdownBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
});
