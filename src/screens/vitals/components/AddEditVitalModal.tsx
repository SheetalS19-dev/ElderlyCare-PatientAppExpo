import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../../../constants';
import { fs, hs, ws } from '../../../utils/metrics';
import { TYPOGRAPHY } from '../../../utils/typography';

interface Props {
  visible: boolean;
  vitalName: string;
  isEditing: boolean;
  selectedDate: string;
  onOpenDatePicker: () => void;
  selectedTime: string;
  onOpenTimePicker: () => void;
  systolic: string;
  onChangeSystolic: (t: string) => void;
  diastolic: string;
  onChangeDiastolic: (t: string) => void;
  value: string;
  onChangeValue: (t: string) => void;
  sugarRandom: string;
  onChangeSugarRandom: (t: string) => void;
  onSubmit: () => void;
  onClose: () => void;
  isSubmitting: boolean;
}

export const AddEditVitalModal: React.FC<Props> = ({
  visible,
  vitalName,
  isEditing,
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
  onClose,
  isSubmitting,
}) => {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheetCard}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={styles.title}>
              {isEditing ? `Edit ${vitalName}` : `Log ${vitalName}`}
            </Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <MaterialIcons name="close" size={ws(22)} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
            {/* Date & Time Selectors */}
            <View style={styles.rowTwoCols}>
              <View style={styles.colHalf}>
                <Text style={styles.label}>Date *</Text>
                <TouchableOpacity style={styles.pickerBtn} onPress={onOpenDatePicker}>
                  <Text style={styles.pickerText}>{selectedDate}</Text>
                  <MaterialIcons name="calendar-today" size={ws(16)} color="#64748B" />
                </TouchableOpacity>
              </View>
              <View style={styles.colHalf}>
                <Text style={styles.label}>Time *</Text>
                <TouchableOpacity style={styles.pickerBtn} onPress={onOpenTimePicker}>
                  <Text style={styles.pickerText}>{selectedTime}</Text>
                  <MaterialIcons name="schedule" size={ws(16)} color="#64748B" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Metric Fields based on Vital Name */}
            {vitalName === 'Blood Pressure' ? (
              <View style={styles.rowTwoCols}>
                <View style={styles.colHalf}>
                  <Text style={styles.label}>Systolic (mmHg) *</Text>
                  <TextInput
                    style={styles.input}
                    value={systolic}
                    onChangeText={onChangeSystolic}
                    placeholder="e.g. 120"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.colHalf}>
                  <Text style={styles.label}>Diastolic (mmHg) *</Text>
                  <TextInput
                    style={styles.input}
                    value={diastolic}
                    onChangeText={onChangeDiastolic}
                    placeholder="e.g. 80"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                  />
                </View>
              </View>
            ) : vitalName === 'Sugar' ? (
              <View style={styles.rowTwoCols}>
                <View style={styles.colHalf}>
                  <Text style={styles.label}>Fasting (mg/dL)</Text>
                  <TextInput
                    style={styles.input}
                    value={value}
                    onChangeText={onChangeValue}
                    placeholder="e.g. 95"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.colHalf}>
                  <Text style={styles.label}>Random / PP (mg/dL)</Text>
                  <TextInput
                    style={styles.input}
                    value={sugarRandom}
                    onChangeText={onChangeSugarRandom}
                    placeholder="e.g. 140"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                  />
                </View>
              </View>
            ) : (
              <View style={styles.fieldWrapper}>
                <Text style={styles.label}>
                  {vitalName} Value ({vitalName === 'Weight' ? 'kg' : vitalName === 'Temperature' ? '°F' : '%'}) *
                </Text>
                <TextInput
                  style={styles.input}
                  value={value}
                  onChangeText={onChangeValue}
                  placeholder={`Enter ${vitalName} value`}
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                />
              </View>
            )}
          </ScrollView>

          <View style={styles.footerRow}>
            <TouchableOpacity
              style={styles.cancelBtn}
              activeOpacity={0.8}
              onPress={onClose}
              disabled={isSubmitting}
            >
              <Text style={styles.cancelBtnText}>Close</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.submitBtn}
              activeOpacity={0.85}
              onPress={onSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={Colors.white} />
              ) : (
                <Text style={styles.submitBtnText}>
                  {isEditing ? 'Update Vital' : 'Save Entry'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheetCard: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: ws(24),
    borderTopRightRadius: ws(24),
    paddingHorizontal: ws(20),
    paddingTop: hs(12),
    maxHeight: '80%',
  },
  handle: {
    width: ws(36),
    height: hs(4),
    borderRadius: ws(2),
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: hs(12),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hs(16),
    paddingBottom: hs(10),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  title: {
    flex: 1,
    fontSize: fs(16),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
  },
  formScroll: {
    marginBottom: hs(12),
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
  label: {
    fontSize: fs(12),
    ...TYPOGRAPHY.medium,
    color: Colors.primaryFontColor,
    marginBottom: hs(6),
  },
  input: {
    height: hs(44),
    backgroundColor: '#F8FAFC',
    borderRadius: ws(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: ws(12),
    fontSize: fs(13),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
  },
  pickerBtn: {
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
  pickerText: {
    fontSize: fs(13),
    ...TYPOGRAPHY.medium,
    color: Colors.primaryFontColor,
  },
  footerRow: {
    flexDirection: 'row',
    gap: ws(12),
    paddingVertical: hs(16),
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  cancelBtn: {
    flex: 1,
    height: hs(48),
    borderRadius: ws(12),
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: fs(14),
    ...TYPOGRAPHY.bold,
    color: '#64748B',
  },
  submitBtn: {
    flex: 1,
    height: hs(48),
    borderRadius: ws(12),
    backgroundColor: Colors.primaryColor,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primaryColor,
    shadowOffset: { width: 0, height: hs(3) },
    shadowOpacity: 0.2,
    shadowRadius: ws(6),
    elevation: 3,
  },
  submitBtnText: {
    fontSize: fs(14),
    ...TYPOGRAPHY.bold,
    color: Colors.white,
  },
});
