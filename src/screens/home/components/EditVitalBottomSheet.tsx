import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { memo } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { AppButton, AppTextField } from '../../../components';
import { Colors, Typography } from '../../../constants';
import { DateTimeUtils, fs, hs, TYPOGRAPHY, ws } from '../../../utils';

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
                <Text style={styles.fieldLabel}>Systolic (mmHg)</Text>
                <AppTextField
                  placeholder="e.g. 120"
                  keyboardType="number-pad"
                  value={systolic}
                  onChangeText={onChangeSystolic}
                />
                <Text style={styles.fieldLabel}>Diastolic (mmHg)</Text>
                <AppTextField
                  placeholder="e.g. 80"
                  keyboardType="number-pad"
                  value={diastolic}
                  onChangeText={onChangeDiastolic}
                />
              </>
            ) : vitalType === 'Sugar' ? (
              <>
                <Text style={styles.fieldLabel}>Fasting (mg/dL) *</Text>
                <AppTextField
                  placeholder="e.g. 95"
                  keyboardType="number-pad"
                  value={value}
                  onChangeText={onChangeValue}
                />
                <Text style={styles.fieldLabel}>Random (mg/dL) *</Text>
                <AppTextField
                  placeholder="e.g. 140"
                  keyboardType="number-pad"
                  value={sugarRandom}
                  onChangeText={onChangeSugarRandom}
                />
              </>
            ) : (
              <>
                <Text style={styles.fieldLabel}>{vitalType === 'Temperature' ? 'Temperature (°C)' : vitalType}</Text>
                <AppTextField
                  placeholder={`Enter ${vitalType === 'Temperature' ? 'temperature in °C' : vitalType} reading`}
                  keyboardType="decimal-pad"
                  value={value}
                  onChangeText={onChangeValue}
                />
              </>
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
  modalActions: {
    flexDirection: 'row',
    gap: ws(12),
    marginTop: hs(20),
    marginBottom: hs(10),
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
