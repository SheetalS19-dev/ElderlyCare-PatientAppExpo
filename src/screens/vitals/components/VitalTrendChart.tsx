import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Rect, Text as SvgText } from 'react-native-svg';
import { AppCard } from '../../../components';
import { Colors } from '../../../constants';
import { fs, hs, TYPOGRAPHY, ws } from '../../../utils';

interface ChartPoint {
  x: number;
  y: number;
  val: number;
  label: string;
  isLatest: boolean;
  changeColor: string;
}

interface VitalTrendChartProps {
  chartPoints: ChartPoint[];
  yTicks: (number | string)[];
  chartW: number;
  chartH: number;
}

export const VitalTrendChart = memo(({
  chartPoints,
  yTicks,
  chartW,
  chartH,
}: VitalTrendChartProps) => {
  return (
    <AppCard style={styles.chartCard}>
      <View style={styles.chartTitleRow}>
        <View style={styles.chartTitleLeft}>
          <MaterialIcons name="show-chart" size={18} color={Colors.primaryColor} />
          <Text style={styles.chartTitleText}>Weight Trend</Text>
        </View>
        <View style={styles.chartLegendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
            <Text style={styles.legendText}>Decrease</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
            <Text style={styles.legendText}>Increase</Text>
          </View>
        </View>
      </View>

      <View style={styles.chartContainer}>
        {chartPoints.length === 0 ? (
          <View style={styles.emptyChartBox}>
            <Text style={styles.emptyChartText}>
              No weight logs recorded in this period.
            </Text>
          </View>
        ) : (
          <Svg width={chartW} height={chartH}>
            {/* Grid Lines */}
            {yTicks.map((tick, idx) => {
              const yPos =
                hs(18) +
                (idx / (yTicks.length - 1)) * (chartH - hs(18) - hs(22));
              return (
                <React.Fragment key={`grid-${idx}`}>
                  <Line
                    x1={ws(34)}
                    y1={yPos}
                    x2={chartW - ws(20)}
                    y2={yPos}
                    stroke="#E2E8F0"
                    strokeDasharray="3,3"
                    strokeWidth={1}
                  />
                  <SvgText
                    x={ws(28)}
                    y={yPos + hs(3)}
                    fontSize={fs(9)}
                    fill="#94A3B8"
                    textAnchor="end"
                  >
                    {tick}
                  </SvgText>
                </React.Fragment>
              );
            })}

            {/* Chart Line Segments: colored RED for decrease, GREEN for increase */}
            {chartPoints.map((pt, idx) => {
              if (idx === 0) return null;
              const prevPt = chartPoints[idx - 1];
              return (
                <Line
                  key={`seg-${idx}`}
                  x1={prevPt.x}
                  y1={prevPt.y}
                  x2={pt.x}
                  y2={pt.y}
                  stroke={pt.changeColor}
                  strokeWidth={3}
                  strokeLinecap="round"
                />
              );
            })}

            {/* Chart Dots & Value Tooltip */}
            {chartPoints.map((pt, idx) => (
              <React.Fragment key={`pt-${idx}`}>
                <Circle
                  cx={pt.x}
                  cy={pt.y}
                  r={pt.isLatest ? 5.5 : 4}
                  fill={pt.changeColor}
                  stroke="#FFFFFF"
                  strokeWidth={2}
                />
                {pt.isLatest && (
                  <React.Fragment>
                    <Rect
                      x={pt.x - ws(26)}
                      y={pt.y - hs(22)}
                      width={ws(52)}
                      height={hs(16)}
                      rx={fs(5)}
                      fill={pt.changeColor}
                    />
                    <SvgText
                      x={pt.x}
                      y={pt.y - hs(10)}
                      fontSize={fs(9)}
                      fill="#FFFFFF"
                      textAnchor="middle"
                      fontWeight="bold"
                    >
                      {`${pt.val} kg`}
                    </SvgText>
                  </React.Fragment>
                )}

                <SvgText
                  x={pt.x}
                  y={chartH - hs(6)}
                  fontSize={fs(9)}
                  fill="#94A3B8"
                  textAnchor="middle"
                >
                  {pt.label}
                </SvgText>
              </React.Fragment>
            ))}
          </Svg>
        )}
      </View>
    </AppCard>
  );
});

const styles = StyleSheet.create({
  chartCard: {
    padding: ws(16),
    marginBottom: hs(14),
    backgroundColor: Colors.white,
    borderRadius: fs(16),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chartTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hs(10),
  },
  chartTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(6),
  },
  chartTitleText: {
    fontSize: fs(14),
    ...TYPOGRAPHY.bold,
    color: Colors.ink,
  },
  chartLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(10),
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(4),
  },
  legendDot: {
    width: ws(7),
    height: ws(7),
    borderRadius: 999,
  },
  legendText: {
    fontSize: fs(10.5),
    ...TYPOGRAPHY.medium,
    color: '#64748B',
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyChartBox: {
    paddingVertical: hs(24),
    alignItems: 'center',
  },
  emptyChartText: {
    fontSize: fs(12),
    ...TYPOGRAPHY.regular,
    color: '#94A3B8',
  },
});
