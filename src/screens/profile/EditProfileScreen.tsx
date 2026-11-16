import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AppDatePickerModal,
  AppHeader,
  LoadingIndicator,
  SearchableSelectModal,
  type SearchableSelectOption,
} from '../../components';
import { ApiEndpoints, AppConstants, Colors } from '../../constants';
import { useAuth } from '../../context/AuthContext';
import type { RootStackParamList } from '../../navigation/types';
import {
  useGetCitiesQuery,
  useGetPostalCodesByCityQuery,
  useGetStatesQuery,
} from '../../redux/apis/doctorApi';
import {
  useGetUserProfileQuery,
  userApi,
  useSoftDeleteUserMutation,
  useUpdateUserProfileMutation,
} from '../../redux/apis/userApi';
import { useAppDispatch } from '../../redux/hooks';
import { storageService } from '../../services/storageService';
import type { CityModel, PostalCodeModel, StateModel, UserModel } from '../../types';
import {
  DateTimeUtils,
  fs,
  getImageUrl,
  hs,
  isUnionTerritory,
  logApiCall,
  showToast,
  TYPOGRAPHY,
  ws,
} from '../../utils';
import { validateDob, validateEmail, validateName } from '../../validation/authValidation';
import {
  STREET_ADDRESS_MAX,
  validateCityName,
  validateStateName,
  validateStreetAddress,
} from '../../validation/profileValidation';

type Props = NativeStackScreenProps<RootStackParamList, 'EditProfile'>;

type PickerFieldType = 'gender' | 'marital_status' | 'blood_group' | 'occupation' | null;

const GENDER_OPTIONS = ['Male', 'Female', 'Other'];
const MARITAL_STATUS_OPTIONS = ['Married', 'Unmarried', 'Divorced', 'Widowed', 'Other'];
const BLOOD_GROUP_OPTIONS = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
const DEFAULT_OCCUPATION_OPTIONS = ['Job Holder', 'Business'];
const CUSTOM_OCCUPATIONS_KEY = 'custom_occupations';

const cleanDateString = (rawDate?: string | null): string => {
  if (!rawDate) return '';
  const str = String(rawDate).trim();
  if (str.includes('T')) return str.split('T')[0];
  if (str.includes(' ')) return str.split(' ')[0];
  return str;
};

