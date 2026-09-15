import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../../constants';
import { fs, hs, ws } from '../../../utils/metrics';
import { TYPOGRAPHY } from '../../../utils/typography';

export interface WalletSearchBoxProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onClear: () => void;
}

export const WalletSearchBox: React.FC<WalletSearchBoxProps> = ({
  searchQuery,
  onSearchChange,
  onClear,
}) => {
  return (
    <View style={styles.searchBarWrapper}>
      <MaterialIcons name="search" size={fs(20)} color={Colors.secondaryFontColor} style={styles.searchIcon} />
      <TextInput
        style={styles.searchInput}
        placeholder="Search transactions..."
        placeholderTextColor={Colors.secondaryFontColor}
        value={searchQuery}
        onChangeText={onSearchChange}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {searchQuery.length > 0 && (
        <TouchableOpacity
          onPress={onClear}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialIcons name="close" size={fs(18)} color={Colors.secondaryFontColor} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: fs(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: ws(12),
    height: hs(44),
    marginBottom: hs(14),
  },
  searchIcon: {
    marginRight: ws(8),
  },
  searchInput: {
    flex: 1,
    ...TYPOGRAPHY.regular,
    fontSize: fs(13),
    color: Colors.primaryFontColor,
    paddingVertical: 0,
  },
});
