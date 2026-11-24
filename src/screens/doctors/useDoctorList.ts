import type { RouteProp } from '@react-navigation/native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useDebounce } from '../../hooks';
import type { RootStackParamList } from '../../navigation/types';
import {
  useGetDepartmentsQuery,
  useGetDoctorsQuery,
} from '../../redux/apis/doctorApi';
import type { DepartmentModel, DoctorModel } from '../../types';
import { doctorMatchesDepartment, doctorMatchesSearch, showToast } from '../../utils';

export const useDoctorList = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'DoctorList'>>();
  const { isAuthenticated } = useAuth();
  const initialDeptId = route.params?.selectedDeptId || route.params?.categoryId;
  const initialDeptTitle = route.params?.selectedDeptTitle;
  const initialSearch = route.params?.searchQuery || route.params?.search;

  const [search, setSearch] = useState(initialSearch ?? '');
  const [selectedDeptId, setSelectedDeptId] = useState<string | undefined>(
    initialDeptId ? String(initialDeptId) : undefined
  );
  const [selectedDeptTitle, setSelectedDeptTitle] = useState<string | undefined>(
    initialDeptTitle
  );
  const [isDeptModalVisible, setIsDeptModalVisible] = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  // Sync route params when navigated with new params
  useEffect(() => {
    if (route.params?.selectedDeptId || route.params?.categoryId) {
      setSelectedDeptId(
        String(route.params.selectedDeptId || route.params.categoryId)
      );
    }
    if (route.params?.selectedDeptTitle) {
      setSelectedDeptTitle(route.params.selectedDeptTitle);
    }
    if (route.params?.searchQuery) {
      setSearch(route.params.searchQuery);
    }
  }, [
    route.params?.selectedDeptId,
    route.params?.categoryId,
    route.params?.selectedDeptTitle,
    route.params?.searchQuery,
  ]);

  const {
    data: rawDoctorsData,
    isLoading: isDoctorsLoading,
    isFetching,
    isError,
    refetch,
  } = useGetDoctorsQuery({});

  const { data: rawDeptData } = useGetDepartmentsQuery();

  const departments: DepartmentModel[] = useMemo(() => {
    if (Array.isArray(rawDeptData)) return rawDeptData;
    if (Array.isArray((rawDeptData as any)?.data)) return (rawDeptData as any).data;
    if (Array.isArray((rawDeptData as any)?.response)) return (rawDeptData as any).response;
    return [];
  }, [rawDeptData]);

  const doctorsList: DoctorModel[] = useMemo(() => {
    let list: DoctorModel[] = [];
    if (Array.isArray(rawDoctorsData)) list = rawDoctorsData;
    else if (Array.isArray((rawDoctorsData as any)?.data)) list = (rawDoctorsData as any).data;
    else if (Array.isArray((rawDoctorsData as any)?.response)) list = (rawDoctorsData as any).response;

    // Strict department filter (id/title must agree with what the card shows)
    if (selectedDeptId || selectedDeptTitle) {
      const resolvedTitle =
        selectedDeptTitle ||
        departments.find((d) => String(d.id) === String(selectedDeptId))?.title ||
        undefined;
      list = list.filter((doc: any) => doctorMatchesDepartment(doc, selectedDeptId, resolvedTitle));
    }

    // Text search combined (AND) with the department filter
    if (debouncedSearch.trim()) {
      list = list.filter((doc: any) => doctorMatchesSearch(doc, debouncedSearch));
    }

    return list;
  }, [rawDoctorsData, selectedDeptId, selectedDeptTitle, debouncedSearch, departments]);

  const handleSelectDepartment = useCallback((dept?: DepartmentModel) => {
    if (!dept) {
      setSelectedDeptId(undefined);
      setSelectedDeptTitle(undefined);
    } else {
      setSelectedDeptId(String(dept.id));
      setSelectedDeptTitle(dept.title);
    }
    setIsDeptModalVisible(false);
  }, []);

  const handleClearDepartment = useCallback(() => {
    setSelectedDeptId(undefined);
    setSelectedDeptTitle(undefined);
  }, []);

  const handleBookDoctor = useCallback((doc: DoctorModel) => {
    if (!isAuthenticated) {
      showToast('Please log in to book a consultation');
      navigation.navigate('Login');
      return;
    }
    const targetId = String((doc as any)?.user_id || (doc as any)?.doct_id || doc.id);
    navigation.navigate('BookAppointment', {
      doctId: targetId,
      clinicId: doc.clinic_id,
    });
  }, [isAuthenticated, navigation]);

  return {
    navigation,
    isAuthenticated,
    search,
    setSearch,
    selectedDeptId,
    selectedDeptTitle,
    isDeptModalVisible,
    setIsDeptModalVisible,
    departments,
    doctorsList,
    isDoctorsLoading,
    isFetching,
    isError,
    refetch,
    handleSelectDepartment,
    handleClearDepartment,
    handleBookDoctor,
  };
};
