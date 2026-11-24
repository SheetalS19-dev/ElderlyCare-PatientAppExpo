import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { memo, useMemo, useRef, useState } from 'react';
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
import { AppDatePickerModal } from '../../../components';
import { Colors } from '../../../constants';
import { useAuth } from '../../../context/AuthContext';
import {
  useAddFamilyMemberMutation,
  useGetFamilyMembersQuery,
} from '../../../redux/apis/bookingApi';
import { saveFamilyRelation } from '../../../services';
import type { FamilyMemberModel } from '../../../types';
import { DateTimeUtils, fs, hs, isUserSelfMember, showToast, TYPOGRAPHY, ws } from '../../../utils';
import {
  FIELD_LIMITS,
  validateDob,
  validateFamilyRelationDob,
  validateFamilyRelationLimit,
  validateName,
  validatePhone,
} from '../../../validation';
import { RELATION_OPTIONS } from '../../family/components/AddEditFamilyMemberModal';

export interface FamilyMemberSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (member: FamilyMemberModel) => void;
  selectedMemberId?: string | number;
}

export const FamilyMemberSheet: React.FC<FamilyMemberSheetProps> = memo(({
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
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other' | ''>('');
  const [relation, setRelation] = useState('');
  const [showRelationList, setShowRelationList] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const scrollRef = useRef<ScrollView>(null);

  const clearError = (field: string) => {
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const familyList: FamilyMemberModel[] = useMemo(() => {
    let sourceList: FamilyMemberModel[] = [];
    if (Array.isArray(rawData)) {
      sourceList = rawData;
    } else if (Array.isArray((rawData as any)?.data)) {
      sourceList = (rawData as any).data;
    } else if (Array.isArray((rawData as any)?.response)) {
      sourceList = (rawData as any).response;
    }

    const selfFName = (user?.f_name || '').trim();
    const selfLName = (user?.l_name || '').trim();
    const selfPhone = (user?.phone || '').trim();
    const selfId = user?.id ? String(user.id) : uid;

    const existingSelf = sourceList.find((m) => isUserSelfMember(m, user));

    const selfMember: FamilyMemberModel = existingSelf
      ? {
        ...existingSelf,
        id: existingSelf.id ?? selfId,
        user_id: existingSelf.user_id ?? selfId,
        f_name: existingSelf.f_name || selfFName || 'Self',
        l_name: existingSelf.l_name || selfLName || '',
        relationship: 'Self',
      }
      : {
        id: selfId || 'SELF',
        user_id: selfId,
        f_name: selfFName || 'Self',
        l_name: selfLName || '',
        phone: selfPhone || '',
        gender: user?.gender || 'Male',
        dob: user?.dob || '',
        isd_code: user?.isd_code || '+91',
        relationship: 'Self',
      };
    (selfMember as any).is_self = true;

    const otherMembers = sourceList.filter((m) => !isUserSelfMember(m, user));

    return [selfMember, ...otherMembers];
  }, [rawData, user, uid]);

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setPhone('');
    setDob('');
    setGender('');
    setRelation('');
    setShowRelationList(false);
    setErrors({});
    setShowAddForm(false);
  };

  const handleAdd = async () => {
    const nextErrors: Record<string, string | undefined> = {};

    const fnRes = validateName(firstName, true, 'First name');
    if (!fnRes.isValid) nextErrors.firstName = fnRes.error || 'First name is required';

    const lnRes = validateName(lastName, false, 'Last name');
    if (!lnRes.isValid) nextErrors.lastName = lnRes.error || 'Invalid last name';

    const phoneRes = validatePhone(phone, true);
    if (!phoneRes.isValid) nextErrors.phone = phoneRes.error || 'Valid 10-digit mobile number is required';

    if (!dob || !dob.trim()) {
      nextErrors.dob = 'Date of birth is required';
    } else {
      const dobRes = validateDob(dob, true);
      if (!dobRes.isValid) nextErrors.dob = dobRes.error || 'Invalid date of birth';
    }

    if (!gender || !gender.trim()) {
      nextErrors.gender = 'Please select a gender';
    }

    if (!relation || !relation.trim()) {
      nextErrors.relation = 'Please select a relation';
    } else {
      const limitRes = validateFamilyRelationLimit(relation, familyList);
      if (!limitRes.isValid) nextErrors.relation = limitRes.error;
    }

    if (!nextErrors.dob && !nextErrors.relation && dob && relation) {
      const relDobRes = validateFamilyRelationDob(dob, relation, user?.dob);
      if (!relDobRes.isValid) nextErrors.dob = relDobRes.error;
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    if (!uid) {
      showToast('Session expired. Please log in again.');
      return;
    }

    try {
      let formattedDob = dob.trim();
      if (formattedDob.includes('T')) {
        formattedDob = formattedDob.split('T')[0];
      } else if (formattedDob.includes('/')) {
        const parts = formattedDob.split('/');
        if (parts.length === 3) {
          if (parts[0].length === 4) {
            formattedDob = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
          } else if (parts[2].length === 4) {
            formattedDob = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          }
        }
      }

      const cleanRelation = relation.trim();

      const payload: any = {
        user_id: uid,
        f_name: firstName.trim(),
        first_name: firstName.trim(),
        l_name: lastName ? lastName.trim() : '',
        last_name: lastName ? lastName.trim() : '',
        phone: phone.trim(),
        gender: gender.trim(),
        dob: formattedDob,
        isd_code: countryCode.dialCode || '+91',
        relation: cleanRelation,
        relationship: cleanRelation,
      };

      const res: any = await addFamilyMember(payload).unwrap();
      showToast('Patient added successfully');

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

      if (newMemberId && cleanRelation) {
        await saveFamilyRelation(uid, String(newMemberId), cleanRelation);
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
        relationship: cleanRelation,
        relation: cleanRelation,
      };

      resetForm();
      onSelect(savedMember);
      onClose();
    } catch (e: any) {
      const msg = e?.data?.message || e?.message || 'Could not add patient, please try again';
      const lower = msg.toLowerCase();
      if (lower.includes('phone') || lower.includes('mobile')) {
        setErrors((prev) => ({ ...prev, phone: msg }));
      } else if (lower.includes('first name') || lower.includes('f_name')) {
        setErrors((prev) => ({ ...prev, firstName: msg }));
      } else if (lower.includes('last name') || lower.includes('l_name')) {
        setErrors((prev) => ({ ...prev, lastName: msg }));
      } else if (lower.includes('dob') || lower.includes('birth')) {
        setErrors((prev) => ({ ...prev, dob: msg }));
      } else if (lower.includes('gender')) {
        setErrors((prev) => ({ ...prev, gender: msg }));
      } else if (lower.includes('relation')) {
        setErrors((prev) => ({ ...prev, relation: msg }));
      } else {
        setErrors((prev) => ({ ...prev, general: msg }));
      }
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
              ref={scrollRef}
              style={styles.formScroll}
              contentContainerStyle={styles.formContentContainer}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {/* 2-Column Row for First Name and Last Name */}
              <View style={styles.twoColRow}>
                <View style={styles.col}>
                  <Text style={[styles.inputLabel, styles.firstInputLabel]}>First Name *</Text>
                  <TextInput
                    style={[styles.textInput, !!errors.firstName && styles.inputError]}
                    placeholder="Enter first name"
                    placeholderTextColor={Colors.slate_94A3B8}
                    value={firstName}
                    onChangeText={(v) => {
                      setFirstName(v);
                      clearError('firstName');
                    }}
                    autoCapitalize="words"
                    maxLength={FIELD_LIMITS.NAME_MAX}
                  />
                  {!!errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}
                </View>

                <View style={styles.col}>
                  <Text style={[styles.inputLabel, styles.firstInputLabel]}>Last Name</Text>
                  <TextInput
                    style={[styles.textInput, !!errors.lastName && styles.inputError]}
                    placeholder="Enter last name"
                    placeholderTextColor={Colors.slate_94A3B8}
                    value={lastName}
                    onChangeText={(v) => {
                      setLastName(v);
                      clearError('lastName');
                    }}
                    autoCapitalize="words"
                    maxLength={FIELD_LIMITS.NAME_MAX}
                  />
                  {!!errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}
                </View>
              </View>

              {/* Mobile Number */}
              <Text style={styles.inputLabel}>Mobile Number *</Text>
              <View style={[styles.phoneInputRow, !!errors.phone && styles.inputError]}>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="Enter 10-digit mobile number"
                  placeholderTextColor={Colors.slate_94A3B8}
                  keyboardType="phone-pad"
                  maxLength={FIELD_LIMITS.PHONE_MAX}
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
                style={[styles.dateSelectorTile, !!errors.dob && styles.inputError]}
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
                {(['Male', 'Female', 'Other'] as const).map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.genderChip, gender === g && styles.genderChipSelected]}
                    onPress={() => {
                      setGender(g);
                      clearError('gender');
                    }}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.genderChipText,
                        gender === g && styles.genderChipTextSelected,
                      ]}
                    >
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
                  !!errors.relation && styles.inputError,
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

              {/* Relation Dropdown List */}
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

                      const UNIQUE_MAP: Record<string, string> = {
                        father: 'Father',
                        mother: 'Mother',
                        husband: 'Spouse',
                        wife: 'Spouse',
                        spouse: 'Spouse',
                        grandfather: 'Grandfather',
                        grandmother: 'Grandmother',
                      };
                      const uniqueGroup = UNIQUE_MAP[opt.toLowerCase()];
                      const isTaken =
                        Boolean(uniqueGroup) &&
                        familyList.some(
                          (m) =>
                            UNIQUE_MAP[(m.relation || m.relationship || '').trim().toLowerCase()] === uniqueGroup
                        );

                      return (
                        <TouchableOpacity
                          key={opt}
                          style={[
                            styles.relationOptionItem,
                            isSelected && styles.relationOptionItemSelected,
                            isLast && styles.relationOptionItemLast,
                            isTaken && { opacity: 0.45, backgroundColor: Colors.slate_F8FAFC },
                          ]}
                          disabled={isTaken}
                          onPress={() => {
                            if (isTaken) return;
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
                              isTaken && { color: Colors.slate_94A3B8 },
                            ]}
                          >
                            {opt}{isTaken ? ' (Already added)' : ''}
                          </Text>
                          {isSelected && (
                            <MaterialIcons name="check" size={ws(18)} color={Colors.primaryColor} />
                          )}
                          {isTaken && !isSelected && (
                            <MaterialIcons name="block" size={ws(16)} color={Colors.slate_94A3B8} />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

              {/* General Error Banner */}
              {!!errors.general && (
                <View style={styles.generalErrorBox}>
                  <MaterialIcons name="error-outline" size={16} color={Colors.redColor} />
                  <Text style={styles.generalErrorText}>{errors.general}</Text>
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.modalActionRow}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={resetForm}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalSubmitBtn, isAdding && styles.modalSubmitBtnDisabled]}
                  onPress={handleAdd}
                  disabled={isAdding}
                  activeOpacity={0.8}
                >
                  {isAdding ? (
                    <ActivityIndicator size="small" color={Colors.white} />
                  ) : (
                    <Text style={styles.modalSubmitText}>Add Patient</Text>
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
                  <MaterialIcons name="people-outline" size={48} color={Colors.gray_CBD5E1} />
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
                            color={isSelected ? Colors.white : Colors.primaryColor}
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
                                  backgroundColor: Colors.aquaSoft,
                                  paddingHorizontal: ws(6),
                                  paddingVertical: hs(1),
                                  borderRadius: fs(4),
                                }}
                              >
                                <Text style={{ fontSize: fs(10), ...TYPOGRAPHY.semiBold, color: Colors.primaryColor }}>
                                  {item.gender}
                                </Text>
                              </View>
                            )}
                            {isSelf && (
                              <View
                                style={{
                                  backgroundColor: Colors.green_ECFDF5,
                                  borderWidth: 1,
                                  borderColor: Colors.green_A7F3D0,
                                  paddingHorizontal: ws(6),
                                  paddingVertical: hs(1),
                                  borderRadius: fs(4),
                                }}
                              >
                                <Text
                                  style={{
                                    fontSize: fs(10),
                                    ...TYPOGRAPHY.bold,
                                    color: Colors.green_059669,
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
                          <MaterialIcons name="chevron-right" size={22} color={Colors.gray_CBD5E1} />
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
                <MaterialIcons name="add" size={20} color={Colors.white} />
                <Text style={styles.addPatientBtnText}>Add Patient</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>

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
});

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
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ws(20),
    paddingTop: hs(16),
    paddingBottom: hs(12),
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
    borderTopLeftRadius: fs(20),
    borderTopRightRadius: fs(20),
  },
  headerTitle: {
    fontSize: fs(16),
    ...TYPOGRAPHY.bold,
    color: Colors.gray_1A202C,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(10),
  },
  modalIconCircle: {
    width: ws(36),
    height: hs(36),
    borderRadius: fs(18),
    backgroundColor: Colors.aquaSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listWrapper: {
    padding: ws(16),
  },
  listContent: {
    paddingBottom: hs(12),
  },
  loadingBox: {
    paddingVertical: hs(30),
    alignItems: 'center',
    justifyContent: 'center',
    gap: hs(8),
  },
  loadingText: {
    fontSize: fs(13),
    ...TYPOGRAPHY.regular,
    color: Colors.gray_718096,
  },
  emptyBox: {
    paddingVertical: hs(30),
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: fs(15),
    ...TYPOGRAPHY.bold,
    color: Colors.gray_2D3748,
    marginTop: hs(8),
  },
  emptySubtitle: {
    fontSize: fs(13),
    ...TYPOGRAPHY.regular,
    color: Colors.gray_718096,
    marginTop: hs(4),
  },
  memberCard: {
    backgroundColor: Colors.white,
    borderRadius: fs(8),
    padding: ws(12),
    marginBottom: hs(8),
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  memberCardActive: {
    borderColor: Colors.primaryColor,
    backgroundColor: Colors.aquaSoft,
  },
  memberAvatar: {
    width: ws(40),
    height: hs(40),
    borderRadius: fs(20),
    backgroundColor: Colors.aquaSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: ws(12),
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: fs(15),
    ...TYPOGRAPHY.bold,
    color: Colors.gray_1A202C,
  },
  memberPhone: {
    fontSize: fs(13),
    ...TYPOGRAPHY.regular,
    color: Colors.gray_718096,
    marginTop: hs(2),
  },
  addPatientBtn: {
    backgroundColor: Colors.primaryColor,
    borderRadius: fs(8),
    height: hs(45),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ws(6),
    marginTop: hs(8),
  },
  addPatientBtnText: {
    fontSize: fs(14),
    ...TYPOGRAPHY.bold,
    color: Colors.white,
  },
  formScroll: {
    maxHeight: hs(540),
  },
  formContentContainer: {
    padding: ws(16),
    paddingBottom: hs(24),
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
  twoColRow: {
    flexDirection: 'row',
    gap: ws(10),
  },
  col: {
    flex: 1,
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
  countryCodeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ws(10),
    borderRightWidth: 1,
    borderRightColor: Colors.border,
    height: '100%',
  },
  flagText: {
    fontSize: fs(16),
    marginRight: ws(4),
  },
  dialCodeText: {
    fontSize: fs(13),
    ...TYPOGRAPHY.semiBold,
    color: Colors.primaryFontColor,
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
  inputError: {
    borderColor: Colors.redColor,
    backgroundColor: Colors.red_FFF5F5,
  },
  generalErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.red_FFF5F5,
    borderRadius: fs(8),
    borderWidth: 1,
    borderColor: Colors.redColor,
    paddingHorizontal: ws(12),
    paddingVertical: hs(8),
    marginTop: hs(8),
    marginBottom: hs(4),
    gap: ws(6),
  },
  generalErrorText: {
    flex: 1,
    fontSize: fs(12),
    ...TYPOGRAPHY.medium,
    color: Colors.redColor,
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
