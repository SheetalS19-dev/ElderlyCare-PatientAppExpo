import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../../constants';
import { isUnionTerritory } from '../../../utils/locationHelper';
import { fs, hs, ws } from '../../../utils/metrics';
import { TYPOGRAPHY } from '../../../utils/typography';
import {
  CITY_MAX,
  STATE_MAX,
  STREET_ADDRESS_MAX,
} from '../../../validation/profileValidation';

interface Props {
  address: string;
  onChangeAddress: (text: string) => void;
  city: string;
  onChangeCity: (text: string) => void;
  state: string;
  onChangeState: (text: string) => void;
  postalCode: string;
  onChangePostalCode: (text: string) => void;
  onPressState?: () => void;
  onPressCity?: () => void;
  onPressPostalCode?: () => void;
  errors?: {
    address?: string;
    city?: string;
    state?: string;
    postalCode?: string;
  };
}

export const AddressLocationSection: React.FC<Props> = ({
  address,
  onChangeAddress,
  city,
  onChangeCity,
  state,
  onChangeState,
  postalCode,
  onChangePostalCode,
  onPressState,
  onPressCity,
  onPressPostalCode,
  errors,
}) => {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>Address & Location</Text>

      {/* Row: State & City */}
      <View style={styles.rowTwoCols}>
        <View style={styles.colHalf}>
          <Text style={styles.fieldLabel}>State / UT</Text>
          {onPressState ? (
            <TouchableOpacity
              style={[styles.selectorField, errors?.state && styles.inputError]}
              activeOpacity={0.8}
              onPress={onPressState}
            >
              <Text
                style={[styles.selectorText, !state && styles.placeholderText]}
                numberOfLines={1}
              >
                {state ? `${state} (${isUnionTerritory(state) ? 'UT' : 'State'})` : 'Select State'}
              </Text>
              <MaterialIcons name="keyboard-arrow-down" size={18} color={Colors.secondaryFontColor} />
            </TouchableOpacity>
          ) : (
            <TextInput
              style={[styles.inputField, errors?.state && styles.inputError]}
              value={state}
              onChangeText={onChangeState}
              placeholder="State"
              placeholderTextColor="#94A3B8"
              maxLength={STATE_MAX}
            />
          )}
          {!!errors?.state && <Text style={styles.fieldErrorText}>{errors.state}</Text>}
        </View>

        <View style={styles.colHalf}>
          <Text style={styles.fieldLabel}>City</Text>
          {onPressCity ? (
            <TouchableOpacity
              style={[
                styles.selectorField,
                !state.trim() && styles.disabledField,
                errors?.city && styles.inputError,
              ]}
              activeOpacity={state.trim() ? 0.8 : 1}
              onPress={onPressCity}
            >
              <Text
                style={[styles.selectorText, (!city || !state.trim()) && styles.placeholderText]}
                numberOfLines={1}
              >
                {!state.trim() ? 'Select state first' : city || 'Select City'}
              </Text>
              <MaterialIcons name="keyboard-arrow-down" size={18} color={Colors.secondaryFontColor} />
            </TouchableOpacity>
          ) : (
            <TextInput
              style={[styles.inputField, errors?.city && styles.inputError]}
              value={city}
              onChangeText={onChangeCity}
              placeholder="City"
              placeholderTextColor="#94A3B8"
              maxLength={CITY_MAX}
            />
          )}
          {!!errors?.city && <Text style={styles.fieldErrorText}>{errors.city}</Text>}
        </View>
      </View>

      {/* Postal Code */}
      <View style={styles.fieldWrapper}>
        <Text style={styles.fieldLabel}>Postal Code / Pincode</Text>
        {onPressPostalCode ? (
          <TouchableOpacity
            style={[
              styles.selectorField,
              !city.trim() && styles.disabledField,
              errors?.postalCode && styles.inputError,
            ]}
            activeOpacity={city.trim() ? 0.8 : 1}
            onPress={onPressPostalCode}
          >
            <Text
              style={[
                styles.selectorText,
                (!postalCode || !city.trim()) && styles.placeholderText,
              ]}
              numberOfLines={1}
            >
              {!city.trim() ? 'Select city first' : postalCode || 'Select Postal Code'}
            </Text>
            <MaterialIcons name="keyboard-arrow-down" size={18} color={Colors.secondaryFontColor} />
          </TouchableOpacity>
        ) : (
          <TextInput
            style={[styles.inputField, errors?.postalCode && styles.inputError]}
            value={postalCode}
            onChangeText={onChangePostalCode}
            placeholder="e.g. 226010"
            placeholderTextColor="#94A3B8"
            keyboardType="numeric"
            maxLength={6}
          />
        )}
        {!!errors?.postalCode && <Text style={styles.fieldErrorText}>{errors.postalCode}</Text>}
      </View>

      {/* Address Line */}
      <View style={styles.fieldWrapper}>
        <Text style={styles.fieldLabel}>Street Address</Text>
        <TextInput
          style={[styles.inputField, styles.multilineInput, errors?.address && styles.inputError]}
          value={address}
          onChangeText={onChangeAddress}
          placeholder="House no., street, area"
          placeholderTextColor="#94A3B8"
          maxLength={STREET_ADDRESS_MAX}
          multiline
          numberOfLines={2}
        />
        {!!errors?.address && <Text style={styles.fieldErrorText}>{errors.address}</Text>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionCard: {
    backgroundColor: Colors.white,
    borderRadius: ws(20),
    padding: ws(16),
    marginBottom: hs(16),
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: hs(2) },
    shadowOpacity: 0.03,
    shadowRadius: ws(4),
    elevation: 1,
  },
  sectionTitle: {
    fontSize: fs(15),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
    marginBottom: hs(14),
  },
  rowTwoCols: {
    flexDirection: 'row',
    gap: ws(10),
    marginBottom: hs(12),
  },
  colHalf: {
    flex: 1,
  },
  fieldWrapper: {
    marginBottom: hs(12),
  },
  fieldLabel: {
    fontSize: fs(12),
    ...TYPOGRAPHY.medium,
    color: Colors.primaryFontColor,
    marginBottom: hs(6),
  },
  inputField: {
    height: hs(44),
    backgroundColor: '#F8FAFC',
    borderRadius: ws(12),
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: ws(12),
    fontSize: fs(13),
    ...TYPOGRAPHY.regular,
    color: Colors.primaryFontColor,
  },
  selectorField: {
    height: hs(44),
    backgroundColor: '#F8FAFC',
    borderRadius: ws(12),
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: ws(12),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  disabledField: {
    backgroundColor: '#F1F5F9',
  },
  selectorText: {
    flex: 1,
    marginRight: ws(4),
    fontSize: fs(13),
    ...TYPOGRAPHY.medium,
    color: Colors.primaryFontColor,
  },
  placeholderText: {
    color: '#94A3B8',
    ...TYPOGRAPHY.regular,
  },
  multilineInput: {
    height: hs(64),
    paddingTop: hs(10),
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: Colors.redColor,
    backgroundColor: '#FFF5F5',
  },
  fieldErrorText: {
    fontSize: fs(11),
    ...TYPOGRAPHY.medium,
    color: '#EF4444',
    marginTop: hs(4),
  },
});
