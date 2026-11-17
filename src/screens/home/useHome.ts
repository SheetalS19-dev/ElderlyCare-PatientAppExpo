import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { getSavedFamilyRelations } from '../../services';
import { storageService } from '../../services/storageService';
import type { RootStackParamList } from '../../navigation/types';
import { useGetAppointmentsQuery } from '../../redux/apis/appointmentApi';
import { useGetFamilyMembersQuery } from '../../redux/apis/bookingApi';
import { useGetClinicsQuery } from '../../redux/apis/clinicApi';
import {
  useGetBannersQuery,
  useGetCitiesQuery,
  useGetDepartmentsQuery,
  useGetDoctorsQuery,
  type BannerModel,
  type CityModel,
  type DepartmentModel,
  type DoctorModel,
} from '../../redux/apis/doctorApi';
import { useGetNotificationsByDateQuery } from '../../redux/apis/notificationApi';
import { useGetPatientFilesQuery } from '../../redux/apis/patientFilesApi';
import { useGetUserProfileQuery } from '../../redux/apis/userApi';
import {
  useDeleteVitalMutation,
  useGetVitalsQuery,
  useUpdateVitalMutation,
} from '../../redux/apis/vitalsApi';
import { getUserFullName, type FamilyMemberModel, type NotificationModel } from '../../types';
import {
  detectDeviceCityName,
  extractNotificationsList,
  formatDoctorName,
  getNotificationSeenKey,
  isWithinLast7Days,
  matchCityFromList,
  showToast,
} from '../../utils';
import type { ActivePatientInfo } from './components/HomePatientDashboard';

const SAVED_LOCATION_KEY = 'SAVED_USER_CITY_LOCATION';

export type RootNavigation = NativeStackNavigationProp<RootStackParamList>;

