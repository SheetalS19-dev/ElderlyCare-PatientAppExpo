import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../../constants';
import { fs, hs, ws } from '../../../utils/metrics';
import { TYPOGRAPHY } from '../../../utils/typography';

export type VitalFilterType = 'All' | 'Today' | '7 Days' | '30 Days' | 'Custom';

interface Props {
  visible: boolean;
  activeFilter: VitalFilterType;
  onSelectFilter: (filter: VitalFilterType) => void;
  onClose: () => void;
}

const FILTER_OPTIONS: VitalFilterType[] = ['All', 'Today', '7 Days', '30 Days'];

export const VitalDateFilterModal: React.FC<Props> = ({
  visible,
  activeFilter,
  onSelectFilter,
  onClose,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.pickerModalBackdrop}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.filterMenuBox}>
          <Text style={styles.filterMenuTitle}>Filter By Date</Text>
          {FILTER_OPTIONS.map((f) => (
            <TouchableOpacity
              key={`opt-${f}`}
              style={[
                styles.filterMenuItem,
                activeFilter === f && styles.filterMenuItemActive,
              ]}
              onPress={() => {
                onSelectFilter(f);
                onClose();
              }}
            >
              <Text
                style={[
                  styles.filterMenuItemText,
                  activeFilter === f && styles.filterMenuItemTextActive,
                ]}
              >
                {f === 'All'
                  ? 'All Records'
                  : f === 'Today'
                    ? 'Today'
                    : `Last ${f}`}
              </Text>
              {activeFilter === f && (
                <MaterialIcons name="check" size={ws(18)} color={Colors.primaryColor} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  pickerModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: ws(28),
  },
  filterMenuBox: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: ws(16),
    paddingVertical: hs(16),
    paddingHorizontal: ws(12),
    elevation: 8,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  filterMenuTitle: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(15),
    color: Colors.primaryFontColor,
    paddingHorizontal: ws(12),
    paddingBottom: hs(10),
    marginBottom: hs(4),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  filterMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: hs(12),
    paddingHorizontal: ws(12),
    borderRadius: ws(8),
  },
  filterMenuItemActive: {
    backgroundColor: Colors.aquaSoft,
  },
  filterMenuItemText: {
    ...TYPOGRAPHY.medium,
    fontSize: fs(14),
    color: Colors.primaryFontColor,
  },
  filterMenuItemTextActive: {
    ...TYPOGRAPHY.semiBold,
    color: Colors.primaryColor,
  },
});
