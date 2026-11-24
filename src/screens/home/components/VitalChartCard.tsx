import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop, Text as SvgText } from 'react-native-svg';
import { Colors } from '../../../constants';
import { DateTimeUtils, fs, hs, isWithinLast7Days, sortVitalsDescending, TYPOGRAPHY, ws } from '../../../utils';

/** Build SVG path with straight lines between points (M x y L x y ...) */
const buildStraightPath = (pts: { x: number; y: number }[]): string => {
  if (pts.length === 0) return '';
  if (pts.length === 1) return `M${pts[0].x} ${pts[0].y}`;
  let d = `M${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    d += ` L${pts[i].x} ${pts[i].y}`;
  }
  return d;
};

const CHART_H = 96;
const CHART_Y_GUTTER = 30;
const CHART_PAD_T = 10;
const CHART_PAD_B = 10;
const CHART_PAD_R = 12;

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

export const VitalChartCard = React.memo(({
  vitalType,
  title,
  subtitle,
  unit,
  iconName,
  iconColor,
  pillBgColor,
  headers,
  records,
  latestVal,
  onPress,
  onDeleteRecord,
  onEditRecord,
  fullWidth = true,
  yLabels = ['4', '3', '2', '1', '0'],
}: VitalChartCardProps) => {
  const last7DaysRecords = useMemo(() => {
    let list: any[] = [];
    if (Array.isArray(records)) list = records;
    else if (Array.isArray(records?.data)) list = records.data;
    else if (Array.isArray(records?.response)) list = records.response;

    const filtered = list.filter((item) => isWithinLast7Days(item.date || item.created_at));
    return sortVitalsDescending(filtered);
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

    if (vitalType === 'Sugar') {
      let maxV = 0;
      let minV = 999;
      last7DaysRecords.forEach((r) => {
        const f = Number(r.sugar_fasting || 0);
        const rand = Number(r.sugar_random || 0);
        if (f > maxV) maxV = f;
        if (rand > maxV) maxV = rand;
        if (f > 0 && f < minV) minV = f;
        if (rand > 0 && rand < minV) minV = rand;
      });
      if (maxV === 0) maxV = 160;
      if (minV === 999) minV = 70;

      let top = Math.ceil(maxV / 10) * 10;
      let bottom = Math.floor(minV / 10) * 10;
      if (top <= bottom) top = bottom + 30;

      const step = (top - bottom) / 3;
      const labels = [
        String(Math.round(top)),
        String(Math.round(top - step)),
        String(Math.round(top - step * 2)),
        String(Math.round(bottom)),
      ];
      return { computedYLabels: labels, minY: bottom, maxY: top };
    }

    if (vitalType === 'Weight') {
      let maxV = 0;
      let minV = 999;
      last7DaysRecords.forEach((r) => {
        const v = Number(r.weight || r.value || 0);
        if (v > maxV) maxV = v;
        if (v > 0 && v < minV) minV = v;
      });
      if (maxV === 0) maxV = 70;
      if (minV === 999) minV = 50;

      let top = Math.ceil(maxV) + 1;
      let bottom = Math.floor(minV) - 1;
      if (top <= bottom) top = bottom + 2;

      const labels = [String(top), String(Math.round((top + bottom) / 2)), String(bottom)];
      return { computedYLabels: labels, minY: bottom, maxY: top };
    }

    if (vitalType === 'Temperature') {
      let maxV = 0;
      let minV = 999;
      last7DaysRecords.forEach((r) => {
        const v = Number(r.temperature || r.value || 0);
        if (v > maxV) maxV = v;
        if (v > 0 && v < minV) minV = v;
      });
      if (maxV === 0) maxV = 39;
      if (minV === 999) minV = 35;

      let top = Math.ceil(maxV) + 1;
      let bottom = Math.floor(minV) - 1;
      if (top <= bottom) top = bottom + 2;

      const labels = [String(top), String(Math.round((top + bottom) / 2)), String(bottom)];
      return { computedYLabels: labels, minY: bottom, maxY: top };
    }

    if (vitalType === 'SpO2') {
      let maxV = 0;
      let minV = 999;
      last7DaysRecords.forEach((r) => {
        const v = Number(r.spo2 || r.value || 0);
        if (v > maxV) maxV = v;
        if (v > 0 && v < minV) minV = v;
      });
      if (maxV === 0) maxV = 100;
      if (minV === 999) minV = 90;

      let top = 100;
      if (maxV < 85) {
        top = Math.min(100, Math.ceil(maxV / 5) * 5 + 5);
      } else if (maxV < 95) {
        top = Math.min(100, Math.ceil(maxV / 5) * 5 + 5);
      }

      let bottom = Math.max(0, Math.floor(minV / 5) * 5 - 5);
      if (minV >= 85 && bottom < 80) {
        bottom = 80;
      }

      if (top <= bottom) top = Math.min(100, bottom + 10);
      const step = (top - bottom) / 2;
      const labels = [
        String(Math.round(top)),
        String(Math.round(top - step)),
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
      const slice = [...last7DaysRecords].slice(0, 5).reverse();
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
    for (let i = 4; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
      let dateFormatted = DateTimeUtils.getDataFormat(d.toISOString().split('T')[0]);
      dateFormatted = dateFormatted.replace(/,?\s*\d{4}/g, '').trim();
      dates.push(`${dateFormatted} 00:00`);
    }
    return dates;
  }, [last7DaysRecords]);

  const [chartW, setChartW] = useState(0);

  const series = useMemo(() => {
    if (!hasData || chartW <= 0) return [] as { color: string; points: { x: number; y: number }[] }[];
    const slice = [...last7DaysRecords].slice(0, 5).reverse();
    const count = slice.length;
    const plotW = chartW - CHART_Y_GUTTER - CHART_PAD_R;
    const plotH = CHART_H - CHART_PAD_T - CHART_PAD_B;
    const range = maxY - minY || 1;
    const xAt = (i: number) => CHART_Y_GUTTER + ((i + 0.5) / count) * plotW;
    const yAt = (v: number) =>
      CHART_PAD_T + (1 - Math.min(1, Math.max(0, (v - minY) / range))) * plotH;

    let defs: { color: string; get: (r: any) => number }[] = [];
    if (vitalType === 'Blood Pressure') {
      defs = [
        { color: Colors.redColor, get: (r) => Number(r.bp_systolic || 0) },
        { color: Colors.primaryColor, get: (r) => Number(r.bp_diastolic || 0) },
      ];
    } else if (vitalType === 'Sugar') {
      defs = [
        { color: Colors.sky_0284C7, get: (r) => Number(r.sugar_fasting || 0) },
        { color: Colors.orange_F96335, get: (r) => Number(r.sugar_random || 0) },
      ];
    } else if (vitalType === 'Weight') {
      defs = [
        {
          color: iconColor,
          get: (r) => Number(r.weight || r.value || 0),
        },
      ];
    } else {
      defs = [
        {
          color: iconColor,
          get: (r) => Number(r.weight || r.temperature || r.spo2 || r.value || 0),
        },
      ];
    }

    return defs.map((d) => ({
      color: d.color,
      points: slice
        .map((r, i) => ({ v: d.get(r), val: d.get(r), x: xAt(i), y: 0 }))
        .filter((p) => p.v > 0)
        .map((p) => ({ x: p.x, y: yAt(p.v), v: p.v, val: p.v })),
    }));
  }, [hasData, chartW, last7DaysRecords, vitalType, minY, maxY, iconColor]);

  const weightSegments = useMemo(() => {
    if (vitalType !== 'Weight') return [];
    const weightSeries = series[0];
    if (!weightSeries || weightSeries.points.length < 2) return [];
    const pts = weightSeries.points;
    const segs: { d: string; color: string; isDecreased: boolean }[] = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] || p2;
      const c1x = p1.x + (p2.x - p0.x) / 6;
      const c1y = p1.y + (p2.y - p0.y) / 6;
      const c2x = p2.x + (p3.x - p1.x) / 6;
      const c2y = p2.y + (p3.y - p1.y) / 6;
      const d = `M${p1.x} ${p1.y} L${p2.x} ${p2.y}`;
      const isDecreased = (p2 as any).val < (p1 as any).val;
      const color = isDecreased ? Colors.redColor : Colors.green_10B981;
      segs.push({ d, color, isDecreased });
    }
    return segs;
  }, [vitalType, series]);

  const legendItems =
    hasData && vitalType === 'Blood Pressure'
      ? [
        { color: Colors.redColor, label: 'Systolic' },
        { color: Colors.primaryColor, label: 'Diastolic' },
      ]
      : hasData && vitalType === 'Sugar'
        ? [
          { color: Colors.sky_0284C7, label: 'Fasting' },
          { color: Colors.orange_F96335, label: 'Random' },
        ]
        : [];

  const plotH = CHART_H - CHART_PAD_T - CHART_PAD_B;
  const baseY = CHART_PAD_T + plotH;
  const fillKey = vitalType.replace(/\W/g, '');

  return (
    <TouchableOpacity
      style={[styles.vitalsGridCard, fullWidth && styles.vitalsGridCardFull]}
      activeOpacity={0.9}
      onPress={onPress}
    >
      {/* Title pill + 7-day note pill */}
      <View style={styles.vitalsCardHeaderRow}>
        <View style={[styles.vitalsTitlePill, { backgroundColor: pillBgColor }]}>
          <MaterialIcons name={iconName} size={fs(14)} color={iconColor} />
          <Text style={styles.vitalsCardTitle} numberOfLines={1}>{title}</Text>
        </View>
        {/* <View style={styles.vitalsNotePill}>
          <MaterialIcons name="info-outline" size={fs(12)} color={Colors.redColor} />
          <Text style={styles.vitalsSevenDaysNote} numberOfLines={1}>
            Note: Data beyond 7 days is not shown
          </Text>
        </View> */}
      </View>

      {legendItems.length > 0 && (
        <View style={styles.vitalsLegendRow}>
          {legendItems.map((l) => (
            <View key={`legend-${l.label}`} style={styles.vitalsLegendItem}>
              <View style={[styles.vitalsLegendDot, { backgroundColor: l.color }]} />
              <Text style={styles.vitalsLegendText}>{l.label}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Line / area chart */}
      <View style={styles.vitalsMiniChartArea}>
        <View style={styles.vitalsRotatedUnitBox}>
          <Text style={styles.vitalsRotatedUnitText} numberOfLines={1}>
            {computedUnitLabel}
          </Text>
        </View>

        <View
          style={styles.vitalsSvgBox}
          onLayout={(e) => setChartW(Math.floor(e.nativeEvent.layout.width))}
        >
          {chartW > 0 && (
            <Svg width={chartW} height={CHART_H}>
              <Defs>
                {series.map((sr, si) => (
                  <LinearGradient
                    key={`fill-def-${fillKey}-${si}`}
                    id={`vitalFill-${fillKey}-${si}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <Stop offset="0%" stopColor={sr.color} stopOpacity="0.22" />
                    <Stop offset="100%" stopColor={sr.color} stopOpacity="0.02" />
                  </LinearGradient>
                ))}
              </Defs>

              {/* Grid + Y labels */}
              {computedYLabels.map((lbl, idx) => {
                const n = computedYLabels.length;
                const lineY = n > 1 ? CHART_PAD_T + idx * (plotH / (n - 1)) : CHART_PAD_T + plotH / 2;
                const isBase = idx === n - 1;
                return (
                  <React.Fragment key={`grid-${idx}`}>
                    <Line
                      x1={CHART_Y_GUTTER}
                      y1={lineY}
                      x2={chartW - CHART_PAD_R}
                      y2={lineY}
                      stroke={isBase ? Colors.aquaBorder : Colors.blue_EDF5FF}
                      strokeWidth={isBase ? 1.5 : 1}
                      strokeDasharray={isBase ? undefined : '3 4'}
                    />
                    <SvgText
                      x={CHART_Y_GUTTER - 7}
                      y={lineY + 3}
                      fontSize={9}
                      fill={Colors.inkSoft}
                      textAnchor="end"
                      fontFamily="Poppins-Medium"
                    >
                      {lbl}
                    </SvgText>
                  </React.Fragment>
                );
              })}

              {/* Area + line + dots */}
              {series.map((sr, si) => {
                if (sr.points.length === 0) return null;
                const first = sr.points[0];
                const last = sr.points[sr.points.length - 1];
                const linePath = buildStraightPath(sr.points);
                return (
                  <React.Fragment key={`series-${si}`}>
                    {sr.points.length > 1 && (
                      <Path
                        d={`${linePath} L${last.x} ${baseY} L${first.x} ${baseY} Z`}
                        fill={`url(#vitalFill-${fillKey}-${si})`}
                      />
                    )}
                    {sr.points.length > 1 && vitalType === 'Weight' && weightSegments.length > 0 ? (
                      weightSegments.map((seg, sIdx) => (
                        <Path
                          key={`weight-seg-${sIdx}`}
                          d={seg.d}
                          stroke={seg.color}
                          strokeWidth={2.4}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          fill="none"
                        />
                      ))
                    ) : sr.points.length > 1 ? (
                      <Path
                        d={linePath}
                        stroke={sr.color}
                        strokeWidth={2.2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                      />
                    ) : null}
                    {sr.points.map((p, pi) => {
                      let dotColor = sr.color;
                      if (vitalType === 'Weight' && pi > 0) {
                        dotColor =
                          (p as any).val < (sr.points[pi - 1] as any).val
                            ? Colors.redColor
                            : Colors.green_10B981;
                      }
                      return (
                        <Circle
                          key={`dot-${si}-${pi}`}
                          cx={p.x}
                          cy={p.y}
                          r={4.2}
                          fill={dotColor}
                          stroke={Colors.white}
                          strokeWidth={1.5}
                        />
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </Svg>
          )}

          {/* X-axis date labels */}
          <View style={styles.vitalsXAxisRow}>
            {xAxisLabels.map((lbl, idx) => (
              <Text key={`x-${idx}`} style={styles.vitalsXLabel} numberOfLines={1}>
                {lbl}
              </Text>
            ))}
          </View>
        </View>
      </View>

      {/* Responsive Full Width Table */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, width: '100%' }}
        style={{ width: '100%' }}
      >
        <View style={{ width: '100%' }}>
          {/* Table Header Bar */}
          <View style={styles.vitalsTableHeaderBar}>
            {headers.map((h, i) => {
              const is5Col = headers.length === 5;
              let cellFlex = 1;
              let cellMinW = is5Col ? 44 : 52;

              if (is5Col) {
                if (i === 0 || i === 1) { cellFlex = 1; cellMinW = 44; } // FASTING / RANDOM or SYSTOLIC / DIASTOLIC
                else if (i === 2) { cellFlex = 1.3; cellMinW = 66; } // DATE
                else if (i === 3) { cellFlex = 1.1; cellMinW = 56; } // TIME
                else if (i === 4) { cellFlex = 1.0; cellMinW = 48; } // ACTION
              } else {
                if (i === 0) { cellFlex = 1.1; cellMinW = 52; } // WEIGHT / TEMP / SPO2
                else if (i === 1) { cellFlex = 1.35; cellMinW = 72; } // DATE
                else if (i === 2) { cellFlex = 1.15; cellMinW = 62; } // TIME
                else if (i === 3) { cellFlex = 1.0; cellMinW = 48; } // ACTION
              }

              return (
                <Text
                  key={`head-${i}`}
                  style={[
                    styles.vitalsTableHeadCell,
                    {
                      flex: cellFlex,
                      minWidth: cellMinW,
                      fontSize: is5Col ? fs(9) : fs(9.8),
                      paddingHorizontal: ws(2),
                    },
                  ]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.8}
                >
                  {h}
                </Text>
              );
            })}
          </View>

          {/* Records List (Full Height, No Vertical Clipping) */}
          {hasData ? (
            <View style={styles.vitalsTableRecordsContainer}>
              {last7DaysRecords.map((item, idx) => {
                const is5Col = headers.length === 5;
                const col0Flex = is5Col ? 1 : 1.1;
                const col0MinW = is5Col ? 44 : 52;
                const dateFlex = is5Col ? 1.3 : 1.35;
                const dateMinW = is5Col ? 66 : 72;
                const timeFlex = is5Col ? 1.1 : 1.15;
                const timeMinW = is5Col ? 56 : 62;
                const actionFlex = 1.0;
                const actionMinW = 48;
                const isLastRow = idx === last7DaysRecords.length - 1;

                const rawDateVal = item.date || item.created_at;
                const dateStr = rawDateVal ? (DateTimeUtils.getDataFormat(rawDateVal) || String(rawDateVal).split('T')[0]) : '--';
                const timeStr = item.time ? DateTimeUtils.formatTimeToAmPm(item.time) || item.time : '--';

                return (
                  <View
                    key={`row-${item.id ?? idx}`}
                    style={[
                      styles.vitalsTableRow,
                      isLastRow && styles.vitalsTableRowLast,
                    ]}
                  >
                    {vitalType === 'Blood Pressure' ? (
                      <>
                        <Text style={[styles.vitalsTableCellText, { flex: col0Flex, minWidth: col0MinW, fontSize: fs(10) }]} numberOfLines={1}>{item.bp_systolic ?? '--'}</Text>
                        <Text style={[styles.vitalsTableCellText, { flex: col0Flex, minWidth: col0MinW, fontSize: fs(10) }]} numberOfLines={1}>{item.bp_diastolic ?? '--'}</Text>
                      </>
                    ) : vitalType === 'Sugar' ? (
                      <>
                        <Text style={[styles.vitalsTableCellText, { flex: col0Flex, minWidth: col0MinW, fontSize: fs(10) }]} numberOfLines={1}>{item.sugar_fasting ?? '--'}</Text>
                        <Text style={[styles.vitalsTableCellText, { flex: col0Flex, minWidth: col0MinW, fontSize: fs(10) }]} numberOfLines={1}>{item.sugar_random ?? '--'}</Text>
                      </>
                    ) : (
                      <Text style={[styles.vitalsTableCellText, { flex: col0Flex, minWidth: col0MinW, fontSize: fs(10.5) }]} numberOfLines={1}>
                        {item.weight || item.temperature || item.spo2 || item.value || '--'}
                      </Text>
                    )}
                    <Text
                      style={[
                        styles.vitalsTableCellText,
                        {
                          flex: dateFlex,
                          minWidth: dateMinW,
                          fontSize: is5Col ? fs(9.5) : fs(10.5),
                        },
                      ]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.85}
                    >
                      {dateStr}
                    </Text>
                    <Text
                      style={[
                        styles.vitalsTableCellText,
                        {
                          flex: timeFlex,
                          minWidth: timeMinW,
                          fontSize: is5Col ? fs(9.5) : fs(10.5),
                        },
                      ]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.85}
                    >
                      {timeStr}
                    </Text>

                    {/* ACTION Column with Edit & Delete Buttons */}
                    <View style={[styles.vitalsTableCellAction, { flex: actionFlex, minWidth: actionMinW }]}>
                      {onEditRecord && (
                        <TouchableOpacity
                          style={styles.actionIconBtnEdit}
                          onPress={() => onEditRecord(item)}
                          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                        >
                          <MaterialIcons name="edit" size={14} color={Colors.green_10B981} />
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        style={styles.actionIconBtnDelete}
                        onPress={() => onDeleteRecord && item.id && onDeleteRecord(item.id)}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      >
                        <MaterialIcons name="delete-outline" size={15} color={Colors.redColor} />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.vitalsTableBody}>
              <Text style={styles.vitalsNoRecordsText}>No Records Found</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  vitalsGridCard: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: fs(16),
    padding: ws(12),
    borderWidth: 1,
    borderColor: Colors.border_E3EDF7,
  },
  vitalsGridCardFull: {
    width: '100%',
  },
  vitalsCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ws(8),
    marginBottom: hs(10),
  },
  vitalsTitlePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(6),
    justifyContent: 'center',
    borderRadius: fs(16),
    paddingVertical: hs(6),
    paddingHorizontal: ws(12),
  },
  // vitalsNotePill: {
  //   flexShrink: 1,
  //   flexDirection: 'row',
  //   alignItems: 'center',
  //   gap: ws(4),
  //   borderRadius: fs(14),
  //   backgroundColor: Colors.red_FFE8E8,
  //   paddingVertical: hs(6),
  //   paddingHorizontal: ws(9),
  // },
  vitalsLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(14),
    marginBottom: hs(6),
    // paddingLeft: ws(4),
  },
  vitalsLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(5),
  },
  vitalsLegendDot: {
    width: ws(8),
    height: ws(8),
    borderRadius: 999,
  },
  vitalsLegendText: {
    fontSize: fs(10),
    ...TYPOGRAPHY.medium,
    color: Colors.inkSoft,
  },
  vitalsCardTitle: {
    fontSize: fs(12.5),
    ...TYPOGRAPHY.semiBold,
    color: Colors.ink,
  },
  vitalsSevenDaysNote: {
    flexShrink: 1,
    fontSize: fs(9),
    ...TYPOGRAPHY.medium,
    color: Colors.redColor,
  },
  vitalsMiniChartArea: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: hs(12),
    alignItems: 'flex-start',
  },
  vitalsRotatedUnitBox: {
    width: ws(14),
    height: CHART_H,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vitalsRotatedUnitText: {
    fontSize: fs(9),
    ...TYPOGRAPHY.semiBold,
    color: Colors.inkSoft,
    transform: [{ rotate: '-90deg' }],
    width: CHART_H,
    textAlign: 'center',
  },
  vitalsSvgBox: {
    flex: 1,
    position: 'relative',
  },
  vitalsXAxisRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hs(2),
    paddingLeft: CHART_Y_GUTTER,
    paddingRight: CHART_PAD_R,
  },
  vitalsXLabel: {
    flex: 1,
    fontSize: fs(8),
    ...TYPOGRAPHY.medium,
    color: Colors.inkSoft,
    textAlign: 'center',
  },
  vitalsTableHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.aquaSoft,
    borderRadius: fs(10),
    paddingVertical: hs(7),
    paddingHorizontal: ws(4),
    marginBottom: hs(4),
    borderWidth: 1,
    borderColor: Colors.aquaBorder,
    width: '100%',
  },
  vitalsTableHeadCell: {
    flex: 1,
    fontSize: fs(10),
    ...TYPOGRAPHY.bold,
    color: Colors.navy,
    textAlign: 'center',
  },
  vitalsTableBody: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: hs(24),
  },
  vitalsTableRecordsContainer: {
    width: '100%',
  },
  vitalsTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: hs(8),
    paddingHorizontal: ws(4),
    borderBottomWidth: 1,
    borderBottomColor: Colors.slate_F1F5F9,
    width: '100%',
  },
  vitalsTableRowLast: {
    borderBottomWidth: 0,
  },
  vitalsTableCellText: {
    flex: 1,
    fontSize: fs(10.5),
    ...TYPOGRAPHY.medium,
    color: Colors.primaryFontColor,
    textAlign: 'center',
  },
  vitalsTableCellAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ws(4),
  },
  actionIconBtnEdit: {
    width: ws(22),
    height: hs(22),
    borderRadius: fs(5),
    backgroundColor: Colors.green_ECFDF5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIconBtnDelete: {
    width: ws(22),
    height: hs(22),
    borderRadius: fs(5),
    backgroundColor: Colors.red_FFF0F0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vitalsNoRecordsText: {
    fontSize: fs(10),
    ...TYPOGRAPHY.medium,
    color: Colors.slate_94A3B8,
  },
});
