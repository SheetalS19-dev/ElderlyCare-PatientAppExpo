import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { memo, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop, Text as SvgText } from 'react-native-svg';
import { Colors } from '../../../constants';
import { DateTimeUtils, fs, hs, TYPOGRAPHY, ws } from '../../../utils';

/** Catmull-Rom -> cubic bezier so vital trends render as smooth curves matching dashboard */
const buildSmoothPath = (pts: { x: number; y: number }[]): string => {
  if (pts.length === 0) return '';
  if (pts.length === 1) return `M${pts[0].x} ${pts[0].y}`;
  let d = `M${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C${c1x} ${c1y} ${c2x} ${c2y} ${p2.x} ${p2.y}`;
  }
  return d;
};

const CHART_H = 100;
const CHART_Y_GUTTER = 32;
const CHART_PAD_T = 10;
const CHART_PAD_B = 10;
const CHART_PAD_R = 12;

export interface VitalTrendChartProps {
  records?: any[];
  chartPoints?: any[];
  yTicks?: (number | string)[];
  chartW?: number;
  chartH?: number;
}

export const VitalTrendChart = memo(({
  records,
  chartPoints,
}: VitalTrendChartProps) => {
  const [chartWidth, setChartWidth] = useState<number>(0);

  // Extract valid weight records
  const slice = useMemo(() => {
    let list: any[] = [];
    if (records && Array.isArray(records)) {
      list = records;
    } else if (chartPoints && chartPoints.length > 0) {
      return chartPoints.map((pt) => ({
        weight: pt.val,
        date: pt.label,
        time: '',
      }));
    }

    const valid = list.filter((r) => {
      const v = Number(r.weight ?? r.value ?? 0);
      return !isNaN(v) && v > 0;
    });

    if (valid.length === 0) return [];

    // Sort descending by date to get most recent first
    const sorted = [...valid].sort((a, b) => {
      const tA = new Date(a.date || a.created_at || 0).getTime();
      const tB = new Date(b.date || b.created_at || 0).getTime();
      return tB - tA;
    });

    // Take up to 5 most recent records and reverse to plot chronologically left to right
    return sorted.slice(0, Math.min(sorted.length, 5)).reverse();
  }, [records, chartPoints]);

  const hasData = slice.length > 0;

  // Dynamic Y-axis scale matching dashboard Weight calculation
  const { computedYLabels, minY, maxY } = useMemo(() => {
    if (!hasData) {
      return { computedYLabels: ['70', '60', '50'], minY: 50, maxY: 70 };
    }

    let maxV = 0;
    let minV = 999;
    slice.forEach((r) => {
      const v = Number(r.weight || (r as any).value || 0);
      if (v > maxV) maxV = v;
      if (v > 0 && v < minV) minV = v;
    });

    if (maxV === 0) maxV = 70;
    if (minV === 999) minV = 50;

    let top = Math.ceil(maxV) + 1;
    let bottom = Math.floor(minV) - 1;
    if (top <= bottom) top = bottom + 2;

    const labels = [
      String(top),
      String(Math.round((top + bottom) / 2)),
      String(bottom),
    ];
    return { computedYLabels: labels, minY: bottom, maxY: top };
  }, [hasData, slice]);

  // Dynamic X-axis date/time labels matching dashboard
  const xAxisLabels = useMemo(() => {
    if (hasData) {
      return slice.map((item) => {
        const dStr = item.date ? item.date.split('T')[0] : (item.created_at ? item.created_at.split('T')[0] : '');
        let dateFormatted = dStr ? DateTimeUtils.getDataFormat(dStr) : '';
        dateFormatted = dateFormatted.replace(/,?\s*\d{4}/g, '').trim();

        const timeFormatted = item.time ? (DateTimeUtils.formatTimeToAmPm(item.time) || item.time) : '';
        const cleanTime = (timeFormatted && timeFormatted !== '00:00' && timeFormatted !== '12:00 AM') ? timeFormatted : '';
        return cleanTime ? `${dateFormatted} ${cleanTime}` : dateFormatted;
      });
    }

    const dates = [];
    const today = new Date();
    for (let i = 3; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
      let dateFormatted = DateTimeUtils.getDataFormat(d.toISOString().split('T')[0]);
      dateFormatted = dateFormatted.replace(/,?\s*\d{4}/g, '').trim();
      dates.push(`${dateFormatted}`);
    }
    return dates;
  }, [hasData, slice]);

  const plotH = CHART_H - CHART_PAD_T - CHART_PAD_B;
  const baseY = CHART_PAD_T + plotH;

  // Chart data points matching dashboard formula
  const points = useMemo(() => {
    if (!hasData || chartWidth <= 0) return [];
    const count = slice.length;
    const plotW = chartWidth - CHART_Y_GUTTER - CHART_PAD_R;
    const range = maxY - minY || 1;

    const xAt = (i: number) => {
      if (count === 1) return CHART_Y_GUTTER + plotW / 2;
      return CHART_Y_GUTTER + ((i + 0.5) / count) * plotW;
    };

    const yAt = (v: number) =>
      CHART_PAD_T + (1 - Math.min(1, Math.max(0, (v - minY) / range))) * plotH;

    return slice.map((r, i) => {
      const val = Number(r.weight || (r as any).value || 0);
      return {
        x: xAt(i),
        y: yAt(val),
        val,
      };
    });
  }, [hasData, slice, chartWidth, minY, maxY, plotH]);

  const linePath = useMemo(() => buildSmoothPath(points), [points]);

  return (
    <View style={styles.vitalsGridCard}>
      {/* Title pill + 7-day note pill matching dashboard exactly */}
      <View style={styles.vitalsCardHeaderRow}>
        <View style={styles.vitalsTitlePill}>
          <MaterialIcons name="fitness-center" size={fs(14)} color={Colors.green_10B981} />
          <Text style={styles.vitalsCardTitle} numberOfLines={1}>Weight</Text>
        </View>
        <View style={styles.vitalsNotePill}>
          <MaterialIcons name="info-outline" size={fs(12)} color={Colors.redColor} />
          <Text style={styles.vitalsSevenDaysNote} numberOfLines={1}>
            Note: Data beyond 7 days is not shown
          </Text>
        </View>
      </View>

      {/* Line / area chart */}
      <View style={styles.vitalsMiniChartArea}>
        <View style={styles.vitalsRotatedUnitBox}>
          <Text style={styles.vitalsRotatedUnitText} numberOfLines={1}>
            Weight (kg)
          </Text>
        </View>

        <View
          style={styles.vitalsSvgBox}
          onLayout={(e) => setChartWidth(Math.floor(e.nativeEvent.layout.width))}
        >
          {chartWidth > 0 && (
            <Svg width={chartWidth} height={CHART_H}>
              <Defs>
                <LinearGradient
                  id="vitalFill-Weight-Details"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <Stop offset="0%" stopColor={Colors.green_10B981} stopOpacity="0.22" />
                  <Stop offset="100%" stopColor={Colors.green_10B981} stopOpacity="0.02" />
                </LinearGradient>
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
                      x2={chartWidth - CHART_PAD_R}
                      y2={lineY}
                      stroke={isBase ? Colors.aquaBorder : Colors.blue_EDF5FF}
                      strokeWidth={isBase ? 1.5 : 1}
                      strokeDasharray={isBase ? undefined : '3 4'}
                    />
                    <SvgText
                      x={CHART_Y_GUTTER - 7}
                      y={lineY + 3}
                      fontSize={fs(9)}
                      fill={Colors.inkSoft}
                      textAnchor="end"
                      fontFamily="Poppins-Medium"
                    >
                      {lbl}
                    </SvgText>
                  </React.Fragment>
                );
              })}

              {/* Area + line + dots matching dashboard smooth curves */}
              {points.length > 1 && (
                <Path
                  d={`${linePath} L${points[points.length - 1].x} ${baseY} L${points[0].x} ${baseY} Z`}
                  fill="url(#vitalFill-Weight-Details)"
                />
              )}
              {points.length > 1 && (
                <Path
                  d={linePath}
                  stroke={Colors.green_10B981}
                  strokeWidth={2.2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              )}
              {points.map((p, pi) => (
                <Circle
                  key={`dot-${pi}`}
                  cx={p.x}
                  cy={p.y}
                  r={4.2}
                  fill={Colors.green_10B981}
                  stroke={Colors.white}
                  strokeWidth={1.5}
                />
              ))}
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
    </View>
  );
});

const styles = StyleSheet.create({
  vitalsGridCard: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: fs(18),
    padding: ws(14),
    marginBottom: hs(14),
    borderWidth: 1,
    borderColor: Colors.border_E3EDF7,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  vitalsCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: ws(8),
    marginBottom: hs(10),
  },
  vitalsTitlePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(6),
    borderRadius: fs(16),
    paddingVertical: hs(6),
    paddingHorizontal: ws(12),
    backgroundColor: Colors.green_D1FAE5,
  },
  vitalsNotePill: {
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(4),
    borderRadius: fs(14),
    backgroundColor: Colors.red_FFE8E8,
    paddingVertical: hs(6),
    paddingHorizontal: ws(9),
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
    marginBottom: hs(4),
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
});
