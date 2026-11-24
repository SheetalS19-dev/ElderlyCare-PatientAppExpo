import type { RouteProp } from '@react-navigation/native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootStackParamList } from '../../navigation/types';
import { useGetClinicsQuery } from '../../redux/apis/clinicApi';
import { useGetCitiesQuery } from '../../redux/apis/doctorApi';
import type { CityModel, ClinicModel } from '../../types';
import {
  detectDeviceCityName,
  formatCityDisplayName,
  matchCityFromList,
  showToast,
} from '../../utils';

export const useClinicList = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'ClinicList'>>();

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
  const [clinicSearch, setClinicSearch] = useState('');
  const [isCityModalVisible, setIsCityModalVisible] = useState(false);
  const [deviceLocationCity, setDeviceLocationCity] = useState<string | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [isUsingCurrentLocation, setIsUsingCurrentLocation] = useState(false);

  // Sync route params if navigation re-invokes screen
  useEffect(() => {
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

  const { data: citiesData } = useGetCitiesQuery();

  // Cities list
  const cities: CityModel[] = useMemo(() => {
    if (Array.isArray(citiesData)) return citiesData;
    if (Array.isArray(citiesData?.data)) return citiesData.data;
    return [];
  }, [citiesData]);

  // If selectedCity has an id but no title, match the title from loaded cities
  useEffect(() => {
    if (selectedCity.id && (!selectedCity.title || selectedCity.title === 'All Cities') && cities.length > 0) {
      const matched = cities.find((c) => String(c.id) === String(selectedCity.id));
      if (matched) {
        setSelectedCity((prev) => ({
          ...prev,
          title: formatCityDisplayName(matched),
        }));
      }
    }
  }, [cities, selectedCity.id, selectedCity.title]);

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

  const handleSelectCity = useCallback((city: CityModel) => {
    const cityTitle = formatCityDisplayName(city);
    setSelectedCity({ id: String(city.id ?? ''), title: cityTitle });
    setIsCityModalVisible(false);
  }, []);

  const handleClearCity = useCallback(() => {
    setSelectedCity({ id: '', title: '' });
  }, []);

  const handleCityModalSelect = useCallback(async (cityObj: CityModel | undefined | null) => {
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
  }, [cities]);

  return {
    navigation,
    insets,
    selectedCity,
    clinicSearch,
    setClinicSearch,
    isCityModalVisible,
    setIsCityModalVisible,
    deviceLocationCity,
    isDetectingLocation,
    isUsingCurrentLocation,
    cities,
    clinics,
    isClinicsLoading,
    isClinicsFetching,
    isClinicsError,
    refetchClinics,
    handleSelectCity,
    handleClearCity,
    handleCityModalSelect,
  };
};
