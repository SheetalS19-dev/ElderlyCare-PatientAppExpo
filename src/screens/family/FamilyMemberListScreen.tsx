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
  CountryCodePicker,
  EmptyState,
  ErrorState,
  LoadingIndicator,
} from '../../components';
import { Colors, Typography } from '../../constants';
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
import { DateTimeUtils, showToast } from '../../utils';
import { validateDob, validatePhone } from '../../validation/authValidation';

type Props = NativeStackScreenProps<RootStackParamList, 'FamilyMemberList'>;

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

  const openAddModal = () => {
    setEditingId(null);
    setFirstName('');
    setLastName('');
    setPhone('');
    setGender('Male');
    setDob('');
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
    if (!lastName.trim()) {
      showToast('Enter Last Name');
      return;
    }
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
      if (editingId) {
        // Updating existing family member
        await updateFamilyMember({
          id: editingId,
          f_name: firstName.trim(),
          l_name: lastName.trim(),
          phone: phone.trim(),
          gender,
          dob,
          isd_code: countryCode.dialCode,
        }).unwrap();
        showToast('Family member updated successfully');
      } else {
        // Adding new family member (requires user_id)
        await addFamilyMember({
          user_id: uid,
          f_name: firstName.trim(),
          l_name: lastName.trim(),
          phone: phone.trim(),
          gender,
          dob,
          isd_code: countryCode.dialCode,
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
          contentContainerStyle={[styles.listContent, { paddingBottom: 90 + insets.bottom }]}
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
            const relationshipText = isSelf ? 'Self' : (item.relationship || 'Family Member');
            const initial = memberName ? memberName.charAt(0).toUpperCase() : 'M';
            const genderVal = item.gender || (isSelf ? currentUser?.gender : '');
            const phoneVal = item.phone ? `${item.isd_code ? `${item.isd_code} ` : ''}${item.phone}` : (isSelf ? currentUser?.phone : '');

            return (
              <AppCard style={styles.card}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => (isSelf ? navigation.navigate('EditProfile') : openEditModal(item))}
                >
                  {/* Card Top Row: Avatar + Name + Relationship + Actions */}
                  <View style={styles.cardHeaderRow}>
                    <View style={[styles.avatarCircle, isSelf && styles.avatarCircleSelf]}>
                      <Text style={[styles.avatarText, isSelf && styles.avatarTextSelf]}>
                        {initial}
                      </Text>
                    </View>

                    <View style={styles.headerInfo}>
                      <Text style={styles.name} numberOfLines={1}>{memberName}</Text>
                      <View style={[styles.relationBadge, isSelf ? styles.selfBadge : styles.familyBadge]}>
                        <Text style={[styles.relationBadgeText, isSelf ? styles.selfBadgeText : styles.familyBadgeText]}>
                          {relationshipText}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.actionRow}>
                      {isSelf ? (
                        <TouchableOpacity
                          style={styles.actionIconBtn}
                          onPress={() => navigation.navigate('EditProfile')}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <MaterialIcons name="edit" size={17} color={Colors.primaryColor} />
                        </TouchableOpacity>
                      ) : (
                        <>
                          <TouchableOpacity
                            style={styles.actionIconBtn}
                            onPress={() => openEditModal(item)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <MaterialIcons name="edit" size={17} color={Colors.primaryColor} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.actionIconBtn, styles.deleteIconBtn]}
                            onPress={() => handleDelete(String(item.id), memberName)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <MaterialIcons name="delete-outline" size={17} color={Colors.redColor} />
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  </View>

                  {/* Card Bottom Meta Box */}
                  {(!!genderVal || !!phoneVal || !!itemDob) && (
                    <View style={styles.metaContainerBox}>
                      {!!genderVal && (
                        <View style={styles.metaGridItem}>
                          <View style={[styles.metaIconCircle, { backgroundColor: '#EFF6FF' }]}>
                            <MaterialIcons name="wc" size={13} color="#2563EB" />
                          </View>
                          <Text style={styles.metaText}>{genderVal}</Text>
                        </View>
                      )}
                      {!!phoneVal && (
                        <View style={styles.metaGridItem}>
                          <View style={[styles.metaIconCircle, { backgroundColor: '#ECFDF5' }]}>
                            <MaterialIcons name="phone" size={13} color="#059669" />
                          </View>
                          <Text style={styles.metaText}>{phoneVal}</Text>
                        </View>
                      )}
                      {!!itemDob && (
                        <View style={styles.metaGridItem}>
                          <View style={[styles.metaIconCircle, { backgroundColor: '#FEF3C7' }]}>
                            <MaterialIcons name="cake" size={13} color="#D97706" />
                          </View>
                          <Text style={styles.metaText}>
                            {DateTimeUtils.getDataFormat(itemDob) || itemDob}
                          </Text>
                        </View>
                      )}
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
        style={[styles.fab, { bottom: 24 + insets.bottom }]}
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

              <Text style={[styles.inputLabel, styles.firstInputLabel]}>First Name*</Text>
              <TextInput
                style={styles.textInput}
                placeholder="First Name"
                placeholderTextColor="#94A3B8"
                value={firstName}
                onChangeText={setFirstName}
              />

              <Text style={styles.inputLabel}>Last Name*</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Last Name"
                placeholderTextColor="#94A3B8"
                value={lastName}
                onChangeText={setLastName}
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
                <MaterialIcons name="calendar-today" size={18} color={Colors.primaryColor} />
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgColor },
  listContent: { flexGrow: 1, padding: 16, paddingBottom: 80 },
  card: {
    marginBottom: 14,
    borderRadius: 20,
    padding: 16,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
  },
  avatarCircleSelf: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  avatarText: {
    fontSize: 18,
    fontFamily: Typography.fontFamily.bold,
    color: '#4338CA',
  },
  avatarTextSelf: {
    color: '#047857',
  },
  headerInfo: {
    flex: 1,
    marginRight: 8,
  },
  name: {
    fontSize: 16,
    fontFamily: Typography.fontFamily.bold,
    color: '#0F172A',
    marginBottom: 3,
  },
  relationBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  selfBadge: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  familyBadge: {
    backgroundColor: '#EEF2FF',
    borderColor: '#C7D2FE',
  },
  relationBadgeText: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.bold,
  },
  selfBadgeText: {
    color: '#047857',
  },
  familyBadgeText: {
    color: '#4338CA',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  actionIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteIconBtn: {
    backgroundColor: '#FEE2E2',
  },
  metaContainerBox: {
    marginTop: 12,
    paddingTop: 10,
    paddingHorizontal: 10,
    paddingBottom: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: 6,
  },
  metaGridItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: '#475569',
    fontFamily: Typography.fontFamily.medium,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
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
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryFontColor,
  },
  inputLabel: {
    fontSize: 13,
    fontFamily: Typography.fontFamily.medium,
    color: '#334155',
    marginBottom: 6,
    marginTop: 14,
  },
  firstInputLabel: {
    marginTop: 2,
  },
  textInput: {
    height: 48,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#1E293B',
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
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
    height: 48,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
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
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 10,
    gap: 10,
  },
  genderChip: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
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
    fontSize: 13,
    fontFamily: Typography.fontFamily.medium,
    color: '#475569',
  },
  genderChipTextSelected: {
    color: Colors.white,
    fontFamily: Typography.fontFamily.bold,
  },
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 10,
  },
  cancelText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.secondaryFontColor,
    fontFamily: Typography.fontFamily.medium,
  },
  saveBtn: {
    flex: 1,
  },
});
