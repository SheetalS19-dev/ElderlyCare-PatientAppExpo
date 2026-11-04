import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Keyboard,
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
import Svg, { Circle, Line, Rect, Text as SvgText } from 'react-native-svg';
import { useDispatch } from 'react-redux';
import {
  AppButton,
  AppCard,
  AppDatePickerModal,
  AppHeader,
  AppTextField,
  AppTimePickerModal,
  EmptyState,
  ErrorState,
  LoadingIndicator,
} from '../../components';
import { Colors, Typography } from '../../constants';
import { useAuth } from '../../context/AuthContext';
import type { RootStackParamList } from '../../navigation/types';
import { baseApi } from '../../redux/apis/baseApi';
import {
  useAddFamilyMemberMutation,
  useGetFamilyMembersQuery,
} from '../../redux/apis/bookingApi';
import { useGetUserProfileQuery } from '../../redux/apis/userApi';
import {
  useAddVitalMutation,
  useDeleteVitalMutation,
  useGetVitalsQuery,
} from '../../redux/apis/vitalsApi';
import type { FamilyMemberModel, UserModel, VitalModel } from '../../types';
import { DateTimeUtils, fs, hs, showToast, TYPOGRAPHY, ws } from '../../utils';

type Props = NativeStackScreenProps<RootStackParamList, 'VitalDetails'>;

type FilterType = 'All' | 'Today' | '7 Days' | '30 Days' | 'Custom';

interface VitalStatusInfo {
  label: string;
  color: string;
  bgColor: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  normalRangeText?: string;
}

