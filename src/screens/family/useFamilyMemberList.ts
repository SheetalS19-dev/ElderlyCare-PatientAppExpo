import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import type { RootStackParamList } from '../../navigation/types';
import {
  useAddFamilyMemberMutation,
  useDeleteFamilyMemberMutation,
  useGetFamilyMembersQuery,
  useUpdateFamilyMemberMutation,
} from '../../redux/apis/bookingApi';
import { useGetUserProfileQuery } from '../../redux/apis/userApi';
import {
  getSavedFamilyRelations,
  removeFamilyRelation,
  saveFamilyRelation,
} from '../../services';
import type { FamilyMemberModel, UserModel } from '../../types';
import {
  isUserSelfMember,
  showToast,
  validateDob,
  validateName,
  validatePhone,
} from '../../utils';
import {
  validateFamilyRelationDob,
  validateFamilyRelationLimit,
} from '../../validation';

export const useFamilyMemberList = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
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

  const [savedRelations, setSavedRelations] = useState<Record<string, string>>({});

  useEffect(() => {
    if (uid) {
      getSavedFamilyRelations(uid).then(setSavedRelations);
    }
  }, [uid]);

  const rawList: FamilyMemberModel[] = useMemo(() => {
    if (Array.isArray(rawData)) return rawData;
    if (Array.isArray((rawData as any)?.data)) return (rawData as any).data;
    if (Array.isArray((rawData as any)?.response)) return (rawData as any).response;
    return [];
  }, [rawData]);

  const familyList: FamilyMemberModel[] = useMemo(() => {
    const list: FamilyMemberModel[] = [...rawList];
    const mainUser = currentUser || authUser;
    const nonSelfEntries: FamilyMemberModel[] = [];

    for (const m of list) {
      const isSelf = isUserSelfMember(m, mainUser);

      if (!isSelf) {
        const memIdStr = String(m.id ?? (m as any)?.member_id ?? '');
        const enrichedRelation =
          savedRelations[memIdStr] ||
          (m as any).relation ||
          m.relationship ||
          '';
        nonSelfEntries.push({
          ...m,
          relation: enrichedRelation,
          relationship: enrichedRelation,
        } as any);
      }
    }

    return nonSelfEntries;
  }, [rawList, currentUser, authUser, savedRelations]);

  const [showModal, setShowModal] = useState(false);
  const [countryCode] = useState({
    name: 'India',
    code: 'IN',
    dialCode: '+91',
    flag: '🇮🇳',
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('');
  const [dob, setDob] = useState('');
  const [relation, setRelation] = useState('');
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  const clearError = useCallback((field: string) => {
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }, []);

  const openAddModal = useCallback(() => {
    setEditingId(null);
    setFirstName('');
    setLastName('');
    setPhone('');
    setGender('');
    setDob('');
    setRelation('');
    setErrors({});
    setShowModal(true);
  }, []);

  const openEditModal = useCallback((item: FamilyMemberModel) => {
    setEditingId(String(item.id));
    setFirstName(item.f_name || '');
    setLastName(item.l_name || '');
    setPhone(item.phone ? String(item.phone).replace(/\D/g, '').slice(-10) : '');
    setGender(item.gender || '');
    const cleanDob = item.dob ? String(item.dob).split('T')[0] : '';
    setDob(cleanDob);
    const existingRelation =
      savedRelations[String(item.id)] ||
      (item as any).relation ||
      item.relationship ||
      '';
    setRelation(existingRelation);
    setErrors({});
    setShowModal(true);
  }, [savedRelations]);

  const handleSave = useCallback(async () => {
    const nextErrors: Record<string, string> = {};

    // 1. First Name * (Mandatory)
    const fnRes = validateName(firstName, true, 'First name');
    if (!fnRes.isValid) nextErrors.firstName = fnRes.error || 'First name is required';

    // 2. Last Name (Optional, but validated if filled)
    const lnRes = validateName(lastName, false, 'Last name');
    if (!lnRes.isValid) nextErrors.lastName = lnRes.error || 'Invalid last name';

    // 3. Mobile Number * (Mandatory)
    const phoneRes = validatePhone(phone, true);
    if (!phoneRes.isValid) nextErrors.phone = phoneRes.error || 'Valid 10-digit mobile number is required';

    // 4. Gender * (Mandatory)
    if (!gender || !gender.trim()) {
      nextErrors.gender = 'Please select a gender';
    }

    // 5. Relation * (Mandatory) + Single-relation limit
    const cleanRelation = relation.trim();
    if (!cleanRelation) {
      nextErrors.relation = 'Please select a relation';
    } else {
      const limitRes = validateFamilyRelationLimit(cleanRelation, familyList, editingId);
      if (!limitRes.isValid) {
        nextErrors.relation = limitRes.error || 'This relation is already added';
      }
    }

    // 6. Date of Birth * (Mandatory) + Relation-specific age validation
    if (!dob || !dob.trim()) {
      nextErrors.dob = 'Date of birth is required';
    } else if (cleanRelation) {
      const userDob = currentUser?.dob || authUser?.dob;
      const relDobRes = validateFamilyRelationDob(dob, cleanRelation, userDob);
      if (!relDobRes.isValid) {
        nextErrors.dob = relDobRes.error || 'Invalid date of birth for this relation';
      }
    } else {
      const dobRes = validateDob(dob, true);
      if (!dobRes.isValid) nextErrors.dob = dobRes.error || 'Invalid date of birth';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    if (!uid) {
      showToast('User session expired. Please log in again.');
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

      if (editingId) {
        await updateFamilyMember({
          id: editingId,
          member_id: editingId,
          family_member_id: editingId,
          ...payload,
        }).unwrap();

        if (cleanRelation) {
          await saveFamilyRelation(uid, String(editingId), cleanRelation);
          setSavedRelations((prev) => ({ ...prev, [String(editingId)]: cleanRelation }));
        }

        showToast('Family member updated successfully');
      } else {
        const createRes: any = await addFamilyMember(payload).unwrap();
        const createdId =
          createRes?.data?.id ??
          createRes?.data?.member_id ??
          createRes?.id ??
          createRes?.member_id;

        if (createdId && cleanRelation) {
          await saveFamilyRelation(uid, String(createdId), cleanRelation);
          setSavedRelations((prev) => ({ ...prev, [String(createdId)]: cleanRelation }));
        }

        showToast('Family member added successfully');
      }

      setShowModal(false);
      refetch();
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || 'Could not save family member. Please try again.';
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
  }, [
    firstName,
    lastName,
    phone,
    gender,
    relation,
    dob,
    familyList,
    editingId,
    currentUser?.dob,
    authUser?.dob,
    uid,
    countryCode.dialCode,
    updateFamilyMember,
    addFamilyMember,
    refetch,
  ]);

  const handleDelete = useCallback((idOrItem: FamilyMemberModel | string, name?: string) => {
    const memId = typeof idOrItem === 'string' ? idOrItem : String(idOrItem.id);
    const memName = typeof idOrItem === 'string' ? (name || 'this member') : (idOrItem.f_name || idOrItem.name || 'this member');
    Alert.alert(
      'Delete Member',
      `Are you sure you want to remove ${memName} from your family members?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteFamilyMember({
                id: memId,
                member_id: memId,
                family_member_id: memId,
              }).unwrap();

              await removeFamilyRelation(uid, memId);
              setSavedRelations((prev) => {
                const copy = { ...prev };
                delete copy[memId];
                return copy;
              });

              showToast('Family member removed successfully');
              refetch();
            } catch (err: any) {
              const msg = err?.data?.message || err?.message || 'Could not remove member. Please try again.';
              showToast(msg);
            }
          },
        },
      ]
    );
  }, [deleteFamilyMember, uid, refetch]);

  return {
    navigation,
    familyList,
    isLoading,
    isError,
    refetch,
    showModal,
    setShowModal,
    editingId,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    phone,
    setPhone,
    gender,
    setGender,
    dob,
    setDob,
    relation,
    setRelation,
    errors,
    clearError,
    isSubmitting,
    countryCode,
    openAddModal,
    openEditModal,
    handleSave,
    handleDelete,
  };
};
