import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppConstants, Colors } from '../../../constants';
import { fs, hs, ws } from '../../../utils/metrics';
import { TYPOGRAPHY } from '../../../utils/typography';

interface Props {
  canReview: boolean;
  total: number;
  onPress: () => void;
}

export const BookingReviewBottomBar: React.FC<Props> = ({
  canReview,
  total,
  onPress,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.reviewBar, { paddingBottom: Math.max(insets.bottom + hs(12), hs(16)) }]}>
      {!canReview && (
        <View style={styles.incompleteWarningRow}>
          <MaterialIcons name="info" size={ws(13)} color={Colors.redColor} />
          <Text style={styles.incompleteWarningText}>
            Select a date, time, and patient to continue
          </Text>
        </View>
      )}
      <TouchableOpacity
        style={[styles.reviewPayBtn, !canReview && styles.reviewPayBtnDisabled]}
        disabled={!canReview}
        onPress={onPress}
        activeOpacity={0.85}
      >
        <MaterialIcons name="lock" size={ws(16)} color={Colors.white} />
        <Text style={styles.reviewPayBtnText}>
          Review & Pay {AppConstants.appCurrency}{total.toFixed(2)}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  reviewBar: {
    backgroundColor: Colors.white,
    paddingHorizontal: ws(16),
    paddingTop: hs(12),
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  incompleteWarningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(4),
    marginBottom: hs(8),
    justifyContent: 'center',
  },
  incompleteWarningText: {
    ...TYPOGRAPHY.medium,
    fontSize: fs(11),
    color: Colors.redColor,
  },
  reviewPayBtn: {
    backgroundColor: Colors.primaryColor,
    paddingVertical: hs(14),
    borderRadius: ws(14),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ws(8),
  },
  reviewPayBtnDisabled: {
    backgroundColor: Colors.slate_94A3B8,
  },
  reviewPayBtnText: {
    ...TYPOGRAPHY.bold,
    fontSize: fs(14),
    color: Colors.white,
  },
});
