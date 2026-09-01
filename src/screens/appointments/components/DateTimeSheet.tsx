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
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Colors, Typography } from '../../../constants';
import {
  useGetBookedTimeSlotsQuery,
  useGetTimeSlotsQuery,
} from '../../../redux/apis/bookingApi';
import type { BookedTimeSlotModel, TimeSlotModel } from '../../../types';
import { DateTimeUtils } from '../../../utils';

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

  // Generate 7 days starting from today
  const calendarDays = useMemo(() => {
    const days = [];
    const now = new Date();
    for (let i = 0; i < 7; i++) {
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

  useEffect(() => {
    if (initialDate) setActiveDate(initialDate);
    else if (calendarDays[0]?.dateStr) setActiveDate(calendarDays[0].dateStr);
  }, [initialDate, calendarDays]);

  const activeDayName = useMemo(() => {
    if (!activeDate) return 'Monday';
    const parts = activeDate.split('-');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      return DAY_NAMES[d.getDay()] || 'Monday';
    }
    return 'Monday';
  }, [activeDate]);

  const effectiveSlotType = String(slotType || appointmentType || '1');

  const appTypeName = useMemo(() => {
    if (effectiveSlotType === '2') return 'Video Consultant';
    if (effectiveSlotType === '3') return 'Emergency';
    return 'OPD';
  }, [effectiveSlotType]);

  // Fetch available slots from backend
  const { data: rawTimeSlots, isLoading: isLoadingSlots } = useGetTimeSlotsQuery(
    { doctId: String(doctId), day: activeDayName, slotType: effectiveSlotType },
    { skip: !visible || !doctId || !activeDayName }
  );

  // Fetch booked slots for the active date
  const { data: rawBookedSlots, isLoading: isLoadingBooked } = useGetBookedTimeSlotsQuery(
    { doctId: String(doctId), date: activeDate, type: appTypeName },
    { skip: !visible || !doctId || !activeDate }
  );

  const timeSlots: TimeSlotModel[] = useMemo(() => {
    let list: any[] = [];
    if (Array.isArray(rawTimeSlots)) list = rawTimeSlots;
    else if (Array.isArray((rawTimeSlots as any)?.data)) list = (rawTimeSlots as any).data;
    else if (Array.isArray((rawTimeSlots as any)?.response)) list = (rawTimeSlots as any).response;
    return list;
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
    const cleanStart = startSlot.trim().toLowerCase();
    return bookedSlots.some((b) => {
      const bSlot = (b.slot || (b as any).time_slots || '').trim().toLowerCase();
      return bSlot === cleanStart || bSlot.includes(cleanStart);
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
      const timeParts = startSlot.split(':');
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

    if (onSelectDateTime) onSelectDateTime(activeDate, start, end);
    if (onConfirm) onConfirm(activeDate, start, end);
    onClose();
  };

  const loading = isLoadingSlots || isLoadingBooked;

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
            {/* 7-Day Date Picker Strip */}
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
              <Text style={styles.sectionTitle}>Available Slots ({activeDayName})</Text>

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
                    const isSelected = initialDate === activeDate && initialTime === start;

                    let bg = '#4CAF50'; // Green (Available)
                    if (isUnavailable) bg = '#F44336'; // Red (Unavailable)
                    if (isSelected) bg = Colors.primaryColor; // Selected

                    return (
                      <TouchableOpacity
                        key={`slot-${index}-${start}`}
                        style={[styles.slotCard, { backgroundColor: bg }]}
                        onPress={() => handleSelectSlot(item)}
                        disabled={isUnavailable}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.slotText} numberOfLines={1}>
                          {start} {end ? `- ${end}` : ''}
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: Typography.fontFamily.bold,
    color: '#1A202C',
  },
  scrollArea: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  calendarStrip: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 4,
  },
  dateCard: {
    width: 62,
    height: 86,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 6,
  },
  dateCardActive: {
    backgroundColor: Colors.primaryColor,
    borderColor: Colors.primaryColor,
  },
  dateMonthText: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.medium,
    color: '#718096',
  },
  dateDayNum: {
    fontSize: 22,
    fontFamily: Typography.fontFamily.bold,
    color: '#1A202C',
    lineHeight: 26,
    marginVertical: 2,
  },
  dateDayName: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.medium,
    color: '#718096',
  },
  dateTextActive: {
    color: '#FFFFFF',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 16,
  },
  slotsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: Typography.fontFamily.bold,
    color: '#2D3748',
    marginBottom: 12,
  },
  loadingBox: {
    paddingVertical: 30,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    fontFamily: Typography.fontFamily.regular,
    color: '#718096',
  },
  emptyBox: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF5F5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FED7D7',
  },
  emptyText: {
    marginTop: 8,
    fontSize: 13,
    fontFamily: Typography.fontFamily.medium,
    color: '#E53E3E',
    textAlign: 'center',
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotCard: {
    width: '31%',
    height: 44,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  slotText: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.bold,
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
