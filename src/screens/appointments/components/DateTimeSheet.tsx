import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography } from '../../../constants';
import {
  useGetBookedTimeSlotsQuery,
  useGetTimeSlotsQuery,
} from '../../../redux/apis/bookingApi';
import type { BookedTimeSlotModel, TimeSlotModel } from '../../../types';
import { DateTimeUtils, fs, hs, ws, TYPOGRAPHY } from '../../../utils';

export interface DateTimeSheetProps {
  visible: boolean;
  onClose: () => void;
  doctId: string;
  slotType?: string; // '1' = OPD, '2' = Video, '3' = Emergency
  appointmentType?: string;
  appointmentTypeName?: string;
  selectedDate?: string; // YYYY-MM-DD
  selectedTimeSlot?: string; // HH:mm:ss
  onSelectDateTime?: (date: string, timeSlot: string, endTime?: string) => void;
  onConfirm?: (date: string, timeSlot: string, endTime?: string) => void;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

export const DateTimeSheet: React.FC<DateTimeSheetProps> = ({
  visible,
  onClose,
  doctId,
  slotType,
  appointmentType,
  appointmentTypeName,
  selectedDate: initialDate,
  selectedTimeSlot: initialTime,
  onSelectDateTime,
  onConfirm,
}) => {
  const insets = useSafeAreaInsets();

  // Generate 30 days starting from today
  const calendarDays = useMemo(() => {
    const days = [];
    const now = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      days.push({
        dateStr,
        dayOfWeek: DAY_NAMES[d.getDay()],
        dayOfWeekShort: DAY_NAMES[d.getDay()].slice(0, 3).toUpperCase(),
        dayNum: d.getDate(),
        monthStr: MONTH_NAMES[d.getMonth()],
      });
    }
    return days;
  }, []);

  const [activeDate, setActiveDate] = useState<string>(
    initialDate || calendarDays[0]?.dateStr || ''
  );

  const normalizeTimeStr = (t?: string): string => {
    if (!t) return '';
    const clean = String(t).trim();
    const isPm = /pm/i.test(clean);
    const isAm = /am/i.test(clean);

    const parts = clean.replace(/[^0-9:]/g, '').split(':');
    if (parts.length >= 2) {
      let h = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      if (!isNaN(h) && !isNaN(m)) {
        if (isPm && h < 12) h += 12;
        if (isAm && h === 12) h = 0;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      }
    }
    return clean.slice(0, 5).toLowerCase();
  };

  const [selectedTime, setSelectedTime] = useState<string>(initialTime || '');

  useEffect(() => {
    if (visible) {
      if (initialDate) setActiveDate(initialDate);
      if (initialTime) setSelectedTime(initialTime);
    }
  }, [visible, initialDate, initialTime]);

