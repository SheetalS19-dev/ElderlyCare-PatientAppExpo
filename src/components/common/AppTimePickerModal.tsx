import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, Typography } from '../../constants';

export interface AppTimePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectTime: (timeStr: string) => void;
  initialTime?: string; // "14:28" or "09:15"
  title?: string;
}

export const AppTimePickerModal: React.FC<AppTimePickerModalProps> = ({
  visible,
  onClose,
  onSelectTime,
  initialTime,
  title = 'Select Time',
}) => {
  const initialHour = initialTime ? parseInt(initialTime.split(':')[0], 10) || 12 : 12;
  const initialMinute = initialTime ? parseInt(initialTime.split(':')[1], 10) || 0 : 0;

  const [hour, setHour] = useState<number>(initialHour % 12 || 12);
  const [minute, setMinute] = useState<number>(Math.floor(initialMinute / 5) * 5);
  const [period, setPeriod] = useState<'AM' | 'PM'>(initialHour >= 12 ? 'PM' : 'AM');

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5);

  const handleConfirm = () => {
    let h24 = hour;
    if (period === 'PM' && hour < 12) h24 += 12;
    if (period === 'AM' && hour === 12) h24 = 0;

    const formattedHour = h24.toString().padStart(2, '0');
    const formattedMin = minute.toString().padStart(2, '0');
    onSelectTime(`${formattedHour}:${formattedMin}`);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.box}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <MaterialIcons name="close" size={22} color={Colors.primaryFontColor} />
            </TouchableOpacity>
          </View>

          {/* Time Display */}
          <View style={styles.timeDisplayBox}>
            <Text style={styles.timeDisplayText}>
              {hour.toString().padStart(2, '0')}:{minute.toString().padStart(2, '0')} {period}
            </Text>
          </View>

          {/* Selector Columns */}
          <View style={styles.columnsRow}>
            {/* Hours Column */}
            <View style={styles.column}>
              <Text style={styles.columnLabel}>Hour</Text>
              <ScrollView style={styles.scrollList} showsVerticalScrollIndicator={false}>
                {hours.map((h) => (
                  <TouchableOpacity
                    key={`h-${h}`}
                    style={[styles.itemPill, hour === h && styles.itemPillActive]}
                    onPress={() => setHour(h)}
                  >
                    <Text style={[styles.itemText, hour === h && styles.itemTextActive]}>
                      {h.toString().padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Minutes Column */}
            <View style={styles.column}>
              <Text style={styles.columnLabel}>Minute</Text>
              <ScrollView style={styles.scrollList} showsVerticalScrollIndicator={false}>
                {minutes.map((m) => (
                  <TouchableOpacity
                    key={`m-${m}`}
                    style={[styles.itemPill, minute === m && styles.itemPillActive]}
                    onPress={() => setMinute(m)}
                  >
                    <Text style={[styles.itemText, minute === m && styles.itemTextActive]}>
                      {m.toString().padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* AM / PM Column */}
            <View style={styles.column}>
              <Text style={styles.columnLabel}>Period</Text>
              <View style={styles.periodCol}>
                {(['AM', 'PM'] as const).map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[styles.itemPill, period === p && styles.itemPillActive]}
                    onPress={() => setPeriod(p)}
                  >
                    <Text style={[styles.itemText, period === p && styles.itemTextActive]}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
              <Text style={styles.confirmText}>Set Time</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  box: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 18,
    elevation: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontFamily: Typography.fontFamily.bold,
    color: '#0F172A',
  },
  timeDisplayBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 14,
  },
  timeDisplayText: {
    fontSize: 22,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryColor,
  },
  columnsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 160,
    marginBottom: 16,
  },
  column: {
    flex: 1,
    alignItems: 'center',
  },
  columnLabel: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.bold,
    color: '#64748B',
    marginBottom: 6,
  },
  scrollList: {
    width: '100%',
  },
  periodCol: {
    gap: 8,
  },
  itemPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 4,
  },
  itemPillActive: {
    backgroundColor: Colors.primaryColor,
  },
  itemText: {
    fontSize: 14,
    fontFamily: Typography.fontFamily.medium,
    color: '#334155',
  },
  itemTextActive: {
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
  },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  cancelText: {
    fontSize: 13,
    fontFamily: Typography.fontFamily.medium,
    color: '#64748B',
  },
  confirmBtn: {
    backgroundColor: Colors.primaryColor,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 10,
  },
  confirmText: {
    fontSize: 13,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.white,
  },
});
