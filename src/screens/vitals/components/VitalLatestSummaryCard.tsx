import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { memo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppCard } from '../../../components';
import { Colors } from '../../../constants';
import type { VitalModel } from '../../../types';
import { fs, hs, TYPOGRAPHY, ws } from '../../../utils';
import { formatVitalDateTime } from './vitalHelpers';

interface VitalStatusInfo {
  label: string;
  color: string;
  bgColor: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  normalRangeText?: string;
}

interface HeroWeightTrend {
  label: string;
  diffText: string;
  color: string;
  bgColor: string;
  icon: keyof typeof MaterialIcons.glyphMap;
}

interface VitalLatestSummaryCardProps {
  latestVital: VitalModel;
  vitalName: string;
  iconInfo: { icon: any; color: string; bg: string };
  latestStatus: VitalStatusInfo;
  heroWeightTrend: HeroWeightTrend | null;
  onDelete: (id: string) => void;
  renderVitalValue: (item: VitalModel) => string;
}

export const VitalLatestSummaryCard = memo(({
  latestVital,
  vitalName,
  iconInfo,
  latestStatus,
  heroWeightTrend,
  onDelete,
  renderVitalValue,
}: VitalLatestSummaryCardProps) => {
  return (
    <AppCard style={styles.heroCard}>
      <View style={styles.heroHeaderRow}>
        <View
          style={[
            styles.heroIconCircle,
            { backgroundColor: iconInfo.bg },
          ]}
        >
          <MaterialIcons
            name={iconInfo.icon as any}
            size={24}
            color={iconInfo.color}
          />
        </View>

        <View style={styles.heroTitleCol}>
          <Text style={styles.heroLabel}>Latest {vitalName}</Text>
          <Text style={styles.heroTime} numberOfLines={1}>
            {formatVitalDateTime(
              latestVital.date || latestVital.created_at,
              latestVital.time
            )}
          </Text>
        </View>

        {/* Non-weight status badge in header row */}
        {vitalName !== 'Weight' && (
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: latestStatus.bgColor },
            ]}
          >
            <MaterialIcons
              name={latestStatus.icon}
              size={13}
              color={latestStatus.color}
              style={{ marginRight: ws(3) }}
            />
            <Text
              style={[
                styles.statusBadgeText,
                { color: latestStatus.color },
              ]}
            >
              {latestStatus.label}
            </Text>
          </View>
        )}

        {/* Delete action button */}
        {!!latestVital.id && (
          <View style={styles.heroActionBtns}>
            <TouchableOpacity
              style={styles.actionIconBtnDelete}
              onPress={() => onDelete(String(latestVital.id))}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialIcons name="delete-outline" size={15} color={Colors.redColor} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Value and Normal Range column layout */}
      <View style={styles.heroBottomContainer}>
        {vitalName === 'Sugar' ? (() => {
          const hasFasting =
            latestVital.sugar_fasting !== undefined &&
            latestVital.sugar_fasting !== null &&
            String(latestVital.sugar_fasting).trim() !== '';
          const hasRandom =
            latestVital.sugar_random !== undefined &&
            latestVital.sugar_random !== null &&
            String(latestVital.sugar_random).trim() !== '';

          if (!hasFasting && !hasRandom) {
            return (
              <View style={styles.heroSugarColsRow}>
                <View style={styles.heroSugarCol}>
                  <Text style={styles.heroSugarColLabel}>Sugar</Text>
                  <Text style={styles.heroSugarColValue}>--</Text>
                </View>
              </View>
            );
          }

          return (
            <View style={styles.heroSugarColsRow}>
              {hasFasting && (
                <View style={styles.heroSugarCol}>
                  <Text style={styles.heroSugarColLabel}>Fasting</Text>
                  <Text style={styles.heroSugarColValue}>
                    {latestVital.sugar_fasting}
                    <Text style={styles.heroSugarColUnit}> mg/dL</Text>
                  </Text>
                </View>
              )}
              {hasFasting && hasRandom && <View style={styles.heroSugarDivider} />}
              {hasRandom && (
                <View style={styles.heroSugarCol}>
                  <Text style={styles.heroSugarColLabel}>Random</Text>
                  <Text style={styles.heroSugarColValue}>
                    {latestVital.sugar_random}
                    <Text style={styles.heroSugarColUnit}> mg/dL</Text>
                  </Text>
                </View>
              )}
            </View>
          );
        })() : (
          <View style={styles.heroValueAndBadgeRow}>
            <Text style={styles.heroValueText}>
              {renderVitalValue(latestVital)}
            </Text>

            {/* Weight status badge beside value */}
            {vitalName === 'Weight' && heroWeightTrend && (
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: heroWeightTrend.bgColor,
                    paddingHorizontal: ws(10),
                    paddingVertical: hs(4),
                  },
                ]}
              >
                <MaterialIcons
                  name={heroWeightTrend.icon as any}
                  size={14}
                  color={heroWeightTrend.color}
                  style={{ marginRight: ws(4) }}
                />
                <Text
                  style={[
                    styles.statusBadgeText,
                    {
                      color: heroWeightTrend.color,
                      fontSize: fs(11.5),
                    },
                  ]}
                >
                  {`${heroWeightTrend.label} (${heroWeightTrend.diffText})`}
                </Text>
              </View>
            )}
          </View>
        )}

        {latestStatus.normalRangeText ? (
          <View style={styles.heroRangeRow}>
            <MaterialIcons
              name="info-outline"
              size={13}
              color={Colors.slate_64748B}
              style={{ marginRight: ws(4) }}
            />
            <Text style={styles.heroRangeText}>{latestStatus.normalRangeText}</Text>
          </View>
        ) : null}
      </View>
    </AppCard>
  );
});

