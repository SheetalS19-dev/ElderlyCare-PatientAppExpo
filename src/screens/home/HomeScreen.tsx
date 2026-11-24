import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useCallback } from 'react';
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AppDatePickerModal,
  AppTimePickerModal,
  BottomTabBar,
  CitySelectModal,
  LoadingIndicator
} from '../../components';
import { Colors } from '../../constants';
import type { DoctorModel } from '../../redux/apis/doctorApi';
import { fs, hs, TYPOGRAPHY, ws } from '../../utils';
import {
  ClinicFeatureCard,
  DoctorSpotlightCard,
  EditVitalBottomSheet,
  EmergencySupportCard,
  HomeBannerSlider,
  HomeHeader,
  HomePatientDashboard
} from './components';
import { useHome } from './useHome';

export const HomeScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const {
    navigation,
    isAuthenticated,
    userImage,
    greetingName,
    hasUnreadNotifications,
    search,
    setSearch,
    selectedCity,
    activeCityName,
    activeCityId,
    hasCityFilter,
    showLocationModal,
    setShowLocationModal,
    deviceLocationCity,
    isDetectingLocation,
    isUsingCurrentLocation,
    citiesList,
    handleCitySelect,
    selectedMemberId,
    setSelectedMemberId,
    selectedMemberDisplayName,
    selfFullName,
    filteredFamilyMembersList,
    showMemberDropdown,
    setShowMemberDropdown,
    activePatientInfo,
    genderIconName,
    rawBpVitals,
    rawSugarVitals,
    rawWeightVitals,
    rawTempVitals,
    rawSpo2Vitals,
    getLatestVitalValue,
    activeFamilyId,
    handleDeleteVitalRecord,
    latestAppointments,
    latestFiles,
    downloadingFileId,
    setDownloadingFileId,
    bannerList,
    activeBannerIndex,
    handleBannerScroll,
    deptList,
    deptLoading,
    deptError,
    handleDepartmentPress,
    doctorList,
    doctorsLoading,
    handleDoctorClick,
    clinicList,
    clinicsLoading,
    // Edit Vital Modal
    editingVitalType,
    showEditModal,
    setShowEditModal,
    selectedDate,
    setSelectedDate,
    selectedTime,
    setSelectedTime,
    showDatePicker,
    setShowDatePicker,
    showTimePicker,
    setShowTimePicker,
    systolic,
    setSystolic,
    diastolic,
    setDiastolic,
    value,
    setValue,
    sugarRandom,
    setSugarRandom,
    openEditModal,
    handleUpdateVitalSubmit,
    isUpdating,
    editVitalErrors,
  } = useHome();

  const handleToggleMemberDropdown = useCallback(() => setShowMemberDropdown((prev) => !prev), [setShowMemberDropdown]);
  const handleSelectMember = useCallback((id: string) => {
    setSelectedMemberId(id);
    setShowMemberDropdown(false);
  }, [setSelectedMemberId, setShowMemberDropdown]);
  const handleManageMembers = useCallback(() => navigation.navigate('FamilyMemberList'), [navigation]);
  const handleBookAppointment = useCallback(() => navigation.navigate('DoctorList', {}), [navigation]);
  const handleViewAllVitals = useCallback(() => navigation.navigate('Vitals'), [navigation]);
  const handleNavigateVitalDetails = useCallback((vitalName: string) => {
    navigation.navigate('VitalDetails', { vitalName, familyMemberId: activeFamilyId });
  }, [navigation, activeFamilyId]);
  const handleViewAllAppointments = useCallback(() => navigation.navigate('MyBookings'), [navigation]);
  const handleViewAllFiles = useCallback(() => navigation.navigate('PatientFile'), [navigation]);

  const doctorKeyExtractor = useCallback((item: DoctorModel, index: number) => `doc-${item.user_id ?? item.id ?? index}`, []);
  const renderDoctorSpotlight = useCallback(({ item }: { item: DoctorModel }) => (
    <DoctorSpotlightCard doctor={item} onBook={() => handleDoctorClick(item)} />
  ), [handleDoctorClick]);

  const clinicKeyExtractor = useCallback((clinic: any, idx: number) => `clinic-${clinic.id ?? idx}`, []);
  const handleClinicPress = useCallback((item: any) => {
    navigation.navigate('Clinic', { clinicId: String(item.id) });
  }, [navigation]);
  const renderClinicFeature = useCallback(({ item }: { item: any }) => (
    <ClinicFeatureCard clinic={item} onPress={() => handleClinicPress(item)} />
  ), [handleClinicPress]);

  const listSeparator = useCallback(() => <View style={{ width: ws(10) }} />, []);

  return (
    <View style={styles.screen}>
      {/* 1. Top Header with User Greeting and Search */}
      <HomeHeader
        userImage={userImage}
        greetingName={greetingName}
        hasUnreadNotifications={hasUnreadNotifications}
        search={search}
        onChangeSearch={setSearch}
        onSubmitSearch={() => {
          if (search.trim()) {
            navigation.navigate('Search', { searchQuery: search });
          }
        }}
        onOpenLocationModal={() => setShowLocationModal(true)}
        hasCityFilter={hasCityFilter}
        activeCityName={activeCityName}
        isDetectingLocation={isDetectingLocation}
        onNavigateNotifications={() => navigation.navigate('Notification')}
        onNavigateProfile={() => navigation.navigate(isAuthenticated ? 'EditProfile' : 'Login')}
        topInset={insets.top}
      />

      {/* 2. Main Scrollable Content */}
      <ScrollView
        style={styles.scrollArea}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + 130, 160) },
        ]}
      >
        {/* Section 1: Patient Dashboard Section (when authenticated) */}
        {isAuthenticated && (
          <HomePatientDashboard
            activePatientInfo={activePatientInfo}
            genderIconName={genderIconName}
            selectedMemberId={selectedMemberId}
            selectedMemberDisplayName={selectedMemberDisplayName}
            selfFullName={selfFullName}
            filteredFamilyMembersList={filteredFamilyMembersList}
            showMemberDropdown={showMemberDropdown}
            onToggleMemberDropdown={handleToggleMemberDropdown}
            onSelectMember={handleSelectMember}
            onManageMembers={handleManageMembers}
            onBookAppointment={handleBookAppointment}
            onViewAllVitals={handleViewAllVitals}
            rawBpVitals={rawBpVitals}
            rawSugarVitals={rawSugarVitals}
            rawWeightVitals={rawWeightVitals}
            rawTempVitals={rawTempVitals}
            rawSpo2Vitals={rawSpo2Vitals}
            getLatestVitalValue={getLatestVitalValue}
            activeFamilyId={activeFamilyId}
            onNavigateVitalDetails={handleNavigateVitalDetails}
            onDeleteVitalRecord={handleDeleteVitalRecord}
            onEditVitalRecord={openEditModal}
            latestAppointments={latestAppointments}
            onViewAllAppointments={handleViewAllAppointments}
            latestFiles={latestFiles}
            onViewAllFiles={handleViewAllFiles}
            downloadingFileId={downloadingFileId}
            setDownloadingFileId={setDownloadingFileId}
          />
        )}

        {/* Section 2: Promotional Banners Slider */}
        <HomeBannerSlider
          bannerList={bannerList}
          activeBannerIndex={activeBannerIndex}
          onScroll={handleBannerScroll}
        />

        {/* Section 3: Medical Specialties */}
        {/* <View style={styles.sectionHeader}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.sectionHeading} adjustsFontSizeToFit numberOfLines={2}>
              Medical Specialties
            </Text>
            <Text style={styles.sectionSubheading} numberOfLines={1}>
              Explore by specialization
            </Text>
          </View>
          <TouchableOpacity
            style={styles.viewAllBtn}
            onPress={() => navigation.navigate('DoctorList', {})}
            activeOpacity={0.7}
          >
            <Text style={styles.viewAllText}>View All</Text>
            <MaterialIcons name="arrow-forward-ios" size={12} color={Colors.primaryColor} />
          </TouchableOpacity>
        </View>

        {deptLoading ? (
          <LoadingIndicator />
        ) : deptError ? (
          <ErrorState message="Could not load medical departments" />
        ) : (
          <FlatList
            data={deptList}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item: DepartmentModel, index: number) => `dept-${item.id ?? index}`}
            contentContainerStyle={styles.deptListContainer}
            renderItem={({ item }: { item: DepartmentModel }) => (
              <DepartmentCard item={item} onPress={() => handleDepartmentPress(item)} />
            )}
          />
        )} */}

        {/* Section 4: Top Verified Doctors */}
        <View style={styles.sectionHeader}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.sectionHeading} adjustsFontSizeToFit numberOfLines={2}>
              {activeCityName === 'All' ? 'Top Doctors' : `Top Doctors in ${activeCityName}`}
            </Text>
            <Text style={styles.sectionSubheading} numberOfLines={1}>
              Experienced & verified physicians
            </Text>
          </View>
          {doctorList.length > 0 && (
            <TouchableOpacity
              style={styles.viewAllBtn}
              onPress={() => navigation.navigate('DoctorList', {})}
              activeOpacity={0.7}
            >
              <Text style={styles.viewAllText}>View All</Text>
              <MaterialIcons name="arrow-forward-ios" size={12} color={Colors.primaryColor} />
            </TouchableOpacity>
          )}
        </View>

        {doctorsLoading ? (
          <LoadingIndicator />
        ) : doctorList.length === 0 ? (
          <View style={styles.emptyCardBox}>
            <MaterialIcons name="person-search" size={36} color={Colors.secondaryFontColor} />
            <Text style={styles.emptyCardTitle}>
              {activeCityName === 'All' ? 'No Doctors Found' : `No Doctors Found in ${activeCityName}`}
            </Text>
            <Text style={styles.emptyCardSubtitle}>
              Try switching your location or exploring all specialists.
            </Text>
            <TouchableOpacity
              style={styles.emptyActionBtn}
              onPress={() => setShowLocationModal(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.emptyActionText}>Change Location</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={doctorList}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={doctorKeyExtractor}
            contentContainerStyle={styles.doctorsListContainer}
            ItemSeparatorComponent={listSeparator}
            renderItem={renderDoctorSpotlight}
          />
        )}

        {/* Section 5: Featured Clinics */}
        <View style={styles.sectionHeader}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.sectionHeading} adjustsFontSizeToFit numberOfLines={2}>
              Featured Clinics
            </Text>
            <Text style={styles.sectionSubheading} numberOfLines={1}>
              {activeCityName === 'All'
                ? 'Trusted medical centers'
                : `Trusted medical centers in ${activeCityName}`}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.viewAllBtn}
            onPress={() =>
              navigation.navigate('ClinicList', {
                cityId: activeCityId || '',
                cityTitle: activeCityName !== 'All' ? activeCityName : '',
              } as any)
            }
            activeOpacity={0.7}
          >
            <Text style={styles.viewAllText}>View All</Text>
            <MaterialIcons name="arrow-forward-ios" size={12} color={Colors.primaryColor} />
          </TouchableOpacity>
        </View>

        {clinicsLoading ? (
          <LoadingIndicator />
        ) : clinicList.length === 0 ? (
          <View style={styles.emptyCardBox}>
            <MaterialIcons name="local-hospital" size={36} color={Colors.secondaryFontColor} />
            <Text style={styles.emptyCardTitle}>
              {activeCityName === 'All' ? 'No Clinics Listed' : `No Clinics Listed in ${activeCityName}`}
            </Text>
            <Text style={styles.emptyCardSubtitle}>Check nearby cities or explore all clinics.</Text>
            <TouchableOpacity
              style={[
                styles.viewAllBtn,
                {
                  marginTop: hs(10),
                  alignSelf: 'center',
                  backgroundColor: Colors.primaryColor,
                  paddingHorizontal: ws(16),
                  paddingVertical: hs(8),
                  borderRadius: 8,
                },
              ]}
              onPress={() =>
                navigation.navigate('ClinicList', {
                  cityId: '',
                  cityTitle: '',
                } as any)
              }
              activeOpacity={0.8}
            >
              <Text style={[styles.viewAllText, { color: Colors.white }]}>Explore All Clinics</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={clinicList}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={clinicKeyExtractor}
            contentContainerStyle={styles.clinicsListContainer}
            ItemSeparatorComponent={listSeparator}
            renderItem={renderClinicFeature}
          />
        )}

        {/* Section 6: Emergency & 24/7 Care Hotline Banner */}
        <EmergencySupportCard onContact={() => navigation.navigate('ContactUs')} />

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Floating Bottom Tab Bar */}
      <BottomTabBar />

      {/* Location Selection Bottom Sheet Modal */}
      <CitySelectModal
        visible={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        cities={citiesList}
        selectedCityId={
          isUsingCurrentLocation && !selectedCity?.id
            ? 'CURRENT'
            : selectedCity?.id
              ? String(selectedCity.id)
              : 'ALL'
        }
        onSelectCity={handleCitySelect}
        currentCityName={deviceLocationCity ?? undefined}
        isDetectingLocation={isDetectingLocation}
        activeLocationLabel={activeCityName}
      />

      {/* Update Vital Bottom Sheet Modal */}
      <EditVitalBottomSheet
        visible={showEditModal}
        vitalType={editingVitalType}
        onClose={() => setShowEditModal(false)}
        selectedDate={selectedDate}
        onOpenDatePicker={() => setShowDatePicker(true)}
        selectedTime={selectedTime}
        onOpenTimePicker={() => setShowTimePicker(true)}
        systolic={systolic}
        onChangeSystolic={setSystolic}
        diastolic={diastolic}
        onChangeDiastolic={setDiastolic}
        value={value}
        onChangeValue={setValue}
        sugarRandom={sugarRandom}
        onChangeSugarRandom={setSugarRandom}
        onSubmit={handleUpdateVitalSubmit}
        isUpdating={isUpdating}
        errors={editVitalErrors}
      />

      {/* Date & Time Picker Modals */}
      <AppDatePickerModal
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        initialDate={selectedDate}
        maxDate={new Date()}
        onSelectDate={(dateStr) => setSelectedDate(dateStr)}
        title="Select Date"
      />

      <AppTimePickerModal
        visible={showTimePicker}
        onClose={() => setShowTimePicker(false)}
        initialTime={selectedTime}
        onSelectTime={(timeStr) => setSelectedTime(timeStr)}
        title="Select Time"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.bgColor,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: hs(4),
  },

  /* Section Headers */
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: ws(16),
    marginTop: hs(10),
    marginBottom: hs(10),
    gap: ws(8),
  },
  sectionHeading: {
    fontSize: fs(15),
    ...TYPOGRAPHY.bold,
    color: Colors.ink,
  },
  sectionSubheading: {
    fontSize: fs(11),
    ...TYPOGRAPHY.regular,
    color: Colors.secondaryFontColor,
    marginTop: hs(2),
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(4),
    paddingVertical: hs(4),
    paddingHorizontal: ws(2),
    flexShrink: 0,
  },
  viewAllText: {
    fontSize: fs(12),
    ...TYPOGRAPHY.semiBold,
    color: Colors.navy,
  },

  /* Department List */
  deptListContainer: {
    paddingHorizontal: ws(16),
    paddingBottom: hs(4),
  },

  /* Doctors List */
  doctorsListContainer: {
    paddingHorizontal: ws(16),
    paddingVertical: hs(6),
  },

  /* Empty States */
  emptyCardBox: {
    marginHorizontal: ws(16),
    backgroundColor: Colors.white,
    borderRadius: fs(16),
    padding: ws(20),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyCardTitle: {
    fontSize: fs(13),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
    marginTop: hs(8),
  },
  emptyCardSubtitle: {
    fontSize: fs(11),
    ...TYPOGRAPHY.regular,
    color: Colors.secondaryFontColor,
    textAlign: 'center',
    marginTop: hs(4),
  },
  emptyActionBtn: {
    marginTop: hs(10),
    backgroundColor: Colors.aquaSoft,
    paddingHorizontal: ws(14),
    paddingVertical: hs(6),
    borderRadius: fs(8),
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.2)',
  },
  emptyActionText: {
    fontSize: fs(11),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryColor,
  },

  /* Clinics Horizontal Row */
  clinicsListContainer: {
    paddingHorizontal: ws(16),
    paddingVertical: hs(6),
  },
});
