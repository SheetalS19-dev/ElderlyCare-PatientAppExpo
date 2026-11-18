import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
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
import { AppDatePickerModal } from '../../../components';
import { Colors } from '../../../constants';
import { DateTimeUtils, fs, hs, TYPOGRAPHY, ws } from '../../../utils';

export const RELATION_OPTIONS = [
  'Husband',
  'Wife',
  'Father',
  'Mother',
  'Son',
  'Daughter',
  'Brother',
  'Sister',
  'Grandfather',
  'Grandmother',
  'Other',
];

interface AddEditFamilyMemberModalProps {
  visible: boolean;
  onClose: () => void;
  editingId: string | null;
  firstName: string;
  setFirstName: (val: string) => void;
  lastName: string;
  setLastName: (val: string) => void;
  phone: string;
  setPhone: (val: string) => void;
  dob: string;
  setDob: (val: string) => void;
  gender: string;
  setGender: (val: string) => void;
  relation: string;
  setRelation: (val: string) => void;
  countryCode: { name: string; code: string; dialCode: string; flag: string };
  errors: Record<string, string | undefined>;
  clearError: (field: string) => void;
  onSave: () => void;
  isSubmitting: boolean;
}

export const AddEditFamilyMemberModal: React.FC<AddEditFamilyMemberModalProps> = ({
  visible,
  onClose,
  editingId,
  firstName,
  setFirstName,
  lastName,
  setLastName,
  phone,
  setPhone,
  dob,
  setDob,
  gender,
  setGender,
  relation,
  setRelation,
  countryCode,
  errors,
  clearError,
  onSave,
  isSubmitting,
}) => {
  const insets = useSafeAreaInsets();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showRelationList, setShowRelationList] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity style={styles.backdropPressable} activeOpacity={1} onPress={onClose} />
        <View style={[styles.modalBox, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={{ flexGrow: 1, paddingBottom: hs(32) }}
            keyboardShouldPersistTaps="handled"
            bounces={false}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <View style={styles.modalIconCircle}>
                  <MaterialIcons
                    name={editingId ? 'edit' : 'person-add'}
                    size={20}
                    color={Colors.primaryColor}
                  />
                </View>
                <Text style={styles.modalTitle}>
                  {editingId ? 'Edit Family Member' : 'Add New Family Member'}
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <MaterialIcons name="close" size={24} color={Colors.secondaryFontColor} />
              </TouchableOpacity>
            </View>

            {/* 2-Column Row for First Name and Last Name */}
            <View style={styles.twoColRow}>
              <View style={styles.col}>
                <Text style={[styles.inputLabel, styles.firstInputLabel]}>First Name *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter first name"
                  placeholderTextColor={Colors.slate_94A3B8}
                  value={firstName}
                  onChangeText={(v) => {
                    setFirstName(v);
                    clearError('firstName');
                  }}
                />
                {!!errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}
              </View>

              <View style={styles.col}>
                <Text style={[styles.inputLabel, styles.firstInputLabel]}>Last Name</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter last name"
                  placeholderTextColor={Colors.slate_94A3B8}
                  value={lastName}
                  onChangeText={(v) => {
                    setLastName(v);
                    clearError('lastName');
                  }}
                />
                {!!errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}
              </View>
            </View>

            <Text style={styles.inputLabel}>Mobile Number *</Text>
            <View style={styles.phoneInputRow}>
              <TextInput
                style={styles.phoneInput}
                placeholder="Enter 10-digit mobile number"
                placeholderTextColor={Colors.slate_94A3B8}
                keyboardType="phone-pad"
                maxLength={10}
                value={phone}
                onChangeText={(v) => {
                  setPhone(v.replace(/[^0-9]/g, ''));
                  clearError('phone');
                }}
              />
            </View>
            {!!errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}

            {/* Date of Birth Selection Tile */}
            <Text style={styles.inputLabel}>Date of Birth *</Text>
            <TouchableOpacity
              style={styles.dateSelectorTile}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.7}
            >
              <Text style={[styles.dateSelectorText, !dob ? styles.dateSelectorPlaceholder : null]}>
                {dob ? (DateTimeUtils.getDataFormat(dob) || dob) : DateTimeUtils.DOB_PLACEHOLDER}
              </Text>
              <MaterialIcons name="calendar-today" size={16} color={Colors.primaryColor} />
            </TouchableOpacity>
            {!!errors.dob && <Text style={styles.errorText}>{errors.dob}</Text>}

            {/* Gender Selector */}
            <Text style={styles.inputLabel}>Gender *</Text>
            <View style={styles.genderRow}>
              {['Male', 'Female', 'Other'].map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[styles.genderChip, gender === g && styles.genderChipSelected]}
                  onPress={() => {
                    setGender(g);
                    clearError('gender');
                  }}
                >
                  <Text style={[styles.genderChipText, gender === g && styles.genderChipTextSelected]}>
                    {g}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {!!errors.gender && <Text style={styles.errorText}>{errors.gender}</Text>}

            {/* Relation Selector */}
            <Text style={styles.inputLabel}>Relation *</Text>
            <TouchableOpacity
              style={[
                styles.dateSelectorTile,
                showRelationList && styles.selectorTileActive,
              ]}
              onPress={() => {
                setShowRelationList((v) => {
                  const next = !v;
                  if (next) {
                    setTimeout(() => {
                      scrollRef.current?.scrollToEnd({ animated: true });
                    }, 120);
                  }
                  return next;
                });
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.dateSelectorText, !relation ? styles.dateSelectorPlaceholder : null]}>
                {relation || 'Select relation'}
              </Text>
              <MaterialIcons
                name={showRelationList ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                size={20}
                color={Colors.primaryColor}
              />
            </TouchableOpacity>
            {!!errors.relation && <Text style={styles.errorText}>{errors.relation}</Text>}

            {/* Dropdown Options List */}
            {showRelationList && (
              <View style={styles.relationDropdownList}>
                <ScrollView
                  nestedScrollEnabled
                  bounces={false}
                  showsVerticalScrollIndicator={true}
                  style={styles.dropdownScrollView}
                  contentContainerStyle={styles.dropdownScrollContent}
                >
                  {RELATION_OPTIONS.map((opt, index) => {
                    const isSelected = relation === opt;
                    const isLast = index === RELATION_OPTIONS.length - 1;
                    return (
                      <TouchableOpacity
                        key={opt}
                        style={[
                          styles.relationOptionItem,
                          isSelected && styles.relationOptionItemSelected,
                          isLast && styles.relationOptionItemLast,
                        ]}
                        onPress={() => {
                          setRelation(opt);
                          setShowRelationList(false);
                          clearError('relation');
                        }}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.relationOptionText,
                            isSelected && styles.relationOptionTextSelected,
                          ]}
                        >
                          {opt}
                        </Text>
                        {isSelected && (
                          <MaterialIcons name="check" size={ws(18)} color={Colors.primaryColor} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSubmitBtn, isSubmitting && styles.modalSubmitBtnDisabled]}
                onPress={onSave}
                disabled={isSubmitting}
                activeOpacity={0.8}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Text style={styles.modalSubmitText}>
                    {editingId ? 'Update Member' : 'Add Member'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      <AppDatePickerModal
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        initialDate={dob}
        maxDate={new Date()}
        onSelectDate={(dateStr) => {
          setDob(dateStr);
          clearError('dob');
        }}
        title="Select Date of Birth"
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  backdropPressable: { flex: 1 },
  modalBox: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: fs(20),
    borderTopRightRadius: fs(20),
    paddingHorizontal: ws(16),
    paddingTop: hs(14),
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hs(10),
    paddingBottom: hs(8),
    borderBottomWidth: 1,
    borderBottomColor: Colors.slate_F1F5F9,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(8),
  },
  modalIconCircle: {
    width: ws(32),
    height: ws(32),
    borderRadius: 999,
    backgroundColor: Colors.aquaSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: fs(15),
    ...TYPOGRAPHY.bold,
    color: Colors.ink,
  },
  inputLabel: {
    fontSize: fs(12),
    ...TYPOGRAPHY.medium,
    color: Colors.slate_1E293B,
    marginBottom: hs(3),
    marginTop: hs(8),
  },
  firstInputLabel: {
    marginTop: hs(2),
  },
  textInput: {
    height: hs(38),
    backgroundColor: Colors.slate_F8FAFC,
    borderRadius: fs(8),
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: ws(10),
    fontSize: fs(13),
    color: Colors.slate_1E293B,
    ...TYPOGRAPHY.regular,
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: hs(38),
    backgroundColor: Colors.slate_F8FAFC,
    borderRadius: fs(8),
    borderWidth: 1,
    borderColor: Colors.border,
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: ws(10),
    fontSize: fs(13),
    color: Colors.slate_1E293B,
    ...TYPOGRAPHY.regular,
  },
  dateSelectorTile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: hs(38),
    backgroundColor: Colors.slate_F8FAFC,
    borderRadius: fs(8),
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: ws(10),
  },
  dateSelectorText: {
    fontSize: fs(13),
    color: Colors.slate_1E293B,
    ...TYPOGRAPHY.regular,
  },
  dateSelectorPlaceholder: {
    color: Colors.slate_94A3B8,
  },
  genderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hs(3),
    marginBottom: hs(6),
    gap: ws(8),
  },
  genderChip: {
    flex: 1,
    paddingVertical: hs(7),
    borderRadius: fs(8),
    backgroundColor: Colors.slate_F1F5F9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  genderChipSelected: {
    backgroundColor: Colors.primaryColor,
    borderColor: Colors.primaryColor,
  },
  genderChipText: {
    fontSize: fs(12),
    ...TYPOGRAPHY.medium,
    color: Colors.slate_1E293B,
  },
  genderChipTextSelected: {
    ...TYPOGRAPHY.bold,
    color: Colors.white,
  },
  twoColRow: {
    flexDirection: 'row',
    gap: ws(10),
  },
  col: {
    flex: 1,
  },
  selectorTileActive: {
    borderColor: Colors.primaryColor,
  },
  relationDropdownList: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: fs(10),
    marginTop: hs(4),
    marginBottom: hs(8),
    maxHeight: hs(190),
    overflow: 'hidden',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: hs(2) },
    shadowOpacity: 0.08,
    shadowRadius: fs(4),
    elevation: 3,
  },
  dropdownScrollView: {
    maxHeight: hs(190),
  },
  dropdownScrollContent: {
    flexGrow: 1,
    paddingVertical: hs(2),
  },
  relationOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: hs(11),
    paddingHorizontal: ws(14),
    borderBottomWidth: 1,
    borderBottomColor: Colors.slate_F1F5F9,
  },
  relationOptionItemLast: {
    borderBottomWidth: 0,
  },
  relationOptionItemSelected: {
    backgroundColor: Colors.aquaSoft,
  },
  relationOptionText: {
    fontSize: fs(13),
    ...TYPOGRAPHY.medium,
    color: Colors.slate_1E293B,
  },
  relationOptionTextSelected: {
    ...TYPOGRAPHY.bold,
    color: Colors.primaryColor,
  },
  errorText: {
    fontSize: fs(11),
    color: Colors.redColor,
    marginTop: hs(2),
    ...TYPOGRAPHY.regular,
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: ws(10),
    marginTop: hs(16),
  },
  modalCancelBtn: {
    flex: 1,
    height: hs(44),
    borderRadius: fs(10),
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: fs(13.5),
    ...TYPOGRAPHY.medium,
    color: Colors.slate_64748B,
  },
  modalSubmitBtn: {
    flex: 1.2,
    height: hs(44),
    borderRadius: fs(10),
    backgroundColor: Colors.primaryColor,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSubmitBtnDisabled: {
    opacity: 0.7,
  },
  modalSubmitText: {
    fontSize: fs(13.5),
    ...TYPOGRAPHY.bold,
    color: Colors.white,
  },
});
