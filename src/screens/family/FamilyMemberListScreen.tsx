import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import {
  Alert,
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
import {
  AppButton,
  AppCard,
  AppDatePickerModal,
  AppHeader,
  EmptyState,
  ErrorState,
  LoadingIndicator
} from '../../components';
import { Colors } from '../../constants';
import { useAuth } from '../../context/AuthContext';
import type { RootStackParamList } from '../../navigation/types';
import {
  useAddFamilyMemberMutation,
  useDeleteFamilyMemberMutation,
  useGetFamilyMembersQuery,
  useUpdateFamilyMemberMutation,
} from '../../redux/apis/bookingApi';
import { useGetUserProfileQuery } from '../../redux/apis/userApi';
import type { FamilyMemberModel, UserModel } from '../../types';
import { DateTimeUtils, fs, hs, showToast, TYPOGRAPHY, ws } from '../../utils';
import { validateDob, validatePhone } from '../../validation/authValidation';

type Props = NativeStackScreenProps<RootStackParamList, 'FamilyMemberList'>;

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

export const FamilyMemberListScreen = ({ navigation }: Props) => {
  const insets = useSafeAreaInsets();
  const { user: authUser } = useAuth();
  const uid = String(authUser?.id ?? (authUser as any)?.user_id ?? '');

  const { data: userProfileData } = useGetUserProfileQuery(uid, {
    skip: !uid,
  });

  const currentUser: UserModel | null = useMemo(() => {
    return userProfileData?.data ?? userProfileData ?? authUser ?? null;
  }, [userProfileData, authUser]);

  const {
    data: rawData,
    isLoading,
    isError,
    refetch,
  } = useGetFamilyMembersQuery(uid, {
    skip: !uid,
  });

  const [addFamilyMember, { isLoading: isAdding }] = useAddFamilyMemberMutation();
  const [updateFamilyMember, { isLoading: isUpdating }] = useUpdateFamilyMemberMutation();
  const [deleteFamilyMember] = useDeleteFamilyMemberMutation();

  const isSubmitting = isAdding || isUpdating;

  const rawList: FamilyMemberModel[] = useMemo(() => {
    if (Array.isArray(rawData)) return rawData;
    if (Array.isArray((rawData as any)?.data)) return (rawData as any).data;
    if (Array.isArray((rawData as any)?.response)) return (rawData as any).response;
    return [];
  }, [rawData]);

  const familyList: FamilyMemberModel[] = useMemo(() => {
    let list: FamilyMemberModel[] = [...rawList];

    if (currentUser && (currentUser.f_name || currentUser.id)) {
      const selfUserFName = (currentUser.f_name || '').trim().toLowerCase();
      const selfUserLName = (currentUser.l_name || '').trim().toLowerCase();
      const selfUserPhone = (currentUser.phone || '').trim();
      const currentUserIdStr = String(currentUser.id ?? '');

      const selfEntries: FamilyMemberModel[] = [];
      const nonSelfEntries: FamilyMemberModel[] = [];

      for (const m of list) {
        const isSelf =
          (m as any).is_self === true ||
          (m.relationship || '').toLowerCase() === 'self' ||
          (currentUserIdStr && String(m.id) === currentUserIdStr) ||
          (selfUserFName &&
            m.f_name?.trim().toLowerCase() === selfUserFName &&
            (m.l_name?.trim().toLowerCase() === selfUserLName || !m.l_name) &&
            (m.phone?.trim() === selfUserPhone || !m.phone || (m.relationship || '').toLowerCase() === 'self'));

        if (isSelf) {
          selfEntries.push(m);
        } else {
          nonSelfEntries.push(m);
        }
      }

      const firstSelf = selfEntries[0];

      const selfItem: FamilyMemberModel = {
        id: currentUser.id,
        user_id: currentUser.id,
        f_name: currentUser.f_name,
        l_name: currentUser.l_name,
        phone: currentUser.phone,
        isd_code: currentUser.isd_code || '+91',
        gender: currentUser.gender || 'Male',
        dob: firstSelf?.dob || currentUser.dob || '',
        ...(firstSelf || {}),
        relationship: 'Self',
        is_self: true,
      } as any;

      return [selfItem, ...nonSelfEntries];
    }

    return list;
  }, [rawList, currentUser]);

  const [showModal, setShowModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  const [countryCode, setCountryCode] = useState({
    name: 'India',
    code: 'IN',
    dialCode: '+91',
    flag: '🇮🇳',
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('Male');
  const [dob, setDob] = useState('');
  const [relation, setRelation] = useState('');

  const openAddModal = () => {
    setEditingId(null);
    setFirstName('');
    setLastName('');
    setPhone('');
    setGender('Male');
    setDob('');
    setRelation('');
    setCountryCode({
      name: 'India',
      code: 'IN',
      dialCode: '+91',
      flag: '🇮🇳',
    });
    setShowModal(true);
  };

  const openEditModal = (item: FamilyMemberModel) => {
    setEditingId(String(item.id));
    setFirstName(item.f_name ?? '');
    setLastName(item.l_name ?? '');
    setPhone(item.phone ?? '');
    setGender(item.gender || 'Male');
    setDob(item.dob ?? '');
    const itemRelation = (item as any).relation || item.relationship || '';
    setRelation(itemRelation.toLowerCase() === 'family member' ? '' : itemRelation);
    if (item.isd_code) {
      setCountryCode((prev) => ({
        ...prev,
        dialCode: item.isd_code ?? '+91',
      }));
    }
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!firstName.trim()) {
      showToast('Enter First Name');
      return;
    }
    // Last Name is optional per Point 2

    if (phone.trim()) {
      const phoneRes = validatePhone(phone, true);
      if (!phoneRes.isValid) {
        showToast(phoneRes.error || 'Please enter a valid 10-digit phone number');
        return;
      }
    }
    if (dob.trim()) {
      const dobRes = validateDob(dob, false);
      if (!dobRes.isValid) {
        showToast(dobRes.error || 'Invalid date of birth');
        return;
      }
    }

    if (!uid) {
      showToast('User session expired. Please log in again.');
      return;
    }

    try {
      const payload: any = {
        user_id: uid,
        f_name: firstName.trim(),
        first_name: firstName.trim(),
        l_name: lastName ? lastName.trim() : '',
        last_name: lastName ? lastName.trim() : '',
        phone: phone.trim(),
        gender,
        dob,
        isd_code: countryCode.dialCode || '+91',
      };
      if (relation.trim()) {
        payload.relation = relation.trim();
        payload.relationship = relation.trim();
      }

      if (editingId) {
        // Updating existing family member
        await updateFamilyMember({
          id: editingId,
          member_id: editingId,
          family_member_id: editingId,
          ...payload,
        }).unwrap();
        showToast('Family member updated successfully');
      } else {
        // Adding new family member (requires user_id)
        await addFamilyMember({
          ...payload,
        }).unwrap();
        showToast('Family member added successfully');
      }

      setShowModal(false);
      refetch();
    } catch (err: any) {
      const errorMsg =
        err?.data?.message ||
        err?.error ||
        'Failed to save family member. Please try again.';
      showToast(errorMsg);
    }
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      'Delete Family Member',
      `Are you sure you want to remove ${name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteFamilyMember(id).unwrap();
              showToast('Family member removed');
              refetch();
            } catch {
              showToast('Could not remove family member');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Family Members" onBackPress={() => navigation.goBack()} />

      {isLoading ? (
        <LoadingIndicator />
      ) : isError ? (
        <ErrorState message="Couldn't load family members" onRetry={refetch} />
      ) : (
        <FlatList
          data={familyList}
          keyExtractor={(item, index) => `fam-${item.id ?? index}`}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: hs(140) + Math.max(insets.bottom, hs(24)) },
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState message="No family members added. Tap + at bottom right to add one." />
          }
          renderItem={({ item }) => {
            const isSelf =
              (item as any).is_self ||
              item.relationship === 'Self' ||
              String(item.id) === String(currentUser?.id);
            const memberName =
              `${item.f_name ?? ''} ${item.l_name ?? ''}`.trim() || (isSelf ? 'Self' : 'Family Member');
            const itemDob = item.dob || (isSelf ? currentUser?.dob : '');
            const initial = memberName ? memberName.charAt(0).toUpperCase() : 'M';
            const genderVal = item.gender || (isSelf ? currentUser?.gender : '');
            const phoneVal = item.phone
              ? `${item.isd_code ? `${item.isd_code} ` : ''}${item.phone}`
              : (isSelf ? currentUser?.phone : '');

            // DB Relation (Husband, Wife, Father, etc.) - if not present, don't show any chip
            const rawRelation =
              (item as any).relation ||
              item.relationship ||
              (item as any).relation_name ||
              (item as any).relation_title ||
              '';
            const cleanRelation = typeof rawRelation === 'string' ? rawRelation.trim() : '';
            const isGenericOrSelf =
              !cleanRelation ||
              cleanRelation.toLowerCase() === 'family member' ||
              cleanRelation.toLowerCase() === 'self';
            const dbRelation = !isGenericOrSelf ? cleanRelation : null;

            const isFemale = (genderVal || '').toLowerCase() === 'female';
            const ageText = calculateAge(itemDob);

            return (
              <AppCard style={styles.card}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => (isSelf ? navigation.navigate('EditProfile') : openEditModal(item))}
                >
                  <View style={styles.cardHeaderRow}>
                    <View
                      style={[
                        styles.avatarCircle,
                        isSelf
                          ? styles.avatarCircleSelf
                          : isFemale
                            ? styles.avatarCircleFemale
                            : styles.avatarCircleMale,
                      ]}
                    >
                      <Text
                        style={[
                          styles.avatarText,
                          isSelf
                            ? styles.avatarTextSelf
                            : isFemale
                              ? styles.avatarTextFemale
                              : styles.avatarTextMale,
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
                        {isSelf ? (
                          <View style={styles.selfBadge}>
                            <MaterialIcons
                              name="verified"
                              size={fs(11)}
                              color="#059669"
                              style={{ marginRight: ws(2) }}
                            />
                            <Text style={styles.selfBadgeText}>Self</Text>
                          </View>
                        ) : dbRelation ? (
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
                              color={isFemale ? '#DB2777' : '#2563EB'}
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
                              color="#D97706"
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
                      {isSelf ? (
                        <TouchableOpacity
                          style={styles.actionIconBtn}
                          onPress={() => navigation.navigate('EditProfile')}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <MaterialIcons name="edit" size={fs(15)} color={Colors.primaryColor} />
                        </TouchableOpacity>
                      ) : (
                        <>
                          <TouchableOpacity
                            style={styles.actionIconBtn}
                            onPress={() => openEditModal(item)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <MaterialIcons name="edit" size={fs(15)} color={Colors.primaryColor} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.actionIconBtn, styles.deleteIconBtn]}
                            onPress={() => handleDelete(String(item.id), memberName)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <MaterialIcons name="delete-outline" size={fs(15)} color={Colors.redColor} />
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  </View>

                  {/* Phone number row if present */}
                  {!!phoneVal && (
                    <View style={styles.cardPhoneRow}>
                      <MaterialIcons name="call" size={fs(12)} color="#059669" style={{ marginRight: ws(4) }} />
                      <Text style={styles.cardPhoneText}>{phoneVal}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </AppCard>
            );
          }}
        />
      )}

      {/* FAB Add Button */}
      <TouchableOpacity
        style={[styles.fab, { bottom: hs(24) + Math.max(insets.bottom, hs(16)) }]}
        activeOpacity={0.85}
        onPress={openAddModal}
      >
        <MaterialIcons name="add" size={28} color={Colors.white} />
      </TouchableOpacity>

      {/* Add/Edit Modal */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity style={styles.backdropPressable} activeOpacity={1} onPress={() => setShowModal(false)} />
          <View style={[styles.modalBox, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <ScrollView
              contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
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
                <TouchableOpacity onPress={() => setShowModal(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <MaterialIcons name="close" size={24} color={Colors.secondaryFontColor} />
                </TouchableOpacity>
              </View>

              {/* 2-Column Row for First Name and Last Name */}
              <View style={styles.twoColRow}>
                <View style={styles.col}>
                  <Text style={[styles.inputLabel, styles.firstInputLabel]}>First Name*</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="First Name"
                    placeholderTextColor="#94A3B8"
                    value={firstName}
                    onChangeText={setFirstName}
                  />
                </View>

                <View style={styles.col}>
                  <Text style={[styles.inputLabel, styles.firstInputLabel]}>Last Name</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Last Name"
                    placeholderTextColor="#94A3B8"
                    value={lastName}
                    onChangeText={setLastName}
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Mobile Number</Text>
              <View style={styles.phoneInputRow}>
                <View style={styles.countryCodeBtn}>
                  <Text style={styles.dialCodeText}>+91</Text>
                </View>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="Enter 10-digit mobile number"
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={phone}
                  onChangeText={(v) => setPhone(v.replace(/[^0-9]/g, ''))}
                />
              </View>

              {/* Date of Birth Selection Tile */}
              <Text style={styles.inputLabel}>Date of Birth</Text>
              <TouchableOpacity
                style={styles.dateSelectorTile}
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.7}
              >
                <Text style={[styles.dateSelectorText, !dob ? styles.dateSelectorPlaceholder : null]}>
                  {dob ? DateTimeUtils.getDataFormat(dob) || dob : 'Select Date of Birth'}
                </Text>
                <MaterialIcons name="calendar-today" size={16} color={Colors.primaryColor} />
              </TouchableOpacity>

              {/* Gender Selector */}
              <Text style={styles.inputLabel}>Gender</Text>
              <View style={styles.genderRow}>
                {['Male', 'Female', 'Other'].map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.genderChip, gender === g && styles.genderChipSelected]}
                    onPress={() => setGender(g)}
                  >
                    <Text style={[styles.genderChipText, gender === g && styles.genderChipTextSelected]}>
                      {g}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Relation Selector */}
              <Text style={styles.inputLabel}>Relation (Optional)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Husband, Wife, Father, Mother..."
                placeholderTextColor="#94A3B8"
                value={relation}
                onChangeText={setRelation}
              />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.quickRelationRow}
              >
                {['Husband', 'Wife', 'Father', 'Mother', 'Son', 'Daughter', 'Brother', 'Sister', 'Spouse'].map(
                  (rel) => (
                    <TouchableOpacity
                      key={rel}
                      style={[
                        styles.quickRelationChip,
                        relation.toLowerCase() === rel.toLowerCase() && styles.quickRelationChipActive,
                      ]}
                      onPress={() => setRelation(rel)}
                    >
                      <Text
                        style={[
                          styles.quickRelationText,
                          relation.toLowerCase() === rel.toLowerCase() && styles.quickRelationTextActive,
                        ]}
                      >
                        {rel}
                      </Text>
                    </TouchableOpacity>
                  )
                )}
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <AppButton
                  title={editingId ? 'Update Member' : 'Save Member'}
                  loading={isSubmitting}
                  onPress={handleSubmit}
                  style={styles.saveBtn}
                />
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Date of Birth Calendar Picker Modal */}
      <AppDatePickerModal
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        initialDate={dob}
        maxDate={new Date()}
        onSelectDate={(dateStr) => setDob(dateStr)}
        title="Select Date of Birth"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgColor },
  listContent: { flexGrow: 1, padding: ws(16) },
  card: {
    marginBottom: hs(10),
    borderRadius: fs(14),
    paddingHorizontal: ws(14),
    paddingVertical: hs(12),
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    aspectRatio: 1,
    borderRadius: 999,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ws(10),
    borderWidth: 1.5,
  },
  avatarCircleSelf: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  avatarCircleMale: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  avatarCircleFemale: {
    backgroundColor: '#FDF2F8',
    borderColor: '#FBCFE8',
  },
  avatarText: {
    fontSize: fs(16),
    ...TYPOGRAPHY.bold,
  },
  avatarTextSelf: {
    color: '#059669',
  },
  avatarTextMale: {
    color: '#2563EB',
  },
  avatarTextFemale: {
    color: '#DB2777',
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
    color: '#1E293B',
  },
  selfBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: ws(6),
    paddingVertical: hs(2),
    borderRadius: fs(5),
  },
  selfBadgeText: {
    fontSize: fs(10),
    ...TYPOGRAPHY.bold,
    color: '#047857',
  },
  relationDbBadge: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: ws(6),
    paddingVertical: hs(2),
    borderRadius: fs(5),
  },
  relationDbBadgeText: {
    fontSize: fs(10),
    ...TYPOGRAPHY.bold,
    color: '#1D4ED8',
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
    color: '#64748B',
  },
  cardPhoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hs(8),
    paddingTop: hs(6),
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  cardPhoneText: {
    fontSize: fs(11.5),
    ...TYPOGRAPHY.medium,
    color: '#334155',
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
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteIconBtn: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FEE2E2',
  },
  twoColRow: {
    flexDirection: 'row',
    gap: ws(10),
  },
  col: {
    flex: 1,
  },
  quickRelationRow: {
    flexDirection: 'row',
    paddingVertical: hs(4),
    gap: ws(6),
  },
  quickRelationChip: {
    paddingHorizontal: ws(10),
    paddingVertical: hs(4),
    borderRadius: fs(12),
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickRelationChipActive: {
    backgroundColor: Colors.primaryColor,
    borderColor: Colors.primaryColor,
  },
  quickRelationText: {
    fontSize: fs(11),
    ...TYPOGRAPHY.medium,
    color: '#475569',
  },
  quickRelationTextActive: {
    ...TYPOGRAPHY.bold,
    color: Colors.white,
  },
  fab: {
    position: 'absolute',
    right: ws(20),
    bottom: hs(24),
    width: ws(56),
    height: ws(56),
    borderRadius: 999,
    backgroundColor: Colors.primaryColor,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
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
    borderBottomColor: '#F1F5F9',
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
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: fs(15),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
  },
  inputLabel: {
    fontSize: fs(12),
    ...TYPOGRAPHY.medium,
    color: '#334155',
    marginBottom: hs(3),
    marginTop: hs(8),
  },
  firstInputLabel: {
    marginTop: hs(2),
  },
  textInput: {
    height: hs(38),
    backgroundColor: '#F8FAFC',
    borderRadius: fs(8),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: ws(10),
    fontSize: fs(13),
    color: '#1E293B',
    ...TYPOGRAPHY.regular,
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: hs(38),
    backgroundColor: '#F8FAFC',
    borderRadius: fs(8),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  countryCodeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ws(8),
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
    height: '100%',
  },
  flagText: {
    fontSize: fs(15),
    marginRight: ws(4),
  },
  dialCodeText: {
    fontSize: fs(12.5),
    ...TYPOGRAPHY.semiBold,
    color: '#1E293B',
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: ws(10),
    fontSize: fs(13),
    color: '#1E293B',
    ...TYPOGRAPHY.regular,
  },
  dateSelectorTile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: hs(38),
    backgroundColor: '#F8FAFC',
    borderRadius: fs(8),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: ws(10),
  },
  dateSelectorText: {
    fontSize: fs(13),
    color: '#1E293B',
    ...TYPOGRAPHY.regular,
  },
  dateSelectorPlaceholder: {
    color: '#94A3B8',
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
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  genderChipSelected: {
    backgroundColor: Colors.primaryColor,
    borderColor: Colors.primaryColor,
  },
  genderChipText: {
    fontSize: fs(12),
    ...TYPOGRAPHY.medium,
    color: '#475569',
  },
  genderChipTextSelected: {
    color: Colors.white,
    ...TYPOGRAPHY.bold,
  },
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hs(14),
  },
  cancelBtn: {
    paddingVertical: hs(10),
    paddingHorizontal: ws(14),
    marginRight: ws(8),
  },
  cancelText: {
    fontSize: fs(13),
    color: Colors.secondaryFontColor,
    ...TYPOGRAPHY.medium,
  },
  saveBtn: {
    flex: 1,
  },
});
