import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useMemo, useState } from 'react';
import {
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants';
import { fs, hs, ws } from '../../utils/metrics';
import { TYPOGRAPHY } from '../../utils/typography';

export interface CountryCodeItem {
  name: string;
  code: string;
  dialCode: string;
  flag: string;
}

export const COUNTRY_LIST: CountryCodeItem[] = [
  { name: 'India', code: 'IN', dialCode: '+91', flag: '🇮🇳' },
  { name: 'United States', code: 'US', dialCode: '+1', flag: '🇺🇸' },
  { name: 'United Kingdom', code: 'GB', dialCode: '+44', flag: '🇬🇧' },
  { name: 'United Arab Emirates', code: 'AE', dialCode: '+971', flag: '🇦🇪' },
  { name: 'Canada', code: 'CA', dialCode: '+1', flag: '🇨🇦' },
  { name: 'Australia', code: 'AU', dialCode: '+61', flag: '🇦🇺' },
  { name: 'Saudi Arabia', code: 'SA', dialCode: '+966', flag: '🇸🇦' },
  { name: 'Singapore', code: 'SG', dialCode: '+65', flag: '🇸🇬' },
  { name: 'Germany', code: 'DE', dialCode: '+49', flag: '🇩🇪' },
  { name: 'France', code: 'FR', dialCode: '+33', flag: '🇫🇷' },
  { name: 'Italy', code: 'IT', dialCode: '+39', flag: '🇮🇹' },
  { name: 'Spain', code: 'ES', dialCode: '+34', flag: '🇪🇸' },
  { name: 'Japan', code: 'JP', dialCode: '+81', flag: '🇯🇵' },
  { name: 'China', code: 'CN', dialCode: '+86', flag: '🇨🇳' },
  { name: 'Brazil', code: 'BR', dialCode: '+55', flag: '🇧🇷' },
  { name: 'South Africa', code: 'ZA', dialCode: '+27', flag: '🇿🇦' },
  { name: 'Nigeria', code: 'NG', dialCode: '+234', flag: '🇳🇬' },
  { name: 'Pakistan', code: 'PK', dialCode: '+92', flag: '🇵🇰' },
  { name: 'Bangladesh', code: 'BD', dialCode: '+880', flag: '🇧🇩' },
  { name: 'Nepal', code: 'NP', dialCode: '+977', flag: '🇳🇵' },
  { name: 'Sri Lanka', code: 'LK', dialCode: '+94', flag: '🇱🇰' },
  { name: 'Malaysia', code: 'MY', dialCode: '+60', flag: '🇲🇾' },
  { name: 'Indonesia', code: 'ID', dialCode: '+62', flag: '🇮🇩' },
  { name: 'Philippines', code: 'PH', dialCode: '+63', flag: '🇵🇭' },
  { name: 'Thailand', code: 'TH', dialCode: '+66', flag: '🇹🇭' },
  { name: 'Vietnam', code: 'VN', dialCode: '+84', flag: '🇻🇳' },
  { name: 'New Zealand', code: 'NZ', dialCode: '+64', flag: '🇳🇿' },
  { name: 'Egypt', code: 'EG', dialCode: '+20', flag: '🇪🇬' },
  { name: 'Qatar', code: 'QA', dialCode: '+974', flag: '🇶🇦' },
  { name: 'Kuwait', code: 'KW', dialCode: '+965', flag: '🇰🇼' },
  { name: 'Oman', code: 'OM', dialCode: '+968', flag: '🇴🇲' },
  { name: 'Bahrain', code: 'BH', dialCode: '+973', flag: '🇧🇭' },
  { name: 'Russia', code: 'RU', dialCode: '+7', flag: '🇷🇺' },
  { name: 'Turkey', code: 'TR', dialCode: '+90', flag: '🇹🇷' },
  { name: 'Mexico', code: 'MX', dialCode: '+52', flag: '🇲🇽' },
  { name: 'Netherlands', code: 'NL', dialCode: '+31', flag: '🇳🇱' },
  { name: 'Switzerland', code: 'CH', dialCode: '+41', flag: '🇨🇭' },
  { name: 'Sweden', code: 'SE', dialCode: '+46', flag: '🇸🇪' },
  { name: 'Norway', code: 'NO', dialCode: '+47', flag: '🇳🇴' },
  { name: 'Ireland', code: 'IE', dialCode: '+353', flag: '🇮🇪' },
  { name: 'Kenya', code: 'KE', dialCode: '+254', flag: '🇰🇪' },
];

export interface CountryCodePickerProps {
  visible: boolean;
  selectedDialCode?: string;
  onSelect: (country: CountryCodeItem) => void;
  onClose: () => void;
}

export const CountryCodePicker: React.FC<CountryCodePickerProps> = ({
  visible,
  selectedDialCode = '+91',
  onSelect,
  onClose,
}) => {
  const [search, setSearch] = useState('');

  const filteredCountries = useMemo(() => {
    if (!search.trim()) return COUNTRY_LIST;
    const q = search.toLowerCase();
    return COUNTRY_LIST.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.dialCode.includes(q) ||
        c.code.toLowerCase().includes(q)
    );
  }, [search]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <SafeAreaView style={styles.sheetContainer}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Select Country</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <MaterialIcons name="close" size={fs(24)} color="#4A5568" />
            </TouchableOpacity>
          </View>

          {/* Search Box */}
          <View style={styles.searchBox}>
            <MaterialIcons name="search" size={fs(20)} color="#718096" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search country or code"
              placeholderTextColor="#A0AEC0"
              value={search}
              onChangeText={setSearch}
              autoCorrect={false}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <MaterialIcons name="cancel" size={fs(18)} color="#A0AEC0" />
              </TouchableOpacity>
            )}
          </View>

          {/* List */}
          <FlatList
            data={filteredCountries}
            keyExtractor={(item) => item.code}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const isSelected = item.dialCode === selectedDialCode;
              return (
                <TouchableOpacity
                  style={[styles.itemRow, isSelected && styles.itemRowSelected]}
                  activeOpacity={0.7}
                  onPress={() => {
                    onSelect(item);
                    onClose();
                  }}
                >
                  <Text style={styles.flagText}>{item.flag}</Text>
                  <Text style={[styles.nameText, isSelected && styles.selectedText]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={[styles.dialCodeText, isSelected && styles.selectedDialCode]}>
                    {item.dialCode}
                  </Text>
                  {isSelected && (
                    <MaterialIcons name="check" size={fs(20)} color={Colors.primaryColor} style={styles.checkIcon} />
                  )}
                </TouchableOpacity>
              );
            }}
          />
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  sheetContainer: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: fs(20),
    borderTopRightRadius: fs(20),
    maxHeight: '85%',
    flexShrink: 1,
    paddingBottom: hs(20),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ws(20),
    paddingTop: hs(18),
    paddingBottom: hs(14),
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F7',
  },
  headerTitle: {
    flex: 1,
    ...TYPOGRAPHY.bold,
    fontSize: fs(18),
    color: '#1A202C',
  },
  closeBtn: {
    padding: ws(4),
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7FAFC',
    borderRadius: fs(10),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginHorizontal: ws(16),
    marginTop: hs(12),
    marginBottom: hs(8),
    paddingHorizontal: ws(12),
    height: hs(44),
  },
  searchIcon: {
    marginRight: ws(8),
  },
  searchInput: {
    flex: 1,
    ...TYPOGRAPHY.regular,
    fontSize: fs(14),
    color: '#1A202C',
    paddingVertical: 0,
  },
  listContent: {
    paddingHorizontal: ws(16),
    paddingTop: hs(6),
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hs(14),
    paddingHorizontal: ws(12),
    borderRadius: fs(8),
    borderBottomWidth: 1,
    borderBottomColor: '#F7FAFC',
  },
  itemRowSelected: {
    backgroundColor: '#EFF6FF',
  },
  flagText: {
    fontSize: fs(22),
    marginRight: ws(12),
  },
  nameText: {
    flex: 1,
    ...TYPOGRAPHY.medium,
    fontSize: fs(15),
    color: '#2D3748',
  },
  selectedText: {
    color: Colors.primaryColor,
    ...TYPOGRAPHY.bold,
  },
  dialCodeText: {
    ...TYPOGRAPHY.medium,
    fontSize: fs(14),
    color: '#718096',
    marginLeft: ws(8),
  },
  selectedDialCode: {
    color: Colors.primaryColor,
    ...TYPOGRAPHY.bold,
  },
  checkIcon: {
    marginLeft: ws(8),
  },
});
