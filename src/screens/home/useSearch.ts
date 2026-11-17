import type { RouteProp } from '@react-navigation/native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useDebounce } from '../../hooks';
import type { RootStackParamList } from '../../navigation/types';
import { useGetClinicsQuery } from '../../redux/apis/clinicApi';
import {
  useGetCitiesQuery,
  useGetDepartmentsQuery,
  useGetDoctorsQuery,
} from '../../redux/apis/doctorApi';
import type { CityModel, ClinicModel, DepartmentModel, DoctorModel } from '../../types';
import {
  detectDeviceCityName,
  doctorMatchesDepartment,
  formatCityDisplayName,
  matchCityFromList,
  showToast,
} from '../../utils';

export const useSearch = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'Search'>>();
  const { isAuthenticated } = useAuth();

  const initialSearch = route.params?.searchQuery ?? '';
  const initialTab = route.params?.initialTab ?? 'doctors';
  const initialDeptId = route.params?.selectedDeptId;
  const initialDeptTitle = route.params?.selectedDeptTitle;

  const [search, setSearch] = useState(initialSearch);
  const [activeTab, setActiveTab] = useState<'doctors' | 'clinics'>(initialTab);
  const [selectedDeptId, setSelectedDeptId] = useState<string | undefined>(
    initialDeptId ? String(initialDeptId) : undefined
  );
  const [selectedDeptTitle, setSelectedDeptTitle] = useState<string | undefined>(
    initialDeptTitle
  );

  const [selectedCity, setSelectedCity] = useState<{ id: string; title: string }>({
    id: '',
    title: '',
  });
  const [deviceLocationCity, setDeviceLocationCity] = useState<string | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [isUsingCurrentLocation, setIsUsingCurrentLocation] = useState(false);
  const [citySearch] = useState('');
  const [isCityModalVisible, setIsCityModalVisible] = useState(false);
  const [isDeptModalVisible, setIsDeptModalVisible] = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  // Sync params when navigation triggers new route params
  useEffect(() => {
    if (route.params?.searchQuery !== undefined) {
      setSearch(route.params.searchQuery);
    }
    if (route.params?.initialTab) {
      setActiveTab(route.params.initialTab);
    }
    if (route.params?.selectedDeptId) {
      setSelectedDeptId(String(route.params.selectedDeptId));
    }
    if (route.params?.selectedDeptTitle) {
      setSelectedDeptTitle(route.params.selectedDeptTitle);
    }
  }, [
    route.params?.searchQuery,
    route.params?.initialTab,
    route.params?.selectedDeptId,
    route.params?.selectedDeptTitle,
  ]);

  // Doctors & Clinics Queries (Backend driven filtering & searching)
  const {
    data: rawDoctorsData,
    isLoading: isDoctorsLoading,
    refetch: refetchDoctors,
  } = useGetDoctorsQuery({
    cityId: selectedCity.id || undefined,
    department: selectedDeptId || undefined,
    search: debouncedSearch.trim() || undefined,
  });

  const {
    data: rawClinicsData,
    isLoading: isClinicsLoading,
    refetch: refetchClinics,
  } = useGetClinicsQuery(
    {
      cityId: selectedCity.id || undefined,
      search: debouncedSearch.trim() || undefined,
    },
    { refetchOnMountOrArgChange: true }
  );

  const { data: rawDeptData } = useGetDepartmentsQuery();
  const { data: citiesData } = useGetCitiesQuery(citySearch);

  // Unwrapped departments
  const departments: DepartmentModel[] = useMemo(() => {
    if (Array.isArray(rawDeptData)) return rawDeptData;
    if (Array.isArray((rawDeptData as any)?.data)) return (rawDeptData as any).data;
    if (Array.isArray((rawDeptData as any)?.response)) return (rawDeptData as any).response;
    return [];
  }, [rawDeptData]);

  // Unwrapped cities
  const cities: CityModel[] = useMemo(() => {
    if (Array.isArray(citiesData)) return citiesData;
    if (Array.isArray(citiesData?.data)) return citiesData.data;
    return [];
  }, [citiesData]);

  // Master doctors list directly returned from backend API
  const filteredDoctors: DoctorModel[] = useMemo(() => {
    let list: DoctorModel[] = [];
    if (Array.isArray(rawDoctorsData)) list = rawDoctorsData;
    else if (Array.isArray((rawDoctorsData as any)?.data)) list = (rawDoctorsData as any).data;
    else if (Array.isArray((rawDoctorsData as any)?.response)) list = (rawDoctorsData as any).response;

    // Strict department check on top of the backend filter so a doctor is only listed
    // under the department that their card shows.
    if (selectedDeptId || selectedDeptTitle) {
      const resolvedTitle =
        selectedDeptTitle ||
        departments.find((d) => String(d.id) === String(selectedDeptId))?.title ||
        undefined;
      list = list.filter((doc: any) => doctorMatchesDepartment(doc, selectedDeptId, resolvedTitle));
    }
    return list;
  }, [rawDoctorsData, selectedDeptId, selectedDeptTitle, departments]);

  // Master clinics list directly returned from backend API
  const filteredClinics: ClinicModel[] = useMemo(() => {
    let list: ClinicModel[] = [];
    if (Array.isArray(rawClinicsData)) list = rawClinicsData;
    else if (Array.isArray((rawClinicsData as any)?.data)) list = (rawClinicsData as any).data;
    else if (Array.isArray((rawClinicsData as any)?.response)) list = (rawClinicsData as any).response;
    else if (Array.isArray((rawClinicsData as any)?.result)) list = (rawClinicsData as any).result;
    return list;
  }, [rawClinicsData]);

  const handleSelectDepartment = (dept?: DepartmentModel) => {
    if (!dept) {
      setSelectedDeptId(undefined);
      setSelectedDeptTitle(undefined);
    } else {
      setSelectedDeptId(String(dept.id));
      setSelectedDeptTitle(dept.title || (dept as any).name || (dept as any).dept_name || '');
    }
  };

  const handleSelectCity = async (city: CityModel | null | undefined) => {
    setIsCityModalVisible(false);
    if (city === undefined) {
      setIsUsingCurrentLocation(true);
      setIsDetectingLocation(true);
      try {
        const detected = await detectDeviceCityName();
        if (detected) {
          setDeviceLocationCity(detected);
          const matched = matchCityFromList(detected, cities);
          if (matched) {
            setSelectedCity({ id: String(matched.id ?? ''), title: formatCityDisplayName(matched) });
            showToast(`Location set to ${matched.title || detected}`);
          } else {
            setSelectedCity({ id: '', title: '' });
            showToast(`Detected ${detected}; showing all cities`);
          }
        } else {
          setIsUsingCurrentLocation(false);
          showToast('Could not detect current location');
        }
      } finally {
        setIsDetectingLocation(false);
      }
    } else if (!city) {
      setIsUsingCurrentLocation(false);
      setSelectedCity({ id: '', title: '' });
    } else {
      setIsUsingCurrentLocation(false);
      setSelectedCity({ id: String(city.id ?? ''), title: formatCityDisplayName(city) });
    }
  };

  const hasCityFilter = Boolean(selectedCity.id);
  const hasDeptFilter = Boolean(selectedDeptId || selectedDeptTitle);
  const hasActiveFilters = hasCityFilter || hasDeptFilter || Boolean(debouncedSearch.trim());

  const handleResetFilters = () => {
    setSearch('');
    setSelectedCity({ id: '', title: '' });
    handleSelectDepartment(undefined);
  };

  const handleDoctorBookPress = (doc: DoctorModel) => {
    if (!isAuthenticated) {
      navigation.navigate('Login');
      return;
    }
    navigation.navigate('BookAppointment', {
      doctId: String(doc.user_id || doc.id),
    });
  };

  return {
    navigation,
    insets,
    isAuthenticated,
    search,
    setSearch,
    activeTab,
    setActiveTab,
    selectedDeptId,
    selectedDeptTitle,
    selectedCity,
    setSelectedCity,
    deviceLocationCity,
    isDetectingLocation,
    isUsingCurrentLocation,
    isCityModalVisible,
    setIsCityModalVisible,
    isDeptModalVisible,
    setIsDeptModalVisible,
    departments,
    cities,
    filteredDoctors,
    isDoctorsLoading,
    refetchDoctors,
    filteredClinics,
    isClinicsLoading,
    refetchClinics,
    handleSelectDepartment,
    handleSelectCity,
    hasCityFilter,
    hasDeptFilter,
    hasActiveFilters,
    handleResetFilters,
    handleDoctorBookPress,
  };
};
