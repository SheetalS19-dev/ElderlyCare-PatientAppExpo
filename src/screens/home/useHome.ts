import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { requireOptionalNativeModule } from 'expo-modules-core';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import type { RootStackParamList } from '../../navigation/types';
import { useGetAppointmentsQuery } from '../../redux/apis/appointmentApi';
import { useGetFamilyMembersQuery } from '../../redux/apis/bookingApi';
import { useGetClinicsQuery } from '../../redux/apis/clinicApi';
import {
  useGetBannersQuery,
  useGetCitiesQuery,
  useGetDepartmentsQuery,
  useGetDoctorsQuery,
  type CityModel,
} from '../../redux/apis/doctorApi';
import { useGetPatientFilesQuery } from '../../redux/apis/patientFilesApi';
import { useGetUserProfileQuery } from '../../redux/apis/userApi';
import { useDeleteVitalMutation, useGetVitalsQuery } from '../../redux/apis/vitalsApi';
import { FamilyMemberModel } from '../../types';
import { showToast } from '../../utils';

const SAVED_LOCATION_KEY = 'SAVED_USER_CITY_LOCATION';

export type RootNavigation = NativeStackNavigationProp<RootStackParamList>;

export const useHome = () => {
  const navigation = useNavigation<RootNavigation>();
  const { isAuthenticated, user, updateUser } = useAuth();

  const [deleteVital] = useDeleteVitalMutation();

  const handleDeleteVitalRecord = async (id: string | number) => {
    try {
      await deleteVital({ id }).unwrap();
      showToast('Record deleted');
    } catch (e: any) {
      showToast(e?.data?.message || 'Could not delete record');
    }
  };

  const [search, setSearch] = useState('');
  const [selectedCity, setSelectedCity] = useState<CityModel | null | undefined>(undefined);
  const [deviceLocationCity, setDeviceLocationCity] = useState<string | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string>('SELF');

  // Load saved location from AsyncStorage
  useEffect(() => {
    const loadSavedLocation = async () => {
      try {
        const savedData = await AsyncStorage.getItem(SAVED_LOCATION_KEY);
        if (savedData) {
          const parsed = JSON.parse(savedData);
          if (parsed?.title?.toLowerCase().includes('lucknow')) {
            await AsyncStorage.removeItem(SAVED_LOCATION_KEY);
          } else if (parsed !== undefined) {
            setSelectedCity(parsed);
          }
        }
      } catch (err) {
        console.log('Error loading saved location:', err);
      }
    };
    loadSavedLocation();
  }, []);

  // Fetch device location
  const fetchDeviceCurrentLocation = useCallback(async () => {
    setIsDetectingLocation(true);
    try {
      const hasExpoLocationNativeModule = Boolean(requireOptionalNativeModule('ExpoLocation'));
      if (hasExpoLocationNativeModule) {
        try {
          const Location = require('expo-location');
          if (Location && Location.requestForegroundPermissionsAsync) {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
              const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
              });
              const geocoded = await Location.reverseGeocodeAsync({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              });
              if (geocoded && geocoded.length > 0) {
                const place = geocoded[0];
                const cityName = place.city || place.subregion || place.district || place.region || '';
                if (cityName) {
                  setDeviceLocationCity(cityName);
                  setIsDetectingLocation(false);
                  return;
                }
              }
            }
          }
        } catch (expoError) {
          console.log('Error calling expo-location:', expoError);
        }
      }

      const ipRes = await fetch('http://ip-api.com/json');
      if (ipRes.ok) {
        const ipData = await ipRes.json();
        if (ipData && ipData.status === 'success' && ipData.city) {
          setDeviceLocationCity(ipData.city);
        }
      }
    } catch (error) {
      console.log('Error getting location:', error);
    } finally {
      setIsDetectingLocation(false);
    }
  }, []);

  useEffect(() => {
    if (selectedCity === undefined) {
      fetchDeviceCurrentLocation();
    }
  }, [selectedCity, fetchDeviceCurrentLocation]);

  const { data: citiesData } = useGetCitiesQuery();
  const { data: bannersData } = useGetBannersQuery();
  const { data: departments, isLoading: deptLoading } = useGetDepartmentsQuery();

  const citiesList: CityModel[] = useMemo(() => {
    if (Array.isArray(citiesData)) return citiesData;
    if (Array.isArray((citiesData as any)?.data)) return (citiesData as any).data;
    return [];
  }, [citiesData]);

  const activeCity = useMemo(() => {
    if (selectedCity !== undefined) return selectedCity;
    if (citiesList.length > 0) {
      if (deviceLocationCity) {
        const dName = deviceLocationCity.toLowerCase().trim();
        const matched = citiesList.find((c: CityModel) => {
          const cTitle = (c.title || '').toLowerCase().trim();
          return cTitle.includes(dName) || dName.includes(cTitle);
        });
        if (matched) return matched;
      }
      const defaultCity = citiesList.find(
        (c: CityModel) => (c as any).default_city === 1
      );
      if (defaultCity) return defaultCity;
    }
    return null;
  }, [selectedCity, citiesList, deviceLocationCity]);

  const activeCityName = activeCity ? activeCity.title : (deviceLocationCity || 'All Cities');
  const activeCityId = activeCity?.id != null && String(activeCity.id) !== 'ALL' ? String(activeCity.id) : undefined;

  const handleCitySelect = async (city: CityModel | null | undefined) => {
    if (city === undefined) {
      setSelectedCity(undefined);
      try {
        await AsyncStorage.removeItem(SAVED_LOCATION_KEY);
      } catch (err) {
        console.log(err);
      }
      fetchDeviceCurrentLocation();
    } else if (city === null) {
      const allCitiesObj = { id: 'ALL', title: 'All Cities' } as CityModel;
      setSelectedCity(allCitiesObj);
    } else {
      setSelectedCity(city);
    }
  };

  const { data: doctors, isLoading: doctorsLoading } = useGetDoctorsQuery({ cityId: activeCityId });
  const { data: clinicsData, isLoading: clinicsLoading } = useGetClinicsQuery({ cityId: activeCityId });

  const userIdStr = user?.id ? String(user.id) : '';
  const { data: userProfileData } = useGetUserProfileQuery(userIdStr, {
    skip: !userIdStr,
    refetchOnMountOrArgChange: true,
  });

  useEffect(() => {
    if (userProfileData) {
      const freshUser = (userProfileData as any)?.data ?? userProfileData;
      if (freshUser && typeof freshUser === 'object' && freshUser.id) {
        updateUser({ ...(user || {}), ...freshUser });
      }
    }
  }, [userProfileData]);

  const { data: familyMembersData } = useGetFamilyMembersQuery(userIdStr, { skip: !userIdStr });
  const { data: vitalsData, isLoading: vitalsLoading } = useGetVitalsQuery(userIdStr, { skip: !userIdStr });

  const bannersList = useMemo(() => {
    if (Array.isArray(bannersData)) return bannersData;
    if (Array.isArray((bannersData as any)?.data)) return (bannersData as any).data;
    return [];
  }, [bannersData]);

  const doctorsList = useMemo(() => {
    if (Array.isArray(doctors)) return doctors;
    if (Array.isArray((doctors as any)?.data)) return (doctors as any).data;
    return [];
  }, [doctors]);

  const clinicsList = useMemo(() => {
    if (Array.isArray(clinicsData)) return clinicsData;
    if (Array.isArray((clinicsData as any)?.data)) return (clinicsData as any).data;
    return [];
  }, [clinicsData]);

  return {
    navigation,
    isAuthenticated,
    user,
    search,
    setSearch,
    selectedCity,
    activeCityName,
    isDetectingLocation,
    showLocationModal,
    setShowLocationModal,
    citiesList,
    handleCitySelect,
    bannersList,
    doctorsList,
    doctorsLoading,
    clinicsList,
    clinicsLoading,
    departments: Array.isArray(departments) ? departments : (departments as any)?.data || [],
    deptLoading,
    vitalsData,
    vitalsLoading,
    handleDeleteVitalRecord,
    selectedMemberId,
    setSelectedMemberId,
  };
};
