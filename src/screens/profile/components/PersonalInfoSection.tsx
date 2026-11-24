import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../../constants';
import { DateTimeUtils, fs, hs, TYPOGRAPHY, ws } from '../../../utils';
import { FIELD_LIMITS } from '../../../validation';

interface Props {
  fName: string;
  onChangeFName: (text: string) => void;
  lName: string;
  onChangeLName: (text: string) => void;
  email: string;
  onChangeEmail: (text: string) => void;
  phone: string;
  onChangePhone: (text: string) => void;
  dob: string;
  onOpenDatePicker: () => void;
  gender: string;
  onOpenGenderPicker: () => void;
  occupation: string;
  onOpenOccupationPicker: () => void;
  maritalStatus: string;
  onOpenMaritalStatusPicker: () => void;
  bloodGroup: string;
  onOpenBloodGroupPicker: () => void;
  errors?: Record<string, string | undefined>;
}

const PersonalInfoSectionComponent: React.FC<Props> = ({
  fName,
  onChangeFName,
  lName,
  onChangeLName,
  email,
  onChangeEmail,
  phone,
  onChangePhone,
  dob,
  onOpenDatePicker,
  gender,
  onOpenGenderPicker,
  occupation,
  onOpenOccupationPicker,
  maritalStatus,
  onOpenMaritalStatusPicker,
  bloodGroup,
  onOpenBloodGroupPicker,
  errors,
}) => {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeaderRow}>
        <MaterialIcons name="person" size={18} color={Colors.primaryColor} />
        <Text style={styles.sectionTitle}>PERSONAL DETAILS</Text>
      </View>

      {/* Row: First & Last Name */}
      <View style={styles.rowTwoCols}>
        <View style={styles.colHalf}>
          <Text style={styles.fieldLabel}>First Name *</Text>
          <TextInput
            style={[styles.inputField, !!errors?.fName && styles.inputError]}
            value={fName}
            onChangeText={onChangeFName}
            placeholder="First name"
            placeholderTextColor={Colors.slate_94A3B8}
            maxLength={FIELD_LIMITS.NAME_MAX}
          />
          {!!errors?.fName && <Text style={styles.errorText}>{errors.fName}</Text>}
        </View>
        <View style={styles.colHalf}>
          <Text style={styles.fieldLabel}>Last Name</Text>
          <TextInput
            style={[styles.inputField, !!errors?.lName && styles.inputError]}
            value={lName}
            onChangeText={onChangeLName}
            placeholder="Last name"
            placeholderTextColor={Colors.slate_94A3B8}
            maxLength={FIELD_LIMITS.NAME_MAX}
          />
          {!!errors?.lName && <Text style={styles.errorText}>{errors.lName}</Text>}
        </View>
      </View>

      {/* Email Field */}
      <View style={styles.fieldWrapper}>
        <Text style={styles.fieldLabel}>Email Address *</Text>
        <TextInput
          style={[styles.inputField, !!errors?.email && styles.inputError]}
          value={email}
          onChangeText={onChangeEmail}
          placeholder="email@domain.com"
          placeholderTextColor={Colors.slate_94A3B8}
          keyboardType="email-address"
          autoCapitalize="none"
          maxLength={FIELD_LIMITS.EMAIL_MAX}
        />
        {!!errors?.email && <Text style={styles.errorText}>{errors.email}</Text>}
      </View>

      {/* Phone Number Field */}
      <View style={styles.fieldWrapper}>
        <Text style={styles.fieldLabel}>Phone Number *</Text>
        <TextInput
          style={[styles.inputField, !!errors?.phone && styles.inputError]}
          value={phone}
          onChangeText={(text) => onChangePhone(text.replace(/[^0-9]/g, ''))}
          placeholder="Enter 10-digit mobile number"
          placeholderTextColor={Colors.slate_94A3B8}
          keyboardType="phone-pad"
          maxLength={FIELD_LIMITS.PHONE_MAX}
        />
        {!!errors?.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
      </View>

      {/* Row: Date of Birth & Gender */}
      <View style={styles.rowTwoCols}>
        <View style={styles.colHalf}>
          <Text style={styles.fieldLabel}>Date of Birth *</Text>
          <TouchableOpacity
            style={[styles.selectorField, !!errors?.dob && styles.inputError]}
            activeOpacity={0.8}
            onPress={onOpenDatePicker}
          >
            <Text style={[styles.selectorText, !dob && styles.placeholderText]} numberOfLines={1}>
              {dob ? (DateTimeUtils.getDataFormat(dob) || dob) : 'Select Date of Birth'}
            </Text>
            <MaterialIcons name="calendar-today" size={16} color={Colors.primaryColor} />
          </TouchableOpacity>
          {!!errors?.dob && <Text style={styles.errorText}>{errors.dob}</Text>}
        </View>

        <View style={styles.colHalf}>
          <Text style={styles.fieldLabel}>Gender *</Text>
          <TouchableOpacity
            style={[styles.selectorField, !!errors?.gender && styles.inputError]}
            activeOpacity={0.8}
            onPress={onOpenGenderPicker}
          >
            <Text style={[styles.selectorText, !gender && styles.placeholderText]} numberOfLines={1}>
              {gender || 'Select'}
            </Text>
            <MaterialIcons name="keyboard-arrow-down" size={20} color={Colors.secondaryFontColor} />
          </TouchableOpacity>
          {!!errors?.gender && <Text style={styles.errorText}>{errors.gender}</Text>}
        </View>
      </View>

      {/* Row: Marital Status & Blood Group */}
      <View style={styles.rowTwoCols}>
        <View style={styles.colHalf}>
          <Text style={styles.fieldLabel}>Marital Status</Text>
          <TouchableOpacity
            style={styles.selectorField}
            activeOpacity={0.8}
            onPress={onOpenMaritalStatusPicker}
          >
            <Text style={[styles.selectorText, !maritalStatus && styles.placeholderText]} numberOfLines={1}>
              {maritalStatus || 'Select'}
            </Text>
            <MaterialIcons name="keyboard-arrow-down" size={20} color={Colors.secondaryFontColor} />
          </TouchableOpacity>
        </View>

        <View style={styles.colHalf}>
          <Text style={styles.fieldLabel}>Blood Group *</Text>
          <TouchableOpacity
            style={[styles.selectorField, !!errors?.bloodGroup && styles.inputError]}
            activeOpacity={0.8}
            onPress={onOpenBloodGroupPicker}
          >
            <Text style={[styles.selectorText, !bloodGroup && styles.placeholderText]} numberOfLines={1}>
              {bloodGroup || 'Select'}
            </Text>
            <MaterialIcons name="keyboard-arrow-down" size={20} color={Colors.secondaryFontColor} />
          </TouchableOpacity>
          {!!errors?.bloodGroup && <Text style={styles.errorText}>{errors.bloodGroup}</Text>}
        </View>
      </View>

      {/* Occupation */}
      <View style={styles.fieldWrapper}>
        <Text style={styles.fieldLabel}>Occupation</Text>
        <TouchableOpacity
          style={styles.selectorField}
          activeOpacity={0.8}
          onPress={onOpenOccupationPicker}
        >
          <Text style={[styles.selectorText, !occupation && styles.placeholderText]} numberOfLines={1}>
            {occupation || 'Select Occupation'}
          </Text>
          <MaterialIcons name="keyboard-arrow-down" size={20} color={Colors.secondaryFontColor} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export const PersonalInfoSection = React.memo(PersonalInfoSectionComponent);

const styles = StyleSheet.create({
  sectionCard: {
    backgroundColor: Colors.white,
    borderRadius: fs(16),
    padding: ws(16),
    marginBottom: hs(14),
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(6),
    marginBottom: hs(12),
  },
  sectionTitle: {
    fontSize: fs(13),
    ...TYPOGRAPHY.bold,
    color: Colors.ink,
    letterSpacing: 0.5,
  },
  rowTwoCols: {
    flexDirection: 'row',
    gap: ws(10),
    marginBottom: hs(10),
  },
  colHalf: {
    flex: 1,
  },
  fieldWrapper: {
    marginBottom: hs(10),
  },
  fieldLabel: {
    fontSize: fs(12),
    ...TYPOGRAPHY.medium,
    color: Colors.slate_1E293B,
    marginBottom: hs(4),
  },
  inputField: {
    height: hs(40),
    backgroundColor: Colors.slate_F8FAFC,
    borderRadius: fs(8),
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: ws(10),
    fontSize: fs(13),
    color: Colors.slate_1E293B,
    ...TYPOGRAPHY.regular,
  },
  inputError: {
    borderColor: Colors.redColor,
  },
  errorText: {
    fontSize: fs(11),
    color: Colors.redColor,
    marginTop: hs(2),
    ...TYPOGRAPHY.regular,
  },
  selectorField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: hs(40),
    backgroundColor: Colors.slate_F8FAFC,
    borderRadius: fs(8),
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: ws(10),
  },
  selectorText: {
    fontSize: fs(13),
    color: Colors.slate_1E293B,
    ...TYPOGRAPHY.regular,
    flex: 1,
  },
  placeholderText: {
    color: Colors.slate_94A3B8,
  },
});
