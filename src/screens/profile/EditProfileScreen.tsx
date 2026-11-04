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
} from '../../components';
import { ApiEndpoints, AppConstants, Colors } from '../../constants';
import { useAuth } from '../../context/AuthContext';
import type { RootStackParamList } from '../../navigation/types';
import {
  useGetUserProfileQuery,
  useSoftDeleteUserMutation,
  useUpdateUserProfileMutation,
} from '../../redux/apis/userApi';
import { storageService } from '../../services/storageService';
import type { UserModel } from '../../types';
import { DateTimeUtils, fs, getImageUrl, hs, showToast, TYPOGRAPHY, ws } from '../../utils';
import { validateDob, validateEmail, validatePhone } from '../../validation/authValidation';

type Props = NativeStackScreenProps<RootStackParamList, 'EditProfile'>;

type PickerFieldType = 'gender' | 'marital_status' | 'blood_group' | 'occupation' | null;

const GENDER_OPTIONS = ['Male', 'Female', 'Other'];
const MARITAL_STATUS_OPTIONS = ['Married', 'Unmarried', 'Divorced', 'Widowed', 'Other'];
const BLOOD_GROUP_OPTIONS = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
const OCCUPATION_OPTIONS = ['Job Holder', 'Business', 'Others'];

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
  const userId = String(authUser?.id ?? (authUser as any)?.user_id ?? '');

  // Form State
  const [fName, setFName] = useState(authUser?.f_name ?? '');
  const [lName, setLName] = useState(authUser?.l_name ?? '');
  const [email, setEmail] = useState(authUser?.email ?? '');
  const [phone, setPhone] = useState(authUser?.phone ?? '');
  const [dob, setDob] = useState(cleanDateString(authUser?.dob));
  const [gender, setGender] = useState(authUser?.gender ?? '');
  const [occupation, setOccupation] = useState(authUser?.occupation ?? '');
  const [isCustomOccupation, setIsCustomOccupation] = useState(false);
  const [customOccupationText, setCustomOccupationText] = useState('');
  const [maritalStatus, setMaritalStatus] = useState(authUser?.marital_status ?? '');
  const [bloodGroup, setBloodGroup] = useState(authUser?.blood_group ?? '');

  // Address & Location State
  const [address, setAddress] = useState(authUser?.address ?? '');
  const [city, setCity] = useState(authUser?.city ?? '');
  const [state, setState] = useState(authUser?.state ?? '');
  const [postalCode, setPostalCode] = useState(String(authUser?.postal_code ?? ''));

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);

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
  });

  const [updateProfile, { isLoading: isUpdating }] = useUpdateUserProfileMutation();
  const [softDelete, { isLoading: isDeleting }] = useSoftDeleteUserMutation();

  const user: UserModel | null = useMemo(() => {
    return userProfileData?.data ?? userProfileData ?? authUser ?? null;
  }, [userProfileData, authUser]);

  const remoteImage = user?.image || user?.image_url || authUser?.image || authUser?.image_url || '';

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
      if (userOcc && !['Job Holder', 'Business'].includes(userOcc)) {
        setIsCustomOccupation(true);
        setCustomOccupationText(userOcc === 'Others' ? '' : userOcc);
      } else {
        setIsCustomOccupation(userOcc === 'Others');
        setCustomOccupationText('');
      }
      setMaritalStatus(user.marital_status ?? '');
      setBloodGroup(user.blood_group ?? '');
      setAddress(user.address ?? '');
      setCity(user.city ?? '');
      setState(user.state ?? '');
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

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const json = JSON.parse(xhr.responseText);
            resolve(json);
          } catch (e) {
            resolve({ status: true });
          }
        } else {
          reject(new Error(`Server error (${xhr.status})`));
        }
      };

      xhr.onerror = () => {
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

    if (!fName.trim()) {
      errs.fName = 'First name is required';
    }
    if (email.trim()) {
      const emailRes = validateEmail(email, true);
      if (!emailRes.isValid) {
        errs.email = emailRes.error || 'Please enter a valid email address';
      }
    }
    if (phone.trim()) {
      const phoneRes = validatePhone(phone, true);
      if (!phoneRes.isValid) {
        errs.phone = phoneRes.error || 'Please enter a valid 10-digit phone number';
      }
    }
    if (dob.trim()) {
      const dobRes = validateDob(dob, false);
      if (!dobRes.isValid) {
        errs.dob = dobRes.error || 'Invalid date of birth';
      }
    }
    if (postalCode.trim() && !/^\d{5,6}$/.test(postalCode.trim())) {
      errs.postalCode = 'Please enter a valid 5 or 6 digit postal code';
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
      const finalOccupation =
        isCustomOccupation && customOccupationText.trim()
          ? customOccupationText.trim()
          : occupation;

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
      setSelectedImageUri(null);
      showToast('Profile updated successfully!');
      refetch();
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
        return { title: 'Select Gender', options: GENDER_OPTIONS, current: gender, onSelect: setGender };
      case 'marital_status':
        return { title: 'Select Marital Status', options: MARITAL_STATUS_OPTIONS, current: maritalStatus, onSelect: setMaritalStatus };
      case 'blood_group':
        return { title: 'Select Blood Group', options: BLOOD_GROUP_OPTIONS, current: bloodGroup, onSelect: setBloodGroup };
      case 'occupation':
        return {
          title: 'Select Occupation',
          options: OCCUPATION_OPTIONS,
          current: occupation,
          onSelect: (opt: string) => {
            if (opt === 'Others') {
              setIsCustomOccupation(true);
              setOccupation('Others');
            } else {
              setIsCustomOccupation(false);
              setOccupation(opt);
              setCustomOccupationText('');
            }
          },
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
                placeholder="First Name"
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
                onChangeText={setLName}
                placeholder="Last Name"
                placeholderTextColor="#94A3B8"
              />
            </View>

            {/* Email Address */}
            <View style={styles.fullWidthField}>
              <Text style={styles.fieldLabel}>Email Address</Text>
              <TextInput
                style={styles.textInput}
                value={email}
                onChangeText={(t) => {
                  setEmail(t);
                  if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: '' }));
                }}
                placeholder="Email Address"
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
                <View style={styles.countryCodeBadge}>
                  <Text style={styles.countryCodeText}>+91</Text>
                </View>
                <View style={styles.verticalDivider} />
                <TextInput
                  style={styles.phoneInputInner}
                  value={phone.replace(/^\+91/, '').trim()}
                  placeholder="Mobile Number"
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
                  editable={false}
                />
              </View>
              {!!fieldErrors.phone && <Text style={styles.fieldErrorText}>{fieldErrors.phone}</Text>}
            </View>

            {/* Date of Birth Picker */}
            <View style={styles.fullWidthField}>
              <Text style={styles.fieldLabel}>Date of Birth</Text>
              <TouchableOpacity
                style={styles.selectorInput}
                activeOpacity={0.8}
                onPress={() => setIsDatePickerVisible(true)}
              >
                <Text style={[styles.selectorText, !dob && styles.placeholderText]}>
                  {dob ? DateTimeUtils.getDataFormat(dob) || dob : 'Select Date of Birth'}
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
                  {occupation || 'Select Occupation'}
                </Text>
                <MaterialIcons name="keyboard-arrow-down" size={20} color={Colors.secondaryFontColor} />
              </TouchableOpacity>
            </View>

            {/* If Others or custom occupation is selected, provide manual entry */}
            {isCustomOccupation && (
              <View style={[styles.fullWidthField, { marginTop: hs(2) }]}>
                <Text style={styles.fieldLabel}>Specify Occupation (Manual Entry)</Text>
                <TextInput
                  style={styles.textInput}
                  value={customOccupationText}
                  onChangeText={(t) => {
                    setCustomOccupationText(t);
                    setOccupation(t);
                  }}
                  placeholder="Enter your occupation (e.g. Teacher, Engineer...)"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            )}

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
            {/* Street Address */}
            <View style={styles.fullWidthField}>
              <Text style={styles.fieldLabel}>Street Address</Text>
              <TextInput
                style={styles.textInput}
                value={address}
                onChangeText={setAddress}
                placeholder="Enter Street Address"
                placeholderTextColor="#94A3B8"
              />
            </View>

            {/* City */}
            <View style={styles.fullWidthField}>
              <Text style={styles.fieldLabel}>City</Text>
              <TextInput
                style={styles.textInput}
                value={city}
                onChangeText={setCity}
                placeholder="City"
                placeholderTextColor="#94A3B8"
              />
            </View>

            {/* State */}
            <View style={styles.fullWidthField}>
              <Text style={styles.fieldLabel}>State</Text>
              <TextInput
                style={styles.textInput}
                value={state}
                onChangeText={setState}
                placeholder="State"
                placeholderTextColor="#94A3B8"
              />
            </View>

            {/* Postal Code */}
            <View style={styles.fullWidthField}>
              <Text style={styles.fieldLabel}>Postal Code</Text>
              <TextInput
                style={styles.textInput}
                value={postalCode}
                onChangeText={(t) => {
                  setPostalCode(t);
                  if (fieldErrors.postalCode) setFieldErrors((prev) => ({ ...prev, postalCode: '' }));
                }}
                placeholder="Postal / Zip Code"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
              />
              {!!fieldErrors.postalCode && <Text style={styles.fieldErrorText}>{fieldErrors.postalCode}</Text>}
            </View>
          </View>

          {/* Action Buttons Row matching web UI */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.cancelBtn}
              activeOpacity={0.8}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
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
                <Text style={styles.updateBtnText}>Update Patient Profile</Text>
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
                <Text style={styles.customPickerInputLabel}>Or enter occupation manually:</Text>
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
                      if (customOccupationText.trim()) {
                        setOccupation(customOccupationText.trim());
                        setIsCustomOccupation(true);
                      }
                      setActivePicker(null);
                    }}
                  >
                    <Text style={styles.customPickerApplyText}>Save</Text>
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
          setIsDatePickerVisible(false);
        }}
        initialDate={dob}
        maxDate={new Date()}
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
    borderColor: '#E2E8F0',
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
    backgroundColor: '#EFF6FF',
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
    borderColor: '#E2E8F0',
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
    borderColor: '#E2E8F0',
    textAlignVertical: 'center',
  },
  phoneInputRow: {
    minHeight: hs(38),
    height: hs(38),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: fs(10),
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    borderColor: '#E2E8F0',
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
    gap: ws(10),
    marginTop: hs(14),
    marginBottom: hs(10),
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    height: hs(42),
    borderRadius: fs(10),
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: fs(13),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
  },
  updateBtn: {
    flex: 1.8,
    height: hs(42),
    borderRadius: fs(10),
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
    fontSize: fs(13),
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
    gap: ws(10),
    width: '100%',
  },
  confirmCancelBtn: {
    flex: 1,
    paddingVertical: hs(10),
    borderRadius: fs(10),
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  confirmCancelText: {
    fontSize: fs(13),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
  },
  confirmDeleteBtn: {
    flex: 1,
    paddingVertical: hs(10),
    borderRadius: fs(10),
    backgroundColor: Colors.redColor,
    alignItems: 'center',
  },
  confirmDeleteText: {
    fontSize: fs(13),
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
