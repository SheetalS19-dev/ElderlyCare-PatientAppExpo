import React, { memo } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { AppTextField, StarRating } from '../../../components';
import { Colors } from '../../../constants';
import { fs, hs, TYPOGRAPHY, ws } from '../../../utils';

interface AppointmentReviewModalProps {
  visible: boolean;
  onClose: () => void;
  doctorName: string;
  rating: number;
  onRatingChange: (r: number) => void;
  reviewText: string;
  onChangeReviewText: (t: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export const AppointmentReviewModal = memo(({
  visible,
  onClose,
  doctorName,
  rating,
  onRatingChange,
  reviewText,
  onChangeReviewText,
  onSubmit,
  isSubmitting,
}: AppointmentReviewModalProps) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.dialogOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.dialogBox}>
          <Text style={styles.dialogTitle}>Give review to {doctorName}</Text>
          <View style={styles.reviewStarsRow}>
            <StarRating
              rating={rating}
              starSize={28}
              readOnly={false}
              onRatingChange={onRatingChange}
            />
          </View>
          <AppTextField
            placeholder="Share your experience..."
            value={reviewText}
            onChangeText={onChangeReviewText}
            multiline
            numberOfLines={3}
          />
          <View style={styles.dialogActions}>
            <TouchableOpacity style={styles.dialogBtnCancel} onPress={onClose}>
              <Text style={styles.dialogBtnTextMuted}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dialogBtnConfirm}
              onPress={onSubmit}
              disabled={isSubmitting}
            >
              <Text style={styles.dialogBtnTextConfirm}>
                {isSubmitting ? 'Submitting…' : 'Submit Review'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
});

const styles = StyleSheet.create({
  dialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: ws(24),
  },
  dialogBox: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: fs(18),
    padding: ws(20),
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: hs(4) },
    shadowOpacity: 0.15,
    shadowRadius: fs(10),
    elevation: 8,
  },
  dialogTitle: {
    fontSize: fs(16),
    ...TYPOGRAPHY.bold,
    color: Colors.ink,
    textAlign: 'center',
    marginBottom: hs(14),
  },
  reviewStarsRow: {
    alignItems: 'center',
    marginBottom: hs(14),
  },
  dialogActions: {
    flexDirection: 'row',
    gap: ws(12),
    marginTop: hs(16),
  },
  dialogBtnCancel: {
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
    height: hs(46),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: fs(12),
    backgroundColor: '#F1F5F9',
  },
  dialogBtnTextMuted: {
    fontSize: fs(13),
    ...TYPOGRAPHY.bold,
    color: '#64748B',
  },
  dialogBtnConfirm: {
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
    height: hs(46),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: fs(12),
    backgroundColor: Colors.primaryColor,
  },
  dialogBtnTextConfirm: {
    fontSize: fs(13),
    ...TYPOGRAPHY.bold,
    color: Colors.white,
  },
});