  const activeDayName = useMemo(() => {
    if (!activeDate) return 'Monday';
    const parts = activeDate.split('-');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      return DAY_NAMES[d.getDay()] || 'Monday';
    }
    return 'Monday';
  }, [activeDate]);

  const activeFormattedDate = useMemo(() => {
    if (!activeDate) return '';
    return DateTimeUtils.getDataFormat(activeDate) || activeDate;
  }, [activeDate]);

  const effectiveSlotType = String(slotType || appointmentType || '1');

  const appTypeName = useMemo(() => {
    if (effectiveSlotType === '2') return 'Video Consultant';
    if (effectiveSlotType === '3') return 'Emergency';
    return 'OPD';
  }, [effectiveSlotType]);

  // Fetch available slots from backend
  const { data: rawTimeSlots, isLoading: isLoadingSlots, isFetching: isFetchingSlots } = useGetTimeSlotsQuery(
    { doctId: String(doctId), day: activeDayName, slotType: effectiveSlotType },
    { skip: !visible || !doctId || !activeDayName }
  );

  // Fetch booked slots for the active date
  const { data: rawBookedSlots, isLoading: isLoadingBooked, isFetching: isFetchingBooked } = useGetBookedTimeSlotsQuery(
    { doctId: String(doctId), date: activeDate, type: appTypeName },
    { skip: !visible || !doctId || !activeDate }
  );

  const timeSlots: TimeSlotModel[] = useMemo(() => {
    let list: any[] = [];
    if (Array.isArray(rawTimeSlots)) list = rawTimeSlots;
    else if (Array.isArray((rawTimeSlots as any)?.data)) list = (rawTimeSlots as any).data;
    else if (Array.isArray((rawTimeSlots as any)?.response)) list = (rawTimeSlots as any).response;

    const seen = new Set<string>();
    const uniqueSlots: any[] = [];

    for (const item of list) {
      const start = item.time_start || item.timeStart || item.start_time || item.time || '';
      const end = item.time_end || item.timeEnd || item.end_time || '';
      const normStart = normalizeTimeStr(start);
      const normEnd = normalizeTimeStr(end);
      const key = normEnd ? `${normStart}-${normEnd}` : normStart;

      if (normStart && !seen.has(key)) {
        seen.add(key);
        uniqueSlots.push(item);
      }
    }

    return uniqueSlots;
  }, [rawTimeSlots]);

  const bookedSlots: BookedTimeSlotModel[] = useMemo(() => {
    let list: any[] = [];
    if (Array.isArray(rawBookedSlots)) list = rawBookedSlots;
    else if (Array.isArray((rawBookedSlots as any)?.data)) list = (rawBookedSlots as any).data;
    else if (Array.isArray((rawBookedSlots as any)?.response)) list = (rawBookedSlots as any).response;
    return list;
  }, [rawBookedSlots]);

  const isSlotBooked = (startSlot: string): boolean => {
    if (!startSlot) return false;
    const cleanStart = normalizeTimeStr(startSlot);
    if (!cleanStart) return false;

    return bookedSlots.some((b) => {
      const rawBSlot = b.slot || (b as any).time_slots || (b as any).time || (b as any).start_time || '';
      const cleanB = normalizeTimeStr(String(rawBSlot));
      return cleanB === cleanStart;
    });
  };

  const isSlotPast = (startSlot: string): boolean => {
    if (!startSlot || !activeDate) return false;
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;

    if (activeDate < todayStr) return true;
    if (activeDate === todayStr) {
      const norm = normalizeTimeStr(startSlot);
      const timeParts = norm.split(':');
      if (timeParts.length >= 2) {
        const slotHour = parseInt(timeParts[0], 10);
        const slotMin = parseInt(timeParts[1], 10);
        const currentHour = today.getHours();
        const currentMin = today.getMinutes();
        if (slotHour < currentHour || (slotHour === currentHour && slotMin <= currentMin)) {
          return true;
        }
      }
    }
    return false;
  };

  const handleSelectSlot = (slot: any) => {
    const start = slot.time_start || slot.timeStart || slot.start_time || slot.time || '';
    const end = slot.time_end || slot.timeEnd || slot.end_time || '';
    if (!start) return;

    if (isSlotPast(start) || isSlotBooked(start)) {
      return;
    }

    setSelectedTime(start);
    if (onSelectDateTime) onSelectDateTime(activeDate, start, end);
    if (onConfirm) onConfirm(activeDate, start, end);
    onClose();
  };

  const loading = isLoadingSlots || isLoadingBooked || isFetchingSlots || isFetchingBooked;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

        <View style={[styles.sheetContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Choose Date And Time</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <MaterialIcons name="close" size={24} color="#4A5568" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {/* 30-Day Date Picker Strip */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.calendarStrip}
            >
              {calendarDays.map((item) => {
                const isSelected = item.dateStr === activeDate;
                return (
                  <TouchableOpacity
                    key={item.dateStr}
                    style={[styles.dateCard, isSelected && styles.dateCardActive]}
                    onPress={() => setActiveDate(item.dateStr)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.dateMonthText, isSelected && styles.dateTextActive]}>
                      {item.monthStr}
                    </Text>
                    <Text style={[styles.dateDayNum, isSelected && styles.dateTextActive]}>
                      {item.dayNum}
                    </Text>
                    <Text style={[styles.dateDayName, isSelected && styles.dateTextActive]}>
                      {item.dayOfWeekShort}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.divider} />

            {/* Time Slots Section */}
            <View style={styles.slotsSection}>
              <Text style={styles.sectionTitle}>
                Available Slots — {activeFormattedDate || activeDayName}
              </Text>

              {/* Legend Bar for Color Clarity */}
              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
                  <Text style={styles.legendText}>Available</Text>
                </View>

                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: Colors.primaryColor }]} />
                  <Text style={styles.legendText}>Selected</Text>
                </View>

                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
                  <Text style={styles.legendText}>Booked</Text>
                </View>
              </View>

              {loading ? (
                <View style={styles.loadingBox}>
                  <ActivityIndicator size="small" color={Colors.primaryColor} />
                  <Text style={styles.loadingText}>Loading time slots...</Text>
                </View>
              ) : timeSlots.length === 0 ? (
                <View style={styles.emptyBox}>
                  <MaterialIcons name="event-busy" size={36} color="#E53E3E" />
                  <Text style={styles.emptyText}>
                    Sorry, no available time slots were found for the selected date.
                  </Text>
                </View>
              ) : (
                <View style={styles.slotsGrid}>
                  {timeSlots.map((item, index) => {
                    const start = item.time_start || item.timeStart || item.start_time || item.time || '';
                    const end = item.time_end || item.timeEnd || item.end_time || '';
                    const isBooked = isSlotBooked(start);
                    const isPast = isSlotPast(start);
                    const isUnavailable = isBooked || isPast;
                    const isSelected =
                      Boolean(selectedTime || initialTime) &&
                      normalizeTimeStr(selectedTime || initialTime) === normalizeTimeStr(start);

                    let cardBg = '#ECFDF5'; // Light Green (Available)
                    let cardBorder = '#A7F3D0';
                    let textColor = '#047857';

                    if (isUnavailable) {
                      cardBg = '#FEF2F2'; // Light Red (Unavailable/Booked)
                      cardBorder = '#FCA5A5';
                      textColor = '#B91C1C';
                    }

                    if (isSelected) {
                      cardBg = Colors.primaryColor; // Blue (Selected)
                      cardBorder = Colors.primaryColor;
                      textColor = '#FFFFFF';
                    }

                    const displayStart = DateTimeUtils.formatTimeToAmPm(start) || start;
                    const displayEnd = end ? (DateTimeUtils.formatTimeToAmPm(end) || end) : '';

                    return (
                      <TouchableOpacity
                        key={`slot-${index}-${start}`}
                        style={[
                          styles.slotCard,
                          { backgroundColor: cardBg, borderColor: cardBorder },
                          isUnavailable && styles.slotCardDisabled,
                        ]}
                        onPress={() => handleSelectSlot(item)}
                        disabled={isUnavailable}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.slotText, { color: textColor }]} numberOfLines={1}>
                          {displayStart}{displayEnd ? ` - ${displayEnd}` : ''}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: '#F7F8FA',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ws(20),
    paddingTop: hs(16),
    paddingBottom: hs(12),
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: fs(20),
    borderTopRightRadius: fs(20),
  },
  headerTitle: {
    fontSize: fs(16),
    ...TYPOGRAPHY.bold,
    color: '#1A202C',
  },
  scrollArea: {
    paddingHorizontal: ws(16),
    paddingTop: hs(16),
  },
  calendarStrip: {
    flexDirection: 'row',
    gap: ws(8),
    paddingBottom: hs(4),
  },
  dateCard: {
    width: ws(62),
    height: hs(86),
    borderRadius: fs(10),
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: hs(6),
  },
  dateCardActive: {
    backgroundColor: Colors.primaryColor,
    borderColor: Colors.primaryColor,
  },
  dateMonthText: {
    fontSize: fs(11),
    ...TYPOGRAPHY.medium,
    color: '#718096',
  },
  dateDayNum: {
    fontSize: fs(22),
    ...TYPOGRAPHY.bold,
    color: '#1A202C',
    lineHeight: hs(26),
    marginVertical: hs(2),
  },
  dateDayName: {
    fontSize: fs(11),
    ...TYPOGRAPHY.medium,
    color: '#718096',
  },
  dateTextActive: {
    color: '#FFFFFF',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: hs(16),
  },
  slotsSection: {
    marginBottom: hs(20),
  },
  sectionTitle: {
    fontSize: fs(14),
    ...TYPOGRAPHY.bold,
    color: '#2D3748',
    marginBottom: hs(12),
  },
  loadingBox: {
    paddingVertical: hs(30),
    alignItems: 'center',
    justifyContent: 'center',
    gap: hs(8),
  },
  loadingText: {
    fontSize: fs(13),
    ...TYPOGRAPHY.regular,
    color: '#718096',
  },
  emptyBox: {
    padding: ws(20),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF5F5',
    borderRadius: fs(8),
    borderWidth: 1,
    borderColor: '#FED7D7',
  },
  emptyText: {
    marginTop: hs(8),
    fontSize: fs(13),
    ...TYPOGRAPHY.medium,
    color: '#E53E3E',
    textAlign: 'center',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: ws(16),
    marginBottom: hs(14),
    backgroundColor: '#FFFFFF',
    paddingHorizontal: ws(12),
    paddingVertical: hs(8),
    borderRadius: fs(8),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(6),
  },
  legendDot: {
    width: ws(10),
    height: hs(10),
    borderRadius: fs(5),
  },
  legendText: {
    fontSize: fs(12),
    ...TYPOGRAPHY.medium,
    color: '#4A5568',
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ws(8),
  },
  slotCard: {
    width: '48.5%',
    height: hs(44),
    borderRadius: fs(10),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: ws(6),
    borderWidth: 1.5,
  },
  slotCardDisabled: {
    opacity: 0.85,
  },
  slotText: {
    fontSize: fs(11.5),
    ...TYPOGRAPHY.bold,
    textAlign: 'center',
  },
});
