import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FileSystemUploadType, uploadAsync } from 'expo-file-system/legacy';
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
import { ApiEndpoints, AppConstants, Colors, Typography } from '../../constants';
import { useAuth } from '../../context/AuthContext';
import type { RootStackParamList } from '../../navigation/types';
import {
  useGetUserProfileQuery,
  useSoftDeleteUserMutation,
  useUpdateUserProfileMutation,
} from '../../redux/apis/userApi';
import { storageService } from '../../services/storageService';
import type { UserModel } from '../../types';
import { DateTimeUtils, getImageUrl, showToast } from '../../utils';

type Props = NativeStackScreenProps<RootStackParamList, 'EditProfile'>;

type PickerFieldType = 'gender' | 'occupation' | 'marital_status' | 'blood_group' | null;

const GENDER_OPTIONS = ['Male', 'Female', 'Other'];
const OCCUPATION_OPTIONS = ['Job Holder', 'Business', 'Others'];
const MARITAL_STATUS_OPTIONS = ['Married', 'Unmarried', 'Divorced', 'Widowed', 'Other'];
const BLOOD_GROUP_OPTIONS = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

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
  const [maritalStatus, setMaritalStatus] = useState(authUser?.marital_status ?? '');
  const [bloodGroup, setBloodGroup] = useState(authUser?.blood_group ?? '');

  // Address & Location State
  const [address, setAddress] = useState(authUser?.address ?? '');
  const [city, setCity] = useState(authUser?.city ?? '');
  const [state, setState] = useState(authUser?.state ?? '');
  const [postalCode, setPostalCode] = useState(String(authUser?.postal_code ?? ''));

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
      setOccupation(user.occupation ?? '');
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

  const uploadImageDirectly = async (uri: string) => {
    if (!userId) return;
    setIsUploadingPhoto(true);
    try {
      const token = await storageService.getItem<string>(AppConstants.storageKeys.token);
      const reqHeaders: Record<string, string> = {
        Accept: 'application/json',
      };
      if (token) {
        reqHeaders.Authorization = `Bearer ${token}`;
      }

      const uploadResult = await uploadAsync(
        ApiEndpoints.updateUserUrl,
        uri,
        {
          httpMethod: 'POST',
          uploadType: FileSystemUploadType.MULTIPART,
          fieldName: 'image',
          parameters: {
            id: userId,
          },
          headers: reqHeaders,
        }
      );

      if (uploadResult.status < 200 || uploadResult.status >= 300) {
        throw new Error(`Upload failed (${uploadResult.status})`);
      }

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
    if (!fName.trim()) {
      showToast('First name is required');
      return;
    }
    if (!userId) {
      showToast('Session expired. Please log in again.');
      return;
    }

    setIsSubmitting(true);
    try {
      let responseStatus = 200;

      const token = await storageService.getItem<string>(AppConstants.storageKeys.token);
      const reqHeaders: Record<string, string> = {
        Accept: 'application/json',
      };
      if (token) {
        reqHeaders.Authorization = `Bearer ${token}`;
      }

      if (selectedImageUri) {
        const uploadResult = await uploadAsync(
          ApiEndpoints.updateUserUrl,
          selectedImageUri,
          {
            httpMethod: 'POST',
            uploadType: FileSystemUploadType.MULTIPART,
            fieldName: 'image',
            parameters: {
              id: userId,
              f_name: fName.trim(),
              l_name: lName.trim(),
              email: email.trim(),
              phone: phone.trim(),
              gender,
              occupation,
              marital_status: maritalStatus,
              blood_group: bloodGroup,
              address: address.trim(),
              city: city.trim(),
              state: state.trim(),
              postal_code: postalCode.trim(),
              dob: dob.trim(),
            },
            headers: reqHeaders,
          }
        );
        responseStatus = uploadResult.status;
      } else {
        const formData = new FormData();
        formData.append('id', userId);
        formData.append('f_name', fName.trim());
        formData.append('l_name', lName.trim());
        formData.append('email', email.trim());
        formData.append('phone', phone.trim());
        formData.append('gender', gender);
        formData.append('occupation', occupation);
        formData.append('marital_status', maritalStatus);
        formData.append('blood_group', bloodGroup);
        formData.append('address', address.trim());
        formData.append('city', city.trim());
        formData.append('state', state.trim());
        formData.append('postal_code', postalCode.trim());
        formData.append('dob', dob.trim());

        const response = await fetch(ApiEndpoints.updateUserUrl, {
          method: 'POST',
          body: formData,
          headers: reqHeaders,
        });
        responseStatus = response.status;
      }

      if (responseStatus < 200 || responseStatus >= 300) {
        throw new Error(`Update failed (${responseStatus})`);
      }

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
        occupation,
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
      case 'occupation':
        return { title: 'Select Occupation', options: OCCUPATION_OPTIONS, current: occupation, onSelect: setOccupation };
      case 'marital_status':
        return { title: 'Select Marital Status', options: MARITAL_STATUS_OPTIONS, current: maritalStatus, onSelect: setMaritalStatus };
      case 'blood_group':
        return { title: 'Select Blood Group', options: BLOOD_GROUP_OPTIONS, current: bloodGroup, onSelect: setBloodGroup };
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
            { flexGrow: 1, paddingBottom: Math.max(insets.bottom + 40, 60) },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Profile Header Summary Card with Centered Avatar */}
          <View style={styles.headerCard}>
            {/* Trash Delete Account Button on Top-Right Corner */}
            <TouchableOpacity
              style={styles.trashDeleteBtn}
              activeOpacity={0.7}
              onPress={() => setIsDeleteModalVisible(true)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialIcons name="delete-outline" size={20} color={Colors.redColor} />
            </TouchableOpacity>

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
            {/* First Name & Last Name in Row */}
            <View style={styles.row}>
              <View style={styles.flexCol}>
                <Text style={styles.fieldLabel}>First Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={fName}
                  onChangeText={setFName}
                  placeholder="First Name"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.flexCol}>
                <Text style={styles.fieldLabel}>Last Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={lName}
                  onChangeText={setLName}
                  placeholder="Last Name"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            {/* Email Address */}
            <View style={styles.fullWidthField}>
              <Text style={styles.fieldLabel}>Email Address</Text>
              <TextInput
                style={styles.textInput}
                value={email}
                onChangeText={setEmail}
                placeholder="Email Address"
                placeholderTextColor="#94A3B8"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Mobile Number */}
            <View style={styles.fullWidthField}>
              <Text style={styles.fieldLabel}>Mobile Number</Text>
              <TextInput
                style={[styles.textInput, styles.readOnlyInput]}
                value={phone}
                onChangeText={setPhone}
                placeholder="Mobile Number"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
                editable={false}
              />
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
            </View>

            {/* Gender & Occupation Row */}
            <View style={styles.row}>
              <View style={styles.flexCol}>
                <Text style={styles.fieldLabel}>Gender</Text>
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

              <View style={styles.flexCol}>
                <Text style={styles.fieldLabel}>Occupation</Text>
                <TouchableOpacity
                  style={styles.selectorInput}
                  activeOpacity={0.8}
                  onPress={() => setActivePicker('occupation')}
                >
                  <Text style={[styles.selectorText, !occupation && styles.placeholderText]}>
                    {occupation || 'Select Occupation'}
                  </Text>
                  <MaterialIcons name="keyboard-arrow-down" size={20} color={Colors.secondaryFontColor} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Marital Status & Blood Group Row */}
            <View style={styles.row}>
              <View style={styles.flexCol}>
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

              <View style={styles.flexCol}>
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

            {/* City & State Row */}
            <View style={styles.row}>
              <View style={styles.flexCol}>
                <Text style={styles.fieldLabel}>City</Text>
                <TextInput
                  style={styles.textInput}
                  value={city}
                  onChangeText={setCity}
                  placeholder="City"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.flexCol}>
                <Text style={styles.fieldLabel}>State</Text>
                <TextInput
                  style={styles.textInput}
                  value={state}
                  onChangeText={setState}
                  placeholder="State"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            {/* Postal Code */}
            <View style={styles.fullWidthField}>
              <Text style={styles.fieldLabel}>Postal Code</Text>
              <TextInput
                style={styles.textInput}
                value={postalCode}
                onChangeText={setPostalCode}
                placeholder="Postal / Zip Code"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
              />
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
    </View>
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
    padding: 16,
  },
  headerCard: {
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    position: 'relative',
  },
  trashDeleteBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F1F5F9',
  },
  placeholderAvatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#FFF5EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 32,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryColor,
  },
  editBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.primaryColor,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  headerName: {
    fontSize: 16,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryFontColor,
    textAlign: 'center',
    marginBottom: 6,
  },
  headerMetaColumn: {
    alignItems: 'center',
    gap: 6,
    width: '100%',
  },
  headerDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  headerDetailText: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.secondaryFontColor,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryColor,
    letterSpacing: 0.5,
  },
  formCard: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  flexCol: {
    flex: 1,
  },
  fullWidthField: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primaryFontColor,
    marginBottom: 6,
  },
  textInput: {
    height: 44,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 13,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.primaryFontColor,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  readOnlyInput: {
    backgroundColor: '#F1F5F9',
    color: '#64748B',
  },
  selectorInput: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  selectorText: {
    fontSize: 13,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primaryFontColor,
  },
  placeholderText: {
    color: '#94A3B8',
    fontFamily: Typography.fontFamily.regular,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
    marginTop: 24,
    marginBottom: 16,
  },
  cancelBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  cancelBtnText: {
    fontSize: 13,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryFontColor,
  },
  updateBtn: {
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.primaryColor,
    shadowColor: Colors.primaryColor,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  updateBtnText: {
    fontSize: 13,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  pickerModalContent: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: Colors.white,
    borderRadius: 18,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  pickerModalTitle: {
    fontSize: 14,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryFontColor,
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  pickerOptionsList: {
    gap: 6,
  },
  pickerOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  pickerOptionSelected: {
    backgroundColor: Colors.primaryColor,
  },
  pickerOptionText: {
    fontSize: 13,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primaryFontColor,
  },
  pickerOptionTextSelected: {
    color: Colors.white,
    fontFamily: Typography.fontFamily.bold,
  },
  bottomModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  bottomModalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 12,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 14,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 15,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryFontColor,
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 12,
  },
  sheetOptionText: {
    fontSize: 14,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primaryFontColor,
  },
  confirmBox: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  confirmTitle: {
    fontSize: 16,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryFontColor,
    marginTop: 10,
    marginBottom: 6,
  },
  confirmMessage: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.secondaryFontColor,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  confirmCancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  confirmCancelText: {
    fontSize: 13,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryFontColor,
  },
  confirmDeleteBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.redColor,
    alignItems: 'center',
  },
  confirmDeleteText: {
    fontSize: 13,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
  },
});
