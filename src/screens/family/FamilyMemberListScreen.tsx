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
      const selfIndex = list.findIndex(
        (m) =>
          String(m.id) === String(currentUser.id) ||
          m.relationship === 'Self' ||
          (m as any).is_self === true ||
          (m.f_name === currentUser.f_name && m.phone === currentUser.phone)
      );

      const selfItem: FamilyMemberModel = {
        id: currentUser.id,
        user_id: currentUser.id,
        f_name: currentUser.f_name,
        l_name: currentUser.l_name,
        phone: currentUser.phone,
        isd_code: currentUser.isd_code || '+91',
        gender: currentUser.gender || 'Male',
        dob: currentUser.dob || '',
        relationship: 'Self',
        is_self: true,
      } as any;

      if (selfIndex >= 0) {
        list = list.map((item, idx) =>
          idx === selfIndex
            ? {
                ...item,
                ...selfItem,
                dob: item.dob || currentUser.dob || '',
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

            return (
              <AppCard style={styles.card}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => (isSelf ? navigation.navigate('EditProfile') : openEditModal(item))}
                >
                  <View style={styles.row}>
                    <View style={styles.avatarCircle}>
                      <MaterialIcons name="person" size={26} color={Colors.primaryColor} />
                    </View>
                    <View style={styles.info}>
                      <View style={styles.nameHeaderRow}>
                        <Text style={styles.name}>{memberName}</Text>
                        {!!item.gender && (
                          <View style={styles.genderBadge}>
                            <Text style={styles.genderBadgeText}>{item.gender}</Text>
                          </View>
                        )}
                        {isSelf && (
                          <View style={styles.selfBadge}>
                            <Text style={styles.selfBadgeText}>Self</Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.metaRow}>
                        {!!item.phone && (
                          <View style={styles.metaItem}>
                            <MaterialIcons name="phone" size={13} color="#64748B" />
                            <Text style={styles.metaText}>
                              {item.isd_code ? `${item.isd_code} ` : ''}{item.phone}
                            </Text>
                          </View>
                        )}
                        {!!itemDob && (
                          <View style={styles.metaItem}>
                            <MaterialIcons name="cake" size={13} color="#64748B" />
                            <Text style={styles.metaText}>
                              {DateTimeUtils.getDataFormat(itemDob) || itemDob}
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
                          <MaterialIcons name="edit" size={18} color={Colors.primaryColor} />
                        </TouchableOpacity>
                      ) : (
                        <>
                          <TouchableOpacity
                            style={styles.actionIconBtn}
                            onPress={() => openEditModal(item)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <MaterialIcons name="edit" size={18} color={Colors.primaryColor} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.actionIconBtn, styles.deleteIconBtn]}
                            onPress={() => handleDelete(String(item.id), memberName)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <MaterialIcons name="delete-outline" size={18} color={Colors.redColor} />
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  </View>
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
  card: { marginBottom: 12, borderRadius: 16, padding: 14 },
  row: { flexDirection: 'row', alignItems: 'center' },
  avatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    borderWidth: 1.5,
    borderColor: '#DBEAFE',
  },
  info: { flex: 1 },
  nameHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontSize: 15,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryFontColor,
  },
  selfBadge: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  selfBadgeText: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.bold,
    color: '#059669',
  },
  genderBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  genderBadgeText: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.medium,
    color: '#2563EB',
  },
  metaRow: { flexDirection: 'column', marginTop: 6, gap: 4 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 12, color: Colors.secondaryFontColor, fontFamily: Typography.fontFamily.regular },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 8 },
  actionIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteIconBtn: {
    backgroundColor: '#FEE2E2',
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
