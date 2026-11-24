import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useCallback } from 'react';
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
  EmptyState,
  ErrorState,
  LoadingIndicator,
  SearchBox,
} from '../../components';
import { Colors } from '../../constants';
import {
  fs,
  getImageUrl,
  hs,
  TYPOGRAPHY,
  ws,
} from '../../utils';
import { useClinicList } from './useClinicList';

export const ClinicListScreen: React.FC = () => {
  const {
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
    handleClearCity,
    handleCityModalSelect,
  } = useClinicList();

  const handleBackPress = useCallback(() => navigation.goBack(), [navigation]);

  const keyExtractor = useCallback((item: any, index: number) => `clinic-${item.id ?? index}`, []);

  const handlePressClinic = useCallback(
    (clinicId: string | number | undefined) => {
      navigation.navigate('Clinic', { clinicId: String(clinicId) });
    },
    [navigation]
  );

  const renderClinicItem = useCallback(
    ({ item }: { item: any }) => (
      <TouchableOpacity
        style={styles.clinicCard}
        activeOpacity={0.85}
        onPress={() => handlePressClinic(item.id)}
      >
        {item.image ? (
          <Image
            source={{ uri: getImageUrl(item.image) }}
            style={styles.clinicImage}
          />
        ) : (
          <View style={styles.placeholderImage}>
            <FontAwesome5 name="hospital-alt" size={fs(26)} color={Colors.primaryColor} />
          </View>
        )}

        <View style={styles.clinicDetails}>
          <View style={styles.badgeRow}>
            <View style={styles.verifiedBadge}>
              <MaterialIcons name="verified" size={fs(12)} color={Colors.green_059669} />
              <Text style={styles.verifiedText}>Verified Center</Text>
            </View>
          </View>

          <Text style={styles.clinicTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.clinicAddress} numberOfLines={2}>
            {item.address}
          </Text>
        </View>

        <View style={styles.chevronCircle}>
          <Ionicons name="chevron-forward" size={fs(18)} color={Colors.primaryColor} />
        </View>
      </TouchableOpacity>
    ),
    [handlePressClinic]
  );

  return (
    <View style={styles.container}>
      <AppHeader title="Care Clinics & Centers" onBackPress={handleBackPress} />

      <View style={styles.content}>
        {/* City Selector Pill */}
        <View style={styles.citySelectorRow}>
          <TouchableOpacity
            style={styles.citySelector}
            activeOpacity={0.8}
            onPress={() => setIsCityModalVisible(true)}
          >
            <View style={styles.cityIconCircle}>
              <Ionicons name="location-sharp" size={fs(16)} color={Colors.primaryColor} />
            </View>
            <View style={styles.cityTextGroup}>
              <Text style={styles.citySelectorLabel}>Location</Text>
              <Text style={styles.citySelectorText} numberOfLines={1}>
                {selectedCity.title || 'All Cities'}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={fs(18)} color={Colors.secondaryFontColor} />
          </TouchableOpacity>

          {!!selectedCity.id && (
            <TouchableOpacity style={styles.clearCityBtn} onPress={handleClearCity}>
              <Ionicons name="close-circle" size={fs(20)} color={Colors.secondaryFontColor} />
            </TouchableOpacity>
          )}
        </View>

        {/* Search Clinic Input */}
        <View style={styles.searchWrapper}>
          <SearchBox
            value={clinicSearch}
            onChangeText={setClinicSearch}
            placeholder="Search clinic by name, address..."
          />
        </View>

        {/* Header Results Count */}
        <View style={styles.resultsHeaderRow}>
          <Text style={styles.resultsCountText}>
            Showing {clinics.length} {clinics.length === 1 ? 'Clinic' : 'Clinics'}
          </Text>
        </View>

        {/* Clinics List */}
        {isClinicsLoading ? (
          <LoadingIndicator />
        ) : isClinicsError ? (
          <ErrorState message="Could not load clinics list" onRetry={refetchClinics} />
        ) : (
          <FlatList
            data={clinics}
            keyExtractor={keyExtractor}
            renderItem={renderClinicItem}
            contentContainerStyle={[
              styles.listContainer,
              { flexGrow: 1, paddingBottom: hs(80) + Math.max(insets.bottom, hs(24)) },
            ]}
            showsVerticalScrollIndicator={false}
            refreshing={isClinicsFetching}
            onRefresh={refetchClinics}
            ListEmptyComponent={
              <View style={{ alignItems: 'center', paddingVertical: hs(30), paddingHorizontal: ws(20) }}>
                <EmptyState
                  message={
                    clinicSearch
                      ? 'No clinics match your search.'
                      : selectedCity.title
                        ? `No clinics available in ${selectedCity.title}.`
                        : 'No clinics available.'
                  }
                />
                {!!selectedCity.id && (
                  <TouchableOpacity
                    style={{
                      marginTop: hs(14),
                      backgroundColor: Colors.primaryColor,
                      paddingHorizontal: ws(18),
                      paddingVertical: hs(10),
                      borderRadius: fs(8),
                    }}
                    onPress={handleClearCity}
                    activeOpacity={0.8}
                  >
                    <Text style={{ color: Colors.white, fontSize: fs(13), ...TYPOGRAPHY.bold }}>
                      Explore All Clinics
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            }
          />
        )}
      </View>

      {/* City Picker Modal */}
      <CitySelectModal
        visible={isCityModalVisible}
        onClose={() => setIsCityModalVisible(false)}
        cities={cities}
        selectedCityId={isUsingCurrentLocation && !selectedCity.id ? 'CURRENT' : (selectedCity.id || 'ALL')}
        currentCityName={deviceLocationCity ?? undefined}
        isDetectingLocation={isDetectingLocation}
        activeLocationLabel={selectedCity.title || 'All Cities'}
        onSelectCity={handleCityModalSelect}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgColor },
  content: { flex: 1, paddingHorizontal: ws(16), paddingTop: hs(12) },
  citySelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hs(10),
    gap: ws(8),
  },
  citySelector: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: fs(14),
    paddingHorizontal: ws(12),
    paddingVertical: hs(8),
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cityIconCircle: {
    width: ws(32),
    height: ws(32),
    aspectRatio: 1,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: Colors.aquaSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ws(10),
  },
  cityTextGroup: {
    flex: 1,
  },
  citySelectorLabel: {
    fontSize: fs(9),
    ...TYPOGRAPHY.medium,
    color: Colors.secondaryFontColor,
    textTransform: 'uppercase',
  },
  citySelectorText: {
    fontSize: fs(13),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
    marginTop: hs(1),
  },
  clearCityBtn: {
    padding: ws(6),
  },
  searchWrapper: { marginBottom: hs(8) },
  resultsHeaderRow: {
    marginBottom: hs(10),
  },
  resultsCountText: {
    fontSize: fs(11),
    ...TYPOGRAPHY.medium,
    color: Colors.secondaryFontColor,
  },
  listContainer: { paddingBottom: hs(24) },
  clinicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: fs(16),
    padding: ws(12),
    marginBottom: hs(12),
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  clinicImage: {
    width: ws(64),
    height: ws(64),
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: Colors.slate_F1F5F9,
    marginRight: ws(12),
  },
  placeholderImage: {
    width: ws(64),
    height: ws(64),
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: Colors.aquaSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ws(12),
  },
  clinicDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hs(4),
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.green_ECFDF5,
    paddingHorizontal: ws(6),
    paddingVertical: hs(2),
    borderRadius: fs(6),
    gap: ws(3),
  },
  verifiedText: {
    fontSize: fs(10),
    ...TYPOGRAPHY.medium,
    color: Colors.green_059669,
  },
  clinicTitle: {
    fontSize: fs(14),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
    marginBottom: hs(2),
  },
  clinicAddress: {
    fontSize: fs(11),
    ...TYPOGRAPHY.regular,
    color: Colors.secondaryFontColor,
    lineHeight: fs(16),
  },
  chevronCircle: {
    width: ws(28),
    height: ws(28),
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: Colors.aquaSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: ws(8),
  },
});
