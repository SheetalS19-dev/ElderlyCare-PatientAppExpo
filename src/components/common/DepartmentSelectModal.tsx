import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { memo, useEffect, useMemo, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants';
import type { DepartmentModel } from '../../types';
import { getDepartmentImageUrl } from '../../utils';
import { fs, hs, ws } from '../../utils/metrics';
import { TYPOGRAPHY } from '../../utils/typography';
import { FIELD_LIMITS } from '../../validation';

export interface DepartmentSelectModalProps {
  visible: boolean;
  onClose: () => void;
  departments: DepartmentModel[];
  selectedDeptId?: string | number | null;
  selectedDeptTitle?: string | null;
  onSelectDepartment: (dept: DepartmentModel | null | undefined) => void;
  title?: string;
}

export const DepartmentSelectModal: React.FC<DepartmentSelectModalProps> = memo(({
  visible,
  onClose,
  departments,
  selectedDeptId,
  selectedDeptTitle,
  onSelectDepartment,
  title = 'Select Department',
}) => {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDepts = useMemo(() => {
    if (!searchQuery.trim()) return departments;
    const q = searchQuery.toLowerCase().trim();
    return departments.filter((d) => {
      const name = (d.title || d.name || '').toLowerCase();
      const desc = (d.description || '').toLowerCase();
      return name.includes(q) || desc.includes(q);
    });
  }, [departments, searchQuery]);

  const hasSelection = !!selectedDeptId || !!selectedDeptTitle;

  // Always open with an empty search so the list starts unfiltered
  useEffect(() => {
    if (!visible) setSearchQuery('');
  }, [visible]);

  const handleSelect = (dept: DepartmentModel | null | undefined) => {
    onSelectDepartment(dept);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.modalBackdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity
          style={styles.dismissArea}
          activeOpacity={1}
          onPress={onClose}
        />

        <View
          style={[
            styles.modalSheetBox,
            { paddingBottom: Math.max(insets.bottom + hs(14), hs(24)) },
          ]}
        >
          {/* Sheet Handle */}
          <View style={styles.modalHandle} />

          {/* Header */}
          <View style={styles.modalSheetHeader}>
            <Text style={styles.modalSheetTitle}>{title}</Text>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialIcons name="close" size={fs(22)} color={Colors.primaryFontColor} />
            </TouchableOpacity>
          </View>

          {/* Search Input */}
          <View style={styles.searchContainer}>
            <MaterialIcons
              name="search"
              size={fs(20)}
              color={Colors.primaryColor}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search department..."
              placeholderTextColor={Colors.slate_94A3B8}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
              maxLength={FIELD_LIMITS.SEARCH_MAX}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <MaterialIcons name="cancel" size={fs(18)} color={Colors.slate_94A3B8} />
              </TouchableOpacity>
            )}
          </View>

          {/* Departments List */}
          <ScrollView
            style={styles.deptList}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {filteredDepts.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialIcons
                  name="search-off"
                  size={fs(32)}
                  color={Colors.secondaryFontColor}
                />
                <Text style={styles.emptyText}>
                  No departments found matching "{searchQuery}"
                </Text>
              </View>
            ) : (
              filteredDepts.map((dept: DepartmentModel, index: number) => {
                const deptIdStr = dept.id != null ? String(dept.id) : '';
                const deptTitle = dept.title || dept.name || '';
                const isSelected =
                  hasSelection &&
                  ((selectedDeptId && String(selectedDeptId) === deptIdStr) ||
                    (selectedDeptTitle &&
                      deptTitle.toLowerCase() === selectedDeptTitle.toLowerCase()));

                return (
                  <TouchableOpacity
                    key={`dept-modal-${dept.id ?? index}`}
                    style={[styles.deptRow, isSelected && styles.deptRowSelected]}
                    activeOpacity={0.7}
                    onPress={() => handleSelect(dept)}
                  >
                    <View style={styles.deptRowLeft}>
                      <View
                        style={[
                          styles.deptIconWrap,
                          isSelected && styles.deptIconWrapSelected,
                        ]}
                      >
                        {getDepartmentImageUrl(dept) ? (
                          <Image
                            source={{ uri: getDepartmentImageUrl(dept) }}
                            style={styles.deptImage}
                            resizeMode="cover"
                          />
                        ) : (
                          <MaterialIcons
                            name="medical-services"
                            size={fs(18)}
                            color={isSelected ? Colors.white : Colors.primaryColor}
                          />
                        )}
                      </View>
                      <View style={{ flex: 1, paddingRight: ws(8) }}>
                        <Text
                          style={[
                            styles.deptNameText,
                            isSelected && styles.deptNameTextSelected,
                          ]}
                          numberOfLines={1}
                        >
                          {deptTitle}
                        </Text>
                        {/* {!!dept.description && (
                          <Text style={styles.deptDescText} numberOfLines={1}>
                            {dept.description}
                          </Text>
                        )} */}
                      </View>
                    </View>
                    {isSelected && (
                      <MaterialIcons name="check-circle" size={fs(20)} color={Colors.primaryColor} />
                    )}
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
});

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  dismissArea: {
    flex: 1,
  },
  modalSheetBox: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: fs(24),
    borderTopRightRadius: fs(24),
    paddingTop: hs(12),
    paddingHorizontal: ws(20),
    maxHeight: '80%',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
  },
  modalHandle: {
    width: ws(40),
    height: hs(4),
    borderRadius: fs(2),
    backgroundColor: Colors.gray_CBD5E1,
    alignSelf: 'center',
    marginBottom: hs(12),
  },
  modalSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: hs(12),
    borderBottomWidth: 1,
    borderBottomColor: Colors.slate_F1F5F9,
  },
  modalSheetTitle: {
    fontSize: fs(17),
    ...TYPOGRAPHY.bold,
    color: Colors.ink,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.slate_F8FAFC,
    borderRadius: fs(12),
    paddingHorizontal: ws(12),
    paddingVertical: hs(8),
    marginVertical: hs(12),
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchIcon: {
    marginRight: ws(8),
  },
  searchInput: {
    flex: 1,
    fontSize: fs(14),
    ...TYPOGRAPHY.medium,
    color: Colors.mainFontColor,
    padding: 0,
  },
  deptList: {
    maxHeight: hs(380),
  },
  deptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: hs(12),
    paddingHorizontal: ws(12),
    borderRadius: fs(12),
    marginBottom: hs(4),
    backgroundColor: 'transparent',
  },
  deptRowSelected: {
    backgroundColor: Colors.aquaSoft,
  },
  deptRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  deptIconWrap: {
    width: ws(40),
    height: ws(40),
    borderRadius: fs(10),
    backgroundColor: Colors.slate_F1F5F9,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ws(12),
    overflow: 'hidden',
  },
  deptImage: {
    width: '100%',
    height: '100%',
  },
  deptIconWrapSelected: {
    backgroundColor: Colors.primaryColor,
  },
  deptNameText: {
    fontSize: fs(14),
    ...TYPOGRAPHY.semiBold,
    color: Colors.primaryFontColor,
  },
  deptNameTextSelected: {
    ...TYPOGRAPHY.bold,
    color: Colors.primaryColor,
  },
  deptDescText: {
    fontSize: fs(11),
    ...TYPOGRAPHY.regular,
    color: Colors.slate_64748B,
    marginTop: hs(2),
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hs(32),
  },
  emptyText: {
    marginTop: hs(8),
    fontSize: fs(13),
    ...TYPOGRAPHY.medium,
    color: Colors.secondaryFontColor,
    textAlign: 'center',
  },
});