const styles = StyleSheet.create({
  heroCard: {
    padding: ws(16),
    marginBottom: hs(14),
    backgroundColor: Colors.white,
    borderRadius: fs(16),
    borderWidth: 1,
    borderColor: Colors.slate_E2E8F0,
  },
  heroHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hs(12),
  },
  heroIconCircle: {
    width: ws(44),
    height: ws(44),
    borderRadius: fs(12),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ws(12),
  },
  heroTitleCol: {
    flex: 1,
  },
  heroLabel: {
    fontSize: fs(15),
    ...TYPOGRAPHY.bold,
    color: Colors.ink,
  },
  heroTime: {
    fontSize: fs(11.5),
    ...TYPOGRAPHY.regular,
    color: Colors.slate_64748B,
    marginTop: hs(2),
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ws(8),
    paddingVertical: hs(3),
    borderRadius: fs(12),
  },
  statusBadgeText: {
    fontSize: fs(11),
    ...TYPOGRAPHY.semiBold,
  },
  heroActionBtns: {
    marginLeft: ws(8),
  },
  actionIconBtnDelete: {
    width: ws(30),
    height: ws(30),
    borderRadius: fs(8),
    backgroundColor: Colors.red_FEE2E2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroBottomContainer: {
    borderTopWidth: 1,
    borderTopColor: Colors.slate_F1F5F9,
    paddingTop: hs(12),
  },
  heroSugarColsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroSugarCol: {
    flex: 1,
  },
  heroSugarColLabel: {
    fontSize: fs(11),
    ...TYPOGRAPHY.medium,
    color: Colors.slate_64748B,
    marginBottom: hs(2),
  },
  heroSugarColValue: {
    fontSize: fs(19),
    ...TYPOGRAPHY.bold,
    color: Colors.ink,
  },
  heroSugarColUnit: {
    fontSize: fs(12),
    ...TYPOGRAPHY.medium,
    color: Colors.slate_64748B,
  },
  heroSugarDivider: {
    width: 1,
    height: hs(36),
    backgroundColor: Colors.slate_E2E8F0,
    marginHorizontal: ws(12),
  },
  heroValueAndBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: ws(10),
  },
  heroValueText: {
    fontSize: fs(24),
    ...TYPOGRAPHY.bold,
    color: Colors.ink,
  },
  heroRangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.slate_F8FAFC,
    paddingHorizontal: ws(10),
    paddingVertical: hs(6),
    borderRadius: fs(8),
    marginTop: hs(10),
  },
  heroRangeText: {
    fontSize: fs(11),
    ...TYPOGRAPHY.regular,
    color: Colors.slate_64748B,
    flex: 1,
  },
});
