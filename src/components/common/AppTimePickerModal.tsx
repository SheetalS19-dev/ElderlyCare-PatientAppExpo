import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useEffect, useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../../constants';
import { fs, hs, ws } from '../../utils/metrics';
import { TYPOGRAPHY } from '../../utils/typography';

export interface AppTimePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectTime: (timeStr: string) => void;
  initialTime?: string; // "14:28", "09:15", "04:10 PM", etc.
  title?: string;
}

const HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

const DIAL_SIZE = ws(230);
const DIAL_RADIUS = DIAL_SIZE / 2;
const NUMBER_RADIUS = ws(86);
const NUMBER_SIZE = ws(34);

function parseTimeString(timeStr?: string): { hour: number; minute: number; period: 'AM' | 'PM' } {
  if (!timeStr) {
    const now = new Date();
    const h = now.getHours();
    const m = Math.floor(now.getMinutes() / 5) * 5;
    return {
      hour: h % 12 || 12,
      minute: m >= 60 ? 55 : m,
      period: h >= 12 ? 'PM' : 'AM',
    };
  }

  const isPM = /PM/i.test(timeStr);
  const isAM = /AM/i.test(timeStr);

  const clean = timeStr.replace(/[^\d:]/g, '');
  const parts = clean.split(':');
  let h = parseInt(parts[0], 10);
  if (isNaN(h)) h = 12;
  let m = parseInt(parts[1], 10);
  if (isNaN(m)) m = 0;

  m = Math.min(55, Math.max(0, Math.floor(m / 5) * 5));

  let period: 'AM' | 'PM';
  if (isPM) {
    period = 'PM';
    if (h > 12) h = h % 12 || 12;
    else if (h === 0) h = 12;
  } else if (isAM) {
    period = 'AM';
    if (h > 12) h = h % 12 || 12;
    else if (h === 0) h = 12;
  } else {
    period = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
  }

  return { hour: h, minute: m, period };
}

