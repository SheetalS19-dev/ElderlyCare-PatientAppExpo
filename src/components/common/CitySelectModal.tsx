import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Keyboard,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants';
import { useGetStatesQuery } from '../../redux/apis/doctorApi';
import type { CityModel, StateModel } from '../../types';
import { fs, hs, ws } from '../../utils/metrics';
import { TYPOGRAPHY } from '../../utils/typography';

export interface CitySelectModalProps {
  visible: boolean;
  onClose: () => void;
  cities: CityModel[];
  selectedCityId?: string | number | null;
  onSelectCity: (city: CityModel | null | undefined) => void;
  title?: string;
  allowAllCities?: boolean;
  currentCityName?: string;
  isDetectingLocation?: boolean;
  activeLocationLabel?: string;
}

interface StateGroup {
  key: string;
  stateId?: string;
  stateTitle: string;
  cities: CityModel[];
}

const PAGE_SIZE = 10;

export const CitySelectModal: React.FC<CitySelectModalProps> = ({
  visible,
  onClose,
  cities,
  selectedCityId,
  onSelectCity,
  title = 'Select Your Location',
  allowAllCities = true,
  currentCityName,
  isDetectingLocation = false,
  activeLocationLabel,
}) => {
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedStateKey, setExpandedStateKey] = useState<string | null>(null);
  const [statePageLimit, setStatePageLimit] = useState(PAGE_SIZE);
  const [searchPageLimit, setSearchPageLimit] = useState(PAGE_SIZE);
  const [expandedCitiesLimit, setExpandedCitiesLimit] = useState(PAGE_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLoadingMoreAreas, setIsLoadingMoreAreas] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const keyboardHeightAnim = useRef(new Animated.Value(0)).current;
  const loadMoreTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const areasTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      const kh = e.endCoordinates?.height ?? 0;
      setKeyboardHeight(kh);
      Animated.timing(keyboardHeightAnim, {
        toValue: kh,
        duration: Platform.OS === 'ios' ? (e.duration || 250) : 180,
        useNativeDriver: false,
      }).start();
    });

    const hideSub = Keyboard.addListener(hideEvent, (e) => {
      setKeyboardHeight(0);
      Animated.timing(keyboardHeightAnim, {
        toValue: 0,
        duration: Platform.OS === 'ios' ? (e?.duration || 250) : 180,
        useNativeDriver: false,
      }).start();
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [keyboardHeightAnim]);

  const { data: statesData, isLoading: statesLoading } = useGetStatesQuery(undefined, {
    skip: !visible,
  });

  const apiStates: StateModel[] = useMemo(() => {
    if (Array.isArray(statesData)) return statesData;
    if (Array.isArray((statesData as any)?.data)) return (statesData as any).data;
    return [];
  }, [statesData]);

  // Reset transient pagination when closing or changing search
  useEffect(() => {
    if (!visible) {
      setSearchQuery('');
      setStatePageLimit(PAGE_SIZE);
      setSearchPageLimit(PAGE_SIZE);
      setExpandedCitiesLimit(PAGE_SIZE);
      setIsLoadingMore(false);
      setIsLoadingMoreAreas(false);
      setKeyboardHeight(0);
      keyboardHeightAnim.setValue(0);
      if (loadMoreTimerRef.current) clearTimeout(loadMoreTimerRef.current);
      if (areasTimerRef.current) clearTimeout(areasTimerRef.current);
      return;
    }

    // Auto-expand the state owning the currently selected city, if any
    const selStr = selectedCityId != null ? String(selectedCityId).trim() : '';
    if (
      selStr &&
      selStr !== 'ALL' &&
      selStr !== 'CURRENT' &&
      selStr.toLowerCase() !== 'all'
    ) {
      const matchedCity = cities.find(
        (c) =>
          String(c.id ?? '') === selStr ||
          (c.title && c.title.toLowerCase() === selStr.toLowerCase())
      );
      if (matchedCity) {
        const key =
          matchedCity.state_id != null
            ? `id:${matchedCity.state_id}`
            : `title:${String(matchedCity.state_title || '').trim().toLowerCase()}`;
        setExpandedStateKey(key);
        setExpandedCitiesLimit(PAGE_SIZE);
      }
    }
  }, [visible, selectedCityId, cities]);

  useEffect(() => {
    setSearchPageLimit(PAGE_SIZE);
    setStatePageLimit(PAGE_SIZE);
    setIsLoadingMore(false);
  }, [searchQuery]);

  useEffect(() => {
    return () => {
      if (loadMoreTimerRef.current) clearTimeout(loadMoreTimerRef.current);
      if (areasTimerRef.current) clearTimeout(areasTimerRef.current);
    };
  }, []);

  // Index cities by state_id and normalized state_title only while modal is open
  const stateGroups: StateGroup[] = useMemo(() => {
    if (!visible) return [];

    const byStateId = new Map<string, CityModel[]>();
    const byStateTitle = new Map<string, CityModel[]>();
    const fallbackTitles = new Map<string, string>();

    for (const c of cities) {
      const sId = c.state_id != null ? String(c.state_id).trim() : '';
      const sTitle = String(c.state_title || '').trim();
      const sTitleKey = sTitle.toLowerCase();

      if (sId) {
        const arr = byStateId.get(sId) || [];
        arr.push(c);
        byStateId.set(sId, arr);
      }
      if (sTitleKey) {
        const arr = byStateTitle.get(sTitleKey) || [];
        arr.push(c);
        byStateTitle.set(sTitleKey, arr);
        if (!fallbackTitles.has(sTitleKey)) {
          fallbackTitles.set(sTitleKey, sTitle);
        }
      }
    }

    const groups: StateGroup[] = [];
    const seenTitleKeys = new Set<string>();

    if (apiStates.length > 0) {
      const sortedApiStates = [...apiStates]
        .filter((s) => s.active !== 0)
        .sort((a, b) => String(a.title || '').localeCompare(String(b.title || '')));

      for (const st of sortedApiStates) {
        const stIdStr = String(st.id);
        const stTitle = String(st.title || '').trim();
        const stTitleKey = stTitle.toLowerCase();
        seenTitleKeys.add(stTitleKey);

        const matchedCities =
          byStateId.get(stIdStr) || byStateTitle.get(stTitleKey) || [];
        groups.push({
          key: `id:${stIdStr}`,
          stateId: stIdStr,
          stateTitle: stTitle,
          cities: matchedCities,
        });
      }
    }

    // Add any extra states present in cities list that weren't in apiStates
    const extraTitles = Array.from(fallbackTitles.entries())
      .filter(([titleKey]) => !seenTitleKeys.has(titleKey))
      .sort((a, b) => a[1].localeCompare(b[1]));

    for (const [titleKey, displayTitle] of extraTitles) {
      groups.push({
        key: `title:${titleKey}`,
        stateTitle: displayTitle,
        cities: byStateTitle.get(titleKey) || [],
      });
    }

    return groups;
  }, [visible, apiStates, cities]);

  const trimmedQuery = searchQuery.trim().toLowerCase();
  const isSearching = trimmedQuery.length > 0;

  const filteredSearchCities = useMemo(() => {
    if (!visible || !isSearching) return [];
    return cities.filter(
      (c) =>
        c.title?.toLowerCase().includes(trimmedQuery) ||
        c.name?.toLowerCase().includes(trimmedQuery) ||
        c.state_title?.toLowerCase().includes(trimmedQuery)
    );
  }, [visible, isSearching, cities, trimmedQuery]);

  const paginatedStates = useMemo(
    () => stateGroups.slice(0, statePageLimit),
    [stateGroups, statePageLimit]
  );

  const paginatedSearchCities = useMemo(
    () => filteredSearchCities.slice(0, searchPageLimit),
    [filteredSearchCities, searchPageLimit]
  );

  const hasMoreStates = !isSearching && statePageLimit < stateGroups.length;
  const hasMoreSearch = isSearching && searchPageLimit < filteredSearchCities.length;
  const hasMoreTopLevel = isSearching ? hasMoreSearch : hasMoreStates;

  const handleLoadMoreTopLevel = () => {
    if (!hasMoreTopLevel || isLoadingMore) return;
    setIsLoadingMore(true);
    if (loadMoreTimerRef.current) clearTimeout(loadMoreTimerRef.current);
    loadMoreTimerRef.current = setTimeout(() => {
      if (isSearching) {
        setSearchPageLimit((prev) => Math.min(prev + PAGE_SIZE, filteredSearchCities.length));
      } else {
        setStatePageLimit((prev) => Math.min(prev + PAGE_SIZE, stateGroups.length));
      }
      setIsLoadingMore(false);
    }, 150);
  };

  const handleToggleState = (groupKey: string) => {
    setExpandedCitiesLimit(PAGE_SIZE);
    setIsLoadingMoreAreas(false);
    setExpandedStateKey((prev) => (prev === groupKey ? null : groupKey));
  };

  const handleLoadMoreAreas = (totalAreas: number) => {
    if (isLoadingMoreAreas || expandedCitiesLimit >= totalAreas) return;
    setIsLoadingMoreAreas(true);
    if (areasTimerRef.current) clearTimeout(areasTimerRef.current);
    areasTimerRef.current = setTimeout(() => {
      setExpandedCitiesLimit((prev) => Math.min(prev + PAGE_SIZE, totalAreas));
      setIsLoadingMoreAreas(false);
    }, 140);
  };

  const isCurrentLocationSelected = selectedCityId === 'CURRENT';

  const isAllCitiesSelected =
    !isCurrentLocationSelected &&
    (selectedCityId === undefined ||
      selectedCityId === null ||
      String(selectedCityId) === '' ||
      String(selectedCityId).toUpperCase() === 'ALL' ||
      String(selectedCityId).toLowerCase() === 'all' ||
      String(selectedCityId).toLowerCase() === 'all cities');

  const handleClose = () => {
    Keyboard.dismiss();
    onClose();
  };

  const handleSelect = (city: CityModel | null | undefined) => {
    Keyboard.dismiss();
    setSearchQuery('');
    onSelectCity(city);
    onClose();
  };

  const isCitySelected = (city: CityModel) => {
    const cityIdStr = city.id != null ? String(city.id) : '';
    return (
      !isCurrentLocationSelected &&
      !isAllCitiesSelected &&
      (String(selectedCityId) === cityIdStr ||
        (city.title && String(selectedCityId).toLowerCase() === city.title.toLowerCase()))
    );
  };

  const subtitleText = isDetectingLocation
    ? 'Detecting your current location...'
    : activeLocationLabel && activeLocationLabel !== 'All' && activeLocationLabel !== 'All Cities'
      ? `Selected: ${activeLocationLabel}`
      : 'Select a state to view cities & areas';

  const renderTopOptionsHeader = () => {
    if (isSearching) return null;
    return (
      <>
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
                !isCurrentLocationSelected && { backgroundColor: Colors.sky_E0F2FE },
              ]}
            >
              <MaterialIcons
                name="my-location"
                size={fs(18)}
                color={isCurrentLocationSelected ? Colors.white : Colors.sky_0284C7}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.cityNameText,
                  isCurrentLocationSelected && styles.cityNameTextSelected,
                ]}
              >
                Use Current Location
              </Text>
              <Text style={styles.cityStateText}>
                {isDetectingLocation
                  ? 'Detecting location...'
                  : currentCityName
                    ? `Detected: ${currentCityName}`
                    : 'Auto-detect location'}
              </Text>
            </View>
          </View>
          {isDetectingLocation ? (
            <ActivityIndicator size="small" color={Colors.primaryColor} />
          ) : isCurrentLocationSelected ? (
            <MaterialIcons name="check-circle" size={fs(20)} color={Colors.primaryColor} />
          ) : null}
        </TouchableOpacity>

        {allowAllCities && (
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
                  size={fs(18)}
                  color={isAllCitiesSelected ? Colors.white : Colors.primaryColor}
                />
              </View>
              <View style={{ flex: 1 }}>
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
              <MaterialIcons name="check-circle" size={fs(20)} color={Colors.primaryColor} />
            )}
          </TouchableOpacity>
        )}

        <Text style={styles.sectionLabel}>States & Union Territories</Text>
      </>
    );
  };

  const renderFooter = () => {
    if (isLoadingMore) {
      return (
        <View style={styles.footerLoaderContainer}>
          <ActivityIndicator size="small" color={Colors.primaryColor} />
          <Text style={styles.footerLoaderText}>
            {isSearching ? 'Loading more locations...' : 'Loading more states...'}
          </Text>
        </View>
      );
    }
    if (hasMoreTopLevel) {
      const shownCount = isSearching ? paginatedSearchCities.length : paginatedStates.length;
      const totalCount = isSearching ? filteredSearchCities.length : stateGroups.length;
      return (
        <TouchableOpacity
          style={styles.loadMoreHintBtn}
          onPress={handleLoadMoreTopLevel}
          activeOpacity={0.75}
        >
          <Text style={styles.loadMoreHintText}>
            Showing {shownCount} of {totalCount} — Scroll for 10 more
          </Text>
        </TouchableOpacity>
      );
    }
    return <View style={{ height: hs(8) }} />;
  };

  const isKeyboardOpen = keyboardHeight > 0;
  const availableHeightWithKeyboard = screenHeight - keyboardHeight - insets.top - hs(24);
  const modalMaxHeight = isKeyboardOpen
    ? Math.min(Math.max(availableHeightWithKeyboard, hs(220)), Math.round(screenHeight * 0.58))
    : Math.round(screenHeight * 0.60);

  const listMaxHeight = isKeyboardOpen
    ? Math.max(modalMaxHeight - hs(120), hs(110))
    : Math.max(modalMaxHeight - hs(120), hs(200));

  const modalPaddingBottom = isKeyboardOpen
    ? hs(12)
    : Math.max(insets.bottom + hs(12), hs(24));

  const modalMinHeight = isKeyboardOpen
    ? undefined
    : Math.min(Math.round(screenHeight * 0.38), hs(280));

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      {!visible ? null : (
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={styles.dismissArea}
            activeOpacity={1}
            onPress={handleClose}
          />

          <Animated.View
            style={[
              styles.modalSheetBox,
              {
                marginBottom: keyboardHeightAnim,
                maxHeight: modalMaxHeight,
                minHeight: modalMinHeight,
                paddingBottom: modalPaddingBottom,
              },
            ]}
          >
            <View style={styles.modalHandle} />

            {/* Header */}
            <View style={styles.modalSheetHeader}>
              <View style={styles.modalHeaderLeft}>
                <View style={styles.modalHeaderIcon}>
                  <MaterialIcons name="location-on" size={fs(18)} color={Colors.primaryColor} />
                </View>
                <View style={styles.modalHeaderTextWrap}>
                  <Text style={styles.modalSheetTitle} numberOfLines={1} adjustsFontSizeToFit>
                    {title}
                  </Text>
                  <Text style={styles.modalSheetSubtitle} numberOfLines={1}>
                    {subtitleText}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={handleClose}
                style={styles.closeIconBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialIcons name="close" size={fs(20)} color={Colors.primaryFontColor} />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={styles.searchContainer}>
              <MaterialIcons
                name="search"
                size={fs(20)}
                color={Colors.primaryColor}
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search city or state..."
                placeholderTextColor={Colors.slate_94A3B8}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCorrect={false}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <MaterialIcons name="cancel" size={fs(18)} color={Colors.slate_94A3B8} />
                </TouchableOpacity>
              )}
            </View>

            {/* Paginated States Dropdown / Search Cities List */}
            {isSearching ? (
              <FlatList
                data={paginatedSearchCities}
                keyExtractor={(item: CityModel, idx: number) => `search-city-${item.id ?? idx}`}
                style={[styles.cityList, { maxHeight: listMaxHeight }]}
                contentContainerStyle={styles.cityListContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                initialNumToRender={PAGE_SIZE}
                maxToRenderPerBatch={PAGE_SIZE}
                windowSize={5}
                onEndReached={handleLoadMoreTopLevel}
                onEndReachedThreshold={0.25}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <MaterialIcons name="location-off" size={fs(32)} color={Colors.secondaryFontColor} />
                    <Text style={styles.emptyText}>No cities found matching "{searchQuery}"</Text>
                  </View>
                }
                ListFooterComponent={renderFooter}
                renderItem={({ item: city }: { item: CityModel }) => {
                  const selected = isCitySelected(city);
                  return (
                    <TouchableOpacity
                      style={[styles.cityRow, selected && styles.cityRowSelected]}
                      activeOpacity={0.7}
                      onPress={() => handleSelect(city)}
                    >
                      <View style={styles.cityRowLeft}>
                        <View
                          style={[
                            styles.cityIconWrap,
                            selected && styles.cityIconWrapSelected,
                          ]}
                        >
                          <MaterialIcons
                            name="location-city"
                            size={fs(18)}
                            color={selected ? Colors.white : Colors.primaryColor}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[
                              styles.cityNameText,
                              selected && styles.cityNameTextSelected,
                            ]}
                          >
                            {city.title || city.name || ''}
                          </Text>
                          {city.state_title ? (
                            <Text style={styles.cityStateText}>{city.state_title}</Text>
                          ) : null}
                        </View>
                      </View>
                      {selected && (
                        <MaterialIcons name="check-circle" size={fs(20)} color={Colors.primaryColor} />
                      )}
                    </TouchableOpacity>
                  );
                }}
              />
            ) : (
              <FlatList
                data={paginatedStates}
                keyExtractor={(group: StateGroup) => group.key}
                style={[styles.cityList, { maxHeight: listMaxHeight }]}
                contentContainerStyle={styles.cityListContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                initialNumToRender={PAGE_SIZE}
                maxToRenderPerBatch={PAGE_SIZE}
                windowSize={5}
                onEndReached={handleLoadMoreTopLevel}
                onEndReachedThreshold={0.25}
                ListHeaderComponent={renderTopOptionsHeader}
                ListEmptyComponent={
                  statesLoading ? (
                    <View style={styles.footerLoaderContainer}>
                      <ActivityIndicator size="small" color={Colors.primaryColor} />
                      <Text style={styles.footerLoaderText}>Loading states...</Text>
                    </View>
                  ) : (
                    <View style={styles.emptyContainer}>
                      <MaterialIcons name="location-off" size={fs(32)} color={Colors.secondaryFontColor} />
                      <Text style={styles.emptyText}>No states available</Text>
                    </View>
                  )
                }
                ListFooterComponent={renderFooter}
                renderItem={({ item: group }: { item: StateGroup }) => {
                  const isExpanded = expandedStateKey === group.key;
                  const visibleCities = isExpanded
                    ? group.cities.slice(0, expandedCitiesLimit)
                    : [];
                  const hasMoreAreas = isExpanded && expandedCitiesLimit < group.cities.length;
                  const hasSelectedChild = group.cities.some((c) => isCitySelected(c));

                  return (
                    <View style={[styles.stateGroupCard, isExpanded && styles.stateGroupCardExpanded]}>
                      <TouchableOpacity
                        style={styles.stateHeaderRow}
                        activeOpacity={0.75}
                        onPress={() => handleToggleState(group.key)}
                      >
                        <View style={styles.cityRowLeft}>
                          <View
                            style={[
                              styles.cityIconWrap,
                              (isExpanded || hasSelectedChild) && styles.cityIconWrapSelected,
                            ]}
                          >
                            <MaterialIcons
                              name="map"
                              size={fs(17)}
                              color={
                                isExpanded || hasSelectedChild ? Colors.white : Colors.primaryColor
                              }
                            />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text
                              style={[
                                styles.cityNameText,
                                (isExpanded || hasSelectedChild) && styles.cityNameTextSelected,
                              ]}
                              numberOfLines={1}
                            >
                              {group.stateTitle}
                            </Text>
                            <Text style={styles.cityStateText}>
                              {group.cities.length}{' '}
                              {group.cities.length === 1 ? 'area / city' : 'areas / cities'}
                            </Text>
                          </View>
                        </View>
                        <MaterialIcons
                          name={isExpanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                          size={fs(22)}
                          color={isExpanded ? Colors.primaryColor : Colors.secondaryFontColor}
                        />
                      </TouchableOpacity>

                      {/* Nested Areas / Cities Dropdown */}
                      {isExpanded && (
                        <View style={styles.nestedAreasBox}>
                          {group.cities.length === 0 ? (
                            <Text style={styles.noAreasText}>No areas listed for this state</Text>
                          ) : (
                            <>
                              {visibleCities.map((city, cIdx) => {
                                const selected = isCitySelected(city);
                                return (
                                  <TouchableOpacity
                                    key={`nested-${group.key}-${city.id ?? cIdx}`}
                                    style={[
                                      styles.nestedCityRow,
                                      selected && styles.nestedCityRowSelected,
                                    ]}
                                    activeOpacity={0.75}
                                    onPress={() => handleSelect(city)}
                                  >
                                    <View style={styles.cityRowLeft}>
                                      <MaterialIcons
                                        name="location-city"
                                        size={fs(15)}
                                        color={
                                          selected ? Colors.primaryColor : Colors.secondaryFontColor
                                        }
                                      />
                                      <Text
                                        style={[
                                          styles.nestedCityText,
                                          selected && styles.nestedCityTextSelected,
                                        ]}
                                        numberOfLines={1}
                                      >
                                        {city.title || city.name || ''}
                                      </Text>
                                    </View>
                                    {selected && (
                                      <MaterialIcons
                                        name="check-circle"
                                        size={fs(18)}
                                        color={Colors.primaryColor}
                                      />
                                    )}
                                  </TouchableOpacity>
                                );
                              })}

                              {isLoadingMoreAreas ? (
                                <View style={styles.areasLoaderRow}>
                                  <ActivityIndicator size="small" color={Colors.primaryColor} />
                                  <Text style={styles.footerLoaderText}>Loading more areas...</Text>
                                </View>
                              ) : hasMoreAreas ? (
                                <TouchableOpacity
                                  style={styles.loadMoreAreasBtn}
                                  onPress={() => handleLoadMoreAreas(group.cities.length)}
                                  activeOpacity={0.75}
                                >
                                  <Text style={styles.loadMoreAreasText}>
                                    Load more areas ({group.cities.length - expandedCitiesLimit}{' '}
                                    remaining)
                                  </Text>
                                  <MaterialIcons
                                    name="expand-more"
                                    size={fs(16)}
                                    color={Colors.primaryColor}
                                  />
                                </TouchableOpacity>
                              ) : null}
                            </>
                          )}
                        </View>
                      )}
                    </View>
                  );
                }}
              />
            )}
          </Animated.View>
        </View>
      )}
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
    borderTopLeftRadius: fs(24),
    borderTopRightRadius: fs(24),
    paddingHorizontal: ws(16),
    paddingTop: hs(10),
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 12,
  },
  modalHandle: {
    width: ws(36),
    height: hs(4),
    borderRadius: fs(2),
    backgroundColor: Colors.gray_CBD5E1,
    alignSelf: 'center',
    marginBottom: hs(12),
  },
  modalSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hs(12),
    gap: ws(10),
  },
  modalHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(10),
  },
  modalHeaderIcon: {
    width: ws(34),
    height: ws(34),
    borderRadius: ws(17),
    backgroundColor: Colors.aquaSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalHeaderTextWrap: {
    flex: 1,
  },
  modalSheetTitle: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(16),
    color: Colors.primaryFontColor,
  },
  modalSheetSubtitle: {
    ...TYPOGRAPHY.regular,
    fontSize: fs(11.5),
    color: Colors.secondaryFontColor,
    marginTop: hs(1),
  },
  closeIconBtn: {
    width: ws(32),
    height: ws(32),
    borderRadius: ws(16),
    backgroundColor: Colors.slate_F1F5F9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.slate_F8FAFC,
    borderRadius: fs(12),
    paddingHorizontal: ws(12),
    height: hs(44),
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: hs(12),
  },
  searchIcon: {
    marginRight: ws(6),
  },
  searchInput: {
    flex: 1,
    ...TYPOGRAPHY.regular,
    fontSize: fs(14),
    color: Colors.primaryFontColor,
    paddingVertical: 0,
  },
  sectionLabel: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(11.5),
    color: Colors.secondaryFontColor,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: hs(6),
    marginBottom: hs(8),
    paddingHorizontal: ws(2),
  },
  cityList: {
    flexShrink: 1,
  },
  cityListContent: {
    paddingBottom: hs(16),
  },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.slate_F8FAFC,
    borderRadius: fs(12),
    paddingVertical: hs(12),
    paddingHorizontal: ws(14),
    marginBottom: hs(8),
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cityRowSelected: {
    backgroundColor: Colors.aquaSoft,
    borderColor: Colors.primaryColor,
  },
  cityRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(10),
    flex: 1,
  },
  cityIconWrap: {
    width: ws(32),
    height: ws(32),
    borderRadius: ws(16),
    backgroundColor: Colors.aquaSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cityIconWrapSelected: {
    backgroundColor: Colors.primaryColor,
  },
  cityNameText: {
    ...TYPOGRAPHY.medium,
    fontSize: fs(13),
    color: Colors.primaryFontColor,
  },
  cityNameTextSelected: {
    ...TYPOGRAPHY.bold,
    color: Colors.primaryColor,
  },
  cityStateText: {
    ...TYPOGRAPHY.regular,
    fontSize: fs(11),
    color: Colors.secondaryFontColor,
    marginTop: hs(1),
  },
  stateGroupCard: {
    backgroundColor: Colors.slate_F8FAFC,
    borderRadius: fs(12),
    marginBottom: hs(8),
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  stateGroupCardExpanded: {
    borderColor: Colors.primaryColor,
    backgroundColor: Colors.sky_E0F2FE,
  },
  stateHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: hs(11),
    paddingHorizontal: ws(14),
  },
  nestedAreasBox: {
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.slate_E2E8F0,
    paddingVertical: hs(6),
    paddingHorizontal: ws(12),
  },
  nestedCityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: hs(9),
    paddingHorizontal: ws(10),
    borderRadius: fs(8),
    marginBottom: hs(4),
    backgroundColor: Colors.slate_F8FAFC,
  },
  nestedCityRowSelected: {
    backgroundColor: Colors.aquaSoft,
  },
  nestedCityText: {
    ...TYPOGRAPHY.medium,
    fontSize: fs(12.5),
    color: Colors.primaryFontColor,
    flex: 1,
  },
  nestedCityTextSelected: {
    ...TYPOGRAPHY.bold,
    color: Colors.primaryColor,
  },
  noAreasText: {
    ...TYPOGRAPHY.regular,
    fontSize: fs(12),
    color: Colors.secondaryFontColor,
    paddingVertical: hs(8),
    textAlign: 'center',
  },
  areasLoaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hs(8),
    gap: ws(8),
  },
  loadMoreAreasBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hs(8),
    gap: ws(4),
  },
  loadMoreAreasText: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(11.5),
    color: Colors.primaryColor,
  },
  footerLoaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hs(14),
    gap: ws(8),
  },
  footerLoaderText: {
    ...TYPOGRAPHY.medium,
    fontSize: fs(12),
    color: Colors.primaryColor,
  },
  loadMoreHintBtn: {
    alignItems: 'center',
    paddingVertical: hs(10),
  },
  loadMoreHintText: {
    ...TYPOGRAPHY.medium,
    fontSize: fs(11.5),
    color: Colors.primaryColor,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hs(24),
  },
  emptyText: {
    ...TYPOGRAPHY.regular,
    fontSize: fs(12),
    color: Colors.secondaryFontColor,
    marginTop: hs(8),
  },
});
