import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
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
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { AppConstants, Colors, Typography } from '../../../constants';
import { useAuth } from '../../../context/AuthContext';
import {
  useAddFamilyMemberMutation,
  useGetFamilyMembersQuery,
} from '../../../redux/apis/bookingApi';
import type { FamilyMemberModel } from '../../../types';
import { DateTimeUtils, showToast } from '../../../utils';
import { validateName } from '../../../validation/profileValidation';
import { AppDatePickerModal } from '../../../components/common/AppDatePickerModal';
import { CountryCodePicker } from '../../../components/common/CountryCodePicker';

export interface FamilyMemberSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (member: FamilyMemberModel) => void;
  selectedMemberId?: string | number;
}

export const FamilyMemberSheet: React.FC<FamilyMemberSheetProps> = ({
  visible,
  onClose,
  onSelect,
  selectedMemberId,
}) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const uid = String(user?.id ?? (user as any)?.user_id ?? '');

  const { data: rawData, isLoading, refetch } = useGetFamilyMembersQuery(uid, {
    skip: !visible || !uid,
  });

  const [addFamilyMember, { isLoading: isAdding }] = useAddFamilyMemberMutation();

  const [showAddForm, setShowAddForm] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  const [countryCode, setCountryCode] = useState({
    name: 'India',
    code: 'IN',
    dialCode: '+91',
    flag: '🇮🇳',
  });

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [error, setError] = useState<string | undefined>();

  const familyList: FamilyMemberModel[] = useMemo(() => {
    let sourceList: FamilyMemberModel[] = [];
    if (Array.isArray(rawData)) {
      sourceList = rawData;
    } else if (Array.isArray((rawData as any)?.data)) {
      sourceList = (rawData as any).data;
    } else if (Array.isArray((rawData as any)?.response)) {
      sourceList = (rawData as any).response;
    }

    let list: FamilyMemberModel[] = [...sourceList];

    // Include self if user is logged in
    if (user && (user.f_name || user.id)) {
      const selfIndex = list.findIndex(
        (m) =>
          String(m.id) === String(user.id) ||
          m.relationship === 'Self' ||
          (m as any).is_self === true ||
          (m.f_name === user.f_name && m.phone === user.phone)
      );
      const selfItem: FamilyMemberModel = {
        id: user.id,
        user_id: user.id,
        f_name: user.f_name,
        l_name: user.l_name,
        phone: user.phone,
        gender: user.gender || 'Male',
        isd_code: user.isd_code || '+91',
        dob: user.dob || '',
        relationship: 'Self',
        is_self: true,
      } as any;

      if (selfIndex >= 0) {
        list = list.map((item, idx) =>
          idx === selfIndex
            ? {
                ...selfItem,
                ...item,
                dob: item.dob || user.dob || '',
                relationship: item.relationship || 'Self',
                is_self: true,
              }
            : item
        );
      } else {
        list = [selfItem, ...list];
      }
    }
    return list;
  }, [rawData, user]);

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setPhone('');
    setDob('');
    setGender('Male');
    setError(undefined);
    setShowAddForm(false);
  };

  const handleAdd = async () => {
    if (!validateName(firstName) || !validateName(lastName)) {
      setError('Enter valid first and last name (min 3 chars)');
      return;
    }
    if (!phone || phone.trim().length < 6) {
      setError('Enter a valid phone number');
      return;
    }
    if (!uid) {
      setError('Session expired. Please log in again.');
      return;
    }
    setError(undefined);

    try {
      const payload = {
        user_id: uid,
        f_name: firstName.trim(),
        l_name: lastName.trim(),
        phone: phone.trim(),
        gender,
        isd_code: countryCode.dialCode || '+91',
        dob: dob || '',
      };

      const res: any = await addFamilyMember(payload).unwrap();
      showToast('Patient added successfully');
      resetForm();

      // Extract new member ID from response safely
      let newMemberId: any = undefined;
      if (res && typeof res === 'object') {
        if (res.data && typeof res.data === 'object' && res.data.id) {
          newMemberId = res.data.id;
        } else if (res.id) {
          newMemberId = res.id;
        } else if (typeof res.data === 'number' || typeof res.data === 'string') {
          newMemberId = res.data;
        }
      }

      const updatedRefetch = await refetch();
      const refetchedList: FamilyMemberModel[] = Array.isArray(updatedRefetch?.data)
        ? updatedRefetch.data
        : Array.isArray((updatedRefetch?.data as any)?.data)
          ? (updatedRefetch.data as any).data
          : [];

      const matchedFromList = refetchedList.find(
        (m) =>
          (newMemberId && String(m.id) === String(newMemberId)) ||
          (m.f_name?.toLowerCase() === payload.f_name.toLowerCase() && m.phone === payload.phone)
      );

      const savedMember: FamilyMemberModel = matchedFromList || {
        id: newMemberId || Date.now(),
        user_id: uid,
        f_name: payload.f_name,
        l_name: payload.l_name,
        phone: payload.phone,
        gender: payload.gender,
        isd_code: payload.isd_code,
        dob: payload.dob,
      };

      onSelect(savedMember);
      onClose();
    } catch (e: any) {
      setError(e?.data?.message || e?.message || 'Could not add family member, please try again');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

        <View
          style={[
            styles.sheetContainer,
            { paddingBottom: Math.max(insets.bottom, 12) },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            {showAddForm ? (
              <View style={styles.modalTitleRow}>
                <View style={styles.modalIconCircle}>
                  <MaterialIcons name="person-add" size={20} color={Colors.primaryColor} />
                </View>
                <Text style={styles.headerTitle}>Add New Patient</Text>
              </View>
            ) : (
              <Text style={styles.headerTitle}>Select Patient</Text>
            )}
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <MaterialIcons name="close" size={24} color={Colors.secondaryFontColor} />
            </TouchableOpacity>
          </View>

          {showAddForm ? (
            <ScrollView
              style={styles.formScroll}
              contentContainerStyle={styles.formContentContainer}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              <Text style={[styles.inputLabel, styles.firstInputLabel]}>First Name*</Text>
              <TextInput
                style={styles.textInput}
                placeholder="First Name"
                placeholderTextColor="#94A3B8"
                value={firstName}
                onChangeText={setFirstName}
                autoCapitalize="words"
              />

              <Text style={styles.inputLabel}>Last Name*</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Last Name"
                placeholderTextColor="#94A3B8"
                value={lastName}
                onChangeText={setLastName}
                autoCapitalize="words"
              />

              <Text style={styles.inputLabel}>Mobile Number</Text>
              <View style={styles.phoneInputRow}>
                <TouchableOpacity
                  style={styles.countryCodeBtn}
                  onPress={() => setShowCountryPicker(true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.flagText}>{countryCode.flag}</Text>
                  <Text style={styles.dialCodeText}>{countryCode.dialCode}</Text>
                  <MaterialIcons name="arrow-drop-down" size={18} color="#64748B" />
                </TouchableOpacity>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="Mobile Number"
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
                  maxLength={15}
                  value={phone}
                  onChangeText={(v) => setPhone(v.replace(/[^0-9]/g, ''))}
                />
              </View>

              {/* Date of Birth Selection */}
              <Text style={styles.inputLabel}>Date of Birth</Text>
              <TouchableOpacity
                style={styles.dateSelectorTile}
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.7}
              >
                <Text style={[styles.dateSelectorText, !dob ? styles.dateSelectorPlaceholder : null]}>
                  {dob ? DateTimeUtils.getDataFormat(dob) || dob : 'Select Date of Birth'}
                </Text>
                <MaterialIcons name="calendar-today" size={18} color={Colors.primaryColor} />
              </TouchableOpacity>

              <Text style={styles.inputLabel}>Gender</Text>
              <View style={styles.genderRow}>
                {(['Male', 'Female', 'Other'] as const).map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.genderChip, gender === g && styles.genderChipActive]}
                    onPress={() => setGender(g)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.genderChipText,
                        gender === g && styles.genderChipTextActive,
                      ]}
                    >
                      {g}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {!!error && <Text style={styles.errorText}>{error}</Text>}

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={resetForm}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.submitBtn, isAdding && styles.btnDisabled]}
                  onPress={handleAdd}
                  disabled={isAdding}
                  activeOpacity={0.85}
                >
                  {isAdding ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.submitBtnText}>Save Patient</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          ) : (
            <View style={styles.listWrapper}>
              {isLoading ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator size="small" color={Colors.primaryColor} />
                  <Text style={styles.loadingText}>Loading patients...</Text>
                </View>
              ) : familyList.length === 0 ? (
                <View style={styles.emptyBox}>
                  <MaterialIcons name="people-outline" size={48} color="#CBD5E1" />
                  <Text style={styles.emptyTitle}>No Patients Found</Text>
                  <Text style={styles.emptySubtitle}>Add a patient or family member to continue</Text>
                </View>
              ) : (
                <FlatList
                  data={familyList}
                  keyExtractor={(item, index) => `fam-${item.id ?? index}`}
                  contentContainerStyle={styles.listContent}
                  style={{ maxHeight: 350 }}
                  showsVerticalScrollIndicator={true}
                  renderItem={({ item }) => {
                    const isSelected =
                      selectedMemberId && String(item.id) === String(selectedMemberId);
                    const isSelf =
                      (item as any).is_self ||
                      item.relationship === 'Self' ||
                      String(item.id) === String(user?.id);
                    const displayName =
                      `${item.f_name ?? ''} ${item.l_name ?? ''}`.trim() || (isSelf ? 'Self' : 'Patient');
                    return (
                      <TouchableOpacity
                        style={[styles.memberCard, isSelected && styles.memberCardActive]}
                        onPress={() => {
                          onSelect(item);
                          onClose();
                        }}
                        activeOpacity={0.8}
                      >
                        <View style={styles.memberAvatar}>
                          <MaterialIcons
                            name="person"
                            size={24}
                            color={isSelected ? '#FFFFFF' : Colors.primaryColor}
                          />
                        </View>
                        <View style={styles.memberInfo}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={styles.memberName} numberOfLines={1}>
                              {displayName}
                            </Text>
                            {!!item.gender && (
                              <View
                                style={{
                                  backgroundColor: '#EFF6FF',
                                  paddingHorizontal: 6,
                                  paddingVertical: 1,
                                  borderRadius: 4,
                                }}
                              >
                                <Text style={{ fontSize: 10, fontWeight: '600', color: '#2563EB' }}>
                                  {item.gender}
                                </Text>
                              </View>
                            )}
                            {isSelf && (
                              <View
                                style={{
                                  backgroundColor: '#ECFDF5',
                                  borderWidth: 1,
                                  borderColor: '#A7F3D0',
                                  paddingHorizontal: 6,
                                  paddingVertical: 1,
                                  borderRadius: 4,
                                }}
                              >
                                <Text
                                  style={{
                                    fontSize: 10,
                                    fontWeight: '700',
                                    color: '#059669',
                                  }}
                                >
                                  Self
                                </Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.memberPhone}>
                            {item.phone ? `${item.isd_code ? `${item.isd_code} ` : ''}${item.phone}` : '--'}
                          </Text>
                        </View>
                        {isSelected ? (
                          <MaterialIcons name="check-circle" size={22} color={Colors.primaryColor} />
                        ) : (
                          <MaterialIcons name="chevron-right" size={22} color="#CBD5E1" />
                        )}
                      </TouchableOpacity>
                    );
                  }}
                />
              )}

              {/* Add Patient Button */}
              <TouchableOpacity
                style={styles.addPatientBtn}
                onPress={() => setShowAddForm(true)}
                activeOpacity={0.85}
              >
                <MaterialIcons name="add" size={20} color="#FFFFFF" />
                <Text style={styles.addPatientBtnText}>Add Patient</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* Country Code Picker Modal */}
      <CountryCodePicker
        visible={showCountryPicker}
        selectedDialCode={countryCode.dialCode}
        onSelect={(item) => {
          setCountryCode(item);
          setShowCountryPicker(false);
        }}
        onClose={() => setShowCountryPicker(false)}
      />

      {/* Date of Birth Calendar Picker Modal */}
      <AppDatePickerModal
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        initialDate={dob}
        maxDate={new Date()}
        onSelectDate={(dateStr) => setDob(dateStr)}
        title="Select Date of Birth"
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: '#F7F8FA',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: Typography.fontFamily.bold,
    color: '#1A202C',
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF5EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listWrapper: {
    padding: 16,
  },
  listContent: {
    paddingBottom: 12,
  },
  loadingBox: {
    paddingVertical: 30,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    fontFamily: Typography.fontFamily.regular,
    color: '#718096',
  },
  emptyBox: {
    paddingVertical: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontFamily: Typography.fontFamily.bold,
    color: '#2D3748',
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    fontFamily: Typography.fontFamily.regular,
    color: '#718096',
    marginTop: 4,
  },
  memberCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  memberCardActive: {
    borderColor: Colors.primaryColor,
    backgroundColor: '#FFF7ED',
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 15,
    fontFamily: Typography.fontFamily.bold,
    color: '#1A202C',
  },
  memberPhone: {
    fontSize: 13,
    fontFamily: Typography.fontFamily.regular,
    color: '#718096',
    marginTop: 2,
  },
  addPatientBtn: {
    backgroundColor: Colors.primaryColor,
    borderRadius: 8,
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
  },
  addPatientBtnText: {
    fontSize: 14,
    fontFamily: Typography.fontFamily.bold,
    color: '#FFFFFF',
  },
  formScroll: {
    maxHeight: 540,
  },
  formContentContainer: {
    padding: 20,
    paddingBottom: 24,
  },
  inputLabel: {
    fontSize: 13,
    fontFamily: Typography.fontFamily.medium,
    color: '#2D3748',
    marginTop: 14,
    marginBottom: 6,
  },
  firstInputLabel: {
    marginTop: 2,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    height: 46,
    paddingHorizontal: 12,
    fontSize: 14,
    fontFamily: Typography.fontFamily.regular,
    color: '#1A202C',
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  countryCodeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
    height: '100%',
  },
  flagText: {
    fontSize: 16,
    marginRight: 4,
  },
  dialCodeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#1E293B',
  },
  dateSelectorTile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 46,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
  },
  dateSelectorText: {
    fontSize: 14,
    color: '#1E293B',
  },
  dateSelectorPlaceholder: {
    color: '#94A3B8',
  },
  genderRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  genderChip: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderChipActive: {
    backgroundColor: Colors.primaryColor,
    borderColor: Colors.primaryColor,
  },
  genderChipText: {
    fontSize: 13,
    fontFamily: Typography.fontFamily.medium,
    color: '#4A5568',
  },
  genderChipTextActive: {
    color: '#FFFFFF',
    fontFamily: Typography.fontFamily.bold,
  },
  errorText: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.regular,
    color: '#E53E3E',
    marginTop: 8,
  },
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  submitBtn: {
    flex: 1,
    backgroundColor: Colors.primaryColor,
    borderRadius: 8,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize: 14,
    fontFamily: Typography.fontFamily.bold,
    color: '#FFFFFF',
  },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 10,
  },
  cancelBtnText: {
    fontSize: 13,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.secondaryFontColor,
  },
});
