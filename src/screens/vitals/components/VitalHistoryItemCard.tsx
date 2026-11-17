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

interface VitalHistoryItemCardProps {
  item: VitalModel;
  vitalName: string;
  iconInfo: { icon: any; color: string; bg: string };
  itemStatus: VitalStatusInfo | null;
  prevEntry?: VitalModel;
  onDelete: (id: string) => void;
  renderVitalValue: (item: VitalModel) => string;
}

export const VitalHistoryItemCard = memo(({
  item,
  vitalName,
  iconInfo,
  itemStatus,
  prevEntry,
  onDelete,
  renderVitalValue,
}: VitalHistoryItemCardProps) => {
  let isDecreased = false;
  let isIncreased = false;

  if (vitalName === 'Weight') {
    const currentVal = parseFloat(String(item.weight || (item as any)?.value || ''));
    const prevVal = prevEntry
      ? parseFloat(String(prevEntry.weight || (prevEntry as any)?.value || ''))
      : NaN;

    if (!isNaN(currentVal) && !isNaN(prevVal)) {
      const diff = currentVal - prevVal;
      if (diff < -0.01) {
        isDecreased = true;
      } else if (diff > 0.01) {
        isIncreased = true;
      }
    }
  }

  const itemWeightColor = isDecreased ? Colors.redColor : isIncreased ? Colors.green_10B981 : Colors.primaryColor;
  const itemWeightBg = isDecreased ? Colors.red_FEE2E2 : isIncreased ? Colors.green_ECFDF5 : Colors.aquaSoft;
  const itemWeightIcon = isDecreased
    ? 'trending-down'
    : isIncreased
      ? 'trending-up'
      : 'fitness-center';

  return (
    <AppCard style={styles.compactHistoryCard}>
      <View style={styles.historyRow}>
        <View
          style={[
            styles.itemIconCircle,
            {
              backgroundColor:
                vitalName === 'Weight' ? itemWeightBg : iconInfo.bg,
            },
          ]}
        >
          <MaterialIcons
            name={(vitalName === 'Weight' ? itemWeightIcon : iconInfo.icon) as any}
            size={18}
            color={vitalName === 'Weight' ? itemWeightColor : iconInfo.color}
          />
        </View>

        <View style={styles.historyInfo}>
          <View style={styles.historyValueAndStatusRow}>
            {vitalName === 'Sugar' ? (
              <View style={styles.historySugarValuesCol}>
                {!!item.sugar_fasting && (
                  <Text style={styles.historyValueText}>
                    Fasting: {item.sugar_fasting} mg/dL
                  </Text>
                )}
                {!!item.sugar_random && (
                  <Text style={item.sugar_fasting ? styles.historySubValueText : styles.historyValueText}>
                    Random: {item.sugar_random} mg/dL
                  </Text>
                )}
              </View>
            ) : (
              <Text style={styles.historyValueText}>
                {renderVitalValue(item)}
              </Text>
            )}

            {/* History Status Pill for non-weight readings */}
            {vitalName !== 'Weight' && itemStatus && (
              <View
                style={[
                  styles.historyStatusBadge,
                  { backgroundColor: itemStatus.bgColor },
                ]}
              >
                <MaterialIcons
                  name={itemStatus.icon}
                  size={10}
                  color={itemStatus.color}
                  style={{ marginRight: ws(3) }}
                />
                <Text
                  style={[
                    styles.historyStatusText,
                    { color: itemStatus.color },
                  ]}
                >
                  {itemStatus.label}
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.historyDateText}>
            {formatVitalDateTime(item.date || item.created_at, item.time)}
          </Text>
        </View>

        {/* Delete action button */}
        <View style={styles.actionRow}>
          {!!item.id && (
            <TouchableOpacity
              style={styles.actionIconBtnDelete}
              onPress={() => onDelete(String(item.id))}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialIcons name="delete-outline" size={16} color={Colors.redColor} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </AppCard>
  );
});

const styles = StyleSheet.create({
  compactHistoryCard: {
    padding: ws(12),
    marginBottom: hs(8),
    backgroundColor: Colors.white,
    borderRadius: fs(12),
    borderWidth: 1,
    borderColor: Colors.slate_E2E8F0,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemIconCircle: {
    width: ws(36),
    height: ws(36),
    borderRadius: fs(10),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ws(12),
  },
  historyInfo: {
    flex: 1,
  },
  historyValueAndStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hs(3),
  },
  historySugarValuesCol: {
    flexDirection: 'column',
  },
  historyValueText: {
    fontSize: fs(14),
    ...TYPOGRAPHY.bold,
    color: Colors.ink,
  },
  historySubValueText: {
    fontSize: fs(12),
    ...TYPOGRAPHY.medium,
    color: Colors.slate_64748B,
    marginTop: hs(1),
  },
  historyStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ws(6),
    paddingVertical: hs(2),
    borderRadius: fs(10),
  },
  historyStatusText: {
    fontSize: fs(10),
    ...TYPOGRAPHY.semiBold,
  },
  historyDateText: {
    fontSize: fs(11),
    ...TYPOGRAPHY.regular,
    color: Colors.slate_94A3B8,
  },
  actionRow: {
    marginLeft: ws(8),
  },
  actionIconBtnDelete: {
    width: ws(28),
    height: ws(28),
    borderRadius: fs(6),
    backgroundColor: Colors.red_FEE2E2,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