export const VitalDetailsScreen = ({ navigation, route }: Props) => {
  const { vitalName, familyMemberId: initialFamilyId } = route.params;
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const { user: authUser } = useAuth();
  const uid = String(authUser?.id ?? (authUser as any)?.user_id ?? '');

  // Automatically fetch patient profile to display real patient name instead of literal "Self"
  const { data: userProfileData } = useGetUserProfileQuery(uid, {
    skip: !uid,
  });

  const currentUser: UserModel | null = useMemo(() => {
    return userProfileData?.data ?? userProfileData ?? authUser ?? null;
  }, [userProfileData, authUser]);

  const userFullName = useMemo(() => {
    const full = `${currentUser?.f_name ?? ''} ${currentUser?.l_name ?? ''}`.trim();
    return full || (currentUser as any)?.name || currentUser?.phone || 'Patient';
  }, [currentUser]);

  // Family Members Query & Mutation
  const { data: familyData, refetch: refetchFamily } = useGetFamilyMembersQuery(uid, {
    skip: !uid,
  });
  const [addFamilyMember] = useAddFamilyMemberMutation();

  const rawFamilyList: FamilyMemberModel[] = useMemo(() => {
    let list: FamilyMemberModel[] = [];
    if (Array.isArray(familyData)) list = familyData;
    else if (Array.isArray((familyData as any)?.data)) list = (familyData as any).data;
    else if (Array.isArray((familyData as any)?.data?.data)) list = (familyData as any).data.data;
    return list;
  }, [familyData]);

  // Find existing self member in the database family_members table
  const existingSelfMemberInDb = useMemo(() => {
    const cFName = (currentUser?.f_name || '').trim().toLowerCase();
    const cPhone = (currentUser?.phone || '').trim();
    return rawFamilyList.find(
      (m) =>
        (m.relationship || '').toLowerCase() === 'self' ||
        (m as any).is_self === true ||
        (cFName && m.f_name?.trim().toLowerCase() === cFName) ||
        (cPhone && m.phone?.trim() === cPhone)
    );
  }, [rawFamilyList, currentUser]);

  const [selectedFamilyId, setSelectedFamilyId] = useState<string>(
    initialFamilyId ? String(initialFamilyId) : ''
  );
  const [showMemberDropdown, setShowMemberDropdown] = useState<boolean>(false);

  // Active Family ID: Resolves to real family_members table ID, eliminating user_id mismatch
  const activeFamilyId = useMemo(() => {
    if (
      selectedFamilyId &&
      selectedFamilyId !== uid &&
      selectedFamilyId !== 'SELF' &&
      selectedFamilyId !== 'ALL'
    ) {
      return selectedFamilyId;
    }
    if (existingSelfMemberInDb?.id) {
      return String(existingSelfMemberInDb.id);
    }
    if (rawFamilyList[0]?.id) {
      return String(rawFamilyList[0].id);
    }
    return uid;
  }, [selectedFamilyId, existingSelfMemberInDb, rawFamilyList, uid]);

  // Automatically sync selectedFamilyId when self member is resolved
  useEffect(() => {
    if (
      existingSelfMemberInDb?.id &&
      (!selectedFamilyId || selectedFamilyId === uid || selectedFamilyId === 'SELF' || selectedFamilyId === 'ALL')
    ) {
      setSelectedFamilyId(String(existingSelfMemberInDb.id));
    }
  }, [existingSelfMemberInDb, selectedFamilyId, uid]);

  const familyList: FamilyMemberModel[] = useMemo(() => {
    const list: FamilyMemberModel[] = [...rawFamilyList];

    const hasSelf = list.some(
      (m) =>
        (m.relationship || '').toLowerCase() === 'self' ||
        (m as any).is_self === true ||
        (existingSelfMemberInDb && String(m.id) === String(existingSelfMemberInDb.id))
    );

    if (!hasSelf && currentUser) {
      return [
        {
          id: existingSelfMemberInDb?.id ?? currentUser.id,
          user_id: currentUser.id,
          f_name: currentUser.f_name,
          l_name: currentUser.l_name,
          name: userFullName,
          phone: currentUser.phone,
          gender: currentUser.gender || 'Male',
          isd_code: currentUser.isd_code || '+91',
          dob: currentUser.dob || '',
          relationship: 'Self',
          is_self: true,
        },
        ...list,
      ];
    }
    return list;
  }, [rawFamilyList, currentUser, existingSelfMemberInDb, userFullName]);

  const activeMemberObj = familyList.find((m) => String(m.id) === activeFamilyId);

  // Helper to format patient display name (Always show actual name instead of literal "Self")
  const getMemberDisplayName = (mem?: FamilyMemberModel | null): string => {
    if (!mem) return userFullName;
    const isSelf =
      (mem as any).is_self === true ||
      (mem.relationship || '').toLowerCase() === 'self' ||
      String(mem.id) === String(currentUser?.id) ||
      String(mem.user_id) === String(currentUser?.id) ||
      (existingSelfMemberInDb && String(mem.id) === String(existingSelfMemberInDb.id));
    if (isSelf) return userFullName;
    return mem.name || `${mem.f_name ?? ''} ${mem.l_name ?? ''}`.trim() || 'Family Member';
  };

  const selectedMemberDisplayName = useMemo(() => {
    return getMemberDisplayName(activeMemberObj);
  }, [activeMemberObj, userFullName]);

  // Date Filter State
  const [activeFilter, setActiveFilter] = useState<FilterType>('7 Days');
  const [customFilterDate, setCustomFilterDate] = useState<string>('');
  const [showFilterPickerModal, setShowFilterPickerModal] = useState<boolean>(false);
  const [showCalendarFilterModal, setShowCalendarFilterModal] = useState<boolean>(false);

  // Vitals Query
  const { data: rawVitals, isLoading, isError, refetch } = useGetVitalsQuery(
    { familyMemberId: activeFamilyId, type: vitalName },
    { skip: !activeFamilyId }
  );

  const [addVital, { isLoading: isAdding }] = useAddVitalMutation();
  const [deleteVital] = useDeleteVitalMutation();

  const vitals: VitalModel[] = useMemo(() => {
    if (!rawVitals) return [];
    let list: VitalModel[] = [];
    if (Array.isArray(rawVitals)) list = rawVitals;
    else if (Array.isArray((rawVitals as any)?.data)) list = (rawVitals as any).data;
    else if (Array.isArray((rawVitals as any)?.data?.data)) list = (rawVitals as any).data.data;
    else if (Array.isArray((rawVitals as any)?.response)) list = (rawVitals as any).response;
    else if (Array.isArray((rawVitals as any)?.response?.data)) list = (rawVitals as any).response.data;
    else if (Array.isArray((rawVitals as any)?.result)) list = (rawVitals as any).result;

    return [...list].sort((a, b) => {
      const timeA = new Date(a.date || a.created_at || 0).getTime();
      const timeB = new Date(b.date || b.created_at || 0).getTime();
      return timeB - timeA;
    });
  }, [rawVitals]);

  const latestVital = vitals[0] ?? null;

  // Filtered vitals according to activeFilter
  const filteredVitals = useMemo(() => {
    if (activeFilter === 'All') return vitals;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    return vitals.filter((v) => {
      const vDateStr = v.date
        ? v.date.split('T')[0]
        : v.created_at
          ? v.created_at.split('T')[0]
          : '';
      if (!vDateStr) return true;

      if (activeFilter === 'Today') {
        return vDateStr === todayStr;
      }
      if (activeFilter === '7 Days') {
        const vTime = new Date(vDateStr).getTime();
        const diffDays = (now.getTime() - vTime) / (1000 * 60 * 60 * 24);
        return diffDays >= 0 && diffDays <= 7;
      }
      if (activeFilter === '30 Days') {
        const vTime = new Date(vDateStr).getTime();
        const diffDays = (now.getTime() - vTime) / (1000 * 60 * 60 * 24);
        return diffDays >= 0 && diffDays <= 30;
      }
      if (activeFilter === 'Custom' && customFilterDate) {
        return vDateStr === customFilterDate;
      }
      return true;
    });
  }, [vitals, activeFilter, customFilterDate]);

  // History vitals ALWAYS exclude the latest vital displayed in the top hero card
  const historyVitals = useMemo(() => {
    if (!latestVital) return [];
    return filteredVitals.filter((v) => {
      if (latestVital.id != null && v.id != null) {
        return String(v.id) !== String(latestVital.id);
      }
      return v !== latestVital;
    });
  }, [filteredVitals, latestVital]);

  // Modal State for Add Vital
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedTime, setSelectedTime] = useState<string>(
    new Date().toTimeString().slice(0, 5)
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [value, setValue] = useState('');
  const [sugarRandom, setSugarRandom] = useState('');

  // Field-specific validation errors below respective fields
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const openAddModal = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
    setSelectedTime(new Date().toTimeString().slice(0, 5));
    setSystolic('');
    setDiastolic('');
    setValue('');
    setSugarRandom('');
    setFieldErrors({});
    setShowModal(true);
  };

  // Helper to ensure we have a valid family_member_id from the family_members table
  const ensureValidFamilyMemberId = async (): Promise<string> => {
    const activeMember = rawFamilyList.find((m) => String(m.id) === String(activeFamilyId));
    if (activeMember && activeMember.id) {
      return String(activeMember.id);
    }

    if (existingSelfMemberInDb?.id) {
      return String(existingSelfMemberInDb.id);
    }

    try {
      const createRes: any = await addFamilyMember({
        user_id: uid,
        f_name: currentUser?.f_name || 'Patient',
        l_name: currentUser?.l_name || '',
        gender: currentUser?.gender || 'Male',
        dob: currentUser?.dob || '1990-01-01',
        phone: currentUser?.phone || '',
        isd_code: currentUser?.isd_code || '+91',
        relationship: 'Self',
      }).unwrap();

      const newId =
        createRes?.data?.id ??
        createRes?.data?.member_id ??
        createRes?.id ??
        createRes?.member_id;

      if (newId) {
        setSelectedFamilyId(String(newId));
        refetchFamily();
        return String(newId);
      }
    } catch {
      // If auto-create failed, fall back to activeFamilyId
    }

    return activeFamilyId;
  };

  const handleModalSubmit = async () => {
    Keyboard.dismiss();
    const errors: Record<string, string> = {};

    if (!selectedDate) {
      errors.date = 'Date is required';
    }
    if (!selectedTime) {
      errors.time = 'Time is required';
    }

    if (vitalName === 'Blood Pressure') {
      if (!systolic.trim()) {
        errors.systolic = 'Systolic BP is required';
      } else {
        const sys = parseFloat(systolic.trim());
        if (isNaN(sys) || sys < 40 || sys > 300) {
          errors.systolic = 'Systolic BP must be between 40 and 300 mmHg';
        }
      }

      if (!diastolic.trim()) {
        errors.diastolic = 'Diastolic BP is required';
      } else {
        const dia = parseFloat(diastolic.trim());
        if (isNaN(dia) || dia < 30 || dia > 200) {
          errors.diastolic = 'Diastolic BP must be between 30 and 200 mmHg';
        }
      }
    } else if (vitalName === 'Sugar') {
      if (!value.trim() && !sugarRandom.trim()) {
        errors.value = 'Please enter Fasting or Random sugar value';
      } else {
        if (value.trim()) {
          const fasting = parseFloat(value.trim());
          if (isNaN(fasting) || fasting < 20 || fasting > 1000) {
            errors.value = 'Fasting sugar must be between 20 and 1000 mg/dL';
          }
        }
        if (sugarRandom.trim()) {
          const random = parseFloat(sugarRandom.trim());
          if (isNaN(random) || random < 20 || random > 1000) {
            errors.sugarRandom = 'Random sugar must be between 20 and 1000 mg/dL';
          }
        }
      }
    } else if (vitalName === 'Weight') {
      if (!value.trim()) {
        errors.value = 'Weight is required';
      } else {
        const wt = parseFloat(value.trim());
        if (isNaN(wt) || wt < 1 || wt > 500) {
          errors.value = `${value.trim()} kg is outside accepted range (1–500 kg)`;
        }
      }
    } else if (vitalName === 'Temperature') {
      if (!value.trim()) {
        errors.value = 'Temperature is required';
      } else {
        const temp = parseFloat(value.trim());
        if (isNaN(temp) || temp < 70 || temp > 115) {
          errors.value = `${value.trim()} °F is outside accepted range (70–115 °F)`;
        }
      }
    } else if (vitalName === 'SpO2') {
      if (!value.trim()) {
        errors.value = 'SpO2 percentage is required';
      } else {
        const spo2 = parseFloat(value.trim());
        if (isNaN(spo2) || spo2 < 1 || spo2 > 100) {
          errors.value = 'SpO2 percentage must be between 1% and 100%';
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});

    const targetMemberId = await ensureValidFamilyMemberId();

    const payload: any = {
      user_id: uid,
      family_member_id: targetMemberId,
      type: vitalName,
      date: selectedDate,
      time: selectedTime,
    };

    if (vitalName === 'Blood Pressure') {
      payload.bp_systolic = systolic.trim();
      payload.bp_diastolic = diastolic.trim();
    } else if (vitalName === 'Sugar') {
      if (value.trim()) payload.sugar_fasting = value.trim();
      if (sugarRandom.trim()) payload.sugar_random = sugarRandom.trim();
    } else if (vitalName === 'Weight') {
      payload.weight = value.trim();
    } else if (vitalName === 'Temperature') {
      payload.temperature = value.trim();
    } else if (vitalName === 'SpO2') {
      payload.spo2 = value.trim();
    }

    try {
      await addVital(payload).unwrap();
      showToast(`${vitalName} logged successfully`);
      setShowModal(false);

      // Immediately sync selectedFamilyId to the saved member ID
      setSelectedFamilyId(String(targetMemberId));

      // Invalidate RTK Query cache globally so all screens update immediately
      dispatch(baseApi.util.invalidateTags(['Vitals']));
      await refetch();
      refetchFamily();
    } catch (e: any) {
      const errMsg = e?.data?.message || e?.message || '';
      if (
        errMsg.toLowerCase().includes('foreign key constraint') ||
        errMsg.toLowerCase().includes('vital_family_member_id')
      ) {
        try {
          const createRes: any = await addFamilyMember({
            user_id: uid,
            f_name: currentUser?.f_name || 'Patient',
            l_name: currentUser?.l_name || '',
            gender: currentUser?.gender || 'Male',
            dob: currentUser?.dob || '1990-01-01',
            phone: currentUser?.phone || '',
            isd_code: currentUser?.isd_code || '+91',
            relationship: 'Self',
          }).unwrap();
          const retryId =
            createRes?.data?.id ??
            createRes?.data?.member_id ??
            createRes?.id ??
            createRes?.member_id;
          if (retryId) {
            payload.family_member_id = String(retryId);
            setSelectedFamilyId(String(retryId));
            await addVital(payload).unwrap();
            showToast(`${vitalName} logged successfully`);
            setShowModal(false);
            dispatch(baseApi.util.invalidateTags(['Vitals']));
            await refetch();
            refetchFamily();
            return;
          }
        } catch {
          // fall through
        }
      }
      setFieldErrors({
        general: errMsg || 'Failed to save vital reading',
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteVital({ id }).unwrap();
      showToast('Record deleted');
      dispatch(baseApi.util.invalidateTags(['Vitals']));
      await refetch();
    } catch (e: any) {
      showToast(e?.data?.message || 'Could not delete record');
    }
  };

  const renderVitalValue = (item: VitalModel) => {
    if (vitalName === 'Blood Pressure') {
      return `${item.bp_systolic ?? '--'} / ${item.bp_diastolic ?? '--'} mmHg`;
    }
    if (vitalName === 'Sugar') {
      const parts = [];
      if (item.sugar_fasting) parts.push(`Fasting: ${item.sugar_fasting} mg/dL`);
      if (item.sugar_random) parts.push(`Random: ${item.sugar_random} mg/dL`);
      return parts.length > 0 ? parts.join('  •  ') : '-- mg/dL';
    }
    if (vitalName === 'Weight') return `${item.weight ?? (item as any)?.value ?? '--'} kg`;
    if (vitalName === 'Temperature') return `${item.temperature ?? (item as any)?.value ?? '--'} °F`;
    if (vitalName === 'SpO2') return `${item.spo2 ?? (item as any)?.value ?? '--'} %`;
    return '--';
  };

  const getVitalIcon = () => {
    if (vitalName === 'Blood Pressure') return { icon: 'favorite', color: Colors.redColor, bg: '#FEE2E2' };
    if (vitalName === 'Sugar') return { icon: 'opacity', color: '#8B5CF6', bg: '#EDE9FE' };
    if (vitalName === 'Weight') return { icon: 'fitness-center', color: '#2563EB', bg: '#EFF6FF' };
    if (vitalName === 'Temperature') return { icon: 'thermostat', color: '#D97706', bg: '#FEF3C7' };
    if (vitalName === 'SpO2') return { icon: 'air', color: '#0284C7', bg: '#E0F2FE' };
    return { icon: 'favorite', color: Colors.primaryColor, bg: '#EFF6FF' };
  };

  const iconInfo = getVitalIcon();

  const formatVitalDateTime = (dateStr?: string, timeStr?: string) => {
    const dFormatted = dateStr ? DateTimeUtils.getDataFormat(dateStr) : '';
    const tFormatted = timeStr ? DateTimeUtils.formatTimeToAmPm(timeStr) || timeStr : '';
    if (dFormatted && tFormatted) return `${dFormatted}, ${tFormatted}`;
    if (dFormatted) return dFormatted;
    if (tFormatted) return tFormatted;
    return '--';
  };

  // Dynamic Vital Status Calculation
  const getVitalStatus = (item?: VitalModel | null): VitalStatusInfo => {
    if (!item) {
      return {
        label: 'No Data',
        color: '#64748B',
        bgColor: '#F1F5F9',
        icon: 'help-outline',
      };
    }

    if (vitalName === 'Temperature') {
      const temp = parseFloat(String(item.temperature || (item as any)?.value || ''));
      if (isNaN(temp)) {
        return {
          label: 'Recorded',
          color: '#64748B',
          bgColor: '#F1F5F9',
          icon: 'info-outline',
          normalRangeText: 'Normal range: 97.0 – 99.5 °F',
        };
      }
      if (temp < 97.0) {
        return {
          label: 'Below Normal',
          color: '#DC2626',
          bgColor: '#FEE2E2',
          icon: 'error-outline',
          normalRangeText: 'Normal range: 97.0 – 99.5 °F',
        };
      }
      if (temp <= 99.5) {
        return {
          label: 'Normal',
          color: '#059669',
          bgColor: '#ECFDF5',
          icon: 'check-circle-outline',
          normalRangeText: 'Normal range: 97.0 – 99.5 °F',
        };
      }
      if (temp <= 100.4) {
        return {
          label: 'Elevated',
          color: '#D97706',
          bgColor: '#FEF3C7',
          icon: 'warning-amber',
          normalRangeText: 'Normal range: 97.0 – 99.5 °F',
        };
      }
      return {
        label: 'High (Fever)',
        color: '#DC2626',
        bgColor: '#FEE2E2',
        icon: 'error-outline',
        normalRangeText: 'Normal range: 97.0 – 99.5 °F',
      };
    }

    if (vitalName === 'Weight') {
      return {
        label: 'Latest reading',
        color: '#2563EB',
        bgColor: '#EFF6FF',
        icon: 'fitness-center',
        normalRangeText: 'Track weight changes over time',
      };
    }

    if (vitalName === 'Blood Pressure') {
      const sys = parseFloat(String(item.bp_systolic || ''));
      const dia = parseFloat(String(item.bp_diastolic || ''));
      if (isNaN(sys) || isNaN(dia)) {
        return {
          label: 'Recorded',
          color: '#64748B',
          bgColor: '#F1F5F9',
          icon: 'info-outline',
          normalRangeText: 'Normal: < 120/80 mmHg',
        };
      }
      if (sys < 120 && dia < 80) {
        return {
          label: 'Normal',
          color: '#059669',
          bgColor: '#ECFDF5',
          icon: 'check-circle-outline',
          normalRangeText: 'Normal: < 120/80 mmHg',
        };
      }
      if (sys <= 129 && dia < 80) {
        return {
          label: 'Elevated',
          color: '#D97706',
          bgColor: '#FEF3C7',
          icon: 'warning-amber',
          normalRangeText: 'Normal: < 120/80 mmHg',
        };
      }
      if ((sys >= 130 && sys <= 139) || (dia >= 80 && dia <= 89)) {
        return {
          label: 'Stage 1 High',
          color: '#EA580C',
          bgColor: '#FFEDD5',
          icon: 'error-outline',
          normalRangeText: 'Normal: < 120/80 mmHg',
        };
      }
      return {
        label: 'Stage 2 High',
        color: '#DC2626',
        bgColor: '#FEE2E2',
        icon: 'error-outline',
        normalRangeText: 'Normal: < 120/80 mmHg',
      };
    }

    if (vitalName === 'Sugar') {
      const fasting = parseFloat(String(item.sugar_fasting || ''));
      if (!isNaN(fasting)) {
        if (fasting < 70) {
          return {
            label: 'Low',
            color: '#DC2626',
            bgColor: '#FEE2E2',
            icon: 'error-outline',
            normalRangeText: 'Fasting normal: 70 – 99 mg/dL',
          };
        }
        if (fasting <= 99) {
          return {
            label: 'Normal',
            color: '#059669',
            bgColor: '#ECFDF5',
            icon: 'check-circle-outline',
            normalRangeText: 'Fasting normal: 70 – 99 mg/dL',
          };
        }
        if (fasting <= 125) {
          return {
            label: 'Prediabetes',
            color: '#D97706',
            bgColor: '#FEF3C7',
            icon: 'warning-amber',
            normalRangeText: 'Fasting normal: 70 – 99 mg/dL',
          };
        }
        return {
          label: 'High',
          color: '#DC2626',
          bgColor: '#FEE2E2',
          icon: 'error-outline',
          normalRangeText: 'Fasting normal: 70 – 99 mg/dL',
        };
      }
      return {
        label: 'Recorded',
        color: '#64748B',
        bgColor: '#F1F5F9',
        icon: 'info-outline',
        normalRangeText: 'Fasting normal: 70 – 99 mg/dL',
      };
    }

    if (vitalName === 'SpO2') {
      const spo2 = parseFloat(String(item.spo2 || (item as any)?.value || ''));
      if (isNaN(spo2)) {
        return {
          label: 'Recorded',
          color: '#64748B',
          bgColor: '#F1F5F9',
          icon: 'info-outline',
          normalRangeText: 'Normal: 95 – 100 %',
        };
      }
      if (spo2 >= 95) {
        return {
          label: 'Normal',
          color: '#059669',
          bgColor: '#ECFDF5',
          icon: 'check-circle-outline',
          normalRangeText: 'Normal: 95 – 100 %',
        };
      }
      if (spo2 >= 90) {
        return {
          label: 'Low',
          color: '#D97706',
          bgColor: '#FEF3C7',
          icon: 'warning-amber',
          normalRangeText: 'Normal: 95 – 100 %',
        };
      }
      return {
        label: 'Critical',
        color: '#DC2626',
        bgColor: '#FEE2E2',
        icon: 'error-outline',
        normalRangeText: 'Normal: 95 – 100 %',
      };
    }

    return {
      label: 'Recorded',
      color: '#64748B',
      bgColor: '#F1F5F9',
      icon: 'info-outline',
    };
  };

  const latestStatus = getVitalStatus(latestVital);

  // Weight trend detection for Hero Card (decrease in red, increase in green)
  const heroWeightTrend = useMemo(() => {
    if (vitalName !== 'Weight' || vitals.length < 2) return null;
    const latest = parseFloat(String(vitals[0]?.weight || (vitals[0] as any)?.value || ''));
    const prev = parseFloat(String(vitals[1]?.weight || (vitals[1] as any)?.value || ''));
    if (isNaN(latest) || isNaN(prev)) return null;
    const diff = latest - prev;
    if (diff < -0.01) {
      return {
        diffText: `${diff.toFixed(1)} kg`,
        label: 'Weight Decreased',
        color: '#EF4444',
        bgColor: '#FEE2E2',
        icon: 'trending-down' as keyof typeof MaterialIcons.glyphMap,
      };
    }
    if (diff > 0.01) {
      return {
        diffText: `+${diff.toFixed(1)} kg`,
        label: 'Weight Increased',
        color: '#10B981',
        bgColor: '#ECFDF5',
        icon: 'trending-up' as keyof typeof MaterialIcons.glyphMap,
      };
    }
    return {
      diffText: '0.0 kg',
      label: 'No Change',
      color: '#2563EB',
      bgColor: '#EFF6FF',
      icon: 'trending-flat' as keyof typeof MaterialIcons.glyphMap,
    };
  }, [vitalName, vitals]);

  // Weight Trend SVG Chart Calculations: computes change colors (decrease in RED, increase in GREEN)
  const { chartPoints, yTicks, chartW, chartH } = useMemo(() => {
    if (vitalName !== 'Weight') {
      return { chartPoints: [], yTicks: [], chartW: 0, chartH: 0 };
    }

    const recordsSource = filteredVitals.length > 0 ? filteredVitals : vitals;
    const valid = recordsSource
      .filter((item) => {
        const val = parseFloat(String(item.weight || (item as any)?.value || ''));
        return !isNaN(val) && val > 0;
      })
      .slice(0, 7)
      .reverse(); // Chronological: oldest to newest

    if (valid.length === 0) {
      return {
        chartPoints: [],
        yTicks: [120, 100, 80, 60, 40],
        chartW: ws(310),
        chartH: hs(130),
      };
    }

    const values = valid.map((r) => parseFloat(String(r.weight || (r as any)?.value || 0)));
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);

    const bottom = Math.max(0, Math.floor((minVal - 10) / 10) * 10);
    const top = Math.ceil((maxVal + 10) / 10) * 10;
    const range = Math.max(top - bottom, 20);

    const step = range / 4;
    const ticks = [
      Math.round(top),
      Math.round(top - step),
      Math.round(top - step * 2),
      Math.round(top - step * 3),
      Math.round(bottom),
    ];

    const cWidth = ws(310);
    const cHeight = hs(130);
    const padLeft = ws(34);
    const padRight = ws(20);
    const padTop = hs(18);
    const padBottom = hs(22);
    const availW = cWidth - padLeft - padRight;
    const availH = cHeight - padTop - padBottom;

    const points = valid.map((r, idx) => {
      const val = parseFloat(String(r.weight || (r as any)?.value || 0));
      const x =
        valid.length === 1
          ? padLeft + availW / 2
          : padLeft + (idx / (valid.length - 1)) * availW;
      const y = padTop + availH - ((val - bottom) / range) * availH;

      const rawDate = r.date || r.created_at || '';
      let label = '';
      if (rawDate) {
        const d = new Date(rawDate);
        if (!isNaN(d.getTime())) {
          label = `${d.getDate()} ${DateTimeUtils.getMonthName(d.getMonth() + 1).slice(0, 3)}`;
        }
      }

      // Check change against previous chronological reading
      let changeColor = '#2563EB';
      if (idx > 0) {
        const prevVal = parseFloat(String(valid[idx - 1].weight || (valid[idx - 1] as any)?.value || 0));
        const diff = val - prevVal;
        if (diff < -0.01) {
          changeColor = '#EF4444'; // RED for decrease
        } else if (diff > 0.01) {
          changeColor = '#10B981'; // GREEN for increase
        }
      }

      return {
        x,
        y,
        val,
        label,
        isLatest: idx === valid.length - 1,
        changeColor,
      };
    });

    return { chartPoints: points, yTicks: ticks, chartW: cWidth, chartH: cHeight };
  }, [vitalName, filteredVitals, vitals]);

  return (
    <View style={styles.container}>
      <AppHeader title={`${vitalName} Tracker`} onBackPress={() => navigation.goBack()} />

      {/* Dropdown heading changed to "Name" */}
      {familyList.length > 0 && (
        <View style={styles.memberDropdownSection}>
          <Text style={styles.memberDropdownLabel}>Name</Text>
          <View style={styles.memberDropdownContainer}>
            <TouchableOpacity
              style={[
                styles.memberDropdownField,
                showMemberDropdown && styles.memberDropdownFieldOpen,
              ]}
              activeOpacity={0.85}
              onPress={() => setShowMemberDropdown((prev) => !prev)}
            >
              <Text style={styles.memberDropdownFieldText} numberOfLines={1}>
                {selectedMemberDisplayName}
              </Text>
              <MaterialIcons
                name={showMemberDropdown ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                size={fs(20)}
                color={Colors.primaryColor}
              />
            </TouchableOpacity>

            {showMemberDropdown && (
              <View style={styles.memberDropdownMenuCard}>
                <ScrollView
                  nestedScrollEnabled
                  bounces={false}
                  showsVerticalScrollIndicator={false}
                  style={{ maxHeight: hs(220) }}
                >
                  {familyList.map((mem) => {
                    const isSelected = String(mem.id) === activeFamilyId;
                    const displayName = getMemberDisplayName(mem);

                    return (
                      <TouchableOpacity
                        key={`dropdown-mem-${mem.id}`}
                        style={[
                          styles.memberDropdownMenuItem,
                          isSelected && styles.memberDropdownMenuItemActive,
                        ]}
                        activeOpacity={0.7}
                        onPress={() => {
                          setSelectedFamilyId(String(mem.id));
                          setShowMemberDropdown(false);
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
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Date Filter Bar */}
      <View style={styles.dateFilterRow}>
        <TouchableOpacity
          style={styles.filterDropdownBtn}
          onPress={() => setShowFilterPickerModal(true)}
          activeOpacity={0.8}
        >
          <MaterialIcons name="calendar-today" size={15} color="#2563EB" />
          <Text style={styles.filterDropdownBtnText}>
            {activeFilter === 'Custom' && customFilterDate
              ? DateTimeUtils.getDataFormat(customFilterDate)
              : activeFilter === '7 Days'
                ? 'Last 7 Days'
                : activeFilter === '30 Days'
                  ? 'Last 30 Days'
                  : activeFilter === 'Today'
                    ? 'Today'
                    : 'All Records'}
          </Text>
          <MaterialIcons name="keyboard-arrow-down" size={18} color="#2563EB" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.filterCalendarBtn}
          onPress={() => setShowCalendarFilterModal(true)}
          activeOpacity={0.8}
        >
          <MaterialIcons name="event" size={16} color="#475569" />
          <Text style={styles.filterCalendarBtnText}>View Calendar</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <LoadingIndicator />
      ) : isError ? (
        <ErrorState message="Couldn't load vital history" onRetry={refetch} />
      ) : (
        <FlatList
          data={historyVitals}
          keyExtractor={(item, index) => `v-${item.id ?? index}`}
          contentContainerStyle={[
            styles.listContent,
            { flexGrow: 1, paddingBottom: hs(140) + Math.max(insets.bottom, hs(24)) },
          ]}
          ListHeaderComponent={
            <View>
              {/* Latest Vital Hero Card */}
              {latestVital && (
                <AppCard style={styles.heroCard}>
                  <View style={styles.heroHeaderRow}>
                    <View
                      style={[
                        styles.heroIconCircle,
                        {
                          backgroundColor:
                            vitalName === 'Weight' && heroWeightTrend
                              ? heroWeightTrend.bgColor
                              : iconInfo.bg,
                        },
                      ]}
                    >
                      <MaterialIcons
                        name={
                          (vitalName === 'Weight' && heroWeightTrend
                            ? heroWeightTrend.icon
                            : iconInfo.icon) as any
                        }
                        size={24}
                        color={
                          vitalName === 'Weight' && heroWeightTrend
                            ? heroWeightTrend.color
                            : iconInfo.color
                        }
                      />
                    </View>
                    <View style={styles.heroTitleCol}>
                      <Text style={styles.heroLabel}>Latest {vitalName}</Text>
                        <Text style={styles.heroTime} numberOfLines={1}>
                          {formatVitalDateTime(
                            latestVital.date || latestVital.created_at,
                            latestVital.time
                          )}
                        </Text>
                    </View>

                        {/* Non-weight status badge in header row */}
                        {vitalName !== 'Weight' && (
                          <View
                            style={[
                              styles.statusBadge,
                              { backgroundColor: latestStatus.bgColor },
                            ]}
                          >
                    <MaterialIcons
                      name={latestStatus.icon}
                      size={13}
                      color={latestStatus.color}
                      style={{ marginRight: ws(3) }}
                    />
                    <Text
                      style={[
                        styles.statusBadgeText,
                        { color: latestStatus.color },
                      ]}
                    >
                      {latestStatus.label}
                    </Text>
                  </View>
                    )}

                  {/* Delete action button */}
                  {!!latestVital.id && (
                    <View style={styles.heroActionBtns}>
                      <TouchableOpacity
                        style={styles.actionIconBtnDelete}
                        onPress={() => handleDelete(String(latestVital.id))}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <MaterialIcons name="delete-outline" size={15} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                  {/* Value and Normal Range column layout */}
              <View style={styles.heroBottomContainer}>
                {vitalName === 'Sugar' ? (
                  <View style={styles.heroSugarColsRow}>
                    <View style={styles.heroSugarCol}>
                      <Text style={styles.heroSugarColLabel}>Fasting</Text>
                      <Text style={styles.heroSugarColValue}>
                        {latestVital.sugar_fasting ? `${latestVital.sugar_fasting}` : '--'}
                        <Text style={styles.heroSugarColUnit}> mg/dL</Text>
                      </Text>
                    </View>
                    <View style={styles.heroSugarDivider} />
                    <View style={styles.heroSugarCol}>
                      <Text style={styles.heroSugarColLabel}>Random</Text>
                      <Text style={styles.heroSugarColValue}>
                        {latestVital.sugar_random ? `${latestVital.sugar_random}` : '--'}
                        <Text style={styles.heroSugarColUnit}> mg/dL</Text>
                      </Text>
                    </View>
                  </View>
                ) : (
                      <View style={styles.heroValueAndBadgeRow}>
                        <Text style={styles.heroValueText}>
                          {renderVitalValue(latestVital)}
                        </Text>

                        {/* Weight status badge moved beside weight value to give title row full width */}
                        {vitalName === 'Weight' && heroWeightTrend && (
                          <View
                            style={[
                              styles.statusBadge,
                              {
                                backgroundColor: heroWeightTrend.bgColor,
                                paddingHorizontal: ws(10),
                                paddingVertical: hs(4),
                              },
                            ]}
                          >
                            <MaterialIcons
                              name={heroWeightTrend.icon as any}
                              size={14}
                              color={heroWeightTrend.color}
                              style={{ marginRight: ws(4) }}
                            />
                            <Text
                              style={[
                                styles.statusBadgeText,
                                {
                                  color: heroWeightTrend.color,
                                  fontSize: fs(11.5),
                                },
                              ]}
                            >
                              {`${heroWeightTrend.label} (${heroWeightTrend.diffText})`}
                            </Text>
                          </View>
                        )}
                      </View>
                )}

                {latestStatus.normalRangeText ? (
                  <View style={styles.heroRangeRow}>
                    <MaterialIcons
                      name="info-outline"
                      size={13}
                      color="#64748B"
                      style={{ marginRight: ws(4) }}
                    />
                    <Text style={styles.heroRangeText}>{latestStatus.normalRangeText}</Text>
                  </View>
                ) : null}
              </View>
            </AppCard>
              )}

      {/* Weight Trend Chart for Weight Tracker */}
      {vitalName === 'Weight' && (
        <AppCard style={styles.chartCard}>
          <View style={styles.chartTitleRow}>
            <View style={styles.chartTitleLeft}>
              <MaterialIcons name="show-chart" size={18} color="#2563EB" />
              <Text style={styles.chartTitleText}>Weight Trend</Text>
            </View>
            {/* Chart Legend: Red for Decrease, Green for Increase */}
            <View style={styles.chartLegendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
                <Text style={styles.legendText}>Decrease</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
                <Text style={styles.legendText}>Increase</Text>
              </View>
            </View>
          </View>

          <View style={styles.chartContainer}>
            {chartPoints.length === 0 ? (
              <View style={styles.emptyChartBox}>
                <Text style={styles.emptyChartText}>
                  No weight logs recorded in this period.
                </Text>
              </View>
            ) : (
              <Svg width={chartW} height={chartH}>
                {/* Grid Lines */}
                {yTicks.map((tick, idx) => {
                  const yPos =
                    hs(18) +
                    (idx / (yTicks.length - 1)) * (chartH - hs(18) - hs(22));
                  return (
                    <React.Fragment key={`grid-${idx}`}>
                      <Line
                        x1={ws(34)}
                        y1={yPos}
                        x2={chartW - ws(20)}
                        y2={yPos}
                        stroke="#E2E8F0"
                        strokeDasharray="3,3"
                        strokeWidth={1}
                      />
                      <SvgText
                        x={ws(28)}
                        y={yPos + hs(3)}
                        fontSize={fs(9)}
                        fill="#94A3B8"
                        textAnchor="end"
                      >
                        {tick}
                      </SvgText>
                    </React.Fragment>
                  );
                })}

                {/* Chart Line Segments: colored RED for decrease, GREEN for increase */}
                {chartPoints.map((pt, idx) => {
                  if (idx === 0) return null;
                  const prevPt = chartPoints[idx - 1];
                  return (
                    <Line
                      key={`seg-${idx}`}
                      x1={prevPt.x}
                      y1={prevPt.y}
                      x2={pt.x}
                      y2={pt.y}
                      stroke={pt.changeColor}
                      strokeWidth={3}
                      strokeLinecap="round"
                    />
                  );
                })}

                {/* Chart Dots & Value Tooltip */}
                {chartPoints.map((pt, idx) => (
                  <React.Fragment key={`pt-${idx}`}>
                    <Circle
                      cx={pt.x}
                      cy={pt.y}
                      r={pt.isLatest ? 5.5 : 4}
                      fill={pt.changeColor}
                      stroke="#FFFFFF"
                      strokeWidth={2}
                    />
                    {pt.isLatest && (
                      <React.Fragment>
                        <Rect
                          x={pt.x - ws(26)}
                          y={pt.y - hs(22)}
                          width={ws(52)}
                          height={hs(16)}
                          rx={fs(5)}
                          fill={pt.changeColor}
                        />
                        <SvgText
                          x={pt.x}
                          y={pt.y - hs(10)}
                          fontSize={fs(9)}
                          fill="#FFFFFF"
                          textAnchor="middle"
                          fontWeight="bold"
                        >
                          {`${pt.val} kg`}
                        </SvgText>
                      </React.Fragment>
                    )}

                    <SvgText
                      x={pt.x}
                      y={chartH - hs(6)}
                      fontSize={fs(9)}
                      fill="#94A3B8"
                      textAnchor="middle"
                    >
                      {pt.label}
                    </SvgText>
                  </React.Fragment>
                ))}
              </Svg>
            )}
          </View>
        </AppCard>
      )}

      {/* History Section Header: only shown if there are earlier records */}
      {historyVitals.length > 0 && (
        <View style={styles.historySectionHeaderRow}>
          <Text style={styles.historySectionTitle}>
            {vitalName === 'Temperature'
              ? 'Temperature History'
              : vitalName === 'Weight'
                ? `Recent Entries (${historyVitals.length} Entries)`
                : `${vitalName} History`}
          </Text>
        </View>
      )}
    </View>
          }
ListEmptyComponent = {
  latestVital? null: (
    <EmptyState message={`No ${vitalName} records found.`} />
  )
}
renderItem = {({ item }) => {
  const itemStatus = getVitalStatus(item);

  // Compute weight change for this history entry
  let isDecreased = false;
  let isIncreased = false;
  let weightDiffStr = '';

  if (vitalName === 'Weight') {
    const currentVal = parseFloat(String(item.weight || (item as any)?.value || ''));
    const itemTime = new Date(item.date || item.created_at || 0).getTime();
    const prevEntry = vitals.find((v) => {
      const t = new Date(v.date || v.created_at || 0).getTime();
      return t < itemTime && (v.weight || (v as any)?.value);
    });
    const prevVal = prevEntry
      ? parseFloat(String(prevEntry.weight || (prevEntry as any)?.value || ''))
      : NaN;

    if (!isNaN(currentVal) && !isNaN(prevVal)) {
      const diff = currentVal - prevVal;
      if (diff < -0.01) {
        isDecreased = true;
        weightDiffStr = `${diff.toFixed(1)} kg`;
      } else if (diff > 0.01) {
        isIncreased = true;
        weightDiffStr = `+${diff.toFixed(1)} kg`;
      }
    }
  }

  // Red for decrease, Green for increase
  const itemWeightColor = isDecreased ? '#EF4444' : isIncreased ? '#10B981' : '#2563EB';
  const itemWeightBg = isDecreased ? '#FEE2E2' : isIncreased ? '#ECFDF5' : '#EFF6FF';
  const itemWeightIcon = isDecreased
    ? 'trending-down'
    : isIncreased
      ? 'trending-up'
      : 'fitness-center';

  return (
      <AppCard style={styles.compactHistoryCard}>
        <View style={styles.historyRow}>
          <View
            style={[
              styles.itemIconCircle,
              {
                backgroundColor:
                  vitalName === 'Weight' ? itemWeightBg : iconInfo.bg,
              },
            ]}
          >
            <MaterialIcons
              name={(vitalName === 'Weight' ? itemWeightIcon : iconInfo.icon) as any}
              size={18}
              color={vitalName === 'Weight' ? itemWeightColor : iconInfo.color}
            />
          </View>

          <View style={styles.historyInfo}>
            <View style={styles.historyValueAndStatusRow}>
              {vitalName === 'Sugar' ? (
                <View style={styles.historySugarValuesCol}>
                  <Text style={styles.historyValueText}>
                    Fasting: {item.sugar_fasting ? `${item.sugar_fasting} mg/dL` : '--'}
                  </Text>
                  {!!item.sugar_random && (
                    <Text style={styles.historySubValueText}>
                      Random: {`${item.sugar_random} mg/dL`}
                    </Text>
                  )}
                </View>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <Text
                    style={styles.historyValueText}
                    numberOfLines={1}
                  >
                    {renderVitalValue(item)}
                  </Text>

                  {/* Weight badge: Red for decrease, Green for increase */}
                  {vitalName === 'Weight' && (isDecreased || isIncreased) && (
                    <View
                      style={[
                        styles.historyStatusBadge,
                        { backgroundColor: itemWeightBg, marginLeft: ws(6) },
                      ]}
                    >
                      <MaterialIcons
                        name={itemWeightIcon as any}
                        size={11}
                        color={itemWeightColor}
                        style={{ marginRight: ws(2) }}
                      />
                      <Text
                        style={[
                          styles.historyStatusText,
                          { color: itemWeightColor, fontWeight: '700' },
                        ]}
                      >
                        {weightDiffStr}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* History Status Pill for non-weight readings */}
              {vitalName !== 'Weight' && itemStatus && (
                <View
                  style={[
                    styles.historyStatusBadge,
                    { backgroundColor: itemStatus.bgColor },
                  ]}
                >
                  <MaterialIcons
                    name={itemStatus.icon}
                    size={10}
                    color={itemStatus.color}
                    style={{ marginRight: ws(3) }}
                  />
                  <Text
                    style={[
                      styles.historyStatusText,
                      { color: itemStatus.color },
                    ]}
                  >
                    {itemStatus.label}
                  </Text>
                </View>
              )}
            </View>

            <Text style={styles.historyDateText}>
              {formatVitalDateTime(item.date || item.created_at, item.time)}
            </Text>
          </View>

          {/* Delete action button */}
          <View style={styles.actionRow}>
            {!!item.id && (
              <TouchableOpacity
                style={styles.actionIconBtnDelete}
                onPress={() => handleDelete(String(item.id))}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialIcons name="delete-outline" size={16} color="#EF4444" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </AppCard>
      );
          }}
        />
      )}

      {/* FAB Add Reading Button */}
      <TouchableOpacity
        style={[styles.fab, { bottom: hs(24) + Math.max(insets.bottom, hs(16)) }]}
        activeOpacity={0.85}
        onPress={openAddModal}
      >
        <MaterialIcons name="add" size={28} color={Colors.white} />
      </TouchableOpacity>

      {/* Add Vital Data Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => {
          Keyboard.dismiss();
          setShowModal(false);
        }}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity
            style={styles.backdropPressable}
            activeOpacity={1}
            onPress={() => {
              Keyboard.dismiss();
              setShowModal(false);
            }}
          />
          <View style={[styles.modalBox, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            {/* Header */}
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Add {vitalName} Data</Text>
              <TouchableOpacity
                onPress={() => {
                  Keyboard.dismiss();
                  setShowModal(false);
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialIcons name="close" size={22} color={Colors.primaryFontColor} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalScrollBody}
              contentContainerStyle={styles.modalScrollContent}
              keyboardShouldPersistTaps="handled"
              bounces={false}
              showsVerticalScrollIndicator={false}
            >
              {/* Label changed to "Name *" and field permanently non-editable */}
              <View style={styles.modalFieldGroup}>
                <Text style={styles.modalFieldLabel}>Name *</Text>
                <View style={[styles.memberBox, styles.memberBoxReadOnly]}>
                  <MaterialIcons
                    name="person-outline"
                    size={18}
                    color="#64748B"
                    style={{ marginRight: ws(8) }}
                  />
                  <Text style={styles.memberBoxText}>{selectedMemberDisplayName}</Text>
                  <MaterialIcons
                    name="lock-outline"
                    size={16}
                    color="#94A3B8"
                    style={{ marginLeft: 'auto' }}
                  />
                </View>
              </View>

              {/* Date & Time Selection Row */}
              <View style={styles.dateTimeRow}>
                {/* Select Date */}
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalFieldLabel}>Select Date *</Text>
                  <TouchableOpacity
                    style={[
                      styles.pickerTriggerBox,
                      !!fieldErrors.date && styles.inputErrorBorder,
                    ]}
                    onPress={() => {
                      Keyboard.dismiss();
                      setShowDatePicker(true);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.pickerTriggerText}>{selectedDate}</Text>
                    <MaterialIcons name="calendar-today" size={17} color={Colors.primaryColor} />
                  </TouchableOpacity>
                  {!!fieldErrors.date && (
                    <View style={styles.errorRow}>
                      <MaterialIcons name="error-outline" size={13} color="#EF4444" />
                      <Text style={styles.errorText}>{fieldErrors.date}</Text>
                    </View>
                  )}
                </View>

                {/* Select Time */}
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalFieldLabel}>Select Time *</Text>
                  <TouchableOpacity
                    style={[
                      styles.pickerTriggerBox,
                      !!fieldErrors.time && styles.inputErrorBorder,
                    ]}
                    onPress={() => {
                      Keyboard.dismiss();
                      setShowTimePicker(true);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.pickerTriggerText}>{selectedTime}</Text>
                    <MaterialIcons name="schedule" size={17} color={Colors.primaryColor} />
                  </TouchableOpacity>
                  {!!fieldErrors.time && (
                    <View style={styles.errorRow}>
                      <MaterialIcons name="error-outline" size={13} color="#EF4444" />
                      <Text style={styles.errorText}>{fieldErrors.time}</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Metric Value Inputs with inline errors displayed below respective fields */}
              {vitalName === 'Blood Pressure' ? (
                <View style={styles.modalFieldGroup}>
                  <Text style={styles.modalFieldLabel}>Systolic (mmHg) *</Text>
                  <View
                    style={[
                      styles.inputWithIconContainer,
                      !!fieldErrors.systolic && styles.inputErrorBorder,
                    ]}
                  >
                    <TextInput
                      style={styles.textInputWithIcon}
                      placeholder="e.g. 120"
                      placeholderTextColor="#94A3B8"
                      keyboardType="number-pad"
                      value={systolic}
                      onChangeText={(t) => {
                        setSystolic(t);
                        if (fieldErrors.systolic) {
                          setFieldErrors((prev) => ({ ...prev, systolic: '' }));
                        }
                      }}
                    />
                    <Text style={styles.inputUnitSuffix}>mmHg</Text>
                  </View>
                  {!!fieldErrors.systolic && (
                    <View style={styles.errorRow}>
                      <MaterialIcons name="error-outline" size={13} color="#EF4444" />
                      <Text style={styles.errorText}>{fieldErrors.systolic}</Text>
                    </View>
                  )}

                  <Text style={[styles.modalFieldLabel, { marginTop: hs(8) }]}>Diastolic (mmHg) *</Text>
                  <View
                    style={[
                      styles.inputWithIconContainer,
                      !!fieldErrors.diastolic && styles.inputErrorBorder,
                    ]}
                  >
                    <TextInput
                      style={styles.textInputWithIcon}
                      placeholder="e.g. 80"
                      placeholderTextColor="#94A3B8"
                      keyboardType="number-pad"
                      value={diastolic}
                      onChangeText={(t) => {
                        setDiastolic(t);
                        if (fieldErrors.diastolic) {
                          setFieldErrors((prev) => ({ ...prev, diastolic: '' }));
                        }
                      }}
                    />
                    <Text style={styles.inputUnitSuffix}>mmHg</Text>
                  </View>
                  {!!fieldErrors.diastolic && (
                    <View style={styles.errorRow}>
                      <MaterialIcons name="error-outline" size={13} color="#EF4444" />
                      <Text style={styles.errorText}>{fieldErrors.diastolic}</Text>
                    </View>
                  )}

                  <Text style={styles.helperText}>
                    Accepted range: Sys 40–300, Dia 30–200 mmHg
                  </Text>
                </View>
              ) : vitalName === 'Sugar' ? (
                <View style={styles.modalFieldGroup}>
                  <Text style={styles.modalFieldLabel}>Fasting (mg/dL) *</Text>
                  <View
                    style={[
                      styles.inputWithIconContainer,
                      !!fieldErrors.value && styles.inputErrorBorder,
                    ]}
                  >
                    <TextInput
                      style={styles.textInputWithIcon}
                      placeholder="e.g. 95"
                      placeholderTextColor="#94A3B8"
                      keyboardType="number-pad"
                      value={value}
                      onChangeText={(t) => {
                        setValue(t);
                        if (fieldErrors.value) {
                          setFieldErrors((prev) => ({ ...prev, value: '' }));
                        }
                      }}
                    />
                    <Text style={styles.inputUnitSuffix}>mg/dL</Text>
                  </View>
                  {!!fieldErrors.value && (
                    <View style={styles.errorRow}>
                      <MaterialIcons name="error-outline" size={13} color="#EF4444" />
                      <Text style={styles.errorText}>{fieldErrors.value}</Text>
                    </View>
                  )}

                  <Text style={[styles.modalFieldLabel, { marginTop: hs(8) }]}>Random (mg/dL)</Text>
                  <View
                    style={[
                      styles.inputWithIconContainer,
                      !!fieldErrors.sugarRandom && styles.inputErrorBorder,
                    ]}
                  >
                    <TextInput
                      style={styles.textInputWithIcon}
                      placeholder="e.g. 140"
                      placeholderTextColor="#94A3B8"
                      keyboardType="number-pad"
                      value={sugarRandom}
                      onChangeText={(t) => {
                        setSugarRandom(t);
                        if (fieldErrors.sugarRandom) {
                          setFieldErrors((prev) => ({ ...prev, sugarRandom: '' }));
                        }
                      }}
                    />
                    <Text style={styles.inputUnitSuffix}>mg/dL</Text>
                  </View>
                  {!!fieldErrors.sugarRandom && (
                    <View style={styles.errorRow}>
                      <MaterialIcons name="error-outline" size={13} color="#EF4444" />
                      <Text style={styles.errorText}>{fieldErrors.sugarRandom}</Text>
                    </View>
                  )}

                  <Text style={styles.helperText}>Accepted range: 20–1000 mg/dL</Text>
                </View>
              ) : vitalName === 'Temperature' ? (
                <View style={styles.modalFieldGroup}>
                  <Text style={styles.modalFieldLabel}>Temperature (°F) *</Text>
                  <View
                    style={[
                      styles.inputWithIconContainer,
                      !!fieldErrors.value && styles.inputErrorBorder,
                    ]}
                  >
                    <MaterialIcons
                      name="thermostat"
                      size={20}
                      color={fieldErrors.value ? '#EF4444' : '#D97706'}
                      style={{ marginRight: ws(8) }}
                    />
                    <TextInput
                      style={styles.textInputWithIcon}
                      placeholder="Enter temperature in °F"
                      placeholderTextColor="#94A3B8"
                      keyboardType="decimal-pad"
                      value={value}
                      onChangeText={(t) => {
                        setValue(t);
                        if (fieldErrors.value) {
                          setFieldErrors((prev) => ({ ...prev, value: '' }));
                        }
                      }}
                    />
                    <Text style={styles.inputUnitSuffix}>°F</Text>
                  </View>
                  {!!fieldErrors.value && (
                    <View style={styles.errorRow}>
                      <MaterialIcons name="error-outline" size={13} color="#EF4444" />
                      <Text style={styles.errorText}>{fieldErrors.value}</Text>
                    </View>
                  )}
                  <Text style={styles.helperText}>
                    Accepted range: 70 – 115 °F (Normal: 97.0 – 99.5 °F)
                  </Text>
                </View>
              ) : vitalName === 'Weight' ? (
                <View style={styles.modalFieldGroup}>
                  <Text style={styles.modalFieldLabel}>Weight (kg) *</Text>
                  <View
                    style={[
                      styles.inputWithIconContainer,
                      !!fieldErrors.value && styles.inputErrorBorder,
                    ]}
                  >
                    <MaterialIcons
                      name="fitness-center"
                      size={18}
                      color={fieldErrors.value ? '#EF4444' : '#2563EB'}
                      style={{ marginRight: ws(8) }}
                    />
                    <TextInput
                      style={styles.textInputWithIcon}
                      placeholder="Enter weight in kg"
                      placeholderTextColor="#94A3B8"
                      keyboardType="decimal-pad"
                      value={value}
                      onChangeText={(t) => {
                        setValue(t);
                        if (fieldErrors.value) {
                          setFieldErrors((prev) => ({ ...prev, value: '' }));
                        }
                      }}
                    />
                    <Text style={styles.inputUnitSuffix}>kg</Text>
                  </View>
                  {!!fieldErrors.value && (
                    <View style={styles.errorRow}>
                      <MaterialIcons name="error-outline" size={13} color="#EF4444" />
                      <Text style={styles.errorText}>{fieldErrors.value}</Text>
                    </View>
                  )}
                  <Text style={styles.helperText}>Accepted range: 1 – 500 kg</Text>
                </View>
              ) : (
                <View style={styles.modalFieldGroup}>
                  <Text style={styles.modalFieldLabel}>{`${vitalName} *`}</Text>
                  <View
                    style={[
                      styles.inputWithIconContainer,
                      !!fieldErrors.value && styles.inputErrorBorder,
                    ]}
                  >
                    <TextInput
                      style={styles.textInputWithIcon}
                      placeholder={`Enter ${vitalName} reading`}
                      placeholderTextColor="#94A3B8"
                      keyboardType="decimal-pad"
                      value={value}
                      onChangeText={(t) => {
                        setValue(t);
                        if (fieldErrors.value) {
                          setFieldErrors((prev) => ({ ...prev, value: '' }));
                        }
                      }}
                    />
                  </View>
                  {!!fieldErrors.value && (
                    <View style={styles.errorRow}>
                      <MaterialIcons name="error-outline" size={13} color="#EF4444" />
                      <Text style={styles.errorText}>{fieldErrors.value}</Text>
                    </View>
                  )}
                </View>
              )}

              {/* General API Error Row */}
              {!!fieldErrors.general && (
                <View style={styles.errorRow}>
                  <MaterialIcons name="error-outline" size={15} color="#EF4444" />
                  <Text style={styles.errorText}>{fieldErrors.general}</Text>
                </View>
              )}
            </ScrollView>

            {/* Bottom Action Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  Keyboard.dismiss();
                  setShowModal(false);
                }}
              >
                <Text style={styles.cancelText}>Close</Text>
              </TouchableOpacity>
              <AppButton
                title="Save"
                loading={isAdding}
                onPress={handleModalSubmit}
                style={styles.saveBtn}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Date & Time Picker Modals for Add Vital */}
      <AppDatePickerModal
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        initialDate={selectedDate}
        maxDate={new Date()}
        onSelectDate={(dateStr) => {
          setSelectedDate(dateStr);
          if (fieldErrors.date) setFieldErrors((prev) => ({ ...prev, date: '' }));
        }}
        title="Select Date"
      />

      <AppTimePickerModal
        visible={showTimePicker}
        onClose={() => setShowTimePicker(false)}
        initialTime={selectedTime}
        onSelectTime={(timeStr) => {
          setSelectedTime(timeStr);
          if (fieldErrors.time) setFieldErrors((prev) => ({ ...prev, time: '' }));
        }}
        title="Select Time"
      />

      {/* Filter Options Quick Sheet Modal */}
      <Modal
        visible={showFilterPickerModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFilterPickerModal(false)}
      >
        <TouchableOpacity
          style={styles.pickerModalBackdrop}
          activeOpacity={1}
          onPress={() => setShowFilterPickerModal(false)}
        >
          <View style={styles.filterMenuBox}>
            <Text style={styles.filterMenuTitle}>Filter By Date</Text>
            {(['All', 'Today', '7 Days', '30 Days'] as FilterType[]).map((f) => (
              <TouchableOpacity
                key={`opt-${f}`}
                style={[
                  styles.filterMenuItem,
                  activeFilter === f && styles.filterMenuItemActive,
                ]}
                onPress={() => {
                  setActiveFilter(f);
                  setShowFilterPickerModal(false);
                }}
              >
                <Text
                  style={[
                    styles.filterMenuItemText,
                    activeFilter === f && styles.filterMenuItemTextActive,
                  ]}
                >
                  {f === 'All'
                    ? 'All Records'
                    : f === '7 Days'
                      ? 'Last 7 Days'
                      : f === '30 Days'
                        ? 'Last 30 Days'
                        : 'Today'}
                </Text>
                {activeFilter === f && (
                  <MaterialIcons name="check" size={18} color="#2563EB" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Calendar Filter Modal */}
      <AppDatePickerModal
        visible={showCalendarFilterModal}
        onClose={() => setShowCalendarFilterModal(false)}
        initialDate={customFilterDate || new Date().toISOString().split('T')[0]}
        maxDate={new Date()}
        onSelectDate={(dateStr) => {
          setCustomFilterDate(dateStr);
          setActiveFilter('Custom');
        }}
        title="Filter by Specific Date"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgColor },

  // Patient Name Dropdown
  memberDropdownSection: {
    paddingHorizontal: ws(16),
    paddingTop: hs(12),
    paddingBottom: hs(12),
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    zIndex: 1000,
  },
  memberDropdownLabel: {
    fontSize: fs(11),
    ...TYPOGRAPHY.bold,
    color: '#64748B',
    marginBottom: hs(6),
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  memberDropdownContainer: {
    position: 'relative',
    zIndex: 1000,
  },
  memberDropdownField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: fs(10),
    borderWidth: 1.5,
    borderColor: Colors.blue_3B82F6,
    paddingHorizontal: ws(14),
    paddingVertical: hs(10),
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: hs(1) },
    shadowOpacity: 0.05,
    shadowRadius: fs(3),
    elevation: 2,
  },
  memberDropdownFieldOpen: {
    borderColor: Colors.primaryColor,
  },
  memberDropdownFieldText: {
    fontSize: fs(13.5),
    ...TYPOGRAPHY.medium,
    color: Colors.primaryFontColor,
    flex: 1,
    marginRight: ws(8),
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
    borderColor: Colors.borderColor,
    padding: ws(6),
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: hs(4) },
    shadowOpacity: 0.15,
    shadowRadius: fs(10),
    elevation: 10,
    zIndex: 1000,
  },
  memberDropdownMenuItem: {
    paddingVertical: hs(10),
    paddingHorizontal: ws(12),
    borderRadius: fs(8),
    marginBottom: hs(2),
  },
  memberDropdownMenuItemActive: {
    backgroundColor: Colors.primaryColor,
  },
  memberDropdownMenuItemText: {
    fontSize: fs(13),
    ...TYPOGRAPHY.medium,
    color: Colors.slate_1E293B,
  },
  memberDropdownMenuItemTextActive: {
    ...TYPOGRAPHY.bold,
    color: Colors.white,
  },

  // Date Filter Bar
  dateFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ws(16),
    paddingVertical: hs(10),
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  filterDropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(6),
    backgroundColor: '#EFF6FF',
    paddingHorizontal: ws(12),
    paddingVertical: hs(6),
    borderRadius: fs(16),
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  filterDropdownBtnText: {
    fontSize: fs(12),
    ...TYPOGRAPHY.bold,
    color: '#2563EB',
  },
  filterCalendarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(5),
    backgroundColor: '#F8FAFC',
    paddingHorizontal: ws(12),
    paddingVertical: hs(6),
    borderRadius: fs(16),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterCalendarBtnText: {
    fontSize: fs(12),
    ...TYPOGRAPHY.medium,
    color: '#475569',
  },

  // List Content
  listContent: { flexGrow: 1, padding: ws(16) },

  // Compact Hero Card
  heroCard: {
    padding: ws(14),
    borderRadius: fs(16),
    marginBottom: hs(12),
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  heroHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hs(8),
  },
  heroActionBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(6),
    marginLeft: ws(8),
  },
  heroIconCircle: {
    width: ws(42),
    height: ws(42),
    aspectRatio: 1,
    borderRadius: 999,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ws(10),
  },
  heroTitleCol: {
    flex: 1,
  },
  heroLabel: {
    fontSize: fs(11),
    ...TYPOGRAPHY.medium,
    color: Colors.secondaryFontColor,
  },
  heroTime: {
    marginTop: hs(2),
    fontSize: fs(11.5),
    ...TYPOGRAPHY.regular,
    color: '#64748B',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ws(8),
    paddingVertical: hs(4),
    borderRadius: fs(10),
  },
  statusBadgeText: {
    fontSize: fs(11),
    ...TYPOGRAPHY.bold,
  },
  heroBottomContainer: {
    marginTop: hs(6),
  },
  heroSugarColsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: fs(12),
    paddingVertical: hs(8),
    paddingHorizontal: ws(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: hs(4),
  },
  heroSugarCol: {
    flex: 1,
  },
  heroSugarColLabel: {
    fontSize: fs(11),
    ...TYPOGRAPHY.medium,
    color: '#64748B',
    marginBottom: hs(2),
  },
  heroSugarColValue: {
    fontSize: fs(19),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
  },
  heroSugarColUnit: {
    fontSize: fs(12),
    ...TYPOGRAPHY.medium,
    color: '#64748B',
  },
  heroSugarDivider: {
    width: 1,
    height: '75%',
    backgroundColor: '#E2E8F0',
    marginHorizontal: ws(10),
  },
  heroValueAndBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroValueText: {
    fontSize: fs(24),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
  },
  heroRangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hs(6),
  },
  heroRangeText: {
    fontSize: fs(11),
    ...TYPOGRAPHY.medium,
    color: '#64748B',
  },

  // Weight Trend Chart Card
  chartCard: {
    padding: ws(12),
    borderRadius: fs(16),
    marginBottom: hs(12),
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chartTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hs(8),
  },
  chartTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(6),
  },
  chartTitleText: {
    fontSize: fs(13),
    ...TYPOGRAPHY.bold,
    color: '#1E293B',
  },
  chartLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(10),
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(4),
  },
  legendDot: {
    width: ws(7),
    height: ws(7),
    borderRadius: 999,
  },
  legendText: {
    fontSize: fs(10),
    ...TYPOGRAPHY.medium,
    color: '#64748B',
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyChartBox: {
    height: hs(100),
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyChartText: {
    fontSize: fs(12),
    color: '#94A3B8',
  },

  // History Section Header
  historySectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hs(8),
    marginTop: hs(4),
  },
  historySectionTitle: {
    fontSize: fs(13),
    ...TYPOGRAPHY.bold,
    color: '#334155',
  },

  // Compact History Card
  compactHistoryCard: {
    marginBottom: hs(10),
    borderRadius: fs(14),
    paddingVertical: hs(12),
    paddingHorizontal: ws(14),
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemIconCircle: {
    width: ws(38),
    height: ws(38),
    aspectRatio: 1,
    borderRadius: 999,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ws(12),
  },
  historyInfo: {
    flex: 1,
    marginRight: ws(16),
  },
  historyValueAndStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: ws(8),
  },
  historySugarValuesCol: {
    flex: 1,
    marginRight: ws(6),
    gap: hs(1),
  },
  historyValueText: {
    fontSize: fs(14),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
  },
  historySubValueText: {
    fontSize: fs(12),
    ...TYPOGRAPHY.medium,
    color: Colors.secondaryFontColor,
  },
  historyStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ws(8),
    paddingVertical: hs(3),
    borderRadius: fs(6),
  },
  historyStatusText: {
    fontSize: fs(10),
    ...TYPOGRAPHY.bold,
  },
  historyDateText: {
    marginTop: hs(3),
    fontSize: fs(11),
    color: Colors.secondaryFontColor,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(8),
  },
  actionIconBtnDelete: {
    width: ws(32),
    height: ws(32),
    borderRadius: 999,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // FAB
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
    shadowColor: Colors.primaryColor,
    shadowOffset: { width: 0, height: hs(4) },
    shadowOpacity: 0.3,
    shadowRadius: fs(6),
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  backdropPressable: { flex: 1 },
  modalBox: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: fs(22),
    borderTopRightRadius: fs(22),
    paddingHorizontal: ws(20),
    paddingTop: hs(16),
    maxHeight: '90%',
  },
  modalScrollBody: {
    flexShrink: 1,
  },
  modalScrollContent: {
    paddingHorizontal: ws(2),
    paddingBottom: hs(10),
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hs(14),
  },
  modalTitle: {
    fontSize: fs(16),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
  },
  modalFieldGroup: { marginBottom: hs(10) },
  modalFieldLabel: {
    fontSize: fs(11.5),
    ...TYPOGRAPHY.bold,
    color: '#475569',
    marginBottom: hs(5),
  },
  memberBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: fs(10),
    paddingHorizontal: ws(12),
    paddingVertical: hs(10),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  memberBoxReadOnly: {
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
  },
  memberBoxText: {
    fontSize: fs(13),
    ...TYPOGRAPHY.medium,
    color: Colors.primaryFontColor,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: ws(10),
    marginBottom: hs(10),
  },
  pickerTriggerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: fs(10),
    paddingHorizontal: ws(12),
    paddingVertical: hs(9),
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  pickerTriggerText: {
    fontSize: fs(12.5),
    ...TYPOGRAPHY.medium,
    color: Colors.primaryFontColor,
  },
  inputWithIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: fs(10),
    paddingHorizontal: ws(12),
    paddingVertical: hs(2),
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginHorizontal: ws(1),
  },
  textInputWithIcon: {
    flex: 1,
    height: hs(40),
    fontSize: fs(13),
    ...TYPOGRAPHY.medium,
    color: Colors.primaryFontColor,
  },
  inputUnitSuffix: {
    fontSize: fs(13),
    ...TYPOGRAPHY.bold,
    color: '#64748B',
    marginLeft: ws(4),
  },
  inputErrorBorder: {
    borderColor: '#EF4444',
  },
  helperText: {
    fontSize: fs(11),
    ...TYPOGRAPHY.regular,
    color: '#64748B',
    marginTop: hs(4),
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(4),
    marginTop: hs(4),
    marginBottom: hs(4),
  },
  errorText: {
    fontSize: fs(11),
    ...TYPOGRAPHY.medium,
    color: '#EF4444',
  },
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: hs(12),
    paddingBottom: hs(4),
    gap: ws(10),
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  cancelBtn: {
    flex: 1,
    height: hs(44),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: fs(10),
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  cancelText: {
    fontSize: fs(Typography.fontSize.sm),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
  },
  saveBtn: { flex: 1.2, height: hs(44), borderRadius: fs(10) },

  // Filter Quick Sheet Modal Styles
  pickerModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: ws(24),
  },
  filterMenuBox: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: fs(16),
    padding: ws(16),
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: fs(8),
  },
  filterMenuTitle: {
    fontSize: fs(14),
    ...TYPOGRAPHY.bold,
    color: '#1E293B',
    marginBottom: hs(12),
  },
  filterMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: hs(10),
    paddingHorizontal: ws(8),
    borderRadius: fs(8),
  },
  filterMenuItemActive: {
    backgroundColor: '#EFF6FF',
  },
  filterMenuItemText: {
    fontSize: fs(13),
    ...TYPOGRAPHY.medium,
    color: '#475569',
  },
  filterMenuItemTextActive: {
    ...TYPOGRAPHY.bold,
    color: '#2563EB',
  },
});
