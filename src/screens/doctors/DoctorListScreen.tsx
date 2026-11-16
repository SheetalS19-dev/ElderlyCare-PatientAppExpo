import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  DoctorCard,
  EmptyState,
  ErrorState,
  LoadingIndicator,
  SearchBox,
  AppHeader,
  DepartmentSelectModal,
} from '../../components';
import { Colors } from '../../constants';
import { useAuth } from '../../context/AuthContext';
import { useDebounce } from '../../hooks';
import type { RootStackParamList } from '../../navigation/types';
import {
  useGetDepartmentsQuery,
  useGetDoctorsQuery,
} from '../../redux/apis/doctorApi';
import type { DepartmentModel, DoctorModel } from '../../types';
import { doctorMatchesDepartment, doctorMatchesSearch, fs, hs, TYPOGRAPHY, ws } from '../../utils';

type Props = NativeStackScreenProps<RootStackParamList, 'DoctorList'>;

export const DoctorListScreen = ({ navigation, route }: Props) => {
  const insets = useSafeAreaInsets();
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
      // When only the id is known (deep link), resolve the title from the department list
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

  const handleSelectDepartment = (dept?: DepartmentModel) => {
    if (!dept) {
      setSelectedDeptId(undefined);
      setSelectedDeptTitle(undefined);
    } else {
      setSelectedDeptId(String(dept.id));
      setSelectedDeptTitle(dept.title);
    }
    setIsDeptModalVisible(false);
  };

  const handleClearDepartment = () => {
    setSelectedDeptId(undefined);
    setSelectedDeptTitle(undefined);
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title={selectedDeptTitle || 'Doctors'}
        onBackPress={() => navigation.goBack()}
      />

      <View style={styles.searchWrapper}>
        <SearchBox
          value={search}
          onChangeText={setSearch}
          placeholder="Search doctors, specializations, clinics..."
        />

        {/* Department Dropdown Selector */}
        {departments.length > 0 && (
          <TouchableOpacity
            style={styles.deptSelector}
            activeOpacity={0.7}
            onPress={() => setIsDeptModalVisible(true)}
          >
            <MaterialIcons
              name="medical-services"
              size={18}
              color={Colors.primaryColor}
            />
            <Text style={[styles.deptSelectorText, !selectedDeptTitle && styles.deptSelectorPlaceholder]} numberOfLines={1}>
              {selectedDeptTitle ? selectedDeptTitle : 'Select Department'}
            </Text>
            {selectedDeptId || selectedDeptTitle ? (
              <TouchableOpacity
                onPress={() => handleSelectDepartment(undefined)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={18} color={Colors.secondaryFontColor} />
              </TouchableOpacity>
            ) : (
              <Ionicons name="chevron-down" size={18} color={Colors.secondaryFontColor} />
            )}
          </TouchableOpacity>
        )}
      </View>



      {isDoctorsLoading && doctorsList.length === 0 ? (
        <LoadingIndicator />
      ) : isError ? (
        <ErrorState message="Couldn't load doctors" onRetry={refetch} />
      ) : (
        <FlatList
          data={doctorsList}
          keyExtractor={(item: DoctorModel, index: number) =>
            `doc-${item.user_id ?? item.id ?? index}`
          }
          contentContainerStyle={[styles.listContent, { paddingBottom: hs(80) + Math.max(insets.bottom, hs(24)) }]}
          refreshing={isFetching}
          onRefresh={refetch}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              message={
                selectedDeptTitle
                  ? `No doctors available in ${selectedDeptTitle}`
                  : 'No doctors found matching your search'
              }
            />
          }
          renderItem={({ item }: { item: DoctorModel }) => (
            <DoctorCard
              doctor={item}
              variant="list"
              onPress={() =>
                navigation.navigate('DoctorDetails', {
                  doctId: String(item.user_id || item.id),
                })
              }
              onBookPress={() => {
                if (!isAuthenticated) {
                  navigation.navigate('Login');
                  return;
                }
                navigation.navigate('BookAppointment', {
                  doctId: String(item.user_id || item.id),
                });
              }}
            />
          )}
        />
      )}
      {/* Department Picker Modal */}
      <DepartmentSelectModal
        visible={isDeptModalVisible}
        onClose={() => setIsDeptModalVisible(false)}
        departments={departments}
        selectedDeptId={selectedDeptId}
        selectedDeptTitle={selectedDeptTitle}
        onSelectDepartment={handleSelectDepartment}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgColor,
  },
  searchWrapper: {
    paddingHorizontal: ws(16),
    paddingTop: hs(12),
    paddingBottom: hs(10),
    backgroundColor: Colors.bgColor,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderColor,
    zIndex: 1,
  },
  deptSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: fs(10),
    paddingHorizontal: ws(12),
    paddingVertical: hs(10),
    borderWidth: 1,
    borderColor: Colors.borderColor,
    marginTop: hs(8),
    marginBottom: hs(4),
  },
  deptSelectorText: {
    flex: 1,
    marginLeft: ws(8),
    fontSize: fs(13),
    ...TYPOGRAPHY.medium,
    color: Colors.primaryFontColor,
  },
  deptSelectorPlaceholder: {
    color: Colors.secondaryFontColor,
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: ws(16),
    paddingTop: hs(12),
    paddingBottom: hs(32),
  },
});
