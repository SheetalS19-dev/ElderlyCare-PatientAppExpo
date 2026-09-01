import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AppHeader,
  EmptyState,
  ErrorState,
  LoadingIndicator,
  SearchBox,
} from '../../components';
import { ApiEndpoints, Colors, Typography } from '../../constants';
import type { RootStackParamList } from '../../navigation/types';
import { useGetClinicsQuery } from '../../redux/apis/clinicApi';
import { useGetCitiesQuery } from '../../redux/apis/doctorApi';
import type { CityModel, ClinicModel } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'ClinicList'>;

export const ClinicListScreen = ({ navigation }: Props) => {
  const insets = useSafeAreaInsets();
  const [selectedCity, setSelectedCity] = useState<{ id: string; title: string }>({
    id: '',
    title: '',
  });
  const [citySearch, setCitySearch] = useState('');
  const [clinicSearch, setClinicSearch] = useState('');
  const [isCityModalVisible, setIsCityModalVisible] = useState(false);

  // Queries
  const {
    data: clinicsData,
    isLoading: isClinicsLoading,
    isFetching: isClinicsFetching,
    isError: isClinicsError,
    refetch: refetchClinics,
  } = useGetClinicsQuery({
    cityId: selectedCity.id,
  });

  const { data: citiesData } = useGetCitiesQuery(citySearch);

  // Filtered clinic list
  const clinics: ClinicModel[] = useMemo(() => {
    let list: ClinicModel[] = [];
    if (Array.isArray(clinicsData)) list = clinicsData;
    else if (Array.isArray(clinicsData?.data)) list = clinicsData.data;

    if (!clinicSearch.trim()) return list;

    const query = clinicSearch.toLowerCase();
    return list.filter(
      (item) =>
        item.title?.toLowerCase().includes(query) ||
        item.address?.toLowerCase().includes(query) ||
        (item as any)?.city?.toLowerCase().includes(query)
    );
  }, [clinicsData, clinicSearch]);

  // Cities list
  const cities: CityModel[] = useMemo(() => {
    if (Array.isArray(citiesData)) return citiesData;
    if (Array.isArray(citiesData?.data)) return citiesData.data;
    return [];
  }, [citiesData]);

  const handleSelectCity = (city: CityModel) => {
    const cityTitle = city.state_title ? `${city.title}, ${city.state_title}` : city.title ?? '';
    setSelectedCity({ id: String(city.id ?? ''), title: cityTitle });
    setIsCityModalVisible(false);
  };

  const handleClearCity = () => {
    setSelectedCity({ id: '', title: '' });
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Care Clinics & Centers" onBackPress={() => navigation.goBack()} />

      <View style={styles.content}>
        {/* City Selector Pill */}
        <View style={styles.citySelectorRow}>
          <TouchableOpacity
            style={styles.citySelector}
            activeOpacity={0.8}
            onPress={() => setIsCityModalVisible(true)}
          >
            <View style={styles.cityIconCircle}>
              <Ionicons name="location-sharp" size={16} color={Colors.primaryColor} />
            </View>
            <View style={styles.cityTextGroup}>
              <Text style={styles.citySelectorLabel}>Location</Text>
              <Text style={styles.citySelectorText} numberOfLines={1}>
                {selectedCity.title || 'All Cities'}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={18} color={Colors.secondaryFontColor} />
          </TouchableOpacity>

          {!!selectedCity.id && (
            <TouchableOpacity style={styles.clearCityBtn} onPress={handleClearCity}>
              <Ionicons name="close-circle" size={20} color={Colors.secondaryFontColor} />
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
            keyExtractor={(item, index) => `clinic-${item.id ?? index}`}
            contentContainerStyle={[styles.listContainer, { flexGrow: 1, paddingBottom: Math.max(insets.bottom + 20, 30) }]}
            showsVerticalScrollIndicator={false}
            refreshing={isClinicsFetching}
            onRefresh={refetchClinics}
            ListEmptyComponent={
              <EmptyState message={clinicSearch ? 'No clinics match your search.' : 'No clinics available in this area.'} />
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.clinicCard}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('Clinic', { clinicId: String(item.id) })}
              >
                {item.image ? (
                  <Image
                    source={{ uri: `${ApiEndpoints.imageUrl}/${item.image}` }}
                    style={styles.clinicImage}
                  />
                ) : (
                  <View style={styles.placeholderImage}>
                    <FontAwesome5 name="hospital-alt" size={26} color={Colors.primaryColor} />
                  </View>
                )}

                <View style={styles.clinicDetails}>
                  <View style={styles.badgeRow}>
                    <View style={styles.verifiedBadge}>
                      <MaterialIcons name="verified" size={12} color="#059669" />
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
                  <Ionicons name="chevron-forward" size={18} color={Colors.primaryColor} />
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </View>

      {/* City Picker Modal */}
      <Modal
        visible={isCityModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsCityModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Location / City</Text>
              <TouchableOpacity onPress={() => setIsCityModalVisible(false)}>
                <Ionicons name="close-circle" size={26} color={Colors.secondaryFontColor} />
              </TouchableOpacity>
            </View>

            <SearchBox
              value={citySearch}
              onChangeText={setCitySearch}
              placeholder="Search city..."
            />

            <FlatList
              data={cities}
              keyExtractor={(item, index) => `city-${item.id ?? index}`}
              style={{ marginTop: 12 }}
              ListEmptyComponent={<EmptyState message="No cities found" />}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.cityItem}
                  onPress={() => handleSelectCity(item)}
                >
                  <Ionicons name="location-outline" size={18} color={Colors.primaryColor} />
                  <Text style={styles.cityItemText}>
                    {item.title}
                    {item.state_title ? `, ${item.state_title}` : ''}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgColor },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
  citySelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  citySelector: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cityIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  cityTextGroup: {
    flex: 1,
  },
  citySelectorLabel: {
    fontSize: 9,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.secondaryFontColor,
    textTransform: 'uppercase',
  },
  citySelectorText: {
    fontSize: 13,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryFontColor,
    marginTop: 1,
  },
  clearCityBtn: {
    padding: 6,
  },
  searchWrapper: { marginBottom: 8 },
  resultsHeaderRow: {
    marginBottom: 10,
  },
  resultsCountText: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.secondaryFontColor,
  },
  listContainer: { paddingBottom: 24 },
  clinicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  clinicImage: {
    width: 64,
    height: 64,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
  },
  placeholderImage: {
    width: 64,
    height: 64,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clinicDetails: { flex: 1, marginLeft: 12, marginRight: 8 },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 3,
  },
  verifiedText: {
    fontSize: 9,
    fontFamily: Typography.fontFamily.bold,
    color: '#059669',
  },
  clinicTitle: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryFontColor,
    marginBottom: 3,
  },
  clinicAddress: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.secondaryFontColor,
    lineHeight: 16,
  },
  chevronCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryFontColor,
  },
  cityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  cityItemText: {
    marginLeft: 10,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.primaryFontColor,
  },
});
