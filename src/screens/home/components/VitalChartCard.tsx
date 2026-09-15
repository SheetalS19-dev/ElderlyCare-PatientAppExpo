import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Line } from 'react-native-svg';
import { Colors } from '../../../constants';
import { DateTimeUtils, isWithinLast7Days } from '../../../utils';
import { ws, hs, fs } from '../../../utils/metrics';
import { TYPOGRAPHY } from '../../../utils/typography';

export interface VitalChartCardProps {
  vitalType: string;
  title: string;
  subtitle: string;
  unit: string;
  iconName: keyof typeof MaterialIcons.glyphMap;
  iconColor: string;
  pillBgColor: string;
  headers: string[];
  records: any;
  latestVal: string;
  onPress: () => void;
  onDeleteRecord?: (id: string | number) => void;
  onEditRecord?: (item: any) => void;
  fullWidth?: boolean;
  yLabels?: string[];
}

export const VitalChartCard: React.FC<VitalChartCardProps> = ({
  vitalType,
  title,
  subtitle,
  unit,
  iconName,
  iconColor,
  pillBgColor,
  headers,
  records,
  onPress,
  onDeleteRecord,
  onEditRecord,
  fullWidth = true,
  yLabels = ['4', '3', '2', '1', '0'],
}) => {
  const last7DaysRecords = useMemo(() => {
    let list: any[] = [];
    if (Array.isArray(records)) list = records;
    else if (Array.isArray(records?.data)) list = records.data;
    else if (Array.isArray(records?.response)) list = records.response;

    const filtered = list.filter((item) => isWithinLast7Days(item.date || item.created_at));
    return [...filtered].sort((a, b) => {
      const timeA = new Date(a.date || a.created_at || 0).getTime();
      const timeB = new Date(b.date || b.created_at || 0).getTime();
      return timeB - timeA;
    });
  }, [records]);

  const hasData = last7DaysRecords.length > 0;

  const { computedYLabels, minY, maxY } = useMemo(() => {
    if (!hasData) {
      if (vitalType === 'Weight' || vitalType === 'Temperature') {
        return { computedYLabels: ['4', '2', '0'], minY: 0, maxY: 4 };
      }
      if (vitalType === 'SpO2') {
        return { computedYLabels: ['100', '90', '80'], minY: 80, maxY: 100 };
      }
      return { computedYLabels: ['4', '3', '2', '1', '0'], minY: 0, maxY: 4 };
    }

    if (vitalType === 'Blood Pressure') {
      let maxV = 0;
      let minV = 999;
      last7DaysRecords.forEach((r) => {
        const s = Number(r.bp_systolic || 0);
        const d = Number(r.bp_diastolic || 0);
        if (s > maxV) maxV = s;
        if (d > 0 && d < minV) minV = d;
      });
      if (maxV === 0) maxV = 140;
      if (minV === 999) minV = 70;

      let top = Math.ceil(maxV / 5) * 5;
      if (top - maxV < 3) top += 5;
      let bottom = Math.floor(minV / 5) * 5;
      if (minV - bottom < 2) bottom -= 5;
      if (bottom < 0) bottom = 0;

      const step = (top - bottom) / 3;
      const labels = [
        String(Math.round(top)),
        String(Math.round(top - step)),
        String(Math.round(top - step * 2)),
        String(Math.round(bottom)),
      ];
      return { computedYLabels: labels, minY: bottom, maxY: top };
    }

    return { computedYLabels: yLabels, minY: 0, maxY: 100 };
  }, [hasData, vitalType, last7DaysRecords, yLabels]);

  const computedUnitLabel = useMemo(() => {
    if (vitalType === 'Weight') return 'Weight (kg)';
    if (vitalType === 'Temperature') return 'Temperature (°C)';
    if (vitalType === 'SpO2') return 'SpO2 (%)';
    return unit;
  }, [vitalType, unit]);

  const xAxisLabels = useMemo(() => {
    if (last7DaysRecords.length > 0) {
      const slice = [...last7DaysRecords].slice(0, 4).reverse();
      return slice.map((item) => {
        const dStr = item.date ? item.date.split('T')[0] : (item.created_at ? item.created_at.split('T')[0] : '');
        let dateFormatted = dStr ? DateTimeUtils.getDataFormat(dStr) : '';
        dateFormatted = dateFormatted.replace(/,?\s*\d{4}/g, '').trim();

        const timeFormatted = item.time ? (DateTimeUtils.formatTimeToAmPm(item.time) || item.time) : '';
        const cleanTime = (timeFormatted && timeFormatted !== '00:00' && timeFormatted !== '12:00 AM') ? timeFormatted : '00:00';
        return `${dateFormatted} ${cleanTime}`;
      });
    }
    const dates = [];
    const today = new Date();
    for (let i = 3; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
      let dateFormatted = DateTimeUtils.getDataFormat(d.toISOString().split('T')[0]);
      dateFormatted = dateFormatted.replace(/,?\s*\d{4}/g, '').trim();
      dates.push(`${dateFormatted} 00:00`);
    }
    return dates;
  }, [last7DaysRecords]);

  return (
    <TouchableOpacity
      style={[styles.vitalsGridCard, fullWidth && styles.vitalsGridCardFull]}
      activeOpacity={0.88}
      onPress={onPress}
    >
      <View style={styles.vitalsCardHeaderRow}>
        <View style={[styles.vitalsIconCircle, { backgroundColor: pillBgColor }]}>
          <MaterialIcons name={iconName} size={fs(18)} color={iconColor} />
        </View>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.vitalsCardTitle} numberOfLines={1}>{title}</Text>
          <Text style={styles.vitalsCardSub} numberOfLines={1}>{subtitle}</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ width: '100%' }}>
        <View style={{ minWidth: ws(340), width: '100%' }}>
          <View style={styles.vitalsTableHeaderBar}>
            {headers.map((h, i) => (
              <Text key={`head-${i}`} style={styles.vitalsTableHeadCell} numberOfLines={1}>
                {h}
              </Text>
            ))}
          </View>
        </View>
      </ScrollView>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  vitalsGridCard: {
    backgroundColor: Colors.white,
    borderRadius: fs(16),
    padding: ws(14),
    marginBottom: hs(14),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  vitalsGridCardFull: {
    width: '100%',
  },
  vitalsCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hs(10),
  },
  vitalsIconCircle: {
    width: ws(36),
    height: ws(36),
    borderRadius: ws(18),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ws(10),
  },
  vitalsCardTitle: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(14),
    color: Colors.primaryFontColor,
  },
  vitalsCardSub: {
    ...TYPOGRAPHY.regular,
    fontSize: fs(11),
    color: Colors.secondaryFontColor,
  },
  vitalsTableHeaderBar: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    paddingVertical: hs(6),
    paddingHorizontal: ws(8),
    borderRadius: fs(8),
  },
  vitalsTableHeadCell: {
    flex: 1,
    ...TYPOGRAPHY.semiBold,
    fontSize: fs(11),
    color: Colors.secondaryFontColor,
  },
});