export const AppTimePickerModal: React.FC<AppTimePickerModalProps> = ({
  visible,
  onClose,
  onSelectTime,
  initialTime,
  title = 'Select Time',
}) => {
  const [hour, setHour] = useState<number>(12);
  const [minute, setMinute] = useState<number>(0);
  const [period, setPeriod] = useState<'AM' | 'PM'>('AM');
  const [pickerMode, setPickerMode] = useState<'hour' | 'minute'>('hour');

  useEffect(() => {
    if (visible) {
      const parsed = parseTimeString(initialTime);
      setHour(parsed.hour);
      setMinute(parsed.minute);
      setPeriod(parsed.period);
      setPickerMode('hour');
    }
  }, [visible, initialTime]);

  const handleSelectHour = (h: number) => {
    setHour(h);
    // Smoothly auto-switch to minute view after brief feedback
    setTimeout(() => {
      setPickerMode('minute');
    }, 200);
  };

  const handleSelectMinute = (m: number) => {
    setMinute(m);
  };

  const handleConfirm = () => {
    let h24 = hour;
    if (period === 'PM' && hour < 12) h24 += 12;
    if (period === 'AM' && hour === 12) h24 = 0;

    const formattedHour = h24.toString().padStart(2, '0');
    const formattedMin = minute.toString().padStart(2, '0');
    onSelectTime(`${formattedHour}:${formattedMin}`);
    onClose();
  };

  // Calculate rotation angle of clock hand
  const currentAngle =
    pickerMode === 'hour'
      ? ((hour % 12) * 30)
      : ((minute / 5) * 30);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <MaterialIcons name="schedule" size={fs(18)} color={Colors.primaryColor} />
              <Text style={styles.title}>{title}</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.closeBtn}
            >
              <MaterialIcons name="close" size={fs(18)} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Time Display with Hour/Minute Switcher & AM/PM Pills */}
          <View style={styles.timeDisplayRow}>
            {/* Hour & Minute Digits */}
            <View style={styles.digitsContainer}>
              <TouchableOpacity
                style={[styles.digitBox, pickerMode === 'hour' && styles.digitBoxActive]}
                activeOpacity={0.8}
                onPress={() => setPickerMode('hour')}
              >
                <Text style={[styles.digitText, pickerMode === 'hour' && styles.digitTextActive]}>
                  {hour.toString().padStart(2, '0')}
                </Text>
              </TouchableOpacity>

              <Text style={styles.colonText}>:</Text>

              <TouchableOpacity
                style={[styles.digitBox, pickerMode === 'minute' && styles.digitBoxActive]}
                activeOpacity={0.8}
                onPress={() => setPickerMode('minute')}
              >
                <Text style={[styles.digitText, pickerMode === 'minute' && styles.digitTextActive]}>
                  {minute.toString().padStart(2, '0')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* AM / PM Segmented Control */}
            <View style={styles.periodContainer}>
              <TouchableOpacity
                style={[styles.periodBtn, period === 'AM' && styles.periodBtnActive]}
                activeOpacity={0.8}
                onPress={() => setPeriod('AM')}
              >
                <Text style={[styles.periodText, period === 'AM' && styles.periodTextActive]}>
                  AM
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.periodBtn, period === 'PM' && styles.periodBtnActive]}
                activeOpacity={0.8}
                onPress={() => setPeriod('PM')}
              >
                <Text style={[styles.periodText, period === 'PM' && styles.periodTextActive]}>
                  PM
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Mode Indicator Hint */}
          <View style={styles.modeHintRow}>
            <Text style={styles.modeHintText}>
              Select {pickerMode === 'hour' ? 'Hour' : 'Minute'}
            </Text>
            <TouchableOpacity
              style={styles.switchModePill}
              onPress={() => setPickerMode(pickerMode === 'hour' ? 'minute' : 'hour')}
            >
              <MaterialIcons
                name="swap-horiz"
                size={fs(14)}
                color={Colors.primaryColor}
                style={{ marginRight: ws(3) }}
              />
              <Text style={styles.switchModeText}>
                Switch to {pickerMode === 'hour' ? 'Minutes' : 'Hours'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Clock Dial View */}
          <View style={styles.clockDialWrapper}>
            <View style={styles.clockDial}>
              {/* Central Clock Hand Line */}
              <View
                style={[
                  styles.clockHandContainer,
                  {
                    transform: [{ rotate: `${currentAngle}deg` }],
                  },
                ]}
              >
                <View style={styles.clockHandLine} />
              </View>

              {/* Central Clock Pin Dot */}
              <View style={styles.clockCenterPin} />

              {/* Clock Numbers Rendered Radially */}
              {pickerMode === 'hour'
                ? HOURS.map((h) => {
                  const angleRad = ((h * 30 - 90) * Math.PI) / 180;
                  const x = DIAL_RADIUS + NUMBER_RADIUS * Math.cos(angleRad) - NUMBER_SIZE / 2;
                  const y = DIAL_RADIUS + NUMBER_RADIUS * Math.sin(angleRad) - NUMBER_SIZE / 2;
                  const isSelected = hour === h;

                  return (
                    <TouchableOpacity
                      key={`hour-${h}`}
                      style={[
                        styles.numberPill,
                        { left: x, top: y },
                        isSelected && styles.numberPillSelected,
                      ]}
                      activeOpacity={0.7}
                      onPress={() => handleSelectHour(h)}
                    >
                      <Text style={[styles.numberText, isSelected && styles.numberTextSelected]}>
                        {h}
                      </Text>
                    </TouchableOpacity>
                  );
                })
                : MINUTES.map((m) => {
                  const angleRad = (((m / 5) * 30 - 90) * Math.PI) / 180;
                  const x = DIAL_RADIUS + NUMBER_RADIUS * Math.cos(angleRad) - NUMBER_SIZE / 2;
                  const y = DIAL_RADIUS + NUMBER_RADIUS * Math.sin(angleRad) - NUMBER_SIZE / 2;
                  const isSelected = minute === m;

                  return (
                    <TouchableOpacity
                      key={`min-${m}`}
                      style={[
                        styles.numberPill,
                        { left: x, top: y },
                        isSelected && styles.numberPillSelected,
                      ]}
                      activeOpacity={0.7}
                      onPress={() => handleSelectMinute(m)}
                    >
                      <Text style={[styles.numberText, isSelected && styles.numberTextSelected]}>
                        {m.toString().padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.footerRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm} activeOpacity={0.85}>
              <Text style={styles.confirmBtnText}>Set Time</Text>
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
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: ws(16),
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  modalCard: {
    width: '100%',
    maxWidth: ws(340),
    backgroundColor: Colors.white,
    borderRadius: fs(20),
    paddingHorizontal: ws(18),
    paddingTop: hs(16),
    paddingBottom: hs(18),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hs(12),
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(6),
  },
  title: {
    fontSize: fs(15),
    ...TYPOGRAPHY.bold,
    color: '#1E293B',
  },
  closeBtn: {
    padding: ws(4),
  },
  timeDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F1F5F9',
    borderRadius: fs(14),
    paddingHorizontal: ws(12),
    paddingVertical: hs(8),
    marginBottom: hs(10),
  },
  digitsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(4),
  },
  digitBox: {
    paddingHorizontal: ws(14),
    paddingVertical: hs(6),
    borderRadius: fs(10),
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  digitBoxActive: {
    backgroundColor: Colors.primaryColor,
    borderColor: Colors.primaryColor,
  },
  digitText: {
    fontSize: fs(24),
    ...TYPOGRAPHY.bold,
    color: '#1E293B',
  },
  digitTextActive: {
    color: Colors.white,
  },
  colonText: {
    fontSize: fs(24),
    ...TYPOGRAPHY.bold,
    color: '#64748B',
    marginHorizontal: ws(2),
  },
  periodContainer: {
    flexDirection: 'column',
    backgroundColor: Colors.white,
    borderRadius: fs(10),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  periodBtn: {
    paddingHorizontal: ws(12),
    paddingVertical: hs(5),
    alignItems: 'center',
  },
  periodBtnActive: {
    backgroundColor: Colors.primaryColor,
  },
  periodText: {
    fontSize: fs(12),
    ...TYPOGRAPHY.bold,
    color: '#64748B',
  },
  periodTextActive: {
    color: Colors.white,
  },
  modeHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hs(8),
    paddingHorizontal: ws(4),
  },
  modeHintText: {
    fontSize: fs(12),
    ...TYPOGRAPHY.semiBold,
    color: '#64748B',
  },
  switchModePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: ws(8),
    paddingVertical: hs(3),
    borderRadius: fs(10),
  },
  switchModeText: {
    fontSize: fs(11),
    ...TYPOGRAPHY.medium,
    color: Colors.primaryColor,
  },
  clockDialWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: hs(4),
  },
  clockDial: {
    width: DIAL_SIZE,
    height: DIAL_SIZE,
    borderRadius: DIAL_RADIUS,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clockCenterPin: {
    width: ws(10),
    height: ws(10),
    borderRadius: 999,
    backgroundColor: Colors.primaryColor,
    position: 'absolute',
    zIndex: 5,
  },
  clockHandContainer: {
    position: 'absolute',
    width: DIAL_SIZE,
    height: DIAL_SIZE,
    alignItems: 'center',
    justifyContent: 'flex-start',
    zIndex: 3,
  },
  clockHandLine: {
    width: 2.5,
    height: NUMBER_RADIUS + ws(4),
    backgroundColor: Colors.primaryColor,
    marginTop: DIAL_RADIUS - NUMBER_RADIUS - ws(4),
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  numberPill: {
    position: 'absolute',
    width: NUMBER_SIZE,
    height: NUMBER_SIZE,
    borderRadius: NUMBER_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  numberPillSelected: {
    backgroundColor: Colors.primaryColor,
    shadowColor: Colors.primaryColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  numberText: {
    fontSize: fs(13),
    ...TYPOGRAPHY.bold,
    color: '#334155',
  },
  numberTextSelected: {
    color: Colors.white,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(10),
    marginTop: hs(14),
  },
  cancelBtn: {
    flex: 1,
    height: hs(42),
    borderRadius: fs(10),
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: fs(13),
    ...TYPOGRAPHY.bold,
    color: '#64748B',
  },
  confirmBtn: {
    flex: 1.4,
    height: hs(42),
    borderRadius: fs(10),
    backgroundColor: Colors.primaryColor,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primaryColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  confirmBtnText: {
    fontSize: fs(13.5),
    ...TYPOGRAPHY.bold,
    color: Colors.white,
  },
});