export const EditProfileScreen = ({ navigation }: Props) => {
  const insets = useSafeAreaInsets();
  const { user: authUser, updateUser: updateAuthUser, logout } = useAuth();
  const dispatch = useAppDispatch();
  const userId = String(authUser?.id ?? (authUser as any)?.user_id ?? '');

  // Form State
  const [fName, setFName] = useState(authUser?.f_name ?? '');
  const [lName, setLName] = useState(authUser?.l_name ?? '');
  const [email, setEmail] = useState(authUser?.email ?? '');
  const [phone, setPhone] = useState(authUser?.phone ?? '');
  const [dob, setDob] = useState(cleanDateString(authUser?.dob));
  const [gender, setGender] = useState(authUser?.gender ?? '');
  const [occupation, setOccupation] = useState(authUser?.occupation ?? '');
  const [customOccupationText, setCustomOccupationText] = useState('');
  // Occupations the user typed earlier; they are added to the dropdown automatically.
  const [customOccupations, setCustomOccupations] = useState<string[]>([]);
  const [maritalStatus, setMaritalStatus] = useState(authUser?.marital_status ?? '');
  const [bloodGroup, setBloodGroup] = useState(authUser?.blood_group ?? '');

  // Address & Location State
  const [address, setAddress] = useState(authUser?.address ?? '');
  const [city, setCity] = useState(authUser?.city ?? '');
  const [state, setState] = useState(authUser?.state ?? '');
  const [selectedStateId, setSelectedStateId] = useState<string>('');
  const [selectedCityId, setSelectedCityId] = useState<string>('');
  const [postalCode, setPostalCode] = useState(String(authUser?.postal_code ?? ''));
  const [addressDropdown, setAddressDropdown] = useState<'state' | 'city' | 'postal' | null>(null);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);

  // Location Dropdown APIs
  const { data: statesData, isLoading: isStatesLoading } = useGetStatesQuery();
  const { data: citiesData, isLoading: isCitiesLoading } = useGetCitiesQuery('');

  const apiStates: StateModel[] = useMemo(() => {
    const raw = Array.isArray(statesData)
      ? statesData
      : Array.isArray((statesData as any)?.data)
        ? (statesData as any).data
        : [];
    return raw.filter((s: StateModel) => s && s.title && s.active !== 0);
  }, [statesData]);

  const apiCities: CityModel[] = useMemo(() => {
    const raw = Array.isArray(citiesData)
      ? citiesData
      : Array.isArray((citiesData as any)?.data)
        ? (citiesData as any).data
        : [];
    return raw.filter((c: CityModel) => c && (c.title || c.name));
  }, [citiesData]);

  const resolvedStateObj = useMemo(() => {
    if (selectedStateId) {
      const byId = apiStates.find((s) => String(s.id) === selectedStateId);
      if (byId) return byId;
    }
    const cleanState = state.trim().toLowerCase();
    if (!cleanState) return undefined;
    return apiStates.find((s) => s.title.trim().toLowerCase() === cleanState);
  }, [selectedStateId, state, apiStates]);

  const filteredCitiesForState = useMemo(() => {
    const targetStateId = resolvedStateObj ? String(resolvedStateObj.id) : selectedStateId;
    const targetStateTitle = (resolvedStateObj?.title || state).trim().toLowerCase();
    if (!targetStateId && !targetStateTitle) return [];

    return apiCities
      .filter((c) => {
        if (targetStateId && c.state_id != null && String(c.state_id) === targetStateId) {
          return true;
        }
        return Boolean(
          targetStateTitle && c.state_title && c.state_title.trim().toLowerCase() === targetStateTitle
        );
      })
      .sort((a, b) => String(a.title || a.name || '').localeCompare(String(b.title || b.name || '')));
  }, [apiCities, resolvedStateObj, selectedStateId, state]);

  const resolvedCityObj = useMemo(() => {
    if (selectedCityId) {
      const byId = apiCities.find((c) => String(c.id) === selectedCityId);
      if (byId) return byId;
    }
    const cleanCity = city.trim().toLowerCase();
    if (!cleanCity) return undefined;
    const pool = filteredCitiesForState.length > 0 ? filteredCitiesForState : apiCities;
    return pool.find((c) => (c.title || c.name || '').trim().toLowerCase() === cleanCity);
  }, [selectedCityId, city, filteredCitiesForState, apiCities]);

  const effectiveCityId = resolvedCityObj?.id != null ? String(resolvedCityObj.id) : selectedCityId;

  const { data: postalData, isLoading: isPostalLoading } = useGetPostalCodesByCityQuery(
    effectiveCityId,
    { skip: !effectiveCityId }
  );

  const apiPostalCodes: PostalCodeModel[] = useMemo(() => {
    const raw = Array.isArray(postalData)
      ? postalData
      : Array.isArray((postalData as any)?.data)
        ? (postalData as any).data
        : [];
    return raw.filter((p: PostalCodeModel) => p && p.postal_code != null && String(p.postal_code).trim() !== '');
  }, [postalData]);

  const stateDropdownOptions: SearchableSelectOption<StateModel>[] = useMemo(() => {
    const regularStates = apiStates
      .filter((s) => !isUnionTerritory(s.title))
      .sort((a, b) => a.title.localeCompare(b.title))
      .map((s) => ({
        id: String(s.id),
        label: s.title,
        badge: 'State',
        section: 'States',
        data: s,
      }));
    const uts = apiStates
      .filter((s) => isUnionTerritory(s.title))
      .sort((a, b) => a.title.localeCompare(b.title))
      .map((s) => ({
        id: String(s.id),
        label: s.title,
        badge: 'UT',
        section: 'Union Territories (UTs)',
        data: s,
      }));
    return [...regularStates, ...uts];
  }, [apiStates]);

  const cityDropdownOptions: SearchableSelectOption<CityModel>[] = useMemo(() => {
    return filteredCitiesForState.map((c) => ({
      id: String(c.id ?? c.title ?? ''),
      label: c.title || c.name || '',
      data: c,
    }));
  }, [filteredCitiesForState]);

  const postalDropdownOptions: SearchableSelectOption<PostalCodeModel>[] = useMemo(() => {
    return apiPostalCodes.map((p) => ({
      id: String(p.id ?? p.postal_code),
      label: String(p.postal_code),
      subtitle: p.area ? String(p.area) : undefined,
      data: p,
    }));
  }, [apiPostalCodes]);

  // Modals
  const [activePicker, setActivePicker] = useState<PickerFieldType>(null);
  const [isImagePickerModalVisible, setIsImagePickerModalVisible] = useState(false);
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);

  const {
    data: userProfileData,
    isLoading: isProfileLoading,
    refetch,
  } = useGetUserProfileQuery(userId, {
    skip: !userId,
    refetchOnMountOrArgChange: true,
  });

  const [updateProfile, { isLoading: isUpdating }] = useUpdateUserProfileMutation();
  const [softDelete, { isLoading: isDeleting }] = useSoftDeleteUserMutation();

  const user: UserModel | null = useMemo(() => {
    const rawProfile = userProfileData?.data ?? userProfileData;
    return {
      ...(rawProfile && typeof rawProfile === 'object' ? rawProfile : {}),
      ...(authUser && typeof authUser === 'object' ? authUser : {}),
    };
  }, [userProfileData, authUser]);

  const remoteImage = user?.image || user?.image_url || authUser?.image || authUser?.image_url || '';

  const addCustomOccupation = (value: string) => {
    const clean = value.trim();
    if (!clean || clean.toLowerCase() === 'others') return;
    setCustomOccupations((prev) => {
      const exists = [...DEFAULT_OCCUPATION_OPTIONS, ...prev].some(
        (o) => o.toLowerCase() === clean.toLowerCase()
      );
      if (exists) return prev;
      const next = [...prev, clean];
      storageService.setItem(CUSTOM_OCCUPATIONS_KEY, next).catch(() => { });
      return next;
    });
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const saved = await storageService.getItem<string[]>(CUSTOM_OCCUPATIONS_KEY);
        if (active && Array.isArray(saved)) {
          setCustomOccupations((prev) => Array.from(new Set([...saved, ...prev])));
        }
      } catch {
        // ignore – the list simply starts with the defaults
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const occupationOptions = useMemo(
    () => [...DEFAULT_OCCUPATION_OPTIONS, ...customOccupations],
    [customOccupations]
  );

  useEffect(() => {
    if (user) {
      setFName(user.f_name ?? '');
      setLName(user.l_name ?? '');
      setEmail(user.email ?? '');
      setPhone(user.phone ?? '');
      setDob(cleanDateString(user.dob));
      setGender(user.gender ?? '');
      const userOcc = user.occupation ?? '';
      setOccupation(userOcc);
      if (userOcc && !DEFAULT_OCCUPATION_OPTIONS.includes(userOcc)) {
        addCustomOccupation(userOcc);
      }
      setMaritalStatus(user.marital_status ?? '');
      setBloodGroup(user.blood_group ?? '');
      setAddress(user.address ?? '');
      setCity(user.city ?? '');
      setState(user.state ?? '');
      setSelectedStateId('');
      setSelectedCityId('');
      setPostalCode(user.postal_code ? String(user.postal_code) : '');
    }
  }, [userProfileData, authUser]);

  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const uploadProfileWithXHR = async (
    url: string,
    fields: Record<string, string>,
    imageUri: string | null,
    token?: string
  ): Promise<any> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', url);
      xhr.setRequestHeader('Accept', 'application/json');
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      const formData = new FormData();
      Object.keys(fields).forEach((key) => {
        if (fields[key] !== undefined && fields[key] !== null) {
          formData.append(key, String(fields[key]));
        }
      });

      if (imageUri) {
        let cleanUri = String(imageUri).trim();
        if (Platform.OS === 'android' && !cleanUri.startsWith('file://') && !cleanUri.startsWith('content://')) {
          cleanUri = `file://${cleanUri}`;
        }

        const filename = cleanUri.split('/').pop() || `profile_${Date.now()}.jpg`;
        const match = /\.(\w+)$/.exec(filename);
        const ext = match ? match[1].toLowerCase() : 'jpg';
        const mimeType =
          ext === 'png'
            ? 'image/png'
            : ext === 'webp'
              ? 'image/webp'
              : ext === 'gif'
                ? 'image/gif'
                : 'image/jpeg';

        formData.append('image', {
          uri: cleanUri,
          name: filename,
          type: mimeType,
        } as any);
      }

      const startedAt = Date.now();
      xhr.onload = () => {
        const durationMs = Date.now() - startedAt;
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const json = JSON.parse(xhr.responseText);
            logApiCall({
              url,
              method: 'POST',
              status: xhr.status,
              durationMs,
              payload: formData,
              response: json,
            });
            resolve(json);
          } catch (e) {
            logApiCall({
              url,
              method: 'POST',
              status: xhr.status,
              durationMs,
              payload: formData,
              response: xhr.responseText,
            });
            resolve({ status: true });
          }
        } else {
          logApiCall({
            url,
            method: 'POST',
            status: xhr.status,
            durationMs,
            payload: formData,
            error: `Server error (${xhr.status})`,
            isError: true,
          });
          reject(new Error(`Server error (${xhr.status})`));
        }
      };

      xhr.onerror = () => {
        logApiCall({
          url,
          method: 'POST',
          durationMs: Date.now() - startedAt,
          payload: formData,
          error: 'Network upload failed',
          isError: true,
        });
        reject(new Error('Network upload failed'));
      };

      xhr.send(formData);
    });
  };

  const uploadImageDirectly = async (uri: string) => {
    if (!userId) return;
    setIsUploadingPhoto(true);
    try {
      const token = await storageService.getItem<string>(AppConstants.storageKeys.token);
      await uploadProfileWithXHR(
        ApiEndpoints.updateUserUrl,
        { id: userId },
        uri,
        token || undefined
      );

      const reqHeaders: Record<string, string> = { Accept: 'application/json' };
      if (token) reqHeaders.Authorization = `Bearer ${token}`;

      // Fetch fresh user profile
      const freshRes = await fetch(`${ApiEndpoints.getUserUrl}/${userId}`, {
        headers: reqHeaders,
      });
      let freshUser: any = null;
      if (freshRes.ok) {
        const freshJson = await freshRes.json();
        freshUser = freshJson?.data ?? freshJson;
      }

      if (freshUser) {
        await updateAuthUser({
          ...(authUser || {}),
          ...freshUser,
        });
      }

      setSelectedImageUri(null);
      showToast('Profile photo updated successfully!');
      refetch();
    } catch (err: any) {
      console.warn('Profile photo upload error:', err);
      showToast(err?.message || 'Could not upload profile photo');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handlePickFromGallery = async () => {
    setIsImagePickerModalVisible(false);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const chosenUri = result.assets[0].uri;
        setSelectedImageUri(chosenUri);
        await uploadImageDirectly(chosenUri);
      }
    } catch (err: any) {
      showToast(err?.message || 'Could not open gallery');
    }
  };

  const handleTakePhoto = async () => {
    setIsImagePickerModalVisible(false);
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Camera access is needed to take a profile photo.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const chosenUri = result.assets[0].uri;
        setSelectedImageUri(chosenUri);
        await uploadImageDirectly(chosenUri);
      }
    } catch (err: any) {
      showToast(err?.message || 'Could not open camera');
    }
  };

  const handleUpdate = async () => {
    const errs: Record<string, string> = {};

    // Mandatory fields mirror the Registration form: First Name, Email, Mobile, DOB, Gender.
    const fnRes = validateName(fName, true, 'First name');
    if (!fnRes.isValid) errs.fName = fnRes.error || 'First name is required';
    const lnRes = validateName(lName, false, 'Last name');
    if (!lnRes.isValid) errs.lName = lnRes.error || 'Invalid last name';
    const emailRes = validateEmail(email, true);
    if (!emailRes.isValid) errs.email = emailRes.error || 'Please enter a valid email address';
    // Mobile number is the (read-only) login number, so only its presence is required.
    if (!phone.trim()) errs.phone = 'Phone number is required';
    const dobRes = validateDob(dob, true);
    if (!dobRes.isValid) errs.dob = dobRes.error || 'Date of birth is required';
    if (!gender.trim()) errs.gender = 'Gender is required';

    const hasAnyAddress = Boolean(
      address.trim() || city.trim() || state.trim() || postalCode.trim()
    );
    const addrRes = validateStreetAddress(address, hasAnyAddress);
    if (!addrRes.isValid && addrRes.error) errs.address = addrRes.error;

    const stateRes = validateStateName(state, hasAnyAddress);
    if (!stateRes.isValid && stateRes.error) {
      errs.state = stateRes.error;
    } else if (state.trim() && apiStates.length > 0 && !resolvedStateObj) {
      errs.state = 'Please select a valid State / UT from the list';
    }

    const cityRes = validateCityName(city, hasAnyAddress);
    if (!cityRes.isValid && cityRes.error) {
      errs.city = cityRes.error;
    } else if (
      city.trim() &&
      filteredCitiesForState.length > 0 &&
      !filteredCitiesForState.some(
        (c) => (c.title || c.name || '').trim().toLowerCase() === city.trim().toLowerCase()
      )
    ) {
      errs.city = 'Please select a valid City from the list';
    }

    if (postalCode.trim() && !/^\d{5,6}$/.test(postalCode.trim())) {
      errs.postalCode = 'Please select or enter a valid 5 or 6 digit postal code';
    }

    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) {
      showToast('Please fix the errors before updating profile');
      return;
    }

    if (!userId) {
      showToast('Session expired. Please log in again.');
      return;
    }

    setIsSubmitting(true);
    try {
      const finalOccupation = occupation.trim();
      if (finalOccupation) addCustomOccupation(finalOccupation);

      const token = await storageService.getItem<string>(AppConstants.storageKeys.token);
      await uploadProfileWithXHR(
        ApiEndpoints.updateUserUrl,
        {
          id: userId,
          f_name: fName.trim(),
          l_name: lName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          gender,
          occupation: finalOccupation,
          marital_status: maritalStatus,
          blood_group: bloodGroup,
          address: address.trim(),
          city: city.trim(),
          state: state.trim(),
          postal_code: postalCode.trim(),
          dob: dob.trim(),
        },
        selectedImageUri,
        token || undefined
      );

      const reqHeaders: Record<string, string> = { Accept: 'application/json' };
      if (token) reqHeaders.Authorization = `Bearer ${token}`;

      // Fetch fresh user record from get_user
      let freshUser: any = null;
      try {
        const freshRes = await fetch(`${ApiEndpoints.getUserUrl}/${userId}`, {
          headers: reqHeaders,
        });
        if (freshRes.ok) {
          const freshJson = await freshRes.json();
          freshUser = freshJson?.data ?? freshJson;
        }
      } catch (e) {
        console.warn('Could not fetch updated user profile:', e);
      }

      const mergedUser = {
        ...(authUser || {}),
        ...(freshUser && typeof freshUser === 'object' ? freshUser : {}),
        f_name: fName.trim(),
        l_name: lName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        gender,
        occupation: finalOccupation,
        marital_status: maritalStatus,
        blood_group: bloodGroup,
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        postal_code: postalCode.trim(),
        dob: dob.trim(),
      };

      await updateAuthUser(mergedUser);
      setFName(mergedUser.f_name);
      setLName(mergedUser.l_name);
      // Raw upload bypasses RTK Query, so refresh cached profile / family data
      // so the Dashboard, header and patient dropdown show the new name instantly.
      dispatch((userApi as any).util.invalidateTags(['User', 'FamilyMember']));
      setSelectedImageUri(null);
      showToast('Profile updated successfully!');
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    } catch (err: any) {
      showToast(err?.message || 'Could not update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleteModalVisible(false);
    try {
      await softDelete(userId).unwrap();
      showToast('Account deleted successfully');
      await logout();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      });
    } catch (err: any) {
      showToast(err?.data?.message || 'Could not delete account');
    }
  };

  const getPickerTitleAndOptions = () => {
    switch (activePicker) {
      case 'gender':
        return {
          title: 'Gender', options: GENDER_OPTIONS, current: gender, onSelect: (g: string) => {
            setGender(g);
            setFieldErrors((prev) => ({ ...prev, gender: '' }));
          }
        };
      case 'marital_status':
        return { title: 'Select Marital Status', options: MARITAL_STATUS_OPTIONS, current: maritalStatus, onSelect: setMaritalStatus };
      case 'blood_group':
        return { title: 'Select Blood Group', options: BLOOD_GROUP_OPTIONS, current: bloodGroup, onSelect: setBloodGroup };
      case 'occupation':
        return {
          title: 'Occupation',
          options: occupationOptions,
          current: occupation,
          onSelect: (opt: string) => setOccupation(opt),
        };
      default:
        return { title: '', options: [], current: '', onSelect: () => { } };
    }
  };

  if (isProfileLoading && !user) {
    return (
      <View style={styles.container}>
        <AppHeader title="Patient Profile" onBackPress={() => navigation.goBack()} />
        <LoadingIndicator />
      </View>
    );
  }

  const pickerInfo = getPickerTitleAndOptions();

  return (
    <View style={styles.container}>
      <AppHeader title="Patient Profile" onBackPress={() => navigation.goBack()} />

      <KeyboardAvoidingView
        style={styles.flexOne}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView
          style={styles.flexOne}
          contentContainerStyle={[
            styles.scrollContent,
            { flexGrow: 1, paddingBottom: Math.max(insets.bottom + hs(24), hs(40)) },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Profile Header Summary Card with Centered Avatar */}
          <View style={styles.headerCard}>
            <View style={styles.avatarWrapper}>
              {selectedImageUri ? (
                <Image source={{ uri: selectedImageUri }} style={styles.avatar} />
              ) : remoteImage ? (
                <Image source={{ uri: getImageUrl(remoteImage) }} style={styles.avatar} />
              ) : (
                <View style={styles.placeholderAvatar}>
                  <Text style={styles.avatarInitials}>
                    {fName ? fName.charAt(0).toUpperCase() : 'U'}
                  </Text>
                </View>
              )}
              <TouchableOpacity
                style={styles.editBadge}
                activeOpacity={0.8}
                onPress={() => setIsImagePickerModalVisible(true)}
                disabled={isUploadingPhoto}
              >
                {isUploadingPhoto ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <MaterialIcons name="camera-alt" size={16} color={Colors.white} />
                )}
              </TouchableOpacity>
            </View>

            <Text style={styles.headerName}>
              {`${fName} ${lName}`.trim() || 'Patient Profile'}
            </Text>

            <View style={styles.headerMetaColumn}>
              {!!email && (
                <View style={styles.headerDetailItem}>
                  <MaterialIcons name="mail-outline" size={13} color={Colors.primaryColor} />
                  <Text style={styles.headerDetailText} numberOfLines={1}>
                    {email}
                  </Text>
                </View>
              )}
              {!!phone && (
                <View style={styles.headerDetailItem}>
                  <MaterialIcons name="phone" size={13} color={Colors.primaryColor} />
                  <Text style={styles.headerDetailText}>
                    {phone}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Section 1: PERSONAL DETAILS */}
          <View style={styles.sectionHeader}>
            <MaterialIcons name="person-outline" size={18} color={Colors.primaryColor} />
            <Text style={styles.sectionTitle}>PERSONAL DETAILS</Text>
          </View>

          <View style={styles.formCard}>
            {/* First Name */}
            <View style={styles.fullWidthField}>
              <Text style={styles.fieldLabel}>
                First Name <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <TextInput
                style={styles.textInput}
                value={fName}
                onChangeText={(t) => {
                  setFName(t);
                  if (fieldErrors.fName) setFieldErrors((prev) => ({ ...prev, fName: '' }));
                }}
                placeholder="Enter your first name"
                placeholderTextColor="#94A3B8"
              />
              {!!fieldErrors.fName && <Text style={styles.fieldErrorText}>{fieldErrors.fName}</Text>}
            </View>

            {/* Last Name */}
            <View style={styles.fullWidthField}>
              <Text style={styles.fieldLabel}>Last Name</Text>
              <TextInput
                style={styles.textInput}
                value={lName}
                onChangeText={(t) => {
                  setLName(t);
                  if (fieldErrors.lName) setFieldErrors((prev) => ({ ...prev, lName: '' }));
                }}
                placeholder="Enter your last name"
                placeholderTextColor="#94A3B8"
              />
              {!!fieldErrors.lName && <Text style={styles.fieldErrorText}>{fieldErrors.lName}</Text>}
            </View>

            {/* Email Address */}
            <View style={styles.fullWidthField}>
              <Text style={styles.fieldLabel}>
                Email Address <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <TextInput
                style={styles.textInput}
                value={email}
                onChangeText={(t) => {
                  setEmail(t);
                  if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: '' }));
                }}
                placeholder="Enter your email address"
                placeholderTextColor="#94A3B8"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {!!fieldErrors.email && <Text style={styles.fieldErrorText}>{fieldErrors.email}</Text>}
            </View>

            {/* Mobile Number */}
            <View style={styles.fullWidthField}>
              <Text style={styles.fieldLabel}>
                Mobile Number <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <View style={[styles.phoneInputRow, styles.readOnlyInput]}>
                <TextInput
                  style={styles.phoneInputInner}
                  value={phone.replace(/^\+91/, '').trim()}
                  placeholder="Enter your mobile number"
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
                  editable={false}
                />
              </View>
              {!!fieldErrors.phone && <Text style={styles.fieldErrorText}>{fieldErrors.phone}</Text>}
            </View>

            {/* Date of Birth Picker */}
            <View style={styles.fullWidthField}>
              <Text style={styles.fieldLabel}>
                Date of Birth <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.selectorInput}
                activeOpacity={0.8}
                onPress={() => setIsDatePickerVisible(true)}
              >
                <Text style={[styles.selectorText, !dob && styles.placeholderText]}>
                  {dob ? DateTimeUtils.formatDob(dob) : DateTimeUtils.DOB_PLACEHOLDER}
                </Text>
                <MaterialIcons name="calendar-today" size={16} color={Colors.secondaryFontColor} />
              </TouchableOpacity>
              {!!fieldErrors.dob && <Text style={styles.fieldErrorText}>{fieldErrors.dob}</Text>}
            </View>

            {/* Gender */}
            <View style={styles.fullWidthField}>
              <Text style={styles.fieldLabel}>
                Gender <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.selectorInput}
                activeOpacity={0.8}
                onPress={() => setActivePicker('gender')}
              >
                <Text style={[styles.selectorText, !gender && styles.placeholderText]}>
                  {gender || 'Select Gender'}
                </Text>
                <MaterialIcons name="keyboard-arrow-down" size={20} color={Colors.secondaryFontColor} />
              </TouchableOpacity>
              {!!fieldErrors.gender && <Text style={styles.fieldErrorText}>{fieldErrors.gender}</Text>}
            </View>

            {/* Occupation */}
            <View style={styles.fullWidthField}>
              <Text style={styles.fieldLabel}>Occupation</Text>
              <TouchableOpacity
                style={styles.selectorInput}
                activeOpacity={0.8}
                onPress={() => setActivePicker('occupation')}
              >
                <Text style={[styles.selectorText, !occupation && styles.placeholderText]} numberOfLines={1}>
                  {occupation || 'Occupation'}
                </Text>
                <MaterialIcons name="keyboard-arrow-down" size={20} color={Colors.secondaryFontColor} />
              </TouchableOpacity>
            </View>

            {/* Marital Status */}
            <View style={styles.fullWidthField}>
              <Text style={styles.fieldLabel}>Marital Status</Text>
              <TouchableOpacity
                style={styles.selectorInput}
                activeOpacity={0.8}
                onPress={() => setActivePicker('marital_status')}
              >
                <Text style={[styles.selectorText, !maritalStatus && styles.placeholderText]}>
                  {maritalStatus || 'Select Marital Status'}
                </Text>
                <MaterialIcons name="keyboard-arrow-down" size={20} color={Colors.secondaryFontColor} />
              </TouchableOpacity>
            </View>

            {/* Blood Group */}
            <View style={styles.fullWidthField}>
              <Text style={styles.fieldLabel}>Blood Group</Text>
              <TouchableOpacity
                style={styles.selectorInput}
                activeOpacity={0.8}
                onPress={() => setActivePicker('blood_group')}
              >
                <Text style={[styles.selectorText, !bloodGroup && styles.placeholderText]}>
                  {bloodGroup || 'Select Blood Group'}
                </Text>
                <MaterialIcons name="keyboard-arrow-down" size={20} color={Colors.secondaryFontColor} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Section 2: ADDRESS & LOCATION */}
          <View style={[styles.sectionHeader, { marginTop: 20 }]}>
            <MaterialIcons name="location-on" size={18} color={Colors.primaryColor} />
            <Text style={styles.sectionTitle}>ADDRESS & LOCATION</Text>
          </View>

          <View style={styles.formCard}>
            {/* State / UT Dropdown */}
            <View style={styles.fullWidthField}>
              <Text style={styles.fieldLabel}>State / UT</Text>
              <TouchableOpacity
                style={[styles.selectorInput, fieldErrors.state && styles.inputError]}
                activeOpacity={0.8}
                onPress={() => setAddressDropdown('state')}
              >
                <Text
                  style={[styles.selectorText, !state && styles.placeholderText]}
                  numberOfLines={1}
                >
                  {state
                    ? `${state} (${isUnionTerritory(state) ? 'UT' : 'State'})`
                    : 'Select State / UT'}
                </Text>
                <MaterialIcons name="keyboard-arrow-down" size={20} color={Colors.secondaryFontColor} />
              </TouchableOpacity>
              {!!fieldErrors.state && <Text style={styles.fieldErrorText}>{fieldErrors.state}</Text>}
            </View>

            {/* City Dropdown (depends on selected State / UT) */}
            <View style={styles.fullWidthField}>
              <Text style={styles.fieldLabel}>City</Text>
              <TouchableOpacity
                style={[
                  styles.selectorInput,
                  !state.trim() && styles.readOnlyInput,
                  fieldErrors.city && styles.inputError,
                ]}
                activeOpacity={state.trim() ? 0.8 : 1}
                onPress={() => {
                  if (!state.trim()) {
                    setFieldErrors((prev) => ({ ...prev, state: 'Please select a State / UT first' }));
                    return;
                  }
                  setAddressDropdown('city');
                }}
              >
                <Text
                  style={[
                    styles.selectorText,
                    (!city || !state.trim()) && styles.placeholderText,
                  ]}
                  numberOfLines={1}
                >
                  {!state.trim() ? 'Select state first' : city || 'Select City'}
                </Text>
                <MaterialIcons name="keyboard-arrow-down" size={20} color={Colors.secondaryFontColor} />
              </TouchableOpacity>
              {!!fieldErrors.city && <Text style={styles.fieldErrorText}>{fieldErrors.city}</Text>}
            </View>

            {/* Postal Code Dropdown (depends on selected City) */}
            <View style={styles.fullWidthField}>
              <Text style={styles.fieldLabel}>Postal Code</Text>
              {effectiveCityId && !isPostalLoading && postalDropdownOptions.length === 0 ? (
                <TextInput
                  style={[styles.textInput, fieldErrors.postalCode && styles.inputError]}
                  value={postalCode}
                  onChangeText={(t) => {
                    setPostalCode(t.replace(/\D/g, ''));
                    if (fieldErrors.postalCode) {
                      setFieldErrors((prev) => ({ ...prev, postalCode: '' }));
                    }
                  }}
                  placeholder="Enter Postal Code"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  maxLength={6}
                />
              ) : (
                <TouchableOpacity
                  style={[
                    styles.selectorInput,
                    !city.trim() && styles.readOnlyInput,
                    fieldErrors.postalCode && styles.inputError,
                  ]}
                  activeOpacity={city.trim() ? 0.8 : 1}
                  onPress={() => {
                    if (!city.trim()) {
                      setFieldErrors((prev) => ({ ...prev, city: 'Please select a City first' }));
                      return;
                    }
                    setAddressDropdown('postal');
                  }}
                >
                  <Text
                    style={[
                      styles.selectorText,
                      (!postalCode || !city.trim()) && styles.placeholderText,
                    ]}
                    numberOfLines={1}
                  >
                    {!city.trim()
                      ? 'Select city first'
                      : postalCode || 'Select Postal Code'}
                  </Text>
                  <MaterialIcons name="keyboard-arrow-down" size={20} color={Colors.secondaryFontColor} />
                </TouchableOpacity>
              )}
              {!!fieldErrors.postalCode && (
                <Text style={styles.fieldErrorText}>{fieldErrors.postalCode}</Text>
              )}
            </View>

            {/* Street Address */}
            <View style={styles.fullWidthField}>
              <Text style={styles.fieldLabel}>Street Address</Text>
              <TextInput
                style={[styles.textInput, fieldErrors.address && styles.inputError]}
                value={address}
                onChangeText={(t) => {
                  setAddress(t);
                  if (fieldErrors.address) setFieldErrors((prev) => ({ ...prev, address: '' }));
                }}
                placeholder="Enter Street Address"
                placeholderTextColor="#94A3B8"
                maxLength={STREET_ADDRESS_MAX}
              />
              {!!fieldErrors.address && <Text style={styles.fieldErrorText}>{fieldErrors.address}</Text>}
            </View>
          </View>

          {/* Action Buttons Row */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.cancelBtn}
              activeOpacity={0.8}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.cancelBtnText} numberOfLines={1}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.updateBtn, (isSubmitting || isUpdating) && styles.btnDisabled]}
              activeOpacity={0.85}
              onPress={handleUpdate}
              disabled={isSubmitting || isUpdating}
            >
              {isSubmitting || isUpdating ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Text style={styles.updateBtnText} numberOfLines={1}>Update Profile</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Dynamic Dropdown Selection Modal matching web screenshots */}
      <Modal
        visible={!!activePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setActivePicker(null)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setActivePicker(null)}
        >
          <View style={styles.pickerModalContent}>
            <Text style={styles.pickerModalTitle}>{pickerInfo.title}</Text>
            <View style={styles.pickerOptionsList}>
              {pickerInfo.options.map((option) => {
                const isSelected = pickerInfo.current === option;
                return (
                  <TouchableOpacity
                    key={option}
                    style={[styles.pickerOptionItem, isSelected && styles.pickerOptionSelected]}
                    activeOpacity={0.8}
                    onPress={() => {
                      pickerInfo.onSelect(option);
                      setActivePicker(null);
                    }}
                  >
                    <Text
                      style={[
                        styles.pickerOptionText,
                        isSelected && styles.pickerOptionTextSelected,
                      ]}
                    >
                      {option}
                    </Text>
                    {isSelected && (
                      <MaterialIcons name="check" size={18} color={Colors.white} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Direct manual entry inside picker modal for occupation */}
            {activePicker === 'occupation' && (
              <View style={styles.customPickerInputWrap}>
                <Text style={styles.customPickerInputLabel}>Not listed? Add your occupation</Text>
                <View style={styles.customPickerInputRow}>
                  <TextInput
                    style={styles.customPickerInput}
                    placeholder="e.g. Teacher, Engineer..."
                    placeholderTextColor="#94A3B8"
                    value={customOccupationText}
                    onChangeText={setCustomOccupationText}
                  />
                  <TouchableOpacity
                    style={styles.customPickerApplyBtn}
                    onPress={() => {
                    }}
                  >
                    <Text style={styles.customPickerApplyText}>Add</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Date Picker Modal */}
      <AppDatePickerModal
        visible={isDatePickerVisible}
        onClose={() => setIsDatePickerVisible(false)}
        onSelectDate={(selected) => {
          setDob(selected);
          setFieldErrors((prev) => ({ ...prev, dob: '' }));
          setIsDatePickerVisible(false);
        }}
        initialDate={dob}
        maxDate={new Date()}
      />

      {/* State / UT Searchable Dropdown */}
      <SearchableSelectModal
        visible={addressDropdown === 'state'}
        onClose={() => setAddressDropdown(null)}
        title="Select State / UT"
        subtitle="States and Union Territories"
        searchPlaceholder="Search state or UT..."
        options={stateDropdownOptions}
        selectedValue={resolvedStateObj?.id ?? state}
        isLoading={isStatesLoading}
        emptyMessage="No states available"
        onSelect={(option) => {
          const pickedState = String(option.label || '').trim();
          const pickedStateId = String(option.id || '');
          const isSameState =
            pickedState.toLowerCase() === state.trim().toLowerCase() &&
            pickedStateId === selectedStateId;
          setState(pickedState);
          setSelectedStateId(pickedStateId);
          if (!isSameState) {
            setCity('');
            setSelectedCityId('');
            setPostalCode('');
          }
          setFieldErrors((prev) => ({ ...prev, state: '', city: '', postalCode: '' }));
        }}
      />

      {/* City Searchable Dropdown */}
      <SearchableSelectModal
        visible={addressDropdown === 'city'}
        onClose={() => setAddressDropdown(null)}
        title="Select City"
        subtitle={state ? `Cities in ${state}` : 'Choose your city'}
        searchPlaceholder="Search city..."
        options={cityDropdownOptions}
        selectedValue={resolvedCityObj?.id ?? city}
        isLoading={isCitiesLoading}
        emptyMessage={state ? `No cities listed for ${state}` : 'Select a state first'}
        onSelect={(option) => {
          const pickedCity = String(option.label || '').trim();
          const pickedCityId = String(option.id || '');
          const isSameCity =
            pickedCity.toLowerCase() === city.trim().toLowerCase() &&
            pickedCityId === selectedCityId;
          setCity(pickedCity);
          setSelectedCityId(pickedCityId);
          if (!isSameCity) {
            setPostalCode('');
          }
          setFieldErrors((prev) => ({ ...prev, city: '', postalCode: '' }));
        }}
      />

      {/* Postal Code Searchable Dropdown */}
      <SearchableSelectModal
        visible={addressDropdown === 'postal'}
        onClose={() => setAddressDropdown(null)}
        title="Select Postal Code"
        subtitle={city ? `Postal codes in ${city}` : 'Choose postal code'}
        searchPlaceholder="Search postal code or area..."
        options={postalDropdownOptions}
        selectedValue={postalCode}
        isLoading={isPostalLoading}
        emptyMessage={city ? `No postal codes listed for ${city}` : 'Select a city first'}
        onSelect={(option) => {
          setPostalCode(String(option.label || '').trim());
          setFieldErrors((prev) => ({ ...prev, postalCode: '' }));
        }}
      />

      {/* Image Picker Sheet */}
      <Modal
        visible={isImagePickerModalVisible}
        transparent
        statusBarTranslucent
        animationType="slide"
        onRequestClose={() => setIsImagePickerModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.bottomModalBackdrop}
          activeOpacity={1}
          onPress={() => setIsImagePickerModalVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={[styles.bottomModalContent, { paddingBottom: Math.max(insets.bottom + 20, 36) }]}
          >
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Choose Profile Photo</Text>
              <TouchableOpacity
                onPress={() => setIsImagePickerModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close-circle" size={24} color={Colors.secondaryFontColor} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.sheetOption}
              onPress={handlePickFromGallery}
            >
              <Ionicons name="images-outline" size={22} color={Colors.primaryColor} />
              <Text style={styles.sheetOptionText}>Select from Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sheetOption} onPress={handleTakePhoto}>
              <Ionicons name="camera-outline" size={22} color={Colors.primaryColor} />
              <Text style={styles.sheetOptionText}>Take a Photo</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Delete Account Confirmation Modal */}
      <Modal
        visible={isDeleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsDeleteModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.confirmBox}>
            <MaterialIcons name="warning" size={40} color={Colors.redColor} />
            <Text style={styles.confirmTitle}>Delete Account?</Text>
            <Text style={styles.confirmMessage}>
              Are you sure you want to delete your account? This action cannot be undone and your health records will be removed.
            </Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={styles.confirmCancelBtn}
                onPress={() => setIsDeleteModalVisible(false)}
              >
                <Text style={styles.confirmCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmDeleteBtn}
                onPress={handleDeleteAccount}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Text style={styles.confirmDeleteText}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View >
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  flexOne: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: ws(16),
    paddingTop: hs(12),
  },
  headerCard: {
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: fs(18),
    paddingVertical: hs(14),
    paddingHorizontal: ws(16),
    marginBottom: hs(12),
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: hs(2) },
    shadowOpacity: 0.04,
    shadowRadius: fs(6),
    elevation: 2,
    position: 'relative',
  },
  trashDeleteBtn: {
    position: 'absolute',
    top: hs(12),
    right: ws(12),
    width: ws(34),
    height: ws(34),
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: hs(8),
  },
  avatar: {
    width: ws(80),
    height: ws(80),
    aspectRatio: 1,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
  },
  placeholderAvatar: {
    width: ws(80),
    height: ws(80),
    aspectRatio: 1,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: Colors.aquaSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: fs(28),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryColor,
  },
  editBadge: {
    position: 'absolute',
    bottom: hs(0),
    right: ws(0),
    width: ws(28),
    height: ws(28),
    aspectRatio: 1,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: Colors.primaryColor,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: hs(2) },
    shadowOpacity: 0.2,
    shadowRadius: fs(3),
    elevation: 3,
  },
  headerName: {
    fontSize: fs(15),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
    textAlign: 'center',
    marginBottom: hs(4),
  },
  headerMetaColumn: {
    alignItems: 'center',
    gap: hs(4),
    width: '100%',
  },
  headerDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(4),
    backgroundColor: '#F8FAFC',
    paddingHorizontal: ws(8),
    paddingVertical: hs(3),
    borderRadius: fs(6),
  },
  headerDetailText: {
    fontSize: fs(11),
    ...TYPOGRAPHY.regular,
    color: Colors.secondaryFontColor,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(5),
    marginBottom: hs(8),
  },
  sectionTitle: {
    fontSize: fs(11.5),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryColor,
    letterSpacing: 0.5,
  },
  formCard: {
    backgroundColor: Colors.white,
    borderRadius: fs(16),
    paddingHorizontal: ws(14),
    paddingVertical: hs(12),
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: hs(1) },
    shadowOpacity: 0.03,
    shadowRadius: fs(4),
    elevation: 1,
  },
  row: {
    flexDirection: 'row',
    gap: ws(10),
    marginBottom: hs(8),
  },
  flexCol: {
    flex: 1,
  },
  fullWidthField: {
    marginBottom: hs(8),
  },
  fieldLabel: {
    fontSize: fs(11.5),
    ...TYPOGRAPHY.medium,
    color: Colors.primaryFontColor,
    marginBottom: hs(4),
  },
  requiredAsterisk: {
    color: '#EF4444',
    ...TYPOGRAPHY.bold,
  },
  textInput: {
    minHeight: hs(38),
    height: hs(38),
    backgroundColor: '#F8FAFC',
    borderRadius: fs(10),
    paddingHorizontal: ws(12),
    paddingVertical: Platform.OS === 'ios' ? hs(6) : hs(2),
    fontSize: fs(13),
    ...TYPOGRAPHY.regular,
    color: Colors.primaryFontColor,
    borderWidth: 1,
    borderColor: Colors.border,
    textAlignVertical: 'center',
  },
  inputError: {
    borderColor: Colors.redColor,
    backgroundColor: '#FFF5F5',
  },
  phoneInputRow: {
    minHeight: hs(38),
    height: hs(38),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: fs(10),
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  countryCodeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ws(10),
    height: '100%',
    gap: ws(2),
  },
  countryCodeText: {
    fontSize: fs(13),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
  },
  verticalDivider: {
    width: 1,
    height: '65%',
    backgroundColor: '#CBD5E1',
  },
  phoneInputInner: {
    flex: 1,
    height: '100%',
    paddingHorizontal: ws(10),
    fontSize: fs(13),
    ...TYPOGRAPHY.regular,
    color: Colors.primaryFontColor,
    textAlignVertical: 'center',
  },
  readOnlyInput: {
    backgroundColor: '#F1F5F9',
    color: '#64748B',
  },
  selectorInput: {
    minHeight: hs(38),
    height: hs(38),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: fs(10),
    paddingHorizontal: ws(10),
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectorText: {
    flex: 1,
    marginRight: ws(4),
    fontSize: fs(12.5),
    ...TYPOGRAPHY.medium,
    color: Colors.primaryFontColor,
  },
  placeholderText: {
    color: '#94A3B8',
    ...TYPOGRAPHY.regular,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(12),
    marginTop: hs(16),
    marginBottom: hs(12),
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
    height: hs(48),
    borderRadius: fs(12),
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: fs(14),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
  },
  updateBtn: {
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
    height: hs(48),
    borderRadius: fs(12),
    backgroundColor: Colors.primaryColor,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primaryColor,
    shadowOffset: { width: 0, height: hs(2) },
    shadowOpacity: 0.2,
    shadowRadius: fs(4),
    elevation: 2,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  updateBtnText: {
    fontSize: fs(14),
    ...TYPOGRAPHY.bold,
    color: Colors.white,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: ws(24),
  },
  pickerModalContent: {
    width: '100%',
    maxWidth: ws(340),
    backgroundColor: Colors.white,
    borderRadius: fs(18),
    padding: ws(18),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: hs(4) },
    shadowOpacity: 0.15,
    shadowRadius: fs(10),
    elevation: 5,
  },
  pickerModalTitle: {
    fontSize: fs(14),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
    marginBottom: hs(12),
    paddingBottom: hs(8),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  pickerOptionsList: {
    gap: hs(6),
  },
  pickerOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: hs(10),
    paddingHorizontal: ws(12),
    borderRadius: fs(10),
  },
  pickerOptionSelected: {
    backgroundColor: Colors.primaryColor,
  },
  pickerOptionText: {
    fontSize: fs(13),
    ...TYPOGRAPHY.medium,
    color: Colors.primaryFontColor,
  },
  pickerOptionTextSelected: {
    color: Colors.white,
    ...TYPOGRAPHY.bold,
  },
  customPickerInputWrap: {
    marginTop: hs(12),
    paddingTop: hs(10),
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  customPickerInputLabel: {
    fontSize: fs(11.5),
    ...TYPOGRAPHY.medium,
    color: '#64748B',
    marginBottom: hs(6),
  },
  customPickerInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(8),
  },
  customPickerInput: {
    flex: 1,
    height: hs(38),
    backgroundColor: '#F8FAFC',
    borderRadius: fs(8),
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: ws(10),
    fontSize: fs(12.5),
    ...TYPOGRAPHY.regular,
    color: Colors.primaryFontColor,
  },
  customPickerApplyBtn: {
    height: hs(38),
    paddingHorizontal: ws(14),
    backgroundColor: Colors.primaryColor,
    borderRadius: fs(8),
    justifyContent: 'center',
    alignItems: 'center',
  },
  customPickerApplyText: {
    color: Colors.white,
    fontSize: fs(12),
    ...TYPOGRAPHY.bold,
  },
  bottomModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  bottomModalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: fs(24),
    borderTopRightRadius: fs(24),
    paddingHorizontal: ws(20),
    paddingTop: hs(12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: hs(-4) },
    shadowOpacity: 0.12,
    shadowRadius: fs(10),
    elevation: 12,
  },
  sheetHandle: {
    width: ws(36),
    height: hs(4),
    borderRadius: fs(2),
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: hs(14),
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hs(12),
  },
  sheetTitle: {
    fontSize: fs(15),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hs(14),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: ws(12),
  },
  sheetOptionText: {
    fontSize: fs(14),
    ...TYPOGRAPHY.medium,
    color: Colors.primaryFontColor,
  },
  confirmBox: {
    width: '100%',
    maxWidth: ws(320),
    backgroundColor: Colors.white,
    borderRadius: fs(20),
    padding: ws(20),
    alignItems: 'center',
  },
  confirmTitle: {
    fontSize: fs(16),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
    marginTop: hs(10),
    marginBottom: hs(6),
  },
  confirmMessage: {
    fontSize: fs(12),
    ...TYPOGRAPHY.regular,
    color: Colors.secondaryFontColor,
    textAlign: 'center',
    lineHeight: hs(18),
    marginBottom: hs(20),
  },
  confirmActions: {
    flexDirection: 'row',
    gap: ws(12),
    width: '100%',
  },
  confirmCancelBtn: {
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
    height: hs(48),
    borderRadius: fs(12),
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmCancelText: {
    fontSize: fs(14),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
  },
  confirmDeleteBtn: {
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
    height: hs(48),
    borderRadius: fs(12),
    backgroundColor: Colors.redColor,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmDeleteText: {
    fontSize: fs(14),
    ...TYPOGRAPHY.bold,
    color: Colors.white,
  },
  fieldErrorText: {
    fontSize: fs(12),
    ...TYPOGRAPHY.medium,
    color: '#EF4444',
    marginTop: hs(4),
  },
});
