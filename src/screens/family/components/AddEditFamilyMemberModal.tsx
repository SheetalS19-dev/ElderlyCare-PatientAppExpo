import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../../../constants';
import { fs, hs, ws } from '../../../utils/metrics';
import { TYPOGRAPHY } from '../../../utils/typography';

interface Props {
  visible: boolean;
  isEditing: boolean;
  firstName: string;
  onChangeFirstName: (t: string) => void;
  lastName: string;
  onChangeLastName: (t: string) => void;
  phone: string;
  onChangePhone: (t: string) => void;
  gender: string;
  onSelectGender: (g: string) => void;
  dob: string;
  onOpenDatePicker: () => void;
  onSubmit: () => void;
  onClose: () => void;
  isSubmitting: boolean;
}

const GENDER_OPTIONS = ['Male', 'Female', 'Other'];

export const AddEditFamilyMemberModal: React.FC<Props> = ({
  visible,
  isEditing,
  firstName,
  onChangeFirstName,
  lastName,
  onChangeLastName,
  phone,
  onChangePhone,
  gender,
  onSelectGender,
  dob,
  onOpenDatePicker,
  onSubmit,
  onClose,
  isSubmitting,
}) => {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.sheetCard}>
          <View style={styles.sheetHandle} />

          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>
              {isEditing ? 'Edit Family Member' : 'Add Family Member'}
            </Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <MaterialIcons name="close" size={ws(22)} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollForm}>
            {/* First & Last Name */}
            <View style={styles.rowTwoCols}>
              <View style={styles.colHalf}>
                <Text style={styles.fieldLabel}>First Name *</Text>
                <TextInput
                  style={styles.inputField}
                  value={firstName}
                  onChangeText={onChangeFirstName}
                  placeholder="First name"
                  placeholderTextColor="#94A3B8"
                />
              </View>
              <View style={styles.colHalf}>
                <Text style={styles.fieldLabel}>Last Name *</Text>
                <TextInput
                  style={styles.inputField}
                  value={lastName}
                  onChangeText={onChangeLastName}
                  placeholder="Last name"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            {/* Phone */}
            <View style={styles.fieldWrapper}>
              <Text style={styles.fieldLabel}>Mobile Number</Text>
              <TextInput
                style={styles.inputField}
                value={phone}
                onChangeText={onChangePhone}
                placeholder="10-digit mobile number"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
              />
            </View>

            {/* Gender Pills */}
            <View style={styles.fieldWrapper}>
              <Text style={styles.fieldLabel}>Gender</Text>
              <View style={styles.genderRow}>
                {GENDER_OPTIONS.map((g) => {
                  const isSelected = gender === g;
                  return (
                    <TouchableOpacity
                      key={g}
                      style={[styles.genderPill, isSelected && styles.genderPillActive]}
                      onPress={() => onSelectGender(g)}
                    >
                      <Text
                        style={[
                          styles.genderPillText,
                          isSelected && styles.genderPillTextActive,
                        ]}
                      >
                        {g}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Date of Birth */}
            <View style={styles.fieldWrapper}>
              <Text style={styles.fieldLabel}>Date of Birth</Text>
              <TouchableOpacity
                style={styles.datePickerBtn}
                activeOpacity={0.8}
                onPress={onOpenDatePicker}
              >
                <Text style={[styles.dateText, !dob && styles.placeholderText]}>
                  {dob || 'Select Date of Birth'}
                </Text>
                <MaterialIcons name="calendar-today" size={ws(18)} color="#64748B" />
              </TouchableOpacity>
            </View>
          </ScrollView>

          <View style={styles.sheetFooterRow}>
            <TouchableOpacity
              style={styles.cancelBtn}
              activeOpacity={0.8}
              onPress={onClose}
              disabled={isSubmitting}
            >
              <Text style={styles.cancelBtnText}>Close</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.submitBtn}
              activeOpacity={0.85}
              onPress={onSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Text style={styles.submitBtnText}>
                  {isEditing ? 'Update Details' : 'Add Member'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheetCard: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: ws(24),
    borderTopRightRadius: ws(24),
    paddingHorizontal: ws(20),
    paddingTop: hs(12),
    maxHeight: '85%',
  },
  sheetHandle: {
    width: ws(36),
    height: hs(4),
    borderRadius: ws(2),
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: hs(12),
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hs(16),
    paddingBottom: hs(10),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  sheetTitle: {
    flex: 1,
    fontSize: fs(16),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
  },
  scrollForm: {
    marginBottom: hs(12),
  },
  rowTwoCols: {
    flexDirection: 'row',
    gap: ws(10),
    marginBottom: hs(12),
  },
  colHalf: {
    flex: 1,
  },
  fieldWrapper: {
    marginBottom: hs(12),
  },
  fieldLabel: {
    fontSize: fs(12),
    ...TYPOGRAPHY.medium,
    color: Colors.primaryFontColor,
    marginBottom: hs(6),
  },
  inputField: {
    height: hs(44),
    backgroundColor: '#F8FAFC',
    borderRadius: ws(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: ws(12),
    fontSize: fs(13),
    ...TYPOGRAPHY.regular,
    color: Colors.primaryFontColor,
  },
  genderRow: {
    flexDirection: 'row',
    gap: ws(10),
  },
  genderPill: {
    flex: 1,
    height: hs(40),
    borderRadius: ws(10),
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  genderPillActive: {
    backgroundColor: Colors.primaryColor,
    borderColor: Colors.primaryColor,
  },
  genderPillText: {
    fontSize: fs(12),
    ...TYPOGRAPHY.medium,
    color: Colors.primaryFontColor,
  },
  genderPillTextActive: {
    color: Colors.white,
    ...TYPOGRAPHY.bold,
  },
  datePickerBtn: {
    height: hs(44),
    backgroundColor: '#F8FAFC',
    borderRadius: ws(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: ws(12),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateText: {
    fontSize: fs(13),
    ...TYPOGRAPHY.medium,
    color: Colors.primaryFontColor,
  },
  placeholderText: {
    color: '#94A3B8',
    ...TYPOGRAPHY.regular,
  },
  sheetFooterRow: {
    flexDirection: 'row',
    gap: ws(12),
    paddingVertical: hs(16),
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  cancelBtn: {
    flex: 1,
    height: hs(48),
    borderRadius: ws(12),
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: fs(14),
    ...TYPOGRAPHY.bold,
    color: '#64748B',
  },
  submitBtn: {
    flex: 1,
    height: hs(48),
    borderRadius: ws(12),
    backgroundColor: Colors.primaryColor,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primaryColor,
    shadowOffset: { width: 0, height: hs(3) },
    shadowOpacity: 0.2,
    shadowRadius: ws(6),
    elevation: 3,
  },
  submitBtnText: {
    fontSize: fs(14),
    ...TYPOGRAPHY.bold,
    color: Colors.white,
  },
});
