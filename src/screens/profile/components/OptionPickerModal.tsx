import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../../constants';
import { fs, hs, ws } from '../../../utils/metrics';
import { TYPOGRAPHY } from '../../../utils/typography';

interface Props {
  visible: boolean;
  title: string;
  options: string[];
  selectedValue: string;
  onSelect: (val: string) => void;
  onClose: () => void;
}

export const OptionPickerModal: React.FC<Props> = ({
  visible,
  title,
  options,
  selectedValue,
  onSelect,
  onClose,
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onClose}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{title}</Text>
          <View style={styles.optionsList}>
            {options.map((item) => {
              const isSelected = selectedValue === item;
              return (
                <TouchableOpacity
                  key={item}
                  style={[styles.optionItem, isSelected && styles.optionSelected]}
                  activeOpacity={0.8}
                  onPress={() => {
                    onSelect(item);
                    onClose();
                  }}
                >
                  <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                    {item}
                  </Text>
                  {isSelected && <MaterialIcons name="check" size={ws(18)} color={Colors.white} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: ws(24),
  },
  modalContent: {
    width: '100%',
    maxWidth: ws(320),
    backgroundColor: Colors.white,
    borderRadius: ws(18),
    padding: ws(18),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: hs(4) },
    shadowOpacity: 0.15,
    shadowRadius: ws(10),
    elevation: 5,
  },
  modalTitle: {
    fontSize: fs(14),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
    marginBottom: hs(12),
    paddingBottom: hs(8),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  optionsList: {
    gap: hs(6),
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: hs(10),
    paddingHorizontal: ws(12),
    borderRadius: ws(10),
  },
  optionSelected: {
    backgroundColor: Colors.primaryColor,
  },
  optionText: {
    fontSize: fs(13),
    ...TYPOGRAPHY.medium,
    color: Colors.primaryFontColor,
  },
  optionTextSelected: {
    color: Colors.white,
    ...TYPOGRAPHY.bold,
  },
});
