import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
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
} from '../../components';
import { Colors, Typography, ApiEndpoints } from '../../constants';
import { useAuth } from '../../context/AuthContext';
import { useDebounce } from '../../hooks';
import {
  useGetDoctorsQuery,
  useGetDepartmentsQuery,
  useGetCitiesQuery,
} from '../../redux/apis/doctorApi';
import { useGetClinicsQuery } from '../../redux/apis/clinicApi';
import type { DoctorModel, ClinicModel, DepartmentModel, CityModel } from '../../types';
import { getImageUrl } from '../../utils';

type Props = NativeStackScreenProps<RootStackParamList, 'Search'>;

export const SearchScreen = ({ navigation, route }: Props) => {
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

  // Doctors & Clinics Queries
  const {
    data: rawDoctorsData,
    isLoading: isDoctorsLoading,
    refetch: refetchDoctors,
  } = useGetDoctorsQuery({
    cityId: selectedCity.id || undefined,
    searchQuery: debouncedSearch.trim() || undefined,
  });

  const {
    data: rawClinicsData,
    isLoading: isClinicsLoading,
    refetch: refetchClinics,
  } = useGetClinicsQuery({
    cityId: selectedCity.id || undefined,
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

  // Master doctors list unwrapped and filtered
  const filteredDoctors: DoctorModel[] = useMemo(() => {
    let list: DoctorModel[] = [];
    if (Array.isArray(rawDoctorsData)) list = rawDoctorsData;
    else if (Array.isArray((rawDoctorsData as any)?.data)) list = (rawDoctorsData as any).data;
    else if (Array.isArray((rawDoctorsData as any)?.response)) list = (rawDoctorsData as any).response;

    // Filter by department if selected
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

    // Client-side text filter for instant responsiveness
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase().trim();
      list = list.filter((doc: any) => {
        const fullName = `${doc.f_name ?? ''} ${doc.l_name ?? ''}`.toLowerCase();
        const clinic = (doc.clinic_title ?? doc.clinic_name ?? (doc as any).clinics_name ?? '').toLowerCase();
        const spec = (doc.specialization ?? (doc as any).speciality ?? '').toLowerCase();
        const dept = (doc.dept_title ?? (doc as any).dept_name ?? (doc as any).department_name ?? '').toLowerCase();
        const address = (doc.clinics_address ?? doc.address ?? '').toLowerCase();
        const desc = (doc.description ?? '').toLowerCase();

        return (
          fullName.includes(q) ||
          clinic.includes(q) ||
          spec.includes(q) ||
          dept.includes(q) ||
          address.includes(q) ||
          desc.includes(q)
        );
      });
    }

    return list;
  }, [rawDoctorsData, selectedDeptId, selectedDeptTitle, debouncedSearch]);

  // Master clinics list unwrapped and filtered
  const filteredClinics: ClinicModel[] = useMemo(() => {
    let list: ClinicModel[] = [];
    if (Array.isArray(rawClinicsData)) list = rawClinicsData;
    else if (Array.isArray((rawClinicsData as any)?.data)) list = (rawClinicsData as any).data;
    else if (Array.isArray((rawClinicsData as any)?.response)) list = (rawClinicsData as any).response;

    if (!debouncedSearch.trim()) return list;

    const q = debouncedSearch.toLowerCase().trim();
    return list.filter((c: any) => {
      const title = (c.title ?? c.name ?? '').toLowerCase();
      const address = (c.address ?? '').toLowerCase();
      const city = (c.city_title ?? c.city_name ?? '').toLowerCase();
      const about = (c.about_us ?? c.description ?? '').toLowerCase();
      return title.includes(q) || address.includes(q) || city.includes(q) || about.includes(q);
    });
  }, [rawClinicsData, debouncedSearch]);

  const handleSelectDepartment = (dept?: DepartmentModel) => {
    if (!dept) {
      setSelectedDeptId(undefined);
      setSelectedDeptTitle(undefined);
    } else {
      setSelectedDeptId(String(dept.id));
      setSelectedDeptTitle(dept.title);
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

  return (
    <View style={styles.container}>
      <AppHeader title="Search" onBackPress={() => navigation.goBack()} />

      <View style={styles.content}>
        {/* City Selector (Matching Flutter City Search) */}
        <TouchableOpacity
          style={styles.citySelector}
          activeOpacity={0.7}
          onPress={() => setIsCityModalVisible(true)}
        >
          <Ionicons name="location-sharp" size={18} color={Colors.primaryColor} />
          <Text style={styles.citySelectorText} numberOfLines={1}>
            {selectedCity.title || 'All Cities (Select City)'}
          </Text>
          {selectedCity.id ? (
            <TouchableOpacity
              onPress={() => setSelectedCity({ id: '', title: '' })}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close-circle" size={18} color={Colors.secondaryFontColor} />
            </TouchableOpacity>
          ) : (
            <Ionicons name="chevron-down" size={18} color={Colors.secondaryFontColor} />
          )}
        </TouchableOpacity>

        {/* Search Input Box */}
        <SearchBox
          value={search}
          onChangeText={setSearch}
          placeholder={
            activeTab === 'doctors'
              ? 'Search doctors, clinics, specializations...'
              : 'Search clinics by name, address...'
          }
        />

        {/* Two Tabs: Doctors and Clinics */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'doctors' && styles.activeTab]}
            onPress={() => setActiveTab('doctors')}
            activeOpacity={0.8}
          >
            <FontAwesome5
              name="user-md"
              size={14}
              color={activeTab === 'doctors' ? Colors.primaryColor : Colors.secondaryFontColor}
              style={{ marginRight: 6 }}
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
              size={14}
              color={activeTab === 'clinics' ? Colors.primaryColor : Colors.secondaryFontColor}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.tabText, activeTab === 'clinics' && styles.activeTabText]}>
              Clinics ({filteredClinics.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab 1: Doctors */}
        {activeTab === 'doctors' ? (
          <>
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

            {/* Department Active Filter Banner */}
            {!!selectedDeptTitle && (
              <View style={styles.filterBanner}>
                <Text style={styles.filterText}>
                  Showing doctors from{' '}
                  <Text style={styles.filterHighlight}>{selectedDeptTitle}</Text> department
                </Text>
                <TouchableOpacity
                  onPress={() => handleSelectDepartment(undefined)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close-circle" size={18} color={Colors.primaryColor} />
                </TouchableOpacity>
              </View>
            )}

            {isDoctorsLoading && filteredDoctors.length === 0 ? (
              <LoadingIndicator />
            ) : (
              <FlatList
                data={filteredDoctors}
                keyExtractor={(item, index) => `doc-${item.user_id ?? item.id ?? index}`}
                contentContainerStyle={styles.listContent}
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
            )}
          </>
        ) : (
          /* Tab 2: Clinics */
          isClinicsLoading && filteredClinics.length === 0 ? (
            <LoadingIndicator />
          ) : (
            <FlatList
              data={filteredClinics}
              keyExtractor={(item, index) => `clinic-${item.id ?? index}`}
              contentContainerStyle={styles.listContent}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgColor },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 10 },
  citySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  citySelectorText: {
    flex: 1,
    marginLeft: 8,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.mainFontColor,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    padding: 3,
    marginVertical: 10,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },
  activeTab: {
    backgroundColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.secondaryFontColor,
  },
  activeTabText: {
    fontFamily: Typography.fontFamily.bold,
    fontWeight: '700',
    color: Colors.primaryColor,
  },
  deptScrollWrapper: {
    marginBottom: 8,
  },
  deptChipsContainer: {
    paddingVertical: 4,
  },
  deptChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
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
    fontWeight: '700',
  },
  filterBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: '#FFF7ED',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  filterText: {
    flex: 1,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primaryFontColor,
  },
  filterHighlight: {
    color: Colors.primaryColor,
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: 32,
  },
  clinicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  clinicImage: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  placeholderImage: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clinicDetails: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  clinicTitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    fontWeight: '700',
    color: Colors.mainFontColor,
  },
  clinicAddress: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.secondaryFontColor,
    marginTop: 2,
  },
  cityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 3,
  },
  cityBadgeText: {
    fontSize: 11,
    color: Colors.primaryColor,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    fontWeight: '700',
    color: Colors.mainFontColor,
  },
  allCitiesItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  allCitiesText: {
    marginLeft: 10,
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primaryColor,
    fontWeight: '600',
  },
  cityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  cityItemText: {
    marginLeft: 10,
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.mainFontColor,
  },
});