export const useHome = () => {
  const navigation = useNavigation<RootNavigation>();
  const { isAuthenticated, user } = useAuth();

  const [deleteVital] = useDeleteVitalMutation();

  const handleDeleteVitalRecord = async (id: string | number) => {
    try {
      await deleteVital({ id }).unwrap();
      showToast('Record deleted');
    } catch (e: any) {
      showToast(e?.data?.message || 'Could not delete record');
    }
  };

  const ALL_CITIES_OBJ = useMemo(() => ({ id: 'ALL', title: 'All' } as CityModel), []);
  const [search, setSearch] = useState('');
  const [selectedCity, setSelectedCity] = useState<CityModel | null | undefined>({ id: 'ALL', title: 'All' } as CityModel);
  const [deviceLocationCity, setDeviceLocationCity] = useState<string | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [isUsingCurrentLocation, setIsUsingCurrentLocation] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);

  // Load saved location from AsyncStorage
  useEffect(() => {
    const loadSavedLocation = async () => {
      try {
        const savedData = await AsyncStorage.getItem(SAVED_LOCATION_KEY);
        if (savedData) {
          const parsed = JSON.parse(savedData);
          if (parsed?.id === 'CURRENT') {
            setIsUsingCurrentLocation(true);
            setSelectedCity(undefined);
          } else if (parsed !== undefined && parsed !== null) {
            setIsUsingCurrentLocation(false);
            setSelectedCity(parsed);
          }
        }
      } catch (err) {
        console.log('Error loading saved location:', err);
      }
    };
    loadSavedLocation();
  }, []);

  const { data: citiesData } = useGetCitiesQuery();
  const { data: bannersData } = useGetBannersQuery();
  const {
    data: departments,
    isLoading: deptLoading,
    isError: deptError,
  } = useGetDepartmentsQuery();

  const citiesList: CityModel[] = useMemo(() => {
    if (Array.isArray(citiesData)) return citiesData;
    if (Array.isArray((citiesData as any)?.data)) return (citiesData as any).data;
    return [];
  }, [citiesData]);

  // Fetch device location and resolve against available cities
  const fetchDeviceCurrentLocation = useCallback(async () => {
    setIsDetectingLocation(true);
    try {
      const detected = await detectDeviceCityName();
      if (detected) {
        setDeviceLocationCity(detected);
        const matched = matchCityFromList(detected, citiesList);
        if (matched) {
          setSelectedCity(matched);
          setIsUsingCurrentLocation(true);
          try {
            await AsyncStorage.setItem(SAVED_LOCATION_KEY, JSON.stringify(matched));
          } catch {}
          showToast(`Location set to ${matched.title || detected}`);
        } else {
          showToast(`Detected ${detected}; showing all locations`);
        }
      } else {
        setIsUsingCurrentLocation(false);
        setSelectedCity(ALL_CITIES_OBJ);
        showToast('Could not detect current location');
      }
    } finally {
      setIsDetectingLocation(false);
    }
  }, [citiesList, ALL_CITIES_OBJ]);

  useEffect(() => {
    if (isUsingCurrentLocation && deviceLocationCity && citiesList.length > 0 && !selectedCity) {
      const matched = matchCityFromList(deviceLocationCity, citiesList);
      if (matched) {
        setSelectedCity(matched);
      }
    }
  }, [isUsingCurrentLocation, deviceLocationCity, citiesList, selectedCity]);

  const activeCity = useMemo(() => {
    if (selectedCity !== undefined && selectedCity !== null) {
      return selectedCity;
    }
    return ALL_CITIES_OBJ;
  }, [selectedCity, ALL_CITIES_OBJ]);

  const activeCityName = activeCity?.title || 'All';
  const hasCityFilter = activeCityName !== 'All';

  const activeCityId =
    activeCity?.id != null && String(activeCity.id) !== 'ALL' && String(activeCity.id) !== ''
      ? String(activeCity.id)
      : undefined;

  const handleCitySelect = async (city: CityModel | null | undefined) => {
    if (city === undefined) {
      setIsUsingCurrentLocation(true);
      setSelectedCity(undefined);
      try {
        await AsyncStorage.setItem(SAVED_LOCATION_KEY, JSON.stringify({ id: 'CURRENT' }));
      } catch (err) {
        console.log('Error saving current location mode:', err);
      }
      fetchDeviceCurrentLocation();
    } else if (city === null) {
      setIsUsingCurrentLocation(false);
      setSelectedCity(ALL_CITIES_OBJ);
      try {
        await AsyncStorage.setItem(SAVED_LOCATION_KEY, JSON.stringify(ALL_CITIES_OBJ));
      } catch (err) {
        console.log('Error saving location:', err);
      }
    } else {
      setIsUsingCurrentLocation(false);
      setSelectedCity(city);
      try {
        await AsyncStorage.setItem(SAVED_LOCATION_KEY, JSON.stringify(city));
      } catch (err) {
        console.log('Error saving location:', err);
      }
    }
  };

  const {
    data: doctors,
    isLoading: doctorsLoading,
  } = useGetDoctorsQuery({
    cityId: activeCityId,
  });

  const {
    data: clinicsData,
    isLoading: clinicsLoading,
  } = useGetClinicsQuery(
    {
      cityId: activeCityId,
    },
    { refetchOnMountOrArgChange: true }
  );

  const userIdStr = user?.id ? String(user.id) : '';
  const { data: userProfileData } = useGetUserProfileQuery(userIdStr, { skip: !userIdStr });
  const { data: familyMembersData, refetch: refetchFamilyMembers } = useGetFamilyMembersQuery(userIdStr, { skip: !userIdStr });

  const [savedRelations, setSavedRelations] = useState<Record<string, string>>({});

  useEffect(() => {
    if (userIdStr) {
      getSavedFamilyRelations(userIdStr).then(setSavedRelations);
    }
  }, [userIdStr]);

  useFocusEffect(
    useCallback(() => {
      if (userIdStr) {
        getSavedFamilyRelations(userIdStr).then(setSavedRelations);
        refetchFamilyMembers();
      }
    }, [userIdStr, refetchFamilyMembers])
  );

  const [selectedMemberId, setSelectedMemberId] = useState<string>('SELF');
  const [showMemberDropdown, setShowMemberDropdown] = useState<boolean>(false);
  const [downloadingFileId, setDownloadingFileId] = useState<string | number | null>(null);

  const familyMembersList: FamilyMemberModel[] = useMemo(() => {
    let raw: any[] = [];
    if (Array.isArray(familyMembersData)) raw = familyMembersData;
    else if (Array.isArray((familyMembersData as any)?.data)) raw = (familyMembersData as any).data;
    else if (Array.isArray((familyMembersData as any)?.response)) raw = (familyMembersData as any).response;

    return raw.map((m) => {
      const memIdStr = String(m.id ?? m.member_id ?? '');
      const enrichedRelation =
        savedRelations[memIdStr] ||
        m.relation ||
        m.relationship ||
        '';
      return {
        ...m,
        relation: enrichedRelation,
        relationship: enrichedRelation,
      };
    });
  }, [familyMembersData, savedRelations]);

  const filteredFamilyMembersList = useMemo(() => {
    if (!familyMembersList || familyMembersList.length === 0) return [];
    const mainUserId = String(user?.id ?? (userProfileData as any)?.data?.id ?? userIdStr);

    return familyMembersList.filter((m) => {
      const isSelf =
        (m as any).is_self === true ||
        (m.relationship || '').toLowerCase() === 'self' ||
        String(m.id) === mainUserId;
      return !isSelf;
    });
  }, [familyMembersList, user, userProfileData, userIdStr]);

  const selfFullName = useMemo(() => {
    const fName = user?.f_name || (userProfileData as any)?.data?.f_name || '';
    const lName = user?.l_name || (userProfileData as any)?.data?.l_name || '';
    const full = `${fName} ${lName}`.trim();
    return full || 'Patient';
  }, [user, userProfileData]);

  const selectedMemberDisplayName = useMemo(() => {
    if (selectedMemberId === 'SELF') {
      return selfFullName;
    }
    const mem = familyMembersList.find((m) => String(m.id) === String(selectedMemberId));
    if (mem) {
      return `${mem.f_name || ''} ${mem.l_name || ''}`.trim() || 'Member';
    }
    return selfFullName;
  }, [selectedMemberId, selfFullName, familyMembersList]);

  const { data: rawAppointmentsData } = useGetAppointmentsQuery(userIdStr, { skip: !userIdStr });
  const { data: rawPatientFilesData } = useGetPatientFilesQuery(
    { userId: userIdStr },
    { skip: !userIdStr }
  );

  const appointmentsList = useMemo(() => {
    if (Array.isArray(rawAppointmentsData)) return rawAppointmentsData;
    if (Array.isArray((rawAppointmentsData as any)?.data)) return (rawAppointmentsData as any).data;
    if (Array.isArray((rawAppointmentsData as any)?.response)) return (rawAppointmentsData as any).response;
    return [];
  }, [rawAppointmentsData]);

  const patientAppointments = useMemo(() => {
    if (!appointmentsList || appointmentsList.length === 0) return [];
    if (selectedMemberId === 'ALL') return appointmentsList;

    if (selectedMemberId === 'SELF') {
      const mainUserId = String(user?.id ?? (userProfileData as any)?.data?.id ?? userIdStr);
      const selfFName = (user?.f_name || (userProfileData as any)?.data?.f_name || '').trim().toLowerCase();
      const familyIds = new Set(familyMembersList.map((m) => String(m.id)));

      return appointmentsList.filter((app: any) => {
        const pId = app.patient_id != null ? String(app.patient_id) : null;
        const fId = app.family_member_id != null ? String(app.family_member_id) : null;

        if (pId === mainUserId || fId === mainUserId) return true;
        if (selfFName && app.patient_f_name?.trim().toLowerCase() === selfFName) return true;
        if (!pId || !familyIds.has(pId)) return true;

        return false;
      });
    }

    const selectedMem = familyMembersList.find((m) => String(m.id) === String(selectedMemberId));
    const targetFName = selectedMem?.f_name?.trim().toLowerCase();

    return appointmentsList.filter((app: any) => {
      const pId = app.patient_id != null ? String(app.patient_id) : null;
      const fId = app.family_member_id != null ? String(app.family_member_id) : null;

      if (pId === String(selectedMemberId) || fId === String(selectedMemberId)) return true;
      if (targetFName && app.patient_f_name?.trim().toLowerCase() === targetFName) return true;

      return false;
    });
  }, [appointmentsList, selectedMemberId, familyMembersList, user, userProfileData, userIdStr]);

  const latestAppointments = useMemo(() => {
    return patientAppointments.slice(0, 3);
  }, [patientAppointments]);

  const allFilesList = useMemo(() => {
    let list: any[] = [];
    if (Array.isArray(rawPatientFilesData)) list = rawPatientFilesData;
    else if (Array.isArray((rawPatientFilesData as any)?.data)) list = (rawPatientFilesData as any).data;
    else if (Array.isArray((rawPatientFilesData as any)?.response)) list = (rawPatientFilesData as any).response;
    else if (Array.isArray((rawPatientFilesData as any)?.response?.data)) list = (rawPatientFilesData as any).response.data;
    else if (Array.isArray((rawPatientFilesData as any)?.result)) list = (rawPatientFilesData as any).result;
    return list;
  }, [rawPatientFilesData]);

  const patientFiles = useMemo(() => {
    if (!allFilesList || allFilesList.length === 0) return [];
    if (selectedMemberId === 'ALL') return allFilesList;

    const selectedMem = familyMembersList.find((m) => String(m.id) === String(selectedMemberId));
    const targetFName = selectedMem?.f_name?.trim().toLowerCase();

    const filtered = allFilesList.filter((item: any) => {
      const itemMemId = item.family_member_id ?? item.patient_id ?? item.member_id;
      if (itemMemId != null && String(itemMemId) === String(selectedMemberId)) {
        return true;
      }
      if (selectedMemberId === 'SELF') {
        const mainUserId = String(user?.id ?? userIdStr);
        if (itemMemId != null && String(itemMemId) === mainUserId) return true;
        const selfFName = (user?.f_name || '').trim().toLowerCase();
        const pName = (item.patient_name || item.f_name || item.title || '').trim().toLowerCase();
        if (selfFName && pName && (pName.includes(selfFName) || selfFName.includes(pName))) return true;
      }
      if (targetFName) {
        const pName = (item.patient_name || item.f_name || item.title || '').trim().toLowerCase();
        if (pName && (pName.includes(targetFName) || targetFName.includes(pName))) return true;
      }
      return false;
    });

    return filtered.length > 0 ? filtered : allFilesList;
  }, [allFilesList, selectedMemberId, familyMembersList, user, userIdStr]);

  const latestFiles = useMemo(() => {
    return patientFiles.slice(0, 3);
  }, [patientFiles]);

  // Dynamic Vitals Queries based on active selected member filter
  const activeFamilyId = useMemo(() => {
    if (selectedMemberId === 'ALL' || selectedMemberId === 'SELF') {
      const selfMem = familyMembersList.find(
        (m: any) =>
          (m.relationship || '').toLowerCase() === 'self' ||
          m.is_self === true
      );
      if (selfMem?.id) return String(selfMem.id);
      return userIdStr;
    }
    return String(selectedMemberId);
  }, [selectedMemberId, userIdStr, familyMembersList]);

  const { data: rawBpVitals, refetch: refetchBp } = useGetVitalsQuery(
    { familyMemberId: activeFamilyId, type: 'Blood Pressure' },
    { skip: !activeFamilyId }
  );
  const { data: rawSugarVitals, refetch: refetchSugar } = useGetVitalsQuery(
    { familyMemberId: activeFamilyId, type: 'Sugar' },
    { skip: !activeFamilyId }
  );
  const { data: rawWeightVitals, refetch: refetchWeight } = useGetVitalsQuery(
    { familyMemberId: activeFamilyId, type: 'Weight' },
    { skip: !activeFamilyId }
  );
  const { data: rawTempVitals, refetch: refetchTemp } = useGetVitalsQuery(
    { familyMemberId: activeFamilyId, type: 'Temperature' },
    { skip: !activeFamilyId }
  );
  const { data: rawSpo2Vitals, refetch: refetchSpo2 } = useGetVitalsQuery(
    { familyMemberId: activeFamilyId, type: 'SpO2' },
    { skip: !activeFamilyId }
  );

  // Edit Vital Modal State
  const [editingVitalItem, setEditingVitalItem] = useState<any | null>(null);
  const [editingVitalType, setEditingVitalType] = useState<string>('Blood Pressure');
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState<string>(new Date().toTimeString().slice(0, 5));
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [showTimePicker, setShowTimePicker] = useState<boolean>(false);

  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [value, setValue] = useState('');
  const [sugarRandom, setSugarRandom] = useState('');

  const [updateVital, { isLoading: isUpdating }] = useUpdateVitalMutation();

  const openEditModal = (item: any, vitalType: string) => {
    setEditingVitalItem(item);
    setEditingVitalType(vitalType);
    const dateVal = item.date ? item.date.split('T')[0] : (item.created_at ? item.created_at.split('T')[0] : new Date().toISOString().split('T')[0]);
    setSelectedDate(dateVal);
    const timeVal = item.time ? item.time.slice(0, 5) : new Date().toTimeString().slice(0, 5);
    setSelectedTime(timeVal);

    if (vitalType === 'Blood Pressure') {
      setSystolic(item.bp_systolic ? String(item.bp_systolic) : '');
      setDiastolic(item.bp_diastolic ? String(item.bp_diastolic) : '');
    } else if (vitalType === 'Sugar') {
      setValue(item.sugar_fasting ? String(item.sugar_fasting) : '');
      setSugarRandom(item.sugar_random ? String(item.sugar_random) : '');
    } else if (vitalType === 'Weight') {
      setValue(item.weight || item.value ? String(item.weight || item.value) : '');
    } else if (vitalType === 'Temperature') {
      setValue(item.temperature || item.value ? String(item.temperature || item.value) : '');
    } else if (vitalType === 'SpO2') {
      setValue(item.spo2 || item.value ? String(item.spo2 || item.value) : '');
    }
    setShowEditModal(true);
  };

  const handleUpdateVitalSubmit = async () => {
    if (!editingVitalItem?.id) return;

    const payload: any = {
      id: editingVitalItem.id,
      user_id: userIdStr,
      family_member_id: activeFamilyId,
      type: editingVitalType,
      date: selectedDate,
      time: selectedTime,
    };

    if (editingVitalType === 'Blood Pressure') {
      if (!systolic.trim() || !diastolic.trim()) {
        showToast('Enter Systolic and Diastolic values');
        return;
      }
      payload.bp_systolic = systolic;
      payload.bp_diastolic = diastolic;
    } else if (editingVitalType === 'Sugar') {
      if (!value.trim() && !sugarRandom.trim()) {
        showToast('Enter Fasting or Random sugar reading');
        return;
      }
      payload.sugar_fasting = value;
      payload.sugar_random = sugarRandom;
    } else if (editingVitalType === 'Weight') {
      if (!value.trim()) {
        showToast('Enter Weight reading');
        return;
      }
      payload.weight = value;
    } else if (editingVitalType === 'Temperature') {
      if (!value.trim()) {
        showToast('Enter Temperature reading');
        return;
      }
      payload.temperature = value;
    } else if (editingVitalType === 'SpO2') {
      if (!value.trim()) {
        showToast('Enter SpO2 reading');
        return;
      }
      payload.spo2 = value;
    }

    try {
      const res = await updateVital(payload).unwrap();
      if (res?.status || res?.response === 200 || res?.message?.includes('successfully')) {
        showToast('Vital updated successfully');
        refetchBp();
        refetchSugar();
        refetchWeight();
        refetchTemp();
        refetchSpo2();
        setShowEditModal(false);
      } else {
        showToast(res?.message || 'Failed to update vital');
      }
    } catch (err: any) {
      showToast(err?.data?.message || err?.message || 'Failed to update vital');
    }
  };

  const getLatestVitalValue = (rawData: any, type: string) => {
    if (!rawData) return 'N/A';
    let list: any[] = [];
    if (Array.isArray(rawData)) list = rawData;
    else if (Array.isArray(rawData?.data)) list = rawData.data;
    else if (Array.isArray(rawData?.response)) list = rawData.response;
    if (list.length === 0) return 'N/A';

    const sortedList = [...list].sort((a, b) => {
      const dateA = a.date ? a.date.split('T')[0] : '';
      const timeA = a.time ? a.time.slice(0, 5) : '00:00';
      const dtA = dateA
        ? new Date(`${dateA}T${timeA.length === 5 ? timeA + ':00' : timeA}`).getTime()
        : (new Date(a.created_at || 0).getTime() || 0);

      const dateB = b.date ? b.date.split('T')[0] : '';
      const timeB = b.time ? b.time.slice(0, 5) : '00:00';
      const dtB = dateB
        ? new Date(`${dateB}T${timeB.length === 5 ? timeB + ':00' : timeB}`).getTime()
        : (new Date(b.created_at || 0).getTime() || 0);

      if (dtB !== dtA && !isNaN(dtB) && !isNaN(dtA)) {
        return dtB - dtA;
      }
      return (Number(b.id) || 0) - (Number(a.id) || 0);
    });

    const filteredList = sortedList.filter((item) => isWithinLast7Days(item.date || item.created_at));
    const latest = filteredList[0] || sortedList[0];
    if (!latest) return 'N/A';
    if (type === 'Blood Pressure') {
      if (latest.bp_systolic && latest.bp_diastolic) return `${latest.bp_systolic}/${latest.bp_diastolic}`;
      if (latest.value) return String(latest.value);
      return 'N/A';
    }
    if (type === 'Sugar') {
      if (latest.sugar_fasting) return String(latest.sugar_fasting);
      if (latest.sugar_random) return String(latest.sugar_random);
      if (latest.value) return String(latest.value);
      return 'N/A';
    }
    if (type === 'Weight') return latest.weight || latest.value ? String(latest.weight || latest.value) : 'N/A';
    if (type === 'Temperature') return latest.temperature || latest.value ? String(latest.temperature || latest.value) : 'N/A';
    if (type === 'SpO2') return latest.spo2 || latest.value ? String(latest.spo2 || latest.value) : 'N/A';
    return 'N/A';
  };

  const calculatePatientAge = (dobString?: string) => {
    if (!dobString || dobString === 'N/A' || dobString === 'null' || dobString === 'undefined') return 'N/A';
    const cleanStr = String(dobString).trim().split('T')[0].split(' ')[0];
    let birthDate: Date;
    if (cleanStr.includes('-')) {
      const parts = cleanStr.split('-');
      if (parts.length === 3 && parts[0].length === 4) {
        birthDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      } else {
        birthDate = new Date(cleanStr);
      }
    } else if (cleanStr.includes('/')) {
      const parts = cleanStr.split('/');
      if (parts.length === 3) {
        if (parts[2].length === 4) {
          birthDate = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
        } else if (parts[0].length === 4) {
          birthDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        } else {
          birthDate = new Date(cleanStr);
        }
      } else {
        birthDate = new Date(cleanStr);
      }
    } else {
      birthDate = new Date(cleanStr);
    }

    if (isNaN(birthDate.getTime())) return 'N/A';
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    if (age > 0 && age < 125) return `${age} Yrs`;
    if (age === 0) return '< 1 Yr';
    return 'N/A';
  };

  const activePatientInfo: ActivePatientInfo = useMemo(() => {
    const mainUser = userProfileData?.data ?? userProfileData ?? user;
    let recentDocName = 'No Recent Appointment';
    if (patientAppointments.length > 0) {
      const app = patientAppointments[0];
      recentDocName = formatDoctorName(app.doct_f_name || app.doctor_name || app.name, app.doct_l_name);
    }

    if (selectedMemberId === 'SELF') {
      const dobStr = mainUser?.dob ? String(mainUser.dob).split('T')[0] : undefined;
      return {
        name: getUserFullName(mainUser) || 'N/A',
        gender: mainUser?.gender || 'N/A',
        dob: dobStr || 'N/A',
        age: calculatePatientAge(dobStr),
        bloodGroup: mainUser?.blood_group || mainUser?.blood_g || 'N/A',
        consultingDoctor: recentDocName,
        relation: 'Self',
        isSelf: true,
      };
    }
    if (selectedMemberId !== 'ALL') {
      const member = familyMembersList.find((m) => String(m.id) === String(selectedMemberId));
      if (member) {
        const dobStr = member.dob ? String(member.dob).split('T')[0] : undefined;
        const blood = (member as any).blood_group || (member as any).blood_g;
        return {
          name: `${member.f_name || ''} ${member.l_name || ''}`.trim() || 'N/A',
          gender: member.gender || 'N/A',
          dob: dobStr || 'N/A',
          age: calculatePatientAge(dobStr),
          bloodGroup: blood && String(blood).trim() ? String(blood).trim() : 'N/A',
          consultingDoctor: recentDocName,
          relation: member.relationship || (member as any).relation || 'Family Member',
          isSelf: false,
        };
      }
    }
    const dobStr = mainUser?.dob ? String(mainUser.dob).split('T')[0] : undefined;
    return {
      name: getUserFullName(mainUser) || 'N/A',
      gender: mainUser?.gender || 'N/A',
      dob: dobStr || 'N/A',
      age: calculatePatientAge(dobStr),
      bloodGroup: mainUser?.blood_group || mainUser?.blood_g || 'N/A',
      consultingDoctor: recentDocName,
      relation: 'Account Holder',
      isSelf: true,
    };
  }, [selectedMemberId, familyMembersList, userProfileData, user, patientAppointments]);

  const userCreatedAt = useMemo(() => {
    const u = userProfileData?.data ?? userProfileData ?? user;
    return u?.created_at ?? '';
  }, [userProfileData, user]);

  const { data: notificationsData, refetch: refetchNotifications } = useGetNotificationsByDateQuery(
    { uid: userIdStr, date: userCreatedAt },
    { skip: !userIdStr || !userCreatedAt, refetchOnMountOrArgChange: true }
  );

  const [localNotificationSeenAt, setLocalNotificationSeenAt] = useState<string>('');

  useFocusEffect(
    useCallback(() => {
      let active = true;
      if (!isAuthenticated || !userIdStr) {
        setLocalNotificationSeenAt('');
        return;
      }
      storageService.getItem<string>(getNotificationSeenKey(userIdStr)).then((val) => {
        if (active && val) {
          setLocalNotificationSeenAt(String(val));
        }
      });
      if (userCreatedAt) {
        refetchNotifications();
      }
      return () => {
        active = false;
      };
    }, [isAuthenticated, userIdStr, userCreatedAt, refetchNotifications])
  );

  const hasUnreadNotifications = useMemo(() => {
    if (!isAuthenticated || !userIdStr) return false;
    const list = extractNotificationsList(notificationsData);
    if (list.length === 0) return false;

    const u = userProfileData?.data ?? userProfileData ?? user;
    const serverSeenMs = u?.notification_seen_at ? new Date(u.notification_seen_at).getTime() : NaN;
    const localSeenMs = localNotificationSeenAt ? new Date(localNotificationSeenAt).getTime() : NaN;
    const seenCandidates = [serverSeenMs, localSeenMs].filter((t) => !Number.isNaN(t));

    if (seenCandidates.length === 0) {
      return true;
    }

    const latestSeenMs = Math.max(...seenCandidates);
    return list.some((item: NotificationModel) => {
      if (!item.created_at) return false;
      const itemTime = new Date(item.created_at).getTime();
      return !Number.isNaN(itemTime) && itemTime > latestSeenMs;
    });
  }, [isAuthenticated, userIdStr, notificationsData, userProfileData, user, localNotificationSeenAt]);

  const toArray = (res: any) => {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.response)) return res.response;
    if (Array.isArray(res?.result)) return res.result;
    return [];
  };

  const deptList: DepartmentModel[] = useMemo(() => toArray(departments), [departments]);
  const doctorList: DoctorModel[] = useMemo(() => toArray(doctors), [doctors]);
  const clinicList = useMemo(() => toArray(clinicsData), [clinicsData]);
  const bannerList: BannerModel[] = useMemo(() => toArray(bannersData), [bannersData]);

  const handleDepartmentPress = useCallback(
    (dept: DepartmentModel) => {
      navigation.navigate('DoctorList', {
        selectedDeptId: dept.id != null ? String(dept.id) : undefined,
        selectedDeptTitle: dept.title,
      });
    },
    [navigation]
  );

  const handleDoctorClick = useCallback(
    (doc: DoctorModel) => {
      const targetId = String(doc.user_id || doc.id);
      if (!isAuthenticated) {
        navigation.navigate('Login', {
          redirectTo: 'BookAppointment',
          redirectParams: { doctId: targetId },
        });
        return;
      }
      navigation.navigate('BookAppointment', { doctId: targetId });
    },
    [isAuthenticated, navigation]
  );

  const handleBannerScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const offset = event.nativeEvent.contentOffset.x;
    const index = Math.round(offset / slideSize);
    setActiveBannerIndex(index);
  };

  const userImage = user?.image || user?.image_url || (user as any)?.imageUrl || '';
  const greetingName = isAuthenticated
    ? (getUserFullName(user) || 'User').trim().split(/\s+/)[0]
    : 'Guest';
  const genderRaw = String(activePatientInfo.gender || '').trim().toLowerCase();
  const genderIconName: 'male' | 'female' | 'wc' =
    genderRaw.startsWith('f') ? 'female' : genderRaw.startsWith('m') ? 'male' : 'wc';

  return {
    navigation,
    isAuthenticated,
    user,
    userImage,
    greetingName,
    hasUnreadNotifications,
    search,
    setSearch,
    selectedCity,
    activeCityName,
    activeCityId,
    hasCityFilter,
    isDetectingLocation,
    showLocationModal,
    setShowLocationModal,
    deviceLocationCity,
    isUsingCurrentLocation,
    citiesList,
    handleCitySelect,
    selectedMemberId,
    setSelectedMemberId,
    selectedMemberDisplayName,
    selfFullName,
    filteredFamilyMembersList,
    showMemberDropdown,
    setShowMemberDropdown,
    activePatientInfo,
    genderIconName,
    rawBpVitals,
    rawSugarVitals,
    rawWeightVitals,
    rawTempVitals,
    rawSpo2Vitals,
    getLatestVitalValue,
    activeFamilyId,
    handleDeleteVitalRecord,
    latestAppointments,
    latestFiles,
    downloadingFileId,
    setDownloadingFileId,
    bannerList,
    activeBannerIndex,
    handleBannerScroll,
    deptList,
    deptLoading,
    deptError,
    handleDepartmentPress,
    doctorList,
    doctorsLoading,
    handleDoctorClick,
    clinicList,
    clinicsLoading,
    // Edit Vital Modal
    editingVitalItem,
    editingVitalType,
    showEditModal,
    setShowEditModal,
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
    openEditModal,
    handleUpdateVitalSubmit,
    isUpdating,
  };
};
