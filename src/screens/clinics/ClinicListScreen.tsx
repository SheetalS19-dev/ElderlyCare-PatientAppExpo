import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AppHeader,
  CitySelectModal,
  EmptyState,
  ErrorState,
  LoadingIndicator,
  SearchBox,
} from '../../components';
import { ApiEndpoints, Colors } from '../../constants';
import type { RootStackParamList } from '../../navigation/types';
import { useGetClinicsQuery } from '../../redux/apis/clinicApi';
import { useGetCitiesQuery } from '../../redux/apis/doctorApi';
import type { CityModel, ClinicModel } from '../../types';
import {
  detectDeviceCityName,
  formatCityDisplayName,
  fs,
  getImageUrl,
  hs,
  matchCityFromList,
  showToast,
  TYPOGRAPHY,
  ws,
} from '../../utils';

type Props = NativeStackScreenProps<RootStackParamList, 'ClinicList'>;

export const ClinicListScreen = ({ navigation, route }: Props) => {
  const insets = useSafeAreaInsets();
  const rawRouteCityId = (route?.params as any)?.cityId ? String((route.params as any).cityId).trim() : '';
  const routeCityId =
    rawRouteCityId && rawRouteCityId !== 'ALL' && rawRouteCityId !== 'undefined' && rawRouteCityId !== 'null'
      ? rawRouteCityId
      : '';
  const routeCityTitle =
    (route?.params as any)?.cityTitle && (route?.params as any)?.cityTitle !== 'All'
      ? (route.params as any).cityTitle
      : '';

  const [selectedCity, setSelectedCity] = useState<{ id: string; title: string }>({
    id: routeCityId,
    title: routeCityTitle,
  });
  const [citySearch, setCitySearch] = useState('');
  const [clinicSearch, setClinicSearch] = useState('');
  const [isCityModalVisible, setIsCityModalVisible] = useState(false);
  const [deviceLocationCity, setDeviceLocationCity] = useState<string | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [isUsingCurrentLocation, setIsUsingCurrentLocation] = useState(false);

  // Sync route params if navigation re-invokes screen
  React.useEffect(() => {
    if ((route?.params as any)?.cityId !== undefined) {
      const raw = String((route.params as any).cityId || '').trim();
      const valid = raw && raw !== 'ALL' && raw !== 'undefined' && raw !== 'null' ? raw : '';
      setSelectedCity({
        id: valid,
        title: valid ? ((route.params as any)?.cityTitle || '') : '',
      });
    }
  }, [(route?.params as any)?.cityId, (route?.params as any)?.cityTitle]);

  // Queries
  const {
    data: clinicsData,
    isLoading: isClinicsLoading,
    isFetching: isClinicsFetching,
    isError: isClinicsError,
    refetch: refetchClinics,
  } = useGetClinicsQuery(
    {
      cityId: selectedCity.id || undefined,
    },
    { refetchOnMountOrArgChange: true }
  );

  const { data: citiesData } = useGetCitiesQuery(citySearch);

  // Filtered clinic list
  const clinics: ClinicModel[] = useMemo(() => {
    let list: ClinicModel[] = [];
    if (Array.isArray(clinicsData)) list = clinicsData;
    else if (Array.isArray(clinicsData?.data)) list = clinicsData.data;
    else if (Array.isArray((clinicsData as any)?.response)) list = (clinicsData as any).response;
    else if (Array.isArray((clinicsData as any)?.result)) list = (clinicsData as any).result;

    if (!clinicSearch.trim()) return list;

    const query = clinicSearch.toLowerCase().trim();
    return list.filter(
      (item) =>
        item.title?.toLowerCase().includes(query) ||
        item.name?.toLowerCase().includes(query) ||
        item.address?.toLowerCase().includes(query) ||
        item.city_title?.toLowerCase().includes(query) ||
        (item as any)?.city?.toLowerCase().includes(query)
    );
  }, [clinicsData, clinicSearch]);

  // Cities list
  const cities: CityModel[] = useMemo(() => {
    if (Array.isArray(citiesData)) return citiesData;
    if (Array.isArray(citiesData?.data)) return citiesData.data;
    return [];
  }, [citiesData]);

  const handleSelectCity = (city: CityModel) => {
    const cityTitle = city.state_title ? `${city.title}, ${city.state_title}` : city.title ?? '';
    setSelectedCity({ id: String(city.id ?? ''), title: cityTitle });
    setIsCityModalVisible(false);
  };

  const handleClearCity = () => {
    setSelectedCity({ id: '', title: '' });
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Care Clinics & Centers" onBackPress={() => navigation.goBack()} />

      <View style={styles.content}>
        {/* City Selector Pill */}
        <View style={styles.citySelectorRow}>
          <TouchableOpacity
            style={styles.citySelector}
            activeOpacity={0.8}
            onPress={() => setIsCityModalVisible(true)}
          >
            <View style={styles.cityIconCircle}>
              <Ionicons name="location-sharp" size={fs(16)} color={Colors.primaryColor} />
            </View>
            <View style={styles.cityTextGroup}>
              <Text style={styles.citySelectorLabel}>Location</Text>
              <Text style={styles.citySelectorText} numberOfLines={1}>
                {selectedCity.title || 'All Cities'}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={fs(18)} color={Colors.secondaryFontColor} />
          </TouchableOpacity>

          {!!selectedCity.id && (
            <TouchableOpacity style={styles.clearCityBtn} onPress={handleClearCity}>
              <Ionicons name="close-circle" size={fs(20)} color={Colors.secondaryFontColor} />
            </TouchableOpacity>
          )}
        </View>

        {/* Search Clinic Input */}
        <View style={styles.searchWrapper}>
          <SearchBox
            value={clinicSearch}
            onChangeText={setClinicSearch}
            placeholder="Search clinic by name, address..."
          />
        </View>

        {/* Header Results Count */}
        <View style={styles.resultsHeaderRow}>
          <Text style={styles.resultsCountText}>
            Showing {clinics.length} {clinics.length === 1 ? 'Clinic' : 'Clinics'}
          </Text>
        </View>

        {/* Clinics List */}
        {isClinicsLoading ? (
          <LoadingIndicator />
        ) : isClinicsError ? (
          <ErrorState message="Could not load clinics list" onRetry={refetchClinics} />
        ) : (
          <FlatList
            data={clinics}
            keyExtractor={(item, index) => `clinic-${item.id ?? index}`}
            contentContainerStyle={[styles.listContainer, { flexGrow: 1, paddingBottom: hs(80) + Math.max(insets.bottom, hs(24)) }]}
            showsVerticalScrollIndicator={false}
            refreshing={isClinicsFetching}
            onRefresh={refetchClinics}
            ListEmptyComponent={
              <View style={{ alignItems: 'center', paddingVertical: hs(30), paddingHorizontal: ws(20) }}>
                <EmptyState
                  message={
                    clinicSearch
                      ? 'No clinics match your search.'
                      : selectedCity.title
                        ? `No clinics available in ${selectedCity.title}.`
                        : 'No clinics available.'
                  }
                />
                {!!selectedCity.id && (
                  <TouchableOpacity
                    style={{
                      marginTop: hs(14),
                      backgroundColor: Colors.primaryColor,
                      paddingHorizontal: ws(18),
                      paddingVertical: hs(10),
                      borderRadius: fs(8),
                    }}
                    onPress={handleClearCity}
                    activeOpacity={0.8}
                  >
                    <Text style={{ color: Colors.white, fontSize: fs(13), ...TYPOGRAPHY.bold }}>
                      Explore All Clinics
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.clinicCard}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('Clinic', { clinicId: String(item.id) })}
              >
                {item.image ? (
                  <Image
                    source={{ uri: getImageUrl(item.image) }}
                    style={styles.clinicImage}
                  />
                ) : (
                  <View style={styles.placeholderImage}>
                    <FontAwesome5 name="hospital-alt" size={fs(26)} color={Colors.primaryColor} />
                  </View>
                )}

                <View style={styles.clinicDetails}>
                  <View style={styles.badgeRow}>
                    <View style={styles.verifiedBadge}>
                      <MaterialIcons name="verified" size={fs(12)} color="#059669" />
                      <Text style={styles.verifiedText}>Verified Center</Text>
                    </View>
                  </View>

                  <Text style={styles.clinicTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.clinicAddress} numberOfLines={2}>
                    {item.address}
                  </Text>
                </View>

                <View style={styles.chevronCircle}>
                  <Ionicons name="chevron-forward" size={fs(18)} color={Colors.primaryColor} />
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </View>

      {/* City Picker Modal */}
      <CitySelectModal
        visible={isCityModalVisible}
        onClose={() => setIsCityModalVisible(false)}
        cities={cities}
        selectedCityId={isUsingCurrentLocation && !selectedCity.id ? 'CURRENT' : (selectedCity.id || 'ALL')}
        currentCityName={deviceLocationCity ?? undefined}
        isDetectingLocation={isDetectingLocation}
        activeLocationLabel={selectedCity.title || 'All Cities'}
        onSelectCity={async (cityObj) => {
          setIsCityModalVisible(false);
          if (cityObj === undefined) {
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
                  showToast(`Detected ${detected}; showing all clinics`);
                }
              } else {
                setIsUsingCurrentLocation(false);
                showToast('Could not detect current location');
              }
            } finally {
              setIsDetectingLocation(false);
            }
          } else if (cityObj) {
            setIsUsingCurrentLocation(false);
            setSelectedCity({ id: String(cityObj.id ?? ''), title: formatCityDisplayName(cityObj) });
          } else {
            setIsUsingCurrentLocation(false);
            setSelectedCity({ id: '', title: '' });
          }
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgColor },
  content: { flex: 1, paddingHorizontal: ws(16), paddingTop: hs(12) },
  citySelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hs(10),
    gap: ws(8),
  },
  citySelector: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: fs(14),
    paddingHorizontal: ws(12),
    paddingVertical: hs(8),
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cityIconCircle: {
    width: ws(32),
    height: ws(32),
    aspectRatio: 1,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: Colors.aquaSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ws(10),
  },
  cityTextGroup: {
    flex: 1,
  },
  citySelectorLabel: {
    fontSize: fs(9),
    ...TYPOGRAPHY.medium,
    color: Colors.secondaryFontColor,
    textTransform: 'uppercase',
  },
  citySelectorText: {
    fontSize: fs(13),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
    marginTop: hs(1),
  },
  clearCityBtn: {
    padding: ws(6),
  },
  searchWrapper: { marginBottom: hs(8) },
  resultsHeaderRow: {
    marginBottom: hs(10),
  },
  resultsCountText: {
    fontSize: fs(11),
    ...TYPOGRAPHY.medium,
    color: Colors.secondaryFontColor,
  },
  listContainer: { paddingBottom: hs(24) },
  clinicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: fs(16),
    padding: ws(12),
    marginBottom: hs(12),
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  clinicImage: {
    width: ws(64),
    height: ws(64),
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
  },
  placeholderImage: {
    width: ws(64),
    height: ws(64),
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: Colors.aquaSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clinicDetails: { flex: 1, marginLeft: ws(12), marginRight: ws(8) },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: hs(3),
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: ws(6),
    paddingVertical: hs(2),
    borderRadius: fs(4),
    gap: ws(3),
  },
  verifiedText: {
    fontSize: fs(9),
    ...TYPOGRAPHY.bold,
    color: '#059669',
  },
  clinicTitle: {
    fontSize: fs(14),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
    marginBottom: hs(3),
  },
  clinicAddress: {
    fontSize: fs(11),
    ...TYPOGRAPHY.regular,
    color: Colors.secondaryFontColor,
    lineHeight: fs(16),
  },
  chevronCircle: {
    width: ws(32),
    height: ws(32),
    aspectRatio: 1,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: Colors.aquaSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: fs(20),
    borderTopRightRadius: fs(20),
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
    fontSize: fs(16),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
  },
  cityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hs(12),
    paddingHorizontal: ws(8),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  cityItemText: {
    marginLeft: ws(10),
    fontSize: fs(14),
    ...TYPOGRAPHY.regular,
    color: Colors.primaryFontColor,
  },
});
