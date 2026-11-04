import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import type { RootStackParamList } from '../../navigation/types';
import {
  AppHeader,
  SearchBox,
  DoctorCard,
  LoadingIndicator,
  EmptyState,
  CitySelectModal,
  DepartmentSelectModal,
} from '../../components';
import { Colors, Typography } from '../../constants';
import { useAuth } from '../../context/AuthContext';
import { useDebounce } from '../../hooks';
import {
  useGetDoctorsQuery,
  useGetDepartmentsQuery,
  useGetCitiesQuery,
} from '../../redux/apis/doctorApi';
import { useGetClinicsQuery } from '../../redux/apis/clinicApi';
import type { DoctorModel, ClinicModel, DepartmentModel, CityModel } from '../../types';
import { getImageUrl, ws, hs, fs, TYPOGRAPHY } from '../../utils';

type Props = NativeStackScreenProps<RootStackParamList, 'Search'>;

export const SearchScreen = ({ navigation, route }: Props) => {
  const insets = useSafeAreaInsets();
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
  const [citySearch, setCitySearch] = useState('');
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
  } = useGetClinicsQuery({
    cityId: selectedCity.id || undefined,
    search: debouncedSearch.trim() || undefined,
  });

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
    return list;
  }, [rawDoctorsData]);

  // Master clinics list directly returned from backend API
  const filteredClinics: ClinicModel[] = useMemo(() => {
    let list: ClinicModel[] = [];
    if (Array.isArray(rawClinicsData)) list = rawClinicsData;
    else if (Array.isArray((rawClinicsData as any)?.data)) list = (rawClinicsData as any).data;
    else if (Array.isArray((rawClinicsData as any)?.response)) list = (rawClinicsData as any).response;
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

  const handleSelectCity = (city?: CityModel) => {
    if (!city) {
      setSelectedCity({ id: '', title: '' });
    } else {
      const cityTitle = city.state_title ? `${city.title}, ${city.state_title}` : city.title ?? '';
      setSelectedCity({ id: String(city.id ?? ''), title: cityTitle });
    }
    setIsCityModalVisible(false);
  };

  const hasCityFilter = Boolean(selectedCity.id);
  const hasDeptFilter = Boolean(selectedDeptId || selectedDeptTitle);
  const hasActiveFilters = hasCityFilter || hasDeptFilter || Boolean(debouncedSearch.trim());

  const handleResetFilters = () => {
    setSearch('');
    setSelectedCity({ id: '', title: '' });
    handleSelectDepartment(undefined);
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Search" onBackPress={() => navigation.goBack()} />

      <View style={styles.content}>
        {/* 1. Search Box at top */}
        <SearchBox
          value={search}
          onChangeText={setSearch}
          placeholder={
            activeTab === 'doctors'
              ? 'Search doctors by name...'
              : 'Search clinics by name, address...'
          }
          containerStyle={styles.searchBoxOverride}
        />

        {/* 2. Compact Segmented Tabs: Doctors & Clinics */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'doctors' && styles.activeTab]}
            onPress={() => setActiveTab('doctors')}
            activeOpacity={0.8}
          >
            <FontAwesome5
              name="user-md"
              size={fs(13)}
              color={activeTab === 'doctors' ? Colors.primaryColor : Colors.secondaryFontColor}
              style={{ marginRight: ws(6) }}
            />
            <Text style={[styles.tabText, activeTab === 'doctors' && styles.activeTabText]}>
              Doctors ({filteredDoctors.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'clinics' && styles.activeTab]}
            onPress={() => setActiveTab('clinics')}
            activeOpacity={0.8}
          >
            <FontAwesome5
              name="hospital"
              size={fs(13)}
              color={activeTab === 'clinics' ? Colors.primaryColor : Colors.secondaryFontColor}
              style={{ marginRight: ws(6) }}
            />
            <Text style={[styles.tabText, activeTab === 'clinics' && styles.activeTabText]}>
              Clinics ({filteredClinics.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* 3. Streamlined Filter Row (City & Department side-by-side) */}
        <View style={styles.filterRow}>
          {/* City Filter Chip */}
          <TouchableOpacity
            style={[styles.filterChip, hasCityFilter && styles.filterChipActive]}
            activeOpacity={0.7}
            onPress={() => setIsCityModalVisible(true)}
          >
            <Ionicons
              name="location-sharp"
              size={fs(14)}
              color={hasCityFilter ? Colors.primaryColor : '#64748B'}
            />
            <Text
              style={[styles.filterChipText, hasCityFilter && styles.filterChipTextActive]}
              numberOfLines={1}
            >
              {selectedCity.title ? selectedCity.title.split(',')[0].trim() : 'All Cities'}
            </Text>
            {hasCityFilter ? (
              <TouchableOpacity
                onPress={() => setSelectedCity({ id: '', title: '' })}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={fs(15)} color={Colors.primaryColor} />
              </TouchableOpacity>
            ) : (
              <Ionicons name="chevron-down" size={fs(13)} color="#94A3B8" />
            )}
          </TouchableOpacity>

          {/* Department Filter Chip (Only in Doctors Tab) */}
          {activeTab === 'doctors' && (
            <TouchableOpacity
              style={[styles.filterChip, hasDeptFilter && styles.filterChipActive]}
              activeOpacity={0.7}
              onPress={() => setIsDeptModalVisible(true)}
            >
              <MaterialIcons
                name="medical-services"
                size={fs(14)}
                color={hasDeptFilter ? Colors.primaryColor : '#64748B'}
              />
              <Text
                style={[styles.filterChipText, hasDeptFilter && styles.filterChipTextActive]}
                numberOfLines={1}
              >
                {selectedDeptTitle || 'All Departments'}
              </Text>
              {hasDeptFilter ? (
                <TouchableOpacity
                  onPress={() => handleSelectDepartment(undefined)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close-circle" size={fs(15)} color={Colors.primaryColor} />
                </TouchableOpacity>
              ) : (
                <Ionicons name="chevron-down" size={fs(13)} color="#94A3B8" />
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* 4. Results Summary & Clear Action */}
        <View style={styles.resultsHeaderRow}>
          <Text style={styles.resultsCountText}>
            {activeTab === 'doctors'
              ? `${filteredDoctors.length} ${filteredDoctors.length === 1 ? 'doctor' : 'doctors'} found`
              : `${filteredClinics.length} ${filteredClinics.length === 1 ? 'clinic' : 'clinics'} found`}
          </Text>
          {hasActiveFilters && (
            <TouchableOpacity
              onPress={handleResetFilters}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Text style={styles.resetFiltersText}>Reset</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 5. Results List */}
        {activeTab === 'doctors' ? (
          isDoctorsLoading && filteredDoctors.length === 0 ? (
            <LoadingIndicator />
          ) : (
            <FlatList
              data={filteredDoctors}
              keyExtractor={(item, index) => `doc-${item.user_id ?? item.id ?? index}`}
              contentContainerStyle={[styles.listContent, { paddingBottom: Math.max(insets.bottom + 50, 90) }]}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <EmptyState message="No doctors found matching your search criteria" />
              }
              renderItem={({ item }) => (
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
          )
        ) : (
          /* Tab 2: Clinics */
          isClinicsLoading && filteredClinics.length === 0 ? (
            <LoadingIndicator />
          ) : (
            <FlatList
              data={filteredClinics}
              keyExtractor={(item, index) => `clinic-${item.id ?? index}`}
              contentContainerStyle={[styles.listContent, { paddingBottom: Math.max(insets.bottom + 50, 90) }]}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <EmptyState message="No clinics found matching your search criteria" />
              }
              renderItem={({ item }) => {
                const clinicImg = item.image ? getImageUrl(item.image) : '';
                return (
                  <TouchableOpacity
                    style={styles.clinicCard}
                    activeOpacity={0.8}
                    onPress={() =>
                      navigation.navigate('Clinic', { clinicId: String(item.id) })
                    }
                  >
                    {clinicImg ? (
                      <Image
                        source={{ uri: clinicImg }}
                        style={styles.clinicImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.placeholderImage}>
                        <FontAwesome5 name="hospital" size={26} color={Colors.primaryColor} />
                      </View>
                    )}

                    <View style={styles.clinicDetails}>
                      <Text style={styles.clinicTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={styles.clinicAddress} numberOfLines={2}>
                        {item.address}
                      </Text>
                      {item.city_title ? (
                        <View style={styles.cityBadge}>
                          <Ionicons
                            name="location-outline"
                            size={12}
                            color={Colors.primaryColor}
                          />
                          <Text style={styles.cityBadgeText}>{item.city_title}</Text>
                        </View>
                      ) : null}
                    </View>

                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={Colors.secondaryFontColor}
                    />
                  </TouchableOpacity>
                );
              }}
            />
          )
        )}
      </View>

      {/* City Picker Modal */}
      <CitySelectModal
        visible={isCityModalVisible}
        onClose={() => setIsCityModalVisible(false)}
        cities={cities}
        selectedCityId={selectedCity.id}
        onSelectCity={handleSelectCity}
      />

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
  container: { flex: 1, backgroundColor: Colors.bgColor },
  content: { flex: 1, paddingHorizontal: ws(16), paddingTop: hs(10) },
  searchBoxOverride: {
    marginBottom: hs(8),
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: fs(10),
    padding: ws(3),
    marginBottom: hs(10),
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: hs(8),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: fs(8),
  },
  activeTab: {
    backgroundColor: Colors.white,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: hs(1) },
    shadowOpacity: 0.08,
    shadowRadius: fs(2),
    elevation: 2,
  },
  tabText: {
    fontSize: fs(Typography.fontSize.xs),
    ...TYPOGRAPHY.medium,
    color: Colors.secondaryFontColor,
  },
  activeTabText: {
    ...TYPOGRAPHY.bold,
    color: Colors.primaryColor,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(8),
    marginBottom: hs(8),
  },
  filterChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: fs(8),
    paddingHorizontal: ws(10),
    height: hs(38),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: Colors.primaryColor,
  },
  filterChipText: {
    flex: 1,
    fontSize: fs(Typography.fontSize.xs),
    ...TYPOGRAPHY.medium,
    color: '#334155',
    marginHorizontal: ws(6),
  },
  filterChipTextActive: {
    color: Colors.primaryColor,
    ...TYPOGRAPHY.bold,
  },
  resultsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ws(2),
    marginBottom: hs(8),
  },
  resultsCountText: {
    fontSize: fs(Typography.fontSize.xs),
    ...TYPOGRAPHY.regular,
    color: Colors.secondaryFontColor,
  },
  resetFiltersText: {
    fontSize: fs(Typography.fontSize.xs),
    ...TYPOGRAPHY.semiBold,
    color: Colors.primaryColor,
  },
  listContent: {
    paddingBottom: hs(32),
  },
  clinicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: fs(14),
    padding: ws(12),
    marginBottom: hs(10),
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: hs(2) },
    shadowOpacity: 0.05,
    shadowRadius: fs(5),
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.slate_F1F5F9,
  },
  clinicImage: {
    width: ws(64),
    height: hs(64),
    borderRadius: fs(10),
    backgroundColor: Colors.slate_F1F5F9,
  },
  placeholderImage: {
    width: ws(64),
    height: hs(64),
    borderRadius: fs(10),
    backgroundColor: Colors.blue_EEF2FF,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clinicDetails: {
    flex: 1,
    marginLeft: ws(12),
    marginRight: ws(8),
  },
  clinicTitle: {
    fontSize: fs(Typography.fontSize.sm),
    ...TYPOGRAPHY.bold,
    color: Colors.mainFontColor,
  },
  clinicAddress: {
    fontSize: fs(Typography.fontSize.xs),
    ...TYPOGRAPHY.regular,
    color: Colors.secondaryFontColor,
    marginTop: hs(2),
  },
  cityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hs(4),
    gap: ws(3),
  },
  cityBadgeText: {
    fontSize: fs(11),
    color: Colors.primaryColor,
    ...TYPOGRAPHY.medium,
  },
});
