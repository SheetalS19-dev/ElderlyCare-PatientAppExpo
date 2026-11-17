import { FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  AppHeader,
  CitySelectModal,
  DepartmentSelectModal,
  DoctorCard,
  EmptyState,
  LoadingIndicator,
  SearchBox,
} from '../../components';
import { Colors } from '../../constants';
import {
  fs,
  getImageUrl,
  hs,
  ws,
} from '../../utils';
import { useSearch } from './useSearch';

export const SearchScreen: React.FC = () => {
  const {
    navigation,
    insets,
    search,
    setSearch,
    activeTab,
    setActiveTab,
    selectedDeptId,
    selectedDeptTitle,
    selectedCity,
    setSelectedCity,
    deviceLocationCity,
    isDetectingLocation,
    isUsingCurrentLocation,
    isCityModalVisible,
    setIsCityModalVisible,
    isDeptModalVisible,
    setIsDeptModalVisible,
    departments,
    cities,
    filteredDoctors,
    isDoctorsLoading,
    filteredClinics,
    isClinicsLoading,
    handleSelectDepartment,
    handleSelectCity,
    hasCityFilter,
    hasDeptFilter,
    hasActiveFilters,
    handleResetFilters,
    handleDoctorBookPress,
  } = useSearch();

  return (
    <View style={styles.container}>
      <AppHeader title="Search" onBackPress={() => navigation.goBack()} />

      <View style={styles.content}>
        {/* 1. Search Box at top */}
        <SearchBox
          value={search}
          onChangeText={setSearch}
          placeholder={
            activeTab === 'doctors'
              ? 'Search doctors by name...'
              : 'Search clinics by name, address...'
          }
          containerStyle={styles.searchBoxOverride}
        />

        {/* 2. Compact Segmented Tabs: Doctors & Clinics */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'doctors' && styles.activeTab]}
            onPress={() => setActiveTab('doctors')}
            activeOpacity={0.8}
          >
            <FontAwesome5
              name="user-md"
              size={fs(13)}
              color={activeTab === 'doctors' ? Colors.primaryColor : Colors.secondaryFontColor}
              style={{ marginRight: ws(6) }}
            />
            <Text style={[styles.tabText, activeTab === 'doctors' && styles.activeTabText]}>
              Doctors ({filteredDoctors.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'clinics' && styles.activeTab]}
            onPress={() => setActiveTab('clinics')}
            activeOpacity={0.8}
          >
            <FontAwesome5
              name="hospital"
              size={fs(13)}
              color={activeTab === 'clinics' ? Colors.primaryColor : Colors.secondaryFontColor}
              style={{ marginRight: ws(6) }}
            />
            <Text style={[styles.tabText, activeTab === 'clinics' && styles.activeTabText]}>
              Clinics ({filteredClinics.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* 3. Streamlined Filter Row (City & Department side-by-side) */}
        <View style={styles.filterRow}>
          {/* City Filter Chip */}
          <TouchableOpacity
            style={[styles.filterChip, hasCityFilter && styles.filterChipActive]}
            activeOpacity={0.7}
            onPress={() => setIsCityModalVisible(true)}
          >
            <Ionicons
              name="location-sharp"
              size={fs(14)}
              color={hasCityFilter ? Colors.primaryColor : Colors.inkSoft}
            />
            <Text
              style={[styles.filterChipText, hasCityFilter && styles.filterChipTextActive]}
              numberOfLines={1}
            >
              {selectedCity.title ? selectedCity.title.split(',')[0].trim() : 'All Cities'}
            </Text>
            {hasCityFilter ? (
              <TouchableOpacity
                onPress={() => setSelectedCity({ id: '', title: '' })}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={fs(15)} color={Colors.primaryColor} />
              </TouchableOpacity>
            ) : (
              <Ionicons name="chevron-down" size={fs(13)} color={Colors.slate_94A3B8} />
            )}
          </TouchableOpacity>

          {/* Department Filter Chip (Only in Doctors Tab) */}
          {activeTab === 'doctors' && (
            <TouchableOpacity
              style={[styles.filterChip, hasDeptFilter && styles.filterChipActive]}
              activeOpacity={0.7}
              onPress={() => setIsDeptModalVisible(true)}
            >
              <MaterialIcons
                name="medical-services"
                size={fs(14)}
                color={hasDeptFilter ? Colors.primaryColor : Colors.inkSoft}
              />
              <Text
                style={[styles.filterChipText, hasDeptFilter && styles.filterChipTextActive]}
                numberOfLines={1}
              >
                {selectedDeptTitle || 'Select Department'}
              </Text>
              {hasDeptFilter ? (
                <TouchableOpacity
                  onPress={() => handleSelectDepartment(undefined)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close-circle" size={fs(15)} color={Colors.primaryColor} />
                </TouchableOpacity>
              ) : (
                <Ionicons name="chevron-down" size={fs(13)} color={Colors.slate_94A3B8} />
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* 4. Results Summary & Clear Action */}
        <View style={styles.resultsHeaderRow}>
          <Text style={styles.resultsCountText}>
            {activeTab === 'doctors'
              ? `${filteredDoctors.length} ${filteredDoctors.length === 1 ? 'doctor' : 'doctors'} found`
              : `${filteredClinics.length} ${filteredClinics.length === 1 ? 'clinic' : 'clinics'} found`}
          </Text>
          {hasActiveFilters && (
            <TouchableOpacity
              onPress={handleResetFilters}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Text style={styles.resetFiltersText}>Reset</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 5. Results List */}
        {activeTab === 'doctors' ? (
          isDoctorsLoading && filteredDoctors.length === 0 ? (
            <LoadingIndicator />
          ) : (
            <FlatList
              data={filteredDoctors}
              keyExtractor={(item, index) => `doc-${item.user_id ?? item.id ?? index}`}
              contentContainerStyle={[styles.listContent, { paddingBottom: Math.max(insets.bottom + hs(80), 110) }]}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <EmptyState message="No doctors found matching your search criteria" />
              }
              renderItem={({ item }) => (
                <DoctorCard
                  doctor={item}
                  variant="list"
                  onPress={() =>
                    navigation.navigate('DoctorDetails', {
                      doctId: String(item.user_id || item.id),
                    })
                  }
                  onBookPress={() => handleDoctorBookPress(item)}
                />
              )}
            />
          )
        ) : (
          /* Tab 2: Clinics */
          isClinicsLoading && filteredClinics.length === 0 ? (
            <LoadingIndicator />
          ) : (
            <FlatList
              data={filteredClinics}
              keyExtractor={(item, index) => `clinic-${item.id ?? index}`}
              contentContainerStyle={[styles.listContent, { paddingBottom: Math.max(insets.bottom + hs(80), 110) }]}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <EmptyState message="No clinics found matching your search criteria" />
              }
              renderItem={({ item }) => {
                const clinicImg = item.image ? getImageUrl(item.image) : '';
                return (
                  <TouchableOpacity
                    style={styles.clinicCard}
                    activeOpacity={0.8}
                    onPress={() =>
                      navigation.navigate('Clinic', { clinicId: String(item.id) })
                    }
                  >
                    {clinicImg ? (
                      <Image
                        source={{ uri: clinicImg }}
                        style={styles.clinicImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.placeholderImage}>
                        <FontAwesome5 name="hospital" size={26} color={Colors.primaryColor} />
                      </View>
                    )}

                    <View style={styles.clinicDetails}>
                      <Text style={styles.clinicTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <Text style={styles.clinicAddress} numberOfLines={2}>
                        {item.address}
                      </Text>
                      {item.city_title ? (
                        <View style={styles.cityBadge}>
                          <Ionicons
                            name="location-outline"
                            size={12}
                            color={Colors.primaryColor}
                          />
                          <Text style={styles.cityBadgeText}>{item.city_title}</Text>
                        </View>
                      ) : null}
                    </View>

                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={Colors.secondaryFontColor}
                    />
                  </TouchableOpacity>
                );
              }}
            />
          )
        )}
      </View>

      {/* City Picker Modal */}
      <CitySelectModal
        visible={isCityModalVisible}
        onClose={() => setIsCityModalVisible(false)}
        cities={cities}
        selectedCityId={isUsingCurrentLocation && !selectedCity.id ? 'CURRENT' : (selectedCity.id || 'ALL')}
        onSelectCity={handleSelectCity}
        currentCityName={deviceLocationCity ?? undefined}
        isDetectingLocation={isDetectingLocation}
        activeLocationLabel={selectedCity.title || 'All Cities'}
      />

      {/* Department Picker Modal */}
      <DepartmentSelectModal
        visible={isDeptModalVisible}
        onClose={() => setIsDeptModalVisible(false)}
        departments={departments}
        selectedDeptId={selectedDeptId}
        selectedDeptTitle={selectedDeptTitle}
        onSelectDepartment={handleSelectDepartment}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgColor },
  content: { flex: 1, paddingHorizontal: ws(16), paddingTop: hs(14) },
  searchBoxOverride: {
    marginBottom: hs(8),
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.aqua,
    borderRadius: fs(14),
    padding: ws(4),
    marginBottom: hs(10),
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: hs(8),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: fs(8),
  },
  activeTab: {
    backgroundColor: Colors.white,
    shadowColor: Colors.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  tabText: {
    fontSize: fs(12),
    fontFamily: 'Inter-Medium',
    color: Colors.secondaryFontColor,
  },
  activeTabText: {
    color: Colors.primaryColor,
    fontFamily: 'Inter-SemiBold',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(8),
    marginBottom: hs(10),
  },
  filterChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: ws(10),
    paddingVertical: hs(7),
    borderRadius: fs(10),
    borderWidth: 1,
    borderColor: Colors.border,
    gap: ws(4),
  },
  filterChipActive: {
    borderColor: Colors.primaryColor,
    backgroundColor: Colors.aquaSoft,
  },
  filterChipText: {
    flex: 1,
    fontSize: fs(11),
    fontFamily: 'Inter-Medium',
    color: Colors.primaryFontColor,
  },
  filterChipTextActive: {
    color: Colors.primaryColor,
    fontFamily: 'Inter-SemiBold',
  },
  resultsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hs(8),
    paddingHorizontal: ws(2),
  },
  resultsCountText: {
    fontSize: fs(11),
    fontFamily: 'Inter-Medium',
    color: Colors.secondaryFontColor,
  },
  resetFiltersText: {
    fontSize: fs(11),
    fontFamily: 'Inter-SemiBold',
    color: Colors.primaryColor,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: hs(24),
  },
  clinicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: fs(16),
    padding: ws(12),
    marginBottom: hs(10),
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  clinicImage: {
    width: ws(56),
    height: ws(56),
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: Colors.aquaSoft,
    marginRight: ws(12),
  },
  placeholderImage: {
    width: ws(56),
    height: ws(56),
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: Colors.aquaSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ws(12),
  },
  clinicDetails: {
    flex: 1,
    marginRight: ws(8),
  },
  clinicTitle: {
    fontSize: fs(14),
    fontFamily: 'Inter-SemiBold',
    color: Colors.primaryFontColor,
    marginBottom: hs(2),
  },
  clinicAddress: {
    fontSize: fs(11),
    fontFamily: 'Inter-Regular',
    color: Colors.secondaryFontColor,
    marginBottom: hs(4),
  },
  cityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(3),
  },
  cityBadgeText: {
    fontSize: fs(10),
    fontFamily: 'Inter-Medium',
    color: Colors.primaryColor,
  },
});
