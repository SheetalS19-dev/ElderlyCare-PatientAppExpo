import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { memo } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../../constants';
import { fs, hs, TYPOGRAPHY, ws } from '../../../utils';

interface GenderPickerModalProps {
  visible: boolean;
  onClose: () => void;
  selectedGender: string;
  onSelectGender: (gender: string) => void;
  options?: string[];
}

const DEFAULT_GENDER_OPTIONS = ['Male', 'Female', 'Other'];

export const GenderPickerModal = memo(({
  visible,
  onClose,
  selectedGender,
  onSelectGender,
  options = DEFAULT_GENDER_OPTIONS,
}: GenderPickerModalProps) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onClose}>
        <View style={styles.pickerModalContent}>
          <Text style={styles.pickerModalTitle}>Select Gender</Text>
          <View style={styles.pickerOptionsList}>
            {options.map((item) => {
              const isSelected = selectedGender === item;
              return (
                <TouchableOpacity
                  key={item}
                  style={[styles.pickerOptionItem, isSelected && styles.pickerOptionSelected]}
                  activeOpacity={0.8}
                  onPress={() => {
                    onSelectGender(item);
                    onClose();
                  }}
                >
                  <Text
                    style={[
                      styles.pickerOptionText,
                      isSelected && styles.pickerOptionTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                  {isSelected && <MaterialIcons name="check" size={18} color={Colors.white} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
});

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: ws(20),
  },
  pickerModalContent: {
    backgroundColor: Colors.white,
    borderRadius: fs(18),
    padding: ws(20),
    width: '100%',
    maxWidth: ws(340),
  },
  pickerModalTitle: {
    fontSize: fs(16),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
    marginBottom: hs(14),
  },
  pickerOptionsList: {
    gap: hs(8),
  },
  pickerOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ws(16),
    paddingVertical: hs(12),
    borderRadius: fs(10),
    backgroundColor: Colors.slate_F8FAFC,
    borderWidth: 1,
    borderColor: Colors.slate_E2E8F0,
  },
  pickerOptionSelected: {
    backgroundColor: Colors.primaryColor,
    borderColor: Colors.primaryColor,
  },
  pickerOptionText: {
    fontSize: fs(14),
    ...TYPOGRAPHY.medium,
    color: Colors.primaryFontColor,
  },
  pickerOptionTextSelected: {
    color: Colors.white,
    ...TYPOGRAPHY.bold,
  },
});
