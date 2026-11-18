import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Platform } from 'react-native';
import { ApiEndpoints, AppConstants } from '../../constants';
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
  logApiCall,
  showToast,
  validateCityName,
  validateDob,
  validateEmail,
  validateName,
  validatePhone,
  validatePostalCode,
  validateStateName,
  validateStreetAddress,
} from '../../utils';
import type { SearchableSelectOption } from '../../components';

export type PickerFieldType = 'gender' | 'marital_status' | 'blood_group' | 'occupation' | null;

export const GENDER_OPTIONS = ['Male', 'Female', 'Other'];
export const MARITAL_STATUS_OPTIONS = ['Married', 'Unmarried', 'Divorced', 'Widowed', 'Other'];
export const BLOOD_GROUP_OPTIONS = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
export const DEFAULT_OCCUPATION_OPTIONS = ['Job Holder', 'Business'];
export const CUSTOM_OCCUPATIONS_KEY = 'custom_occupations';

const cleanDateString = (rawDate?: string | null): string => {
  if (!rawDate) return '';
  const str = String(rawDate).trim();
  if (str.includes('T')) return str.split('T')[0];
  if (str.includes(' ')) return str.split(' ')[0];
  return str;
};

export const useEditProfile = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
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
    const cleanState = state.trim().toLowerCase().replace(/\s*\((state|ut)\)/gi, '').trim();
    if (!cleanState) return undefined;
    return apiStates.find((s) => (s.title || '').trim().toLowerCase().replace(/\s*\((state|ut)\)/gi, '').trim() === cleanState);
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
    return [...apiStates]
      .map((s) => {
        const cleanTitle = (s.title || '').replace(/\s*\((state|ut)\)/gi, '').trim();
        return {
          id: String(s.id),
          label: cleanTitle,
          data: s,
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label));
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
        // ignore
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

    const fnRes = validateName(fName, true, 'First name');
    if (!fnRes.isValid) errs.fName = fnRes.error || 'First name is required';
    const lnRes = validateName(lName, false, 'Last name');
    if (!lnRes.isValid) errs.lName = lnRes.error || 'Invalid last name';
    const emailRes = validateEmail(email, true);
    if (!emailRes.isValid) errs.email = emailRes.error || 'Please enter a valid email address';
    const phoneRes = validatePhone(phone, true);
    if (!phoneRes.isValid) errs.phone = phoneRes.error || 'Please enter a valid 10-digit Indian mobile number';
    const dobRes = validateDob(dob, true);
    if (!dobRes.isValid) errs.dob = dobRes.error || 'Date of birth is required';
    if (!gender.trim()) errs.gender = 'Gender is required';
    if (!bloodGroup.trim()) errs.bloodGroup = 'Blood group is required';

    // Address & Location fields are completely optional
    if (address.trim()) {
      const addrRes = validateStreetAddress(address, false);
      if (!addrRes.isValid && addrRes.error) errs.address = addrRes.error;
    }

    if (state.trim()) {
      const stateRes = validateStateName(state, false);
      if (!stateRes.isValid && stateRes.error) {
        errs.state = stateRes.error;
      } else if (apiStates.length > 0 && !resolvedStateObj) {
        errs.state = 'Please select a valid State / UT from the list';
      }
    }

    if (city.trim()) {
      const cityRes = validateCityName(city, false);
      if (!cityRes.isValid && cityRes.error) {
        errs.city = cityRes.error;
      } else if (
        filteredCitiesForState.length > 0 &&
        !filteredCitiesForState.some(
          (c) => (c.title || c.name || '').trim().toLowerCase() === city.trim().toLowerCase()
        )
      ) {
        errs.city = 'Please select a valid City from the list';
      }
    }

    if (postalCode.trim()) {
      const postalRes = validatePostalCode(postalCode, false);
      if (!postalRes.isValid && postalRes.error) {
        errs.postalCode = postalRes.error;
      }
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

      let mergedUser: any = {
        ...(authUser || {}),
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

      try {
        const freshRes = await fetch(`${ApiEndpoints.getUserUrl}/${userId}`, {
          headers: reqHeaders,
        });
        if (freshRes.ok) {
          const freshJson = await freshRes.json();
          const freshUser = freshJson?.data ?? freshJson;
          if (freshUser) mergedUser = { ...mergedUser, ...freshUser };
        }
      } catch (syncErr) {
        console.warn('Post-update profile refetch non-fatal error:', syncErr);
      }

      await updateAuthUser(mergedUser);
      setFName(mergedUser.f_name);
      setLName(mergedUser.l_name);
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
          title: 'Gender',
          options: GENDER_OPTIONS,
          current: gender,
          onSelect: (g: string) => {
            setGender(g);
            setFieldErrors((prev) => ({ ...prev, gender: '' }));
          },
        };
      case 'marital_status':
        return {
          title: 'Select Marital Status',
          options: MARITAL_STATUS_OPTIONS,
          current: maritalStatus,
          onSelect: setMaritalStatus,
        };
      case 'blood_group':
        return {
          title: 'Select Blood Group',
          options: BLOOD_GROUP_OPTIONS,
          current: bloodGroup,
          onSelect: (bg: string) => {
            setBloodGroup(bg);
            setFieldErrors((prev) => ({ ...prev, bloodGroup: '' }));
          },
        };
      case 'occupation':
        return {
          title: 'Occupation',
          options: occupationOptions,
          current: occupation,
          onSelect: (opt: string) => setOccupation(opt),
        };
      default:
        return { title: '', options: [], current: '', onSelect: () => {} };
    }
  };

  return {
    navigation,
    authUser,
    userId,
    user,
    remoteImage,
    selectedImageUri,
    isUploadingPhoto,
    isSubmitting,
    isUpdating,
    isProfileLoading,
    fName,
    setFName,
    lName,
    setLName,
    email,
    setEmail,
    phone,
    setPhone,
    dob,
    setDob,
    gender,
    setGender,
    occupation,
    setOccupation,
    customOccupationText,
    setCustomOccupationText,
    occupationOptions,
    maritalStatus,
    setMaritalStatus,
    bloodGroup,
    setBloodGroup,
    address,
    setAddress,
    city,
    setCity,
    state,
    setState,
    selectedStateId,
    setSelectedStateId,
    selectedCityId,
    setSelectedCityId,
    postalCode,
    setPostalCode,
    addressDropdown,
    setAddressDropdown,
    fieldErrors,
    setFieldErrors,
    stateDropdownOptions,
    cityDropdownOptions,
    postalDropdownOptions,
    isStatesLoading,
    isCitiesLoading,
    isPostalLoading,
    activePicker,
    setActivePicker,
    isImagePickerModalVisible,
    setIsImagePickerModalVisible,
    isDatePickerVisible,
    setIsDatePickerVisible,
    isDeleteModalVisible,
    setIsDeleteModalVisible,
    isDeleting,
    handlePickFromGallery,
    handleTakePhoto,
    handleUpdate,
    handleDeleteAccount,
    addCustomOccupation,
    getPickerTitleAndOptions,
  };
};
