import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import {
  Keyboard,
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AppButton,
  AppDatePickerModal,
  AppTimePickerModal,
} from '../../../components';
import { Colors } from '../../../constants';
import { DateTimeUtils, fs, hs, TYPOGRAPHY, ws } from '../../../utils';
import { FIELD_LIMITS } from '../../../validation';

interface Props {
  visible: boolean;
  vitalName: string;
  selectedMemberDisplayName: string;
  selectedDate: string;
  onDateChange: (text: string) => void;
  onOpenDatePicker: () => void;
  selectedTime: string;
  onTimeChange: (text: string) => void;
  onOpenTimePicker: () => void;
  systolic: string;
  onChangeSystolic: (text: string) => void;
  diastolic: string;
  onChangeDiastolic: (text: string) => void;
  value: string;
  onChangeValue: (text: string) => void;
  sugarRandom: string;
  onChangeSugarRandom: (text: string) => void;
  fieldErrors: Record<string, string>;
  onSubmit: () => void;
  onClose: () => void;
  isSubmitting: boolean;
  showDatePicker: boolean;
  onCloseDatePicker: () => void;
  onSelectDate: (date: string) => void;
  showTimePicker: boolean;
  onCloseTimePicker: () => void;
  onSelectTime: (time: string) => void;
}

