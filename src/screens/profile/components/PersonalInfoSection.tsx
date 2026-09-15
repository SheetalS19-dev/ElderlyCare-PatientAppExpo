import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../../constants';
import { fs, hs, ws } from '../../../utils/metrics';
import { TYPOGRAPHY } from '../../../utils/typography';

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
}

export const PersonalInfoSection: React.FC<Props> = ({
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
}) => {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>Personal Details</Text>

      {/* Row: First & Last Name */}
      <View style={styles.rowTwoCols}>
        <View style={styles.colHalf}>
          <Text style={styles.fieldLabel}>First Name *</Text>
          <TextInput
            style={styles.inputField}
            value={fName}
            onChangeText={onChangeFName}
            placeholder="First name"
            placeholderTextColor="#94A3B8"
          />
        </View>
        <View style={styles.colHalf}>
          <Text style={styles.fieldLabel}>Last Name *</Text>
          <TextInput
            style={styles.inputField}
            value={lName}
            onChangeText={onChangeLName}
            placeholder="Last name"
            placeholderTextColor="#94A3B8"
          />
        </View>
      </View>

      {/* Email Field */}
      <View style={styles.fieldWrapper}>
        <Text style={styles.fieldLabel}>Email Address *</Text>
        <TextInput
          style={styles.inputField}
          value={email}
          onChangeText={onChangeEmail}
          placeholder="email@domain.com"
          placeholderTextColor="#94A3B8"
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      {/* Phone Number Field */}
      <View style={styles.fieldWrapper}>
        <Text style={styles.fieldLabel}>Phone Number *</Text>
        <TextInput
          style={styles.inputField}
          value={phone}
          onChangeText={onChangePhone}
          placeholder="Phone number"
          placeholderTextColor="#94A3B8"
          keyboardType="phone-pad"
        />
      </View>

      {/* Row: DOB & Gender */}
      <View style={styles.rowTwoCols}>
        <View style={styles.colHalf}>
          <Text style={styles.fieldLabel}>Date of Birth</Text>
          <TouchableOpacity
            style={styles.selectBtn}
            activeOpacity={0.8}
            onPress={onOpenDatePicker}
          >
            <Text style={[styles.selectBtnText, !dob && styles.placeholderText]}>
              {dob || 'Select Date'}
            </Text>
            <MaterialIcons name="calendar-today" size={ws(16)} color="#64748B" />
          </TouchableOpacity>
        </View>

        <View style={styles.colHalf}>
          <Text style={styles.fieldLabel}>Gender</Text>
          <TouchableOpacity
            style={styles.selectBtn}
            activeOpacity={0.8}
            onPress={onOpenGenderPicker}
          >
            <Text style={[styles.selectBtnText, !gender && styles.placeholderText]}>
              {gender || 'Select Gender'}
            </Text>
            <MaterialIcons name="arrow-drop-down" size={ws(20)} color="#64748B" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Row: Occupation & Blood Group */}
      <View style={styles.rowTwoCols}>
        <View style={styles.colHalf}>
          <Text style={styles.fieldLabel}>Occupation</Text>
          <TouchableOpacity
            style={styles.selectBtn}
            activeOpacity={0.8}
            onPress={onOpenOccupationPicker}
          >
            <Text style={[styles.selectBtnText, !occupation && styles.placeholderText]}>
              {occupation || 'Select Occupation'}
            </Text>
            <MaterialIcons name="arrow-drop-down" size={ws(20)} color="#64748B" />
          </TouchableOpacity>
        </View>

        <View style={styles.colHalf}>
          <Text style={styles.fieldLabel}>Blood Group</Text>
          <TouchableOpacity
            style={styles.selectBtn}
            activeOpacity={0.8}
            onPress={onOpenBloodGroupPicker}
          >
            <Text style={[styles.selectBtnText, !bloodGroup && styles.placeholderText]}>
              {bloodGroup || 'Select'}
            </Text>
            <MaterialIcons name="arrow-drop-down" size={ws(20)} color="#64748B" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Marital Status */}
      <View style={styles.fieldWrapper}>
        <Text style={styles.fieldLabel}>Marital Status</Text>
        <TouchableOpacity
          style={styles.selectBtn}
          activeOpacity={0.8}
          onPress={onOpenMaritalStatusPicker}
        >
          <Text style={[styles.selectBtnText, !maritalStatus && styles.placeholderText]}>
            {maritalStatus || 'Select Marital Status'}
          </Text>
          <MaterialIcons name="arrow-drop-down" size={ws(20)} color="#64748B" />
        </TouchableOpacity>
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
  selectBtn: {
    height: hs(44),
    backgroundColor: '#F8FAFC',
    borderRadius: ws(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: ws(12),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectBtnText: {
    fontSize: fs(13),
    ...TYPOGRAPHY.medium,
    color: Colors.primaryFontColor,
  },
  placeholderText: {
    color: '#94A3B8',
    ...TYPOGRAPHY.regular,
  },
});
