import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import {
  StyleProp,
  StyleSheet,
  TextInput,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { Colors, Typography } from '../../constants';

export interface SearchBoxProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onTap?: () => void;
  onSubmit?: () => void;
  readOnly?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  onClear?: () => void;
}

export const SearchBox: React.FC<SearchBoxProps> = ({
  value,
  onChangeText,
  placeholder = 'Search doctors, clinics, services...',
  onTap,
  onSubmit,
  readOnly = false,
  containerStyle,
  inputStyle,
  onClear,
}) => {
  const handleClear = () => {
    onChangeText('');
    if (onClear) onClear();
  };

  return (
    <TouchableOpacity
      activeOpacity={onTap ? 0.75 : 1}
      onPress={onTap}
      style={[styles.container, containerStyle]}
    >
      <View style={styles.iconContainer}>
        <MaterialIcons name="search" size={20} color={Colors.primaryColor} />
      </View>
      <TextInput
        style={[styles.input, inputStyle]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        editable={!readOnly && !onTap}
        onSubmitEditing={onSubmit}
        returnKeyType="search"
        pointerEvents={onTap ? 'none' : 'auto'}
      />
      {value.length > 0 && !readOnly && !onTap && (
        <TouchableOpacity
          onPress={handleClear}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.clearButton}
        >
          <MaterialIcons name="cancel" size={18} color="#94A3B8" />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 46,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.primaryFontColor,
    paddingVertical: 0,
    height: '100%',
  },
  clearButton: {
    padding: 2,
    marginLeft: 6,
  },
});
