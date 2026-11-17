import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants';
import { fs, hs, ws } from '../../utils/metrics';
import { TYPOGRAPHY } from '../../utils/typography';

export interface SearchableSelectOption<T = any> {
  id: string | number;
  label: string;
  subtitle?: string;
  badge?: string;
  section?: string;
  data?: T;
}

export interface SearchableSelectModalProps<T = any> {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  searchPlaceholder?: string;
  options: SearchableSelectOption<T>[];
  selectedValue?: string | number | null;
  onSelect: (option: SearchableSelectOption<T>) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  pageSize?: number;
}

const DEFAULT_PAGE_SIZE = 10;

export const SearchableSelectModal = <T,>({
  visible,
  onClose,
  title,
  subtitle,
  searchPlaceholder = 'Search...',
  options,
  selectedValue,
  onSelect,
  isLoading = false,
  emptyMessage = 'No options found',
  pageSize = DEFAULT_PAGE_SIZE,
}: SearchableSelectModalProps<T>) => {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [displayedCount, setDisplayedCount] = useState(pageSize);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadMoreTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!visible) {
      setSearchQuery('');
      setDisplayedCount(pageSize);
      setIsLoadingMore(false);
      if (loadMoreTimerRef.current) {
        clearTimeout(loadMoreTimerRef.current);
        loadMoreTimerRef.current = null;
      }
    }
  }, [visible, pageSize]);

  useEffect(() => {
    setDisplayedCount(pageSize);
    setIsLoadingMore(false);
  }, [searchQuery, pageSize, options]);

  useEffect(() => {
    return () => {
      if (loadMoreTimerRef.current) {
        clearTimeout(loadMoreTimerRef.current);
      }
    };
  }, []);

  const filteredOptions = useMemo(() => {
    if (!visible) return [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        (opt.subtitle ? opt.subtitle.toLowerCase().includes(q) : false) ||
        (opt.section ? opt.section.toLowerCase().includes(q) : false)
    );
  }, [visible, options, searchQuery]);

  const paginatedOptions = useMemo(() => {
    return filteredOptions.slice(0, displayedCount);
  }, [filteredOptions, displayedCount]);

  const hasMore = displayedCount < filteredOptions.length;

  const handleLoadMore = () => {
    if (!hasMore || isLoadingMore) return;
    setIsLoadingMore(true);
    if (loadMoreTimerRef.current) clearTimeout(loadMoreTimerRef.current);
    loadMoreTimerRef.current = setTimeout(() => {
      setDisplayedCount((prev) => Math.min(prev + pageSize, filteredOptions.length));
      setIsLoadingMore(false);
    }, 150);
  };

  const normalizedSelected = selectedValue != null ? String(selectedValue).trim().toLowerCase() : '';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {!visible ? null : (
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableOpacity style={styles.dismissArea} activeOpacity={1} onPress={onClose} />

          <View style={[styles.modalSheetBox, { paddingBottom: Math.max(insets.bottom + hs(12), hs(24)) }]}>
            <View style={styles.modalHandle} />

            {/* Header */}
            <View style={styles.modalSheetHeader}>
              <View style={styles.modalHeaderTextWrap}>
                <Text style={styles.modalSheetTitle} numberOfLines={1}>
                  {title}
                </Text>
                {!!subtitle && (
                  <Text style={styles.modalSheetSubtitle} numberOfLines={1}>
                    {subtitle}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeIconBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialIcons name="close" size={fs(20)} color={Colors.primaryFontColor} />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={styles.searchContainer}>
              <MaterialIcons name="search" size={fs(20)} color={Colors.primaryColor} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder={searchPlaceholder}
                placeholderTextColor={Colors.slate_94A3B8}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <MaterialIcons name="cancel" size={fs(18)} color={Colors.slate_94A3B8} />
                </TouchableOpacity>
              )}
            </View>

            {/* Paginated Options List */}
            {isLoading && options.length === 0 ? (
              <View style={styles.loaderBox}>
                <ActivityIndicator size="small" color={Colors.primaryColor} />
                <Text style={styles.loaderText}>Loading options...</Text>
              </View>
            ) : (
              <FlatList
                data={paginatedOptions}
                keyExtractor={(item, idx) => `opt-${item.id}-${idx}`}
                style={styles.optionsList}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                initialNumToRender={pageSize}
                maxToRenderPerBatch={pageSize}
                windowSize={5}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.25}
                ListEmptyComponent={
                  <View style={styles.emptyBox}>
                    <MaterialIcons name="search-off" size={fs(30)} color={Colors.secondaryFontColor} />
                    <Text style={styles.emptyText}>
                      {searchQuery.trim()
                        ? `No matches for "${searchQuery.trim()}"`
                        : emptyMessage}
                    </Text>
                  </View>
                }
                ListFooterComponent={
                  isLoadingMore ? (
                    <View style={styles.footerLoader}>
                      <ActivityIndicator size="small" color={Colors.primaryColor} />
                      <Text style={styles.footerLoaderText}>Loading more options...</Text>
                    </View>
                  ) : hasMore ? (
                    <TouchableOpacity style={styles.footerLoadMoreBtn} onPress={handleLoadMore} activeOpacity={0.7}>
                      <Text style={styles.footerLoadMoreText}>
                        Scroll or tap to load more ({paginatedOptions.length} of {filteredOptions.length})
                      </Text>
                    </TouchableOpacity>
                  ) : null
                }
                renderItem={({ item, index }) => {
                  const prevSection = index > 0 ? paginatedOptions[index - 1]?.section : undefined;
                  const showSectionHeader = Boolean(item.section && item.section !== prevSection);
                  const isSelected =
                    Boolean(normalizedSelected) &&
                    (String(item.id).trim().toLowerCase() === normalizedSelected ||
                      item.label.trim().toLowerCase() === normalizedSelected);

                  return (
                    <>
                      {showSectionHeader && (
                        <Text style={styles.sectionGroupHeader}>{item.section}</Text>
                      )}
                      <TouchableOpacity
                        style={[styles.optionRow, isSelected && styles.optionRowSelected]}
                        activeOpacity={0.75}
                        onPress={() => {
                          onSelect(item);
                          onClose();
                        }}
                      >
                        <View style={styles.optionLeft}>
                          <Text
                            style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}
                            numberOfLines={1}
                          >
                            {item.label}
                            {item.badge ? ` (${item.badge})` : ''}
                          </Text>
                          {!!item.subtitle && (
                            <Text style={styles.optionSubtitle} numberOfLines={1}>
                              {item.subtitle}
                            </Text>
                          )}
                        </View>
                        {isSelected && (
                          <MaterialIcons name="check-circle" size={fs(19)} color={Colors.primaryColor} />
                        )}
                      </TouchableOpacity>
                    </>
                  );
                }}
              />
            )}
          </View>
        </KeyboardAvoidingView>
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
    minHeight: '55%',
    maxHeight: '82%',
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
  optionsList: {
    flexGrow: 1,
    maxHeight: hs(380),
  },
  sectionGroupHeader: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(11),
    color: Colors.secondaryFontColor,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: hs(8),
    marginBottom: hs(6),
    paddingHorizontal: ws(4),
  },
  optionRow: {
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
  optionRowSelected: {
    backgroundColor: Colors.aquaSoft,
    borderColor: Colors.primaryColor,
  },
  optionLeft: {
    flex: 1,
    marginRight: ws(8),
  },
  optionLabel: {
    ...TYPOGRAPHY.medium,
    fontSize: fs(13.5),
    color: Colors.primaryFontColor,
  },
  optionLabelSelected: {
    ...TYPOGRAPHY.bold,
    color: Colors.primaryColor,
  },
  optionSubtitle: {
    ...TYPOGRAPHY.regular,
    fontSize: fs(11.5),
    color: Colors.secondaryFontColor,
    marginTop: hs(2),
  },
  loaderBox: {
    paddingVertical: hs(36),
    alignItems: 'center',
    justifyContent: 'center',
    gap: hs(8),
  },
  loaderText: {
    ...TYPOGRAPHY.medium,
    fontSize: fs(13),
    color: Colors.secondaryFontColor,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hs(28),
  },
  emptyText: {
    ...TYPOGRAPHY.regular,
    fontSize: fs(12.5),
    color: Colors.secondaryFontColor,
    marginTop: hs(8),
    textAlign: 'center',
  },
  footerLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hs(12),
    gap: ws(8),
  },
  footerLoaderText: {
    ...TYPOGRAPHY.medium,
    fontSize: fs(12),
    color: Colors.primaryColor,
  },
  footerLoadMoreBtn: {
    alignItems: 'center',
    paddingVertical: hs(10),
  },
  footerLoadMoreText: {
    ...TYPOGRAPHY.medium,
    fontSize: fs(12),
    color: Colors.primaryColor,
  },
});

