import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useMemo, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../../constants';
import { fs, hs, ws } from '../../utils/metrics';
import { TYPOGRAPHY } from '../../utils/typography';

export interface AppDatePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectDate: (dateStr: string) => void;
  initialDate?: string; // YYYY-MM-DD
  maxDate?: Date;
  minDate?: Date;
  title?: string;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export const AppDatePickerModal: React.FC<AppDatePickerModalProps> = ({
  visible,
  onClose,
  onSelectDate,
  initialDate,
  maxDate = new Date(),
  minDate = new Date(1920, 0, 1),
  title = 'Select Date of Birth',
}) => {
  const parsedInitial = useMemo(() => {
    if (initialDate && /^\d{4}-\d{2}-\d{2}$/.test(initialDate)) {
      const [y, m, d] = initialDate.split('-').map((n) => parseInt(n, 10));
      return new Date(y, m - 1, d);
    }
    return new Date(2000, 0, 1);
  }, [initialDate]);

  const [currentYear, setCurrentYear] = useState<number>(parsedInitial.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(parsedInitial.getMonth());
  const [selectedDay, setSelectedDay] = useState<number>(parsedInitial.getDate());
  const [showYearSelector, setShowYearSelector] = useState<boolean>(false);

  // Generate list of selectable years (from current year down to 1920)
  const availableYears = useMemo(() => {
    const years: number[] = [];
    const maxYear = maxDate.getFullYear();
    const minYear = minDate.getFullYear();
    for (let y = maxYear; y >= minYear; y--) {
      years.push(y);
    }
    return years;
  }, [maxDate, minDate]);

  // Days matrix for the current month and year
  const daysInMonth = useMemo(() => {
    return new Date(currentYear, currentMonth + 1, 0).getDate();
  }, [currentYear, currentMonth]);

  const firstDayWeekday = useMemo(() => {
    return new Date(currentYear, currentMonth, 1).getDay();
  }, [currentYear, currentMonth]);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    const maxYear = maxDate.getFullYear();
    const maxMonth = maxDate.getMonth();
    if (currentYear > maxYear || (currentYear === maxYear && currentMonth >= maxMonth)) {
      return;
    }
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleDayPress = (day: number) => {
    const candidate = new Date(currentYear, currentMonth, day);
    if (candidate > maxDate || candidate < minDate) return;
    setSelectedDay(day);
  };

  const handleConfirm = () => {
    const yyyy = currentYear;
    const mm = String(currentMonth + 1).padStart(2, '0');
    const dd = String(selectedDay).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    onSelectDate(dateStr);
    onClose();
  };

  const isSelected = (day: number) => {
    return selectedDay === day;
  };

  const isDayDisabled = (day: number) => {
    const candidate = new Date(currentYear, currentMonth, day);
    return candidate > maxDate || candidate < minDate;
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <MaterialIcons name="close" size={fs(22)} color="#718096" />
            </TouchableOpacity>
          </View>

          {/* Month & Year Bar */}
          <View style={styles.monthYearBar}>
            <TouchableOpacity
              style={styles.yearDropdownBtn}
              onPress={() => setShowYearSelector(!showYearSelector)}
              activeOpacity={0.7}
            >
              <Text style={styles.yearText}>{MONTH_NAMES[currentMonth]} {currentYear}</Text>
              <MaterialIcons
                name={showYearSelector ? 'arrow-drop-up' : 'arrow-drop-down'}
                size={fs(22)}
                color="#1A202C"
              />
            </TouchableOpacity>

            {!showYearSelector && (
              <View style={styles.navArrowsRow}>
                <TouchableOpacity style={styles.arrowBtn} onPress={handlePrevMonth}>
                  <MaterialIcons name="chevron-left" size={fs(24)} color="#4A5568" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.arrowBtn} onPress={handleNextMonth}>
                  <MaterialIcons name="chevron-right" size={fs(24)} color="#4A5568" />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {showYearSelector ? (
            /* Year Picker Grid */
            <ScrollView style={styles.yearScroll} contentContainerStyle={styles.yearGrid}>
              {availableYears.map((y) => (
                <TouchableOpacity
                  key={y}
                  style={[styles.yearChip, y === currentYear && styles.yearChipActive]}
                  onPress={() => {
                    setCurrentYear(y);
                    setShowYearSelector(false);
                  }}
                >
                  <Text style={[styles.yearChipText, y === currentYear && styles.yearChipTextActive]}>
                    {y}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            /* Calendar Month Matrix */
            <View style={styles.calendarContainer}>
              {/* Day Labels Row */}
              <View style={styles.dayLabelsRow}>
                {DAY_LABELS.map((lbl, idx) => (
                  <Text key={`lbl-${idx}`} style={styles.dayLabelText}>
                    {lbl}
                  </Text>
                ))}
              </View>

              {/* Days Grid */}
              <View style={styles.daysGrid}>
                {Array.from({ length: firstDayWeekday }).map((_, idx) => (
                  <View key={`empty-${idx}`} style={styles.emptyDayCell} />
                ))}

                {Array.from({ length: daysInMonth }).map((_, idx) => {
                  const dayNum = idx + 1;
                  const selected = isSelected(dayNum);
                  const disabled = isDayDisabled(dayNum);

                  return (
                    <TouchableOpacity
                      key={`day-${dayNum}`}
                      style={[
                        styles.dayCell,
                        selected && styles.dayCellSelected,
                        disabled && styles.dayCellDisabled,
                      ]}
                      onPress={() => handleDayPress(dayNum)}
                      disabled={disabled}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.dayCellText,
                          selected && styles.dayCellTextSelected,
                          disabled && styles.dayCellTextDisabled,
                        ]}
                      >
                        {dayNum}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.footerRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
              <Text style={styles.confirmBtnText}>Set Date</Text>
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: ws(20),
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  modalCard: {
    width: '100%',
    maxWidth: ws(360),
    backgroundColor: '#FFFFFF',
    borderRadius: fs(16),
    padding: ws(16),
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: hs(10),
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    flex: 1,
    ...TYPOGRAPHY.bold,
    fontSize: fs(15),
    color: '#1A202C',
  },
  monthYearBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: hs(10),
    marginBottom: hs(8),
  },
  yearDropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hs(4),
    paddingHorizontal: ws(8),
    borderRadius: fs(6),
    backgroundColor: '#F7FAFC',
  },
  yearText: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(14),
    color: '#1A202C',
  },
  navArrowsRow: {
    flexDirection: 'row',
    gap: ws(4),
  },
  arrowBtn: {
    padding: ws(4),
  },
  calendarContainer: {
    marginTop: hs(4),
  },
  dayLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: hs(6),
  },
  dayLabelText: {
    width: ws(36),
    textAlign: 'center',
    ...TYPOGRAPHY.medium,
    fontSize: fs(12),
    color: '#718096',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  emptyDayCell: {
    width: `${100 / 7}%`,
    height: hs(38),
  },
  dayCell: {
    width: `${100 / 7}%`,
    height: hs(38),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: fs(19),
  },
  dayCellSelected: {
    backgroundColor: Colors.primaryColor,
  },
  dayCellDisabled: {
    opacity: 0.25,
  },
  dayCellText: {
    ...TYPOGRAPHY.medium,
    fontSize: fs(13),
    color: '#1A202C',
  },
  dayCellTextSelected: {
    color: '#FFFFFF',
    ...TYPOGRAPHY.bold,
  },
  dayCellTextDisabled: {
    color: '#A0AEC0',
  },
  yearScroll: {
    height: hs(230),
    marginVertical: hs(6),
  },
  yearGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingVertical: hs(4),
  },
  yearChip: {
    width: '30%',
    paddingVertical: hs(10),
    borderRadius: fs(8),
    backgroundColor: '#F7FAFC',
    alignItems: 'center',
    marginBottom: hs(8),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  yearChipActive: {
    backgroundColor: Colors.primaryColor,
    borderColor: Colors.primaryColor,
  },
  yearChipText: {
    ...TYPOGRAPHY.medium,
    fontSize: fs(13),
    color: '#2D3748',
  },
  yearChipTextActive: {
    color: '#FFFFFF',
    ...TYPOGRAPHY.bold,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(12),
    marginTop: hs(14),
    paddingTop: hs(10),
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  cancelBtn: {
    flex: 1,
    height: hs(44),
    borderRadius: ws(10),
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(13),
    color: '#64748B',
  },
  confirmBtn: {
    flex: 1,
    height: hs(44),
    backgroundColor: Colors.primaryColor,
    borderRadius: ws(10),
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBtnText: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(13),
    color: '#FFFFFF',
  },
});
