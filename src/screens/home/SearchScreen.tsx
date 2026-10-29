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



            {isDoctorsLoading && filteredDoctors.length === 0 ? (
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgColor },
  content: { flex: 1, paddingHorizontal: ws(16), paddingTop: hs(10) },
  citySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: fs(10),
    paddingHorizontal: ws(12),
    paddingVertical: hs(10),
    borderWidth: 1,
    borderColor: Colors.borderColor,
    marginBottom: hs(10),
  },
  citySelectorText: {
    flex: 1,
    marginLeft: ws(8),
    fontSize: fs(Typography.fontSize.sm),
    ...TYPOGRAPHY.medium,
    color: Colors.mainFontColor,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.borderColor,
    borderRadius: fs(12),
    padding: ws(3),
    marginVertical: hs(10),
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: hs(10),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: fs(9),
  },
  activeTab: {
    backgroundColor: Colors.white,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: hs(1) },
    shadowOpacity: 0.1,
    shadowRadius: fs(2),
    elevation: 2,
  },
  tabText: {
    fontSize: fs(Typography.fontSize.sm),
    ...TYPOGRAPHY.medium,
    color: Colors.secondaryFontColor,
  },
  activeTabText: {
    ...TYPOGRAPHY.bold,
    color: Colors.primaryColor,
  },
  deptScrollWrapper: {
    marginBottom: hs(8),
  },
  deptChipsContainer: {
    paddingVertical: hs(4),
  },
  deptChip: {
    paddingHorizontal: ws(14),
    paddingVertical: hs(6),
    borderRadius: fs(16),
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borderColor,
    marginRight: ws(8),
  },
  deptChipActive: {
    backgroundColor: Colors.primaryColor,
    borderColor: Colors.primaryColor,
  },
  deptChipText: {
    fontSize: fs(Typography.fontSize.xs),
    ...TYPOGRAPHY.medium,
    color: Colors.primaryFontColor,
  },
  deptChipTextActive: {
    color: Colors.white,
    ...TYPOGRAPHY.bold,
  },
  filterBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ws(12),
    paddingVertical: hs(7),
    backgroundColor: Colors.lightBlueTint,
    borderRadius: fs(8),
    marginBottom: hs(8),
    borderWidth: 1,
    borderColor: Colors.lightBlueBorder,
  },
  filterText: {
    flex: 1,
    fontSize: fs(Typography.fontSize.xs),
    ...TYPOGRAPHY.medium,
    color: Colors.primaryFontColor,
  },
  filterHighlight: {
    color: Colors.primaryColor,
    ...TYPOGRAPHY.bold,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: fs(24),
    borderTopRightRadius: fs(24),
    padding: ws(16),
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hs(12),
  },
  modalTitle: {
    fontSize: fs(Typography.fontSize.lg),
    ...TYPOGRAPHY.bold,
    color: Colors.mainFontColor,
  },
  allCitiesItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hs(12),
    paddingHorizontal: ws(8),
    borderBottomWidth: 1,
    borderBottomColor: Colors.slate_F1F5F9,
  },
  allCitiesText: {
    marginLeft: ws(10),
    fontSize: fs(Typography.fontSize.md),
    ...TYPOGRAPHY.medium,
    color: Colors.primaryColor,
  },
  cityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hs(12),
    paddingHorizontal: ws(8),
    borderBottomWidth: 1,
    borderBottomColor: Colors.slate_F1F5F9,
  },
  cityItemText: {
    marginLeft: ws(10),
    fontSize: fs(Typography.fontSize.md),
    ...TYPOGRAPHY.regular,
    color: Colors.mainFontColor,
  },
});
