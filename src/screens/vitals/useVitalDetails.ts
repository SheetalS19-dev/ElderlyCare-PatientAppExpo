import type { RouteProp } from '@react-navigation/native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import { Keyboard } from 'react-native';
import { useDispatch } from 'react-redux';
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
import {
  calculateWeightTrend,
  DateTimeUtils,
  getVitalIconInfo,
  getVitalStatus,
  hs,
  showToast,
  sortVitalsDescending,
  ws,
} from '../../utils';
import type { VitalFilterType } from './components';

export const useVitalDetails = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'VitalDetails'>>();
  const { vitalName, familyMemberId: initialFamilyId } = route.params;

  const dispatch = useDispatch();
  const { user: authUser } = useAuth();
  const uid = String(authUser?.id ?? (authUser as any)?.user_id ?? '');

  // Patient profile to display actual patient name instead of literal "Self"
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

  // Find existing self member in family_members table
  const existingSelfMemberInDb = useMemo(() => {
    return rawFamilyList.find(
      (m) =>
        (m.relationship || '').toLowerCase() === 'self' ||
        (m as any).is_self === true ||
        String(m.id) === uid
    );
  }, [rawFamilyList, uid]);

  const [selectedFamilyId, setSelectedFamilyId] = useState<string>(() => {
    if (initialFamilyId && initialFamilyId !== 'SELF' && initialFamilyId !== 'ALL') {
      return String(initialFamilyId);
    }
    return uid;
  });
  const [showMemberDropdown, setShowMemberDropdown] = useState<boolean>(false);

  // Active Family ID: Resolves to real family_members table ID
  const activeFamilyId = useMemo(() => {
    if (
      selectedFamilyId &&
      selectedFamilyId !== uid &&
      selectedFamilyId !== 'SELF' &&
      selectedFamilyId !== 'ALL'
    ) {
      return String(selectedFamilyId);
    }
    if (existingSelfMemberInDb?.id) {
      return String(existingSelfMemberInDb.id);
    }
    return uid;
  }, [selectedFamilyId, existingSelfMemberInDb, uid]);

  const familyList: FamilyMemberModel[] = useMemo(() => {
    const list: FamilyMemberModel[] = [...rawFamilyList];

    const hasSelf = list.some(
      (m) =>
        (m.relationship || '').toLowerCase() === 'self' ||
        (m as any).is_self === true ||
        String(m.id) === uid ||
        (existingSelfMemberInDb && String(m.id) === String(existingSelfMemberInDb.id))
    );

    if (!hasSelf && currentUser) {
      return [
        {
          id: uid,
          user_id: currentUser.id,
          f_name: currentUser.f_name || 'Self',
          l_name: currentUser.l_name || '',
          name: userFullName,
          phone: currentUser.phone || '',
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
  }, [rawFamilyList, currentUser, existingSelfMemberInDb, userFullName, uid]);

  const activeMemberObj = useMemo(() => {
    return familyList.find((m) => {
      const mId = String(m.id);
      if (selectedFamilyId === 'SELF' || selectedFamilyId === uid) {
        return (m as any).is_self === true || (m.relationship || '').toLowerCase() === 'self' || mId === uid;
      }
      return mId === String(selectedFamilyId) || mId === String(activeFamilyId);
    });
  }, [familyList, selectedFamilyId, activeFamilyId, uid]);

  const getMemberDisplayName = (mem?: FamilyMemberModel | null): string => {
    if (!mem) return userFullName;
    const isSelf =
      (mem as any).is_self === true ||
      (mem.relationship || '').toLowerCase() === 'self' ||
      String(mem.id) === uid ||
      String(mem.id) === String(currentUser?.id) ||
      (existingSelfMemberInDb && String(mem.id) === String(existingSelfMemberInDb.id));
    if (isSelf) return `${userFullName} (Self)`;
    return mem.name || `${mem.f_name ?? ''} ${mem.l_name ?? ''}`.trim() || 'Family Member';
  };

  const deduplicatedFamilyList: FamilyMemberModel[] = useMemo(() => {
    const seenIds = new Set<string>();
    const result: FamilyMemberModel[] = [];

    for (const mem of familyList) {
      const idKey = String(mem.id);
      if (!seenIds.has(idKey)) {
        seenIds.add(idKey);
        result.push(mem);
      }
    }
    return result;
  }, [familyList]);

  const selectedMemberDisplayName = useMemo(() => {
    return getMemberDisplayName(activeMemberObj);
  }, [activeMemberObj, userFullName]);

  // Date Filter State
  const [activeFilter, setActiveFilter] = useState<VitalFilterType>('7 Days');
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

    return sortVitalsDescending(list);
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
        return DateTimeUtils.isWithinLast7Days(v.date || v.created_at);
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

  // History vitals exclude latest vital displayed in the top card
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
      let sysNum = 0;
      let diaNum = 0;
      if (!systolic.trim()) {
        errors.systolic = 'Systolic BP is required';
      } else {
        sysNum = parseFloat(systolic.trim());
        if (isNaN(sysNum) || sysNum < 40 || sysNum > 300) {
          errors.systolic = 'Systolic BP must be between 40 and 300 mmHg';
        }
      }

      if (!diastolic.trim()) {
        errors.diastolic = 'Diastolic BP is required';
      } else {
        diaNum = parseFloat(diastolic.trim());
        if (isNaN(diaNum) || diaNum < 30 || diaNum > 200) {
          errors.diastolic = 'Diastolic BP must be between 30 and 200 mmHg';
        }
      }

      if (!errors.systolic && !errors.diastolic && sysNum > 0 && diaNum > 0 && sysNum <= diaNum) {
        errors.systolic = 'Systolic BP must be greater than Diastolic BP';
      }
    } else if (vitalName === 'Sugar') {
      const hasFasting = !!value.trim();
      const hasRandom = !!sugarRandom.trim();
      if (!hasFasting && !hasRandom) {
        errors.sugarGeneral = 'Please enter Fasting or Random sugar value (Accepted range: 20–1000 mg/dL)';
      } else {
        if (hasFasting) {
          const fasting = parseFloat(value.trim());
          if (isNaN(fasting) || fasting < 20 || fasting > 1000) {
            errors.value = 'Fasting sugar must be between 20 and 1000 mg/dL';
          }
        }
        if (hasRandom) {
          const random = parseFloat(sugarRandom.trim());
          if (isNaN(random) || random < 20 || random > 1000) {
            errors.sugarRandom = 'Random sugar must be between 20 and 1000 mg/dL';
          }
        }
      }
    } else if (vitalName === 'Weight') {
      if (!value.trim()) {
        errors.value = 'Weight is required (Accepted range: 1–500 kg)';
      } else {
        const wt = parseFloat(value.trim());
        if (isNaN(wt) || wt < 1 || wt > 500) {
          errors.value = 'Weight must be between 1 and 500 kg';
        }
      }
    } else if (vitalName === 'Temperature') {
      if (!value.trim()) {
        errors.value = 'Temperature is required (Accepted range: 70–115 °F)';
      } else {
        const temp = parseFloat(value.trim());
        if (isNaN(temp) || temp < 70 || temp > 115) {
          errors.value = 'Temperature must be between 70 and 115 °F';
        }
      }
    } else if (vitalName === 'SpO2') {
      if (!value.trim()) {
        errors.value = 'SpO2 percentage is required (Accepted range: 70–100%)';
      } else {
        const spo2 = parseFloat(value.trim());
        if (isNaN(spo2) || spo2 < 70 || spo2 > 100) {
          errors.value = 'SpO2 percentage must be between 70% and 100%';
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

      setSelectedFamilyId(String(targetMemberId));
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

  const iconInfo = getVitalIconInfo(vitalName);
  const latestStatus = getVitalStatus(vitalName, latestVital);

  // Hero Weight Trend
  const heroWeightTrend = useMemo(() => {
    if (vitalName !== 'Weight' || vitals.length < 2) return null;
    const latest = vitals[0]?.weight || (vitals[0] as any)?.value;
    const prev = vitals[1]?.weight || (vitals[1] as any)?.value;
    return calculateWeightTrend(latest, prev);
  }, [vitalName, vitals]);

  // Weight Trend SVG Chart Calculations
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
      .slice(0, 4)
      .reverse();

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

    const points = valid.map((r, i) => {
      const v = parseFloat(String(r.weight || (r as any)?.value || 0));
      const ratio = range > 0 ? (v - bottom) / range : 0.5;
      const x = padLeft + (valid.length === 1 ? availW / 2 : (i / (valid.length - 1)) * availW);
      const y = padTop + (1 - ratio) * availH;

      const dStr = r.date ? r.date.split('T')[0] : (r.created_at ? r.created_at.split('T')[0] : '');
      let dateFormatted = dStr ? DateTimeUtils.getDataFormat(dStr) : '';
      dateFormatted = dateFormatted.replace(/,?\s*\d{4}/g, '').trim();

      const timeFormatted = r.time ? (DateTimeUtils.formatTimeToAmPm(r.time) || r.time) : '';
      const cleanTime = (timeFormatted && timeFormatted !== '00:00' && timeFormatted !== '12:00 AM') ? timeFormatted : '';
      const dateLabel = cleanTime ? `${dateFormatted}\n${cleanTime}` : dateFormatted;

      return { x, y, value: v, dateLabel };
    });

    return { chartPoints: points, yTicks: ticks, chartW: cWidth, chartH: cHeight };
  }, [vitalName, filteredVitals, vitals]);

  return {
    navigation,
    vitalName,
    deduplicatedFamilyList,
    selectedFamilyId,
    setSelectedFamilyId,
    showMemberDropdown,
    setShowMemberDropdown,
    selectedMemberDisplayName,
    activeFilter,
    setActiveFilter,
    customFilterDate,
    setCustomFilterDate,
    showFilterPickerModal,
    setShowFilterPickerModal,
    showCalendarFilterModal,
    setShowCalendarFilterModal,
    isLoading,
    isError,
    refetch,
    historyVitals,
    latestVital,
    iconInfo,
    latestStatus,
    heroWeightTrend,
    chartPoints,
    yTicks,
    chartW,
    chartH,
    openAddModal,
    showModal,
    setShowModal,
    isAdding,
    selectedDate,
    setSelectedDate,
    selectedTime,
    setSelectedTime,
    showDatePicker,
    setShowDatePicker,
    showTimePicker,
    setShowTimePicker,
    systolic,
    setSystolic,
    diastolic,
    setDiastolic,
    value,
    setValue,
    sugarRandom,
    setSugarRandom,
    fieldErrors,
    handleModalSubmit,
    handleDelete,
  };
};