const AddEditVitalModalComponent: React.FC<Props> = ({
  visible,
  vitalName,
  selectedMemberDisplayName,
  selectedDate,
  onDateChange,
  onOpenDatePicker,
  selectedTime,
  onTimeChange,
  onOpenTimePicker,
  systolic,
  onChangeSystolic,
  diastolic,
  onChangeDiastolic,
  value,
  onChangeValue,
  sugarRandom,
  onChangeSugarRandom,
  fieldErrors,
  onSubmit,
  onClose,
  isSubmitting,
  showDatePicker,
  onCloseDatePicker,
  onSelectDate,
  showTimePicker,
  onCloseTimePicker,
  onSelectTime,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={() => {
        Keyboard.dismiss();
        onClose();
      }}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity
          style={styles.backdropPressable}
          activeOpacity={1}
          onPress={() => {
            Keyboard.dismiss();
            onClose();
          }}
        />
        <View style={[styles.modalBox, { paddingBottom: Math.max(insets.bottom, hs(16)) }]}>
          {/* Header */}
          <View style={styles.modalHeaderRow}>
            <Text style={styles.modalTitle}>Add {vitalName} Data</Text>
            <TouchableOpacity
              onPress={() => {
                Keyboard.dismiss();
                onClose();
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialIcons name="close" size={ws(22)} color={Colors.primaryFontColor} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalScrollBody}
            contentContainerStyle={styles.modalScrollContent}
            keyboardShouldPersistTaps="handled"
            bounces={false}
            showsVerticalScrollIndicator={false}
          >
            {/* Read-only Patient Member */}
            <View style={styles.modalFieldGroup}>
              <Text style={styles.modalFieldLabel}>Name *</Text>
              <View style={[styles.memberBox, styles.memberBoxReadOnly]}>
                <MaterialIcons
                  name="person-outline"
                  size={ws(18)}
                  color={Colors.secondaryFontColor}
                  style={{ marginRight: ws(8) }}
                />
                <Text style={styles.memberBoxText}>{selectedMemberDisplayName}</Text>
                <MaterialIcons
                  name="lock-outline"
                  size={ws(16)}
                  color={Colors.slate_94A3B8}
                  style={{ marginLeft: 'auto' }}
                />
              </View>
            </View>

            {/* Date & Time Selection Row */}
            <View style={styles.dateTimeRow}>
              {/* Select Date (locked) */}
              <View style={{ flex: 1 }}>
                <Text style={styles.modalFieldLabel}>Select Date *</Text>
                <View style={[styles.pickerTriggerBox, styles.pickerTriggerBoxLocked]}>
                  <Text style={styles.pickerTriggerText} numberOfLines={1}>
                    {selectedDate ? (DateTimeUtils.getDataFormat(selectedDate) || selectedDate) : 'Select Date'}
                  </Text>
                  <MaterialIcons name="lock-outline" size={ws(16)} color={Colors.slate_94A3B8} />
                </View>
                {!!fieldErrors.date && (
                  <View style={styles.errorRow}>
                    <MaterialIcons name="error-outline" size={ws(13)} color={Colors.redColor} />
                    <Text style={styles.errorText}>{fieldErrors.date}</Text>
                  </View>
                )}
              </View>

              {/* Select Time (locked) */}
              <View style={{ flex: 1 }}>
                <Text style={styles.modalFieldLabel}>Select Time *</Text>
                <View style={[styles.pickerTriggerBox, styles.pickerTriggerBoxLocked]}>
                  <Text style={styles.pickerTriggerText} numberOfLines={1}>
                    {selectedTime ? (DateTimeUtils.formatTimeToAmPm(selectedTime) || selectedTime) : 'Select Time'}
                  </Text>
                  <MaterialIcons name="lock-outline" size={ws(16)} color={Colors.slate_94A3B8} />
                </View>
                {!!fieldErrors.time && (
                  <View style={styles.errorRow}>
                    <MaterialIcons name="error-outline" size={ws(13)} color={Colors.redColor} />
                    <Text style={styles.errorText}>{fieldErrors.time}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Metric Value Inputs based on vitalName */}
            {vitalName === 'Blood Pressure' ? (
              <View style={styles.modalFieldGroup}>
                <Text style={styles.modalFieldLabel}>Systolic (mmHg) *</Text>
                <View
                  style={[
                    styles.inputWithIconContainer,
                    !!fieldErrors.systolic && styles.inputErrorBorder,
                  ]}
                >
                  <View style={[styles.fieldIconBadge, { backgroundColor: Colors.red_FEE2E2 }]}>
                    <MaterialIcons
                      name="favorite"
                      size={ws(16)}
                      color={Colors.redColor}
                    />
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
                {!!fieldErrors.systolic ? (
                  <View style={styles.errorRow}>
                    <MaterialIcons name="error-outline" size={ws(13)} color={Colors.redColor} />
                    <Text style={styles.errorText}>{fieldErrors.systolic}</Text>
                  </View>
                ) : (
                  <Text style={styles.helperText}>Accepted range: 40–300 mmHg</Text>
                )}

                <Text style={[styles.modalFieldLabel, { marginTop: hs(10) }]}>Diastolic (mmHg) *</Text>
                <View
                  style={[
                    styles.inputWithIconContainer,
                    !!fieldErrors.diastolic && styles.inputErrorBorder,
                  ]}
                >
                  <View style={[styles.fieldIconBadge, { backgroundColor: Colors.red_FEE2E2 }]}>
                    <MaterialIcons
                      name="favorite"
                      size={ws(16)}
                      color={Colors.redColor}
                    />
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
                {!!fieldErrors.diastolic ? (
                  <View style={styles.errorRow}>
                    <MaterialIcons name="error-outline" size={ws(13)} color={Colors.redColor} />
                    <Text style={styles.errorText}>{fieldErrors.diastolic}</Text>
                  </View>
                ) : (
                  <Text style={styles.helperText}>Accepted range: 30–200 mmHg</Text>
                )}
              </View>
            ) : vitalName === 'Sugar' ? (
              <View style={styles.modalFieldGroup}>
                {!!fieldErrors.sugarGeneral && (
                  <View style={[styles.errorRow, { marginBottom: hs(8) }]}>
                    <MaterialIcons name="error-outline" size={ws(13)} color={Colors.redColor} />
                    <Text style={styles.errorText}>{fieldErrors.sugarGeneral}</Text>
                  </View>
                )}
                <Text style={styles.modalFieldLabel}>Fasting (mg/dL) *</Text>
                <View
                  style={[
                    styles.inputWithIconContainer,
                    !!fieldErrors.value && styles.inputErrorBorder,
                  ]}
                >
                  <View style={[styles.fieldIconBadge, { backgroundColor: Colors.purple_EDE9FE }]}>
                    <MaterialIcons
                      name="opacity"
                      size={ws(16)}
                      color={Colors.purple_8B5CF6}
                    />
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
                {!!fieldErrors.value ? (
                  <View style={styles.errorRow}>
                    <MaterialIcons name="error-outline" size={ws(13)} color={Colors.redColor} />
                    <Text style={styles.errorText}>{fieldErrors.value}</Text>
                  </View>
                ) : (
                  <Text style={styles.helperText}>Accepted range: 20–1000 mg/dL</Text>
                )}

                <Text style={[styles.modalFieldLabel, { marginTop: hs(10) }]}>Random (mg/dL) *</Text>
                <View
                  style={[
                    styles.inputWithIconContainer,
                    !!fieldErrors.sugarRandom && styles.inputErrorBorder,
                  ]}
                >
                  <View style={[styles.fieldIconBadge, { backgroundColor: Colors.purple_EDE9FE }]}>
                    <MaterialIcons
                      name="opacity"
                      size={ws(16)}
                      color={Colors.purple_8B5CF6}
                    />
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
                {!!fieldErrors.sugarRandom ? (
                  <View style={styles.errorRow}>
                    <MaterialIcons name="error-outline" size={ws(13)} color={Colors.redColor} />
                    <Text style={styles.errorText}>{fieldErrors.sugarRandom}</Text>
                  </View>
                ) : (
                  <Text style={styles.helperText}>Accepted range: 20–1000 mg/dL</Text>
                )}
              </View>
            ) : vitalName === 'Temperature' ? (
              <View style={styles.modalFieldGroup}>
                <Text style={styles.modalFieldLabel}>Temperature (°C) *</Text>
                <View
                  style={[
                    styles.inputWithIconContainer,
                    !!fieldErrors.value && styles.inputErrorBorder,
                  ]}
                >
                  <View style={[styles.fieldIconBadge, { backgroundColor: Colors.amber_FEF3C7 }]}>
                    <MaterialIcons
                      name="thermostat"
                      size={ws(16)}
                      color={Colors.amber_D97706}
                    />
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
                {!!fieldErrors.value ? (
                  <View style={styles.errorRow}>
                    <MaterialIcons name="error-outline" size={ws(13)} color={Colors.redColor} />
                    <Text style={styles.errorText}>{fieldErrors.value}</Text>
                  </View>
                ) : (
                  <Text style={styles.helperText}>
                    Accepted range: 25.0 – 45.0 °C (Normal: 36.1 – 37.5 °C)
                  </Text>
                )}
              </View>
            ) : vitalName === 'Weight' ? (
              <View style={styles.modalFieldGroup}>
                <Text style={styles.modalFieldLabel}>Weight (kg) *</Text>
                <View
                  style={[
                    styles.inputWithIconContainer,
                    !!fieldErrors.value && styles.inputErrorBorder,
                  ]}
                >
                  <View style={[styles.fieldIconBadge, { backgroundColor: Colors.green_ECFDF5 }]}>
                    <MaterialIcons
                      name="fitness-center"
                      size={ws(16)}
                      color={Colors.green_10B981}
                    />
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
                {!!fieldErrors.value ? (
                  <View style={styles.errorRow}>
                    <MaterialIcons name="error-outline" size={ws(13)} color={Colors.redColor} />
                    <Text style={styles.errorText}>{fieldErrors.value}</Text>
                  </View>
                ) : (
                  <Text style={styles.helperText}>Accepted range: 1 – 500 kg</Text>
                )}
              </View>
            ) : (
              <View style={styles.modalFieldGroup}>
                <Text style={styles.modalFieldLabel}>{vitalName === 'SpO2' ? 'SpO2 (%) *' : `${vitalName} *`}</Text>
                <View
                  style={[
                    styles.inputWithIconContainer,
                    !!fieldErrors.value && styles.inputErrorBorder,
                  ]}
                >
                  <View style={[styles.fieldIconBadge, { backgroundColor: Colors.sky_E0F2FE }]}>
                    <MaterialIcons
                      name="air"
                      size={ws(16)}
                      color={Colors.sky_0284C7}
                    />
                  </View>
                  <TextInput
                    style={styles.textInputWithIcon}
                    placeholder={`Enter ${vitalName} reading`}
                    placeholderTextColor={Colors.slate_94A3B8}
                    keyboardType="decimal-pad"
                    value={value}
                    onChangeText={onChangeValue}
                    maxLength={FIELD_LIMITS.VITAL_INPUT_MAX}
                  />
                  {vitalName === 'SpO2' && <Text style={styles.inputUnitSuffix}>%</Text>}
                </View>
                {!!fieldErrors.value ? (
                  <View style={styles.errorRow}>
                    <MaterialIcons name="error-outline" size={ws(13)} color={Colors.redColor} />
                    <Text style={styles.errorText}>{fieldErrors.value}</Text>
                  </View>
                ) : vitalName === 'SpO2' ? (
                  <Text style={styles.helperText}>Accepted range: 70–100% (Normal: 95–100%)</Text>
                ) : null}
              </View>
            )}

            {/* General API Error Row */}
            {!!fieldErrors.general && (
              <View style={styles.generalErrorBox}>
                <MaterialIcons name="error-outline" size={ws(16)} color={Colors.redColor} style={{ marginTop: hs(1) }} />
                <Text style={styles.generalErrorText}>{fieldErrors.general}</Text>
              </View>
            )}
          </ScrollView>

          {/* Bottom Action Buttons */}
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => {
                Keyboard.dismiss();
                onClose();
              }}
            >
              <Text style={styles.cancelText}>Close</Text>
            </TouchableOpacity>
            <AppButton
              title="Save"
              loading={isSubmitting}
              onPress={onSubmit}
              style={styles.saveBtn}
            />
          </View>

          {/* Date & Time Pickers */}
          <AppDatePickerModal
            visible={showDatePicker}
            onClose={onCloseDatePicker}
            initialDate={selectedDate}
            maxDate={new Date()}
            useNativeModal={false}
            onSelectDate={onSelectDate}
            title="Select Date"
          />

          <AppTimePickerModal
            visible={showTimePicker}
            onClose={onCloseTimePicker}
            initialTime={selectedTime}
            useNativeModal={false}
            onSelectTime={onSelectTime}
            title="Select Time"
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export const AddEditVitalModal = React.memo(AddEditVitalModalComponent);

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  backdropPressable: {
    flex: 1,
  },
  modalBox: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: ws(24),
    borderTopRightRadius: ws(24),
    paddingHorizontal: ws(20),
    paddingTop: hs(20),
    maxHeight: '90%',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: hs(14),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(18),
    color: Colors.primaryFontColor,
  },
  modalScrollBody: {
    maxHeight: hs(420),
    marginTop: hs(12),
  },
  modalScrollContent: {
    paddingBottom: hs(16),
  },
  modalFieldGroup: {
    marginBottom: hs(14),
  },
  modalFieldLabel: {
    ...TYPOGRAPHY.medium,
    fontSize: fs(13),
    color: Colors.primaryFontColor,
    marginBottom: hs(6),
  },
  memberBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: ws(12),
    paddingHorizontal: ws(14),
    paddingVertical: hs(12),
    backgroundColor: Colors.slate_F8FAFC,
  },
  memberBoxReadOnly: {
    backgroundColor: Colors.slate_F1F5F9,
    borderColor: Colors.slate_E2E8F0,
  },
  memberBoxText: {
    ...TYPOGRAPHY.semiBold,
    fontSize: fs(14),
    color: Colors.primaryFontColor,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: ws(12),
    marginBottom: hs(14),
  },
  pickerTriggerBoxLocked: {
    backgroundColor: Colors.slate_F1F5F9,
    borderColor: Colors.slate_E2E8F0,
  },
  pickerTriggerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: ws(12),
    paddingHorizontal: ws(12),
    paddingVertical: hs(11),
    backgroundColor: Colors.white,
  },
  pickerTriggerText: {
    flex: 1,
    ...TYPOGRAPHY.medium,
    fontSize: fs(13),
    color: Colors.primaryFontColor,
    marginRight: ws(6),
  },
  placeholderText: {
    color: Colors.slate_94A3B8,
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
    borderColor: Colors.border,
    borderRadius: ws(12),
    paddingHorizontal: ws(14),
    paddingVertical: hs(11),
    backgroundColor: Colors.white,
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
  inputErrorBorder: {
    borderColor: Colors.redColor,
    backgroundColor: Colors.red_FFF5F5,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(4),
    marginTop: hs(4),
  },
  errorText: {
    ...TYPOGRAPHY.regular,
    fontSize: fs(11),
    color: Colors.redColor,
  },
  helperText: {
    ...TYPOGRAPHY.regular,
    fontSize: fs(11),
    color: Colors.secondaryFontColor,
    marginTop: hs(4),
  },
  generalErrorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: ws(8),
    marginTop: hs(12),
    paddingHorizontal: ws(12),
    paddingVertical: hs(8),
    backgroundColor: Colors.red_FFF5F5,
    borderRadius: ws(8),
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  generalErrorText: {
    ...TYPOGRAPHY.medium,
    fontSize: fs(12),
    color: Colors.redColor,
    flex: 1,
    lineHeight: fs(17),
  },
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(12),
    paddingTop: hs(14),
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: hs(12),
    borderRadius: ws(12),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.slate_F8FAFC,
  },
  cancelText: {
    ...TYPOGRAPHY.semiBold,
    fontSize: fs(14),
    color: Colors.secondaryFontColor,
  },
  saveBtn: {
    flex: 2,
    borderRadius: ws(12),
  },
});
