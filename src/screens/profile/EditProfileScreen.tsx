import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AppDatePickerModal,
  AppHeader,
  LoadingIndicator,
  SearchableSelectModal,
} from '../../components';
import { Colors } from '../../constants';
import { fs, hs, TYPOGRAPHY, ws } from '../../utils';
import {
  AddressLocationSection,
  DeleteAccountModal,
  ImagePickerSheet,
  OptionPickerModal,
  PersonalInfoSection,
  ProfileHeaderAvatar,
} from './components';
import { useEditProfile } from './useEditProfile';

export const EditProfileScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const {
    navigation,
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
    getPickerTitleAndOptions,
  } = useEditProfile();

  const handleBackPress = useCallback(() => navigation.goBack(), [navigation]);

  if (isProfileLoading && !user) {
    return (
      <View style={styles.container}>
        <AppHeader title="Patient Profile" onBackPress={handleBackPress} />
        <LoadingIndicator />
      </View>
    );
  }

  const pickerInfo = getPickerTitleAndOptions();

  const handleOpenImagePicker = useCallback(() => setIsImagePickerModalVisible(true), [setIsImagePickerModalVisible]);
  const handleCloseImagePicker = useCallback(() => setIsImagePickerModalVisible(false), [setIsImagePickerModalVisible]);
  const handleOpenDatePicker = useCallback(() => setIsDatePickerVisible(true), [setIsDatePickerVisible]);
  const handleCloseDatePicker = useCallback(() => setIsDatePickerVisible(false), [setIsDatePickerVisible]);
  const handleOpenGenderPicker = useCallback(() => setActivePicker('gender'), [setActivePicker]);
  const handleOpenOccupationPicker = useCallback(() => setActivePicker('occupation'), [setActivePicker]);
  const handleOpenMaritalStatusPicker = useCallback(() => setActivePicker('marital_status'), [setActivePicker]);
  const handleOpenBloodGroupPicker = useCallback(() => setActivePicker('blood_group'), [setActivePicker]);
  const handlePressState = useCallback(() => setAddressDropdown('state'), [setAddressDropdown]);
  const handleCloseDeleteModal = useCallback(() => setIsDeleteModalVisible(false), [setIsDeleteModalVisible]);
  const handleClosePicker = useCallback(() => setActivePicker(null), [setActivePicker]);

  const handlePressCity = useCallback(() => {
    if (!state.trim()) {
      setFieldErrors((prev) => ({ ...prev, state: 'Please select a State / UT first' }));
      return;
    }
    setAddressDropdown('city');
  }, [state, setFieldErrors, setAddressDropdown]);

  const handlePressPostalCode = useCallback(() => {
    if (!city.trim()) {
      setFieldErrors((prev) => ({ ...prev, city: 'Please select a City first' }));
      return;
    }
    setAddressDropdown('postal');
  }, [city, setFieldErrors, setAddressDropdown]);

  const fullName = useMemo(() => `${fName} ${lName}`.trim(), [fName, lName]);
  const addressErrors = useMemo(() => ({
    address: fieldErrors.address,
    city: fieldErrors.city,
    state: fieldErrors.state,
    postalCode: fieldErrors.postalCode,
  }), [fieldErrors.address, fieldErrors.city, fieldErrors.state, fieldErrors.postalCode]);

  return (
    <View style={styles.container}>
      <AppHeader title="Patient Profile" onBackPress={handleBackPress} />

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
          <ProfileHeaderAvatar
            selectedImageUri={selectedImageUri}
            remoteImage={remoteImage}
            isUploadingPhoto={isUploadingPhoto}
            onOpenImagePicker={handleOpenImagePicker}
            fullName={fullName}
            email={email}
          />

          {/* Section 1: PERSONAL DETAILS */}
          <PersonalInfoSection
            fName={fName}
            onChangeFName={(t) => {
              setFName(t);
              if (fieldErrors.fName) setFieldErrors((prev) => ({ ...prev, fName: '' }));
            }}
            lName={lName}
            onChangeLName={(t) => {
              setLName(t);
              if (fieldErrors.lName) setFieldErrors((prev) => ({ ...prev, lName: '' }));
            }}
            email={email}
            onChangeEmail={(t) => {
              setEmail(t);
              if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: '' }));
            }}
            phone={phone}
            onChangePhone={(t) => {
              setPhone(t);
              if (fieldErrors.phone) setFieldErrors((prev) => ({ ...prev, phone: '' }));
            }}
            dob={dob}
            onOpenDatePicker={handleOpenDatePicker}
            gender={gender}
            onOpenGenderPicker={handleOpenGenderPicker}
            occupation={occupation}
            onOpenOccupationPicker={handleOpenOccupationPicker}
            maritalStatus={maritalStatus}
            onOpenMaritalStatusPicker={handleOpenMaritalStatusPicker}
            bloodGroup={bloodGroup}
            onOpenBloodGroupPicker={handleOpenBloodGroupPicker}
            errors={fieldErrors}
          />

          {/* Section 2: ADDRESS & LOCATION */}
          <AddressLocationSection
            address={address}
            onChangeAddress={(t) => {
              setAddress(t);
              if (fieldErrors.address) setFieldErrors((prev) => ({ ...prev, address: '' }));
            }}
            city={city}
            onChangeCity={(t) => {
              setCity(t);
              if (fieldErrors.city) setFieldErrors((prev) => ({ ...prev, city: '' }));
            }}
            state={state}
            onChangeState={(t) => {
              setState(t);
              if (fieldErrors.state) setFieldErrors((prev) => ({ ...prev, state: '' }));
            }}
            postalCode={postalCode}
            onChangePostalCode={(t) => {
              setPostalCode(t.replace(/\D/g, ''));
              if (fieldErrors.postalCode) setFieldErrors((prev) => ({ ...prev, postalCode: '' }));
            }}
            onPressState={handlePressState}
            onPressCity={handlePressCity}
            onPressPostalCode={handlePressPostalCode}
            errors={addressErrors}
          />

          {/* General Error Banner */}
          {!!fieldErrors.general && (
            <View style={styles.generalErrorBox}>
              <MaterialIcons name="error-outline" size={16} color={Colors.redColor} />
              <Text style={styles.generalErrorText}>{fieldErrors.general}</Text>
            </View>
          )}

          {/* Action Buttons Row */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.cancelBtn}
              activeOpacity={0.8}
              onPress={handleBackPress}
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

      {/* Dynamic Dropdown Selection Modal */}
      <OptionPickerModal
        visible={!!activePicker}
        title={pickerInfo.title}
        options={pickerInfo.options}
        selectedValue={pickerInfo.current}
        onSelect={(opt) => {
          pickerInfo.onSelect(opt);
          handleClosePicker();
        }}
        onClose={handleClosePicker}
      />

      {/* Date Picker Modal */}
      <AppDatePickerModal
        visible={isDatePickerVisible}
        onClose={handleCloseDatePicker}
        onSelectDate={(selected) => {
          setDob(selected);
          setFieldErrors((prev) => ({ ...prev, dob: '' }));
          handleCloseDatePicker();
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
        selectedValue={state}
        isLoading={isStatesLoading}
        emptyMessage="No states available"
        pageSize={60}
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
        selectedValue={city}
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
      <ImagePickerSheet
        visible={isImagePickerModalVisible}
        onClose={handleCloseImagePicker}
        onPickFromGallery={handlePickFromGallery}
        onTakePhoto={handleTakePhoto}
      />

      {/* Delete Account Confirmation Modal */}
      <DeleteAccountModal
        visible={isDeleteModalVisible}
        onClose={handleCloseDeleteModal}
        onConfirmDelete={handleDeleteAccount}
        isDeleting={isDeleting}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.slate_F8FAFC,
  },
  flexOne: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: ws(16),
    paddingTop: hs(12),
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: ws(12),
    marginTop: hs(8),
    marginBottom: hs(16),
  },
  generalErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.red_FFF5F5,
    borderRadius: fs(8),
    borderWidth: 1,
    borderColor: Colors.redColor,
    paddingHorizontal: ws(12),
    paddingVertical: hs(8),
    marginTop: hs(4),
    marginBottom: hs(10),
    gap: ws(6),
  },
  generalErrorText: {
    flex: 1,
    fontSize: fs(12),
    ...TYPOGRAPHY.medium,
    color: Colors.redColor,
  },
  cancelBtn: {
    flex: 1,
    height: hs(46),
    borderRadius: fs(12),
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: fs(14),
    ...TYPOGRAPHY.medium,
    color: Colors.slate_64748B,
  },
  updateBtn: {
    flex: 1.5,
    height: hs(46),
    borderRadius: fs(12),
    backgroundColor: Colors.primaryColor,
    justifyContent: 'center',
    alignItems: 'center',
  },
  updateBtnText: {
    fontSize: fs(14),
    ...TYPOGRAPHY.bold,
    color: Colors.white,
  },
  btnDisabled: {
    opacity: 0.65,
  },
});
