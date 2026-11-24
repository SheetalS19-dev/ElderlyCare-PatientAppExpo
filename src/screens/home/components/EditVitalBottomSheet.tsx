import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { memo } from 'react';
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
import { AppButton } from '../../../components';
import { Colors, Typography } from '../../../constants';
import { DateTimeUtils, fs, getVitalIconInfo, hs, TYPOGRAPHY, ws } from '../../../utils';
import { FIELD_LIMITS } from '../../../validation';

interface EditVitalBottomSheetProps {
  visible: boolean;
  vitalType: string;
  onClose: () => void;
  selectedDate: string;
  onOpenDatePicker: () => void;
  selectedTime: string;
  onOpenTimePicker: () => void;
  systolic: string;
  onChangeSystolic: (val: string) => void;
  diastolic: string;
  onChangeDiastolic: (val: string) => void;
  value: string;
  onChangeValue: (val: string) => void;
  sugarRandom: string;
  onChangeSugarRandom: (val: string) => void;
  onSubmit: () => void;
  isUpdating: boolean;
  errors?: Record<string, string>;
}

export const EditVitalBottomSheet = memo(({
  visible,
  vitalType,
  onClose,
  selectedDate,
  onOpenDatePicker,
  selectedTime,
  onOpenTimePicker,
  systolic,
  onChangeSystolic,
  diastolic,
  onChangeDiastolic,
  value,
  onChangeValue,
  sugarRandom,
  onChangeSugarRandom,
  onSubmit,
  isUpdating,
  errors,
}: EditVitalBottomSheetProps) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <TouchableOpacity
          style={styles.backdropPressable}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.modalBox}>
          <View style={styles.modalHeaderRow}>
            <Text style={styles.modalTitle}>Update {vitalType}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <MaterialIcons name="close" size={24} color={Colors.slate_64748B} />
            </TouchableOpacity>
          </View>

          <ScrollView
            bounces={false}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            {/* Date Selection */}
            <Text style={styles.fieldLabel}>Date</Text>
            <TouchableOpacity
              style={styles.pickerSelectorBtn}
              onPress={onOpenDatePicker}
            >
              <Text style={styles.pickerSelectorText}>
                {DateTimeUtils.getDataFormat(selectedDate)}
              </Text>
              <MaterialIcons name="calendar-today" size={18} color={Colors.slate_64748B} />
            </TouchableOpacity>

            {/* Time Selection */}
            <Text style={styles.fieldLabel}>Time</Text>
            <TouchableOpacity
              style={styles.pickerSelectorBtn}
              onPress={onOpenTimePicker}
            >
              <Text style={styles.pickerSelectorText}>
                {DateTimeUtils.formatTimeToAmPm(selectedTime) || selectedTime}
              </Text>
              <MaterialIcons name="access-time" size={18} color={Colors.slate_64748B} />
            </TouchableOpacity>

            {/* Dynamic Vital Fields */}
            {vitalType === 'Blood Pressure' ? (
              <>
                <Text style={styles.fieldLabel}>Systolic (mmHg) *</Text>
                <View
                  style={[
                    styles.inputWithIconContainer,
                    !!errors?.systolic && styles.inputErrorBorder,
                  ]}
                >
                  <View style={[styles.fieldIconBadge, { backgroundColor: Colors.red_FEE2E2 }]}>
                    <MaterialIcons name="favorite" size={ws(16)} color={Colors.redColor} />
                  </View>
                  <TextInput
                    style={styles.textInputWithIcon}
                    placeholder="e.g. 120"
                    placeholderTextColor={Colors.slate_94A3B8}
                    keyboardType="number-pad"
                    value={systolic}
                    onChangeText={onChangeSystolic}
                    maxLength={FIELD_LIMITS.VITAL_INPUT_MAX}
                  />
                  <Text style={styles.inputUnitSuffix}>mmHg</Text>
                </View>
                {!!errors?.systolic && (
                  <View style={styles.errorRow}>
                    <MaterialIcons name="error-outline" size={ws(13)} color={Colors.redColor} />
                    <Text style={styles.errorText}>{errors.systolic}</Text>
                  </View>
                )}

                <Text style={styles.fieldLabel}>Diastolic (mmHg) *</Text>
                <View
                  style={[
                    styles.inputWithIconContainer,
                    !!errors?.diastolic && styles.inputErrorBorder,
                  ]}
                >
                  <View style={[styles.fieldIconBadge, { backgroundColor: Colors.red_FEE2E2 }]}>
                    <MaterialIcons name="favorite" size={ws(16)} color={Colors.redColor} />
                  </View>
                  <TextInput
                    style={styles.textInputWithIcon}
                    placeholder="e.g. 80"
                    placeholderTextColor={Colors.slate_94A3B8}
                    keyboardType="number-pad"
                    value={diastolic}
                    onChangeText={onChangeDiastolic}
                    maxLength={FIELD_LIMITS.VITAL_INPUT_MAX}
                  />
                  <Text style={styles.inputUnitSuffix}>mmHg</Text>
                </View>
                {!!errors?.diastolic && (
                  <View style={styles.errorRow}>
                    <MaterialIcons name="error-outline" size={ws(13)} color={Colors.redColor} />
                    <Text style={styles.errorText}>{errors.diastolic}</Text>
                  </View>
                )}
              </>
            ) : vitalType === 'Sugar' ? (
              <>
                <Text style={styles.fieldLabel}>Fasting (mg/dL) *</Text>
                <View
                  style={[
                    styles.inputWithIconContainer,
                    !!errors?.value && styles.inputErrorBorder,
                  ]}
                >
                  <View style={[styles.fieldIconBadge, { backgroundColor: Colors.purple_EDE9FE }]}>
                    <MaterialIcons name="opacity" size={ws(16)} color={Colors.purple_8B5CF6} />
                  </View>
                  <TextInput
                    style={styles.textInputWithIcon}
                    placeholder="e.g. 95"
                    placeholderTextColor={Colors.slate_94A3B8}
                    keyboardType="number-pad"
                    value={value}
                    onChangeText={onChangeValue}
                    maxLength={FIELD_LIMITS.VITAL_INPUT_MAX}
                  />
                  <Text style={styles.inputUnitSuffix}>mg/dL</Text>
                </View>
                {!!errors?.value && (
                  <View style={styles.errorRow}>
                    <MaterialIcons name="error-outline" size={ws(13)} color={Colors.redColor} />
                    <Text style={styles.errorText}>{errors.value}</Text>
                  </View>
                )}

                <Text style={styles.fieldLabel}>Random (mg/dL) *</Text>
                <View
                  style={[
                    styles.inputWithIconContainer,
                    !!errors?.sugarRandom && styles.inputErrorBorder,
                  ]}
                >
                  <View style={[styles.fieldIconBadge, { backgroundColor: Colors.purple_EDE9FE }]}>
                    <MaterialIcons name="opacity" size={ws(16)} color={Colors.purple_8B5CF6} />
                  </View>
                  <TextInput
                    style={styles.textInputWithIcon}
                    placeholder="e.g. 140"
                    placeholderTextColor={Colors.slate_94A3B8}
                    keyboardType="number-pad"
                    value={sugarRandom}
                    onChangeText={onChangeSugarRandom}
                    maxLength={FIELD_LIMITS.VITAL_INPUT_MAX}
                  />
                  <Text style={styles.inputUnitSuffix}>mg/dL</Text>
                </View>
                {!!errors?.sugarRandom && (
                  <View style={styles.errorRow}>
                    <MaterialIcons name="error-outline" size={ws(13)} color={Colors.redColor} />
                    <Text style={styles.errorText}>{errors.sugarRandom}</Text>
                  </View>
                )}
              </>
            ) : vitalType === 'Temperature' ? (
              <>
                <Text style={styles.fieldLabel}>Temperature (°C) *</Text>
                <View
                  style={[
                    styles.inputWithIconContainer,
                    !!errors?.value && styles.inputErrorBorder,
                  ]}
                >
                  <View style={[styles.fieldIconBadge, { backgroundColor: Colors.amber_FEF3C7 }]}>
                    <MaterialIcons name="thermostat" size={ws(16)} color={Colors.amber_D97706} />
                  </View>
                  <TextInput
                    style={styles.textInputWithIcon}
                    placeholder="Enter temperature in °C (e.g. 37.0)"
                    placeholderTextColor={Colors.slate_94A3B8}
                    keyboardType="decimal-pad"
                    value={value}
                    onChangeText={onChangeValue}
                    maxLength={FIELD_LIMITS.VITAL_INPUT_MAX}
                  />
                  <Text style={styles.inputUnitSuffix}>°C</Text>
                </View>
                {!!errors?.value && (
                  <View style={styles.errorRow}>
                    <MaterialIcons name="error-outline" size={ws(13)} color={Colors.redColor} />
                    <Text style={styles.errorText}>{errors.value}</Text>
                  </View>
                )}
              </>
            ) : vitalType === 'Weight' ? (
              <>
                <Text style={styles.fieldLabel}>Weight (kg) *</Text>
                <View
                  style={[
                    styles.inputWithIconContainer,
                    !!errors?.value && styles.inputErrorBorder,
                  ]}
                >
                  <View style={[styles.fieldIconBadge, { backgroundColor: Colors.green_ECFDF5 }]}>
                    <MaterialIcons name="fitness-center" size={ws(16)} color={Colors.green_10B981} />
                  </View>
                  <TextInput
                    style={styles.textInputWithIcon}
                    placeholder="Enter weight in kg"
                    placeholderTextColor={Colors.slate_94A3B8}
                    keyboardType="decimal-pad"
                    value={value}
                    onChangeText={onChangeValue}
                    maxLength={FIELD_LIMITS.VITAL_INPUT_MAX}
                  />
                  <Text style={styles.inputUnitSuffix}>kg</Text>
                </View>
                {!!errors?.value && (
                  <View style={styles.errorRow}>
                    <MaterialIcons name="error-outline" size={ws(13)} color={Colors.redColor} />
                    <Text style={styles.errorText}>{errors.value}</Text>
                  </View>
                )}
              </>
            ) : (
              <>
                <Text style={styles.fieldLabel}>{vitalType === 'SpO2' ? 'SpO2 (%) *' : `${vitalType} *`}</Text>
                <View
                  style={[
                    styles.inputWithIconContainer,
                    !!errors?.value && styles.inputErrorBorder,
                  ]}
                >
                  <View style={[styles.fieldIconBadge, { backgroundColor: Colors.sky_E0F2FE }]}>
                    <MaterialIcons name="air" size={ws(16)} color={Colors.sky_0284C7} />
                  </View>
                  <TextInput
                    style={styles.textInputWithIcon}
                    placeholder={`Enter ${vitalType} reading`}
                    placeholderTextColor={Colors.slate_94A3B8}
                    keyboardType="decimal-pad"
                    value={value}
                    onChangeText={onChangeValue}
                    maxLength={FIELD_LIMITS.VITAL_INPUT_MAX}
                  />
                  {vitalType === 'SpO2' && <Text style={styles.inputUnitSuffix}>%</Text>}
                </View>
                {!!errors?.value && (
                  <View style={styles.errorRow}>
                    <MaterialIcons name="error-outline" size={ws(13)} color={Colors.redColor} />
                    <Text style={styles.errorText}>{errors.value}</Text>
                  </View>
                )}
              </>
            )}

            {/* General Error Banner */}
            {!!errors?.general && (
              <View style={styles.generalErrorBox}>
                <MaterialIcons name="error-outline" size={16} color={Colors.redColor} />
                <Text style={styles.generalErrorText}>{errors.general}</Text>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelText}>Close</Text>
              </TouchableOpacity>
              <AppButton
                title="Update"
                loading={isUpdating}
                onPress={onSubmit}
                height={hs(48)}
                borderRadius={fs(12)}
                style={styles.saveBtn}
              />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
});

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  backdropPressable: {
    flex: 1,
  },
  modalBox: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: fs(24),
    borderTopRightRadius: fs(24),
    padding: ws(20),
    maxHeight: '85%',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hs(16),
  },
  modalTitle: {
    fontSize: fs(Typography.fontSize.lg),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
  },
  fieldLabel: {
    fontSize: fs(12),
    ...TYPOGRAPHY.bold,
    color: Colors.slate_475569,
    marginBottom: hs(6),
    marginTop: hs(8),
  },
  pickerSelectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.slate_F8FAFC,
    borderWidth: 1,
    borderColor: Colors.gray_CBD5E1,
    borderRadius: fs(10),
    paddingHorizontal: ws(14),
    paddingVertical: hs(12),
    marginBottom: hs(6),
  },
  pickerSelectorText: {
    fontSize: fs(14),
    ...TYPOGRAPHY.medium,
    color: Colors.ink,
  },
  fieldIconBadge: {
    width: ws(30),
    height: ws(30),
    borderRadius: ws(8),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ws(10),
  },
  inputWithIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border || Colors.gray_CBD5E1,
    borderRadius: ws(10),
    paddingHorizontal: ws(12),
    paddingVertical: hs(8),
    backgroundColor: Colors.white,
    marginBottom: hs(4),
  },
  inputErrorBorder: {
    borderColor: Colors.redColor,
  },
  textInputWithIcon: {
    flex: 1,
    ...TYPOGRAPHY.regular,
    fontSize: fs(14),
    color: Colors.primaryFontColor,
    paddingVertical: 0,
  },
  inputUnitSuffix: {
    ...TYPOGRAPHY.medium,
    fontSize: fs(12),
    color: Colors.secondaryFontColor,
    marginLeft: ws(6),
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hs(2),
    marginBottom: hs(6),
    gap: ws(4),
  },
  errorText: {
    ...TYPOGRAPHY.regular,
    fontSize: fs(11),
    color: Colors.redColor,
  },
  modalActions: {
    flexDirection: 'row',
    gap: ws(12),
    marginTop: hs(20),
    marginBottom: hs(10),
  },
  generalErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.red_FFF5F5,
    borderRadius: fs(8),
    borderWidth: 1,
    borderColor: Colors.redColor,
    paddingHorizontal: ws(12),
    paddingVertical: hs(8),
    marginTop: hs(8),
    marginBottom: hs(4),
    gap: ws(6),
  },
  generalErrorText: {
    flex: 1,
    fontSize: fs(12),
    ...TYPOGRAPHY.medium,
    color: Colors.redColor,
  },
  cancelBtn: {
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
    height: hs(48),
    borderRadius: fs(12),
    backgroundColor: Colors.slate_F1F5F9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelText: {
    fontSize: fs(14),
    ...TYPOGRAPHY.bold,
    color: Colors.slate_64748B,
  },
  saveBtn: {
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
    height: hs(48),
    borderRadius: fs(12),
  },
});
