import React from 'react';
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
          <ProfileHeaderAvatar
            selectedImageUri={selectedImageUri}
            remoteImage={remoteImage}
            isUploadingPhoto={isUploadingPhoto}
            onOpenImagePicker={() => setIsImagePickerModalVisible(true)}
            fullName={`${fName} ${lName}`.trim()}
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
            onOpenDatePicker={() => setIsDatePickerVisible(true)}
            gender={gender}
            onOpenGenderPicker={() => setActivePicker('gender')}
            occupation={occupation}
            onOpenOccupationPicker={() => setActivePicker('occupation')}
            maritalStatus={maritalStatus}
            onOpenMaritalStatusPicker={() => setActivePicker('marital_status')}
            bloodGroup={bloodGroup}
            onOpenBloodGroupPicker={() => setActivePicker('blood_group')}
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
            onPressState={() => setAddressDropdown('state')}
            onPressCity={() => {
              if (!state.trim()) {
                setFieldErrors((prev) => ({ ...prev, state: 'Please select a State / UT first' }));
                return;
              }
              setAddressDropdown('city');
            }}
            onPressPostalCode={() => {
              if (!city.trim()) {
                setFieldErrors((prev) => ({ ...prev, city: 'Please select a City first' }));
                return;
              }
              setAddressDropdown('postal');
            }}
            errors={{
              address: fieldErrors.address,
              city: fieldErrors.city,
              state: fieldErrors.state,
              postalCode: fieldErrors.postalCode,
            }}
          />

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

      {/* Dynamic Dropdown Selection Modal */}
      <OptionPickerModal
        visible={!!activePicker}
        title={pickerInfo.title}
        options={pickerInfo.options}
        selectedValue={pickerInfo.current}
        onSelect={(opt) => {
          pickerInfo.onSelect(opt);
          setActivePicker(null);
        }}
        onClose={() => setActivePicker(null)}
      />

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
        selectedValue={state}
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
        onClose={() => setIsImagePickerModalVisible(false)}
        onPickFromGallery={handlePickFromGallery}
        onTakePhoto={handleTakePhoto}
      />

      {/* Delete Account Confirmation Modal */}
      <DeleteAccountModal
        visible={isDeleteModalVisible}
        onClose={() => setIsDeleteModalVisible(false)}
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
