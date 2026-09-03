import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useMemo, useState } from 'react';
import {
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
import { Colors, Typography } from '../../constants';
import type { CityModel } from '../../types';

export interface CitySelectModalProps {
  visible: boolean;
  onClose: () => void;
  cities: CityModel[];
  selectedCityId?: string | number | null;
  onSelectCity: (city: CityModel | null | undefined) => void;
  title?: string;
  allowAllCities?: boolean;
  currentCityName?: string;
}

export const CitySelectModal: React.FC<CitySelectModalProps> = ({
  visible,
  onClose,
  cities,
  selectedCityId,
  onSelectCity,
  title = 'Select Your Location',
  allowAllCities = true,
  currentCityName,
}) => {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCities = useMemo(() => {
    if (!searchQuery.trim()) return cities;
    const q = searchQuery.toLowerCase().trim();
    return cities.filter(
      (c) =>
        c.title?.toLowerCase().includes(q) ||
        c.name?.toLowerCase().includes(q) ||
        c.state_title?.toLowerCase().includes(q)
    );
  }, [cities, searchQuery]);

  const isCurrentLocationSelected = selectedCityId === undefined || selectedCityId === 'CURRENT';

  const isAllCitiesSelected =
    !isCurrentLocationSelected &&
    (selectedCityId === null ||
      String(selectedCityId) === '' ||
      String(selectedCityId).toUpperCase() === 'ALL' ||
      String(selectedCityId).toLowerCase() === 'all cities');

  const handleSelect = (city: CityModel | null | undefined) => {
    onSelectCity(city);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.modalBackdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity
          style={styles.dismissArea}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={[styles.modalSheetBox, { paddingBottom: Math.max(insets.bottom + 12, 24) }]}>
          {/* Sheet Handle */}
          <View style={styles.modalHandle} />

          {/* Header */}
          <View style={styles.modalSheetHeader}>
            <Text style={styles.modalSheetTitle}>{title}</Text>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialIcons name="close" size={22} color={Colors.primaryFontColor} />
            </TouchableOpacity>
          </View>

          {/* Search Input */}
          <View style={styles.searchContainer}>
            <MaterialIcons
              name="search"
              size={20}
              color={Colors.primaryColor}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search city or state..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <MaterialIcons name="cancel" size={18} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>

          {/* Cities List */}
          <ScrollView
            style={styles.cityList}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Current Location Option */}
            {!searchQuery.trim() && (
              <TouchableOpacity
                style={[styles.cityRow, isCurrentLocationSelected && styles.cityRowSelected]}
                activeOpacity={0.7}
                onPress={() => handleSelect(undefined)}
              >
                <View style={styles.cityRowLeft}>
                  <View
                    style={[
                      styles.cityIconWrap,
                      isCurrentLocationSelected && styles.cityIconWrapSelected,
                      !isCurrentLocationSelected && { backgroundColor: '#E0F2FE' },
                    ]}
                  >
                    <MaterialIcons
                      name="my-location"
                      size={18}
                      color={isCurrentLocationSelected ? Colors.white : '#0284C7'}
                    />
                  </View>
                  <View>
                    <Text
                      style={[
                        styles.cityNameText,
                        isCurrentLocationSelected && styles.cityNameTextSelected,
                      ]}
                    >
                      Use Current Location
                    </Text>
                    <Text style={styles.cityStateText}>
                      {currentCityName ? `Detected: ${currentCityName}` : 'Auto-detect location'}
                    </Text>
                  </View>
                </View>
                {isCurrentLocationSelected && (
                  <MaterialIcons name="check-circle" size={20} color={Colors.primaryColor} />
                )}
              </TouchableOpacity>
            )}

            {/* Optional All Cities Option */}
            {allowAllCities && !searchQuery.trim() && (
              <TouchableOpacity
                style={[styles.cityRow, isAllCitiesSelected && styles.cityRowSelected]}
                activeOpacity={0.7}
                onPress={() => handleSelect(null)}
              >
                <View style={styles.cityRowLeft}>
                  <View
                    style={[
                      styles.cityIconWrap,
                      isAllCitiesSelected && styles.cityIconWrapSelected,
                    ]}
                  >
                    <MaterialIcons
                      name="public"
                      size={18}
                      color={isAllCitiesSelected ? Colors.white : Colors.primaryColor}
                    />
                  </View>
                  <View>
                    <Text
                      style={[
                        styles.cityNameText,
                        isAllCitiesSelected && styles.cityNameTextSelected,
                      ]}
                    >
                      All Cities
                    </Text>
                    <Text style={styles.cityStateText}>Show results from all locations</Text>
                  </View>
                </View>
                {isAllCitiesSelected && (
                  <MaterialIcons name="check-circle" size={20} color={Colors.primaryColor} />
                )}
              </TouchableOpacity>
            )}

            {filteredCities.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialIcons name="location-off" size={32} color={Colors.secondaryFontColor} />
                <Text style={styles.emptyText}>No cities found matching "{searchQuery}"</Text>
              </View>
            ) : (
              filteredCities.map((city: CityModel, index: number) => {
                const cityIdStr = city.id != null ? String(city.id) : '';
                const isSelected =
                  !isCurrentLocationSelected &&
                  !isAllCitiesSelected &&
                  (String(selectedCityId) === cityIdStr ||
                    (city.title && String(selectedCityId).toLowerCase() === city.title.toLowerCase()));

                return (
                  <TouchableOpacity
                    key={`city-${city.id ?? index}`}
                    style={[styles.cityRow, isSelected && styles.cityRowSelected]}
                    activeOpacity={0.7}
                    onPress={() => handleSelect(city)}
                  >
                    <View style={styles.cityRowLeft}>
                      <View
                        style={[
                          styles.cityIconWrap,
                          isSelected && styles.cityIconWrapSelected,
                        ]}
                      >
                        <MaterialIcons
                          name="location-city"
                          size={18}
                          color={isSelected ? Colors.white : Colors.primaryColor}
                        />
                      </View>
                      <View>
                        <Text
                          style={[
                            styles.cityNameText,
                            isSelected && styles.cityNameTextSelected,
                          ]}
                        >
                          {city.title || city.name || ''}
                        </Text>
                        {city.state_title ? (
                          <Text style={styles.cityStateText}>{city.state_title}</Text>
                        ) : null}
                      </View>
                    </View>
                    {isSelected && (
                      <MaterialIcons name="check-circle" size={20} color={Colors.primaryColor} />
                    )}
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  dismissArea: {
    flex: 1,
  },
  modalSheetBox: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 10,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 12,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 12,
  },
  modalSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalSheetTitle: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryFontColor,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.primaryFontColor,
    paddingVertical: 0,
  },
  cityList: {
    maxHeight: 340,
  },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cityRowSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: Colors.primaryColor,
  },
  cityRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  cityIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cityIconWrapSelected: {
    backgroundColor: Colors.primaryColor,
  },
  cityNameText: {
    fontSize: 13,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primaryFontColor,
  },
  cityNameTextSelected: {
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryColor,
  },
  cityStateText: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.secondaryFontColor,
    marginTop: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.secondaryFontColor,
    marginTop: 8,
  },
});
