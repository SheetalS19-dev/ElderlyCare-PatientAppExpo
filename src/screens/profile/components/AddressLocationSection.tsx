import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Colors } from '../../../constants';
import { fs, hs, ws } from '../../../utils/metrics';
import { TYPOGRAPHY } from '../../../utils/typography';

interface Props {
  address: string;
  onChangeAddress: (text: string) => void;
  city: string;
  onChangeCity: (text: string) => void;
  state: string;
  onChangeState: (text: string) => void;
  postalCode: string;
  onChangePostalCode: (text: string) => void;
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
}) => {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>Address & Location</Text>

      {/* Address Line */}
      <View style={styles.fieldWrapper}>
        <Text style={styles.fieldLabel}>Street Address</Text>
        <TextInput
          style={[styles.inputField, styles.multilineInput]}
          value={address}
          onChangeText={onChangeAddress}
          placeholder="House no., street, area"
          placeholderTextColor="#94A3B8"
          multiline
          numberOfLines={2}
        />
      </View>

      {/* Row: City & State */}
      <View style={styles.rowTwoCols}>
        <View style={styles.colHalf}>
          <Text style={styles.fieldLabel}>City</Text>
          <TextInput
            style={styles.inputField}
            value={city}
            onChangeText={onChangeCity}
            placeholder="City"
            placeholderTextColor="#94A3B8"
          />
        </View>

        <View style={styles.colHalf}>
          <Text style={styles.fieldLabel}>State</Text>
          <TextInput
            style={styles.inputField}
            value={state}
            onChangeText={onChangeState}
            placeholder="State"
            placeholderTextColor="#94A3B8"
          />
        </View>
      </View>

      {/* Postal Code */}
      <View style={styles.fieldWrapper}>
        <Text style={styles.fieldLabel}>Postal Code / Pincode</Text>
        <TextInput
          style={styles.inputField}
          value={postalCode}
          onChangeText={onChangePostalCode}
          placeholder="e.g. 110001"
          placeholderTextColor="#94A3B8"
          keyboardType="numeric"
        />
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
    borderColor: '#E2E8F0',
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
    borderColor: '#E2E8F0',
    paddingHorizontal: ws(12),
    fontSize: fs(13),
    ...TYPOGRAPHY.regular,
    color: Colors.primaryFontColor,
  },
  multilineInput: {
    height: hs(64),
    paddingTop: hs(10),
    textAlignVertical: 'top',
  },
});
