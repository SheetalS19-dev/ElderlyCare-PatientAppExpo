import Ionicons from '@expo/vector-icons/Ionicons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  ScrollView,
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
} from '../../components';
import { Colors, Typography } from '../../constants';
import { useAuth } from '../../context/AuthContext';
import { useDebounce } from '../../hooks';
import type { RootStackParamList } from '../../navigation/types';
import {
  useGetDepartmentsQuery,
  useGetDoctorsQuery,
} from '../../redux/apis/doctorApi';
import type { DepartmentModel, DoctorModel } from '../../types';

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

    // Filter by department id or title if selected
    if (selectedDeptId || selectedDeptTitle) {
      list = list.filter((doc: any) => {
        const docDeptId = String(doc.dept_id ?? doc.department_id ?? '');
        const docDeptTitle = (
          doc.dept_title ??
          doc.dept_name ??
          doc.department_name ??
          doc.specialization ??
          ''
        ).toLowerCase();

        if (selectedDeptId && docDeptId === String(selectedDeptId)) {
          return true;
        }

        if (selectedDeptTitle) {
          const targetTitle = selectedDeptTitle.toLowerCase().trim();
          if (docDeptTitle.includes(targetTitle) || targetTitle.includes(docDeptTitle)) {
            return true;
          }
        }
        return false;
      });
    }

    // Filter by search query
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase().trim();
      list = list.filter((doc: any) => {
        const fullName = `${doc.f_name ?? ''} ${doc.l_name ?? ''}`.toLowerCase();
        const clinic = (doc.clinic_title ?? doc.clinic_name ?? '').toLowerCase();
        const spec = (doc.specialization ?? '').toLowerCase();
        const dept = (doc.dept_title ?? doc.dept_name ?? '').toLowerCase();
        const address = (doc.clinics_address ?? doc.address ?? '').toLowerCase();
        return (
          fullName.includes(q) ||
          clinic.includes(q) ||
          spec.includes(q) ||
          dept.includes(q) ||
          address.includes(q)
        );
      });
    }

    return list;
  }, [rawDoctorsData, selectedDeptId, selectedDeptTitle, debouncedSearch]);

  const handleSelectDepartment = (dept?: DepartmentModel) => {
    if (!dept) {
      setSelectedDeptId(undefined);
      setSelectedDeptTitle(undefined);
    } else {
      setSelectedDeptId(String(dept.id));
      setSelectedDeptTitle(dept.title);
    }
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
      </View>

      {/* Horizontal Department Chips */}
      {departments.length > 0 && (
        <View style={styles.deptScrollWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.deptChipsContainer}
          >
            <TouchableOpacity
              style={[
                styles.deptChip,
                !selectedDeptId && !selectedDeptTitle && styles.deptChipActive,
              ]}
              onPress={() => handleSelectDepartment(undefined)}
            >
              <Text
                style={[
                  styles.deptChipText,
                  !selectedDeptId && !selectedDeptTitle && styles.deptChipTextActive,
                ]}
              >
                All
              </Text>
            </TouchableOpacity>

            {departments.map((dept) => {
              const isSelected =
                (selectedDeptId && String(dept.id) === selectedDeptId) ||
                (selectedDeptTitle && dept.title === selectedDeptTitle);
              return (
                <TouchableOpacity
                  key={`dept-${dept.id}`}
                  style={[styles.deptChip, isSelected && styles.deptChipActive]}
                  onPress={() => handleSelectDepartment(dept)}
                >
                  <Text
                    style={[
                      styles.deptChipText,
                      isSelected && styles.deptChipTextActive,
                    ]}
                  >
                    {dept.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Selected department filter indicator matching Flutter */}
      {!!selectedDeptTitle && (
        <View style={styles.filterBanner}>
          <Text style={styles.filterText}>
            Showing doctors from{' '}
            <Text style={styles.filterHighlight}>{selectedDeptTitle}</Text>{' '}
            department
          </Text>
          <TouchableOpacity
            onPress={handleClearDepartment}
            style={styles.clearDeptBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close-circle" size={20} color={Colors.primaryColor} />
          </TouchableOpacity>
        </View>
      )}

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
          contentContainerStyle={[styles.listContent, { paddingBottom: Math.max(insets.bottom + 20, 32) }]}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgColor,
  },
  searchWrapper: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
  },
  deptScrollWrapper: {
    paddingVertical: 6,
  },
  deptChipsContainer: {
    paddingHorizontal: 16,
  },
  deptChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 8,
  },
  deptChipActive: {
    backgroundColor: Colors.primaryColor,
    borderColor: Colors.primaryColor,
  },
  deptChipText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primaryFontColor,
  },
  deptChipTextActive: {
    color: Colors.white,
    fontFamily: Typography.fontFamily.bold,
  },
  filterBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#EFF6FF',
    borderBottomWidth: 1,
    borderBottomColor: '#DBEAFE',
  },
  filterText: {
    flex: 1,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primaryFontColor,
  },
  filterHighlight: {
    color: Colors.primaryColor,
    fontFamily: Typography.fontFamily.bold,
  },
  clearDeptBtn: {
    marginLeft: 8,
  },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingBottom: 32,
  },
});
