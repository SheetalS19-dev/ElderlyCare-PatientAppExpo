import React, { memo, useEffect, useMemo, useState } from 'react';
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

const MAX_REVIEW_WORDS = 300;

const countWords = (text: string): number => {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
};

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
  const [errorMsg, setErrorMsg] = useState<string>('');

  const wordCount = useMemo(() => countWords(reviewText), [reviewText]);
  const isOverLimit = wordCount > MAX_REVIEW_WORDS;

  useEffect(() => {
    if (!visible) {
      setErrorMsg('');
    }
  }, [visible]);

  const handleRatingChange = (newRating: number) => {
    setErrorMsg('');
    onRatingChange(newRating);
  };

  const handleTextChange = (text: string) => {
    setErrorMsg('');
    onChangeReviewText(text);
  };

  const handleValidateAndSubmit = () => {
    if (!rating || rating < 1) {
      setErrorMsg('Please select a star rating (1–5 stars)');
      return;
    }
    if (!reviewText.trim()) {
      setErrorMsg('Please share your experience with the doctor');
      return;
    }
    if (wordCount > MAX_REVIEW_WORDS) {
      setErrorMsg(`Review exceeds limit (${wordCount}/${MAX_REVIEW_WORDS} words)`);
      return;
    }
    setErrorMsg('');
    onSubmit();
  };

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
              onRatingChange={handleRatingChange}
            />
          </View>
          <AppTextField
            placeholder="Share your experience..."
            value={reviewText}
            onChangeText={handleTextChange}
            multiline
            numberOfLines={4}
            style={styles.reviewInput}
          />
          <View style={styles.counterRow}>
            {errorMsg ? (
              <Text style={styles.errorText} numberOfLines={1}>
                {errorMsg}
              </Text>
            ) : (
              <View style={{ flex: 1 }} />
            )}
            <Text
              style={[
                styles.wordCounterText,
                isOverLimit && styles.wordCounterExceeded,
              ]}
            >
              {wordCount} / {MAX_REVIEW_WORDS} words
            </Text>
          </View>
          <View style={styles.dialogActions}>
            <TouchableOpacity style={styles.dialogBtnCancel} onPress={onClose}>
              <Text style={styles.dialogBtnTextMuted}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.dialogBtnConfirm,
                (isOverLimit || isSubmitting) && styles.dialogBtnDisabled,
              ]}
              onPress={handleValidateAndSubmit}
              disabled={isSubmitting || isOverLimit}
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
  reviewInput: {
    minHeight: hs(90),
    textAlignVertical: 'top',
  },
  counterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: hs(4),
    paddingHorizontal: ws(2),
  },
  errorText: {
    flex: 1,
    fontSize: fs(11),
    ...TYPOGRAPHY.medium,
    color: Colors.btnColorRed || Colors.red_EF4444,
    marginRight: ws(8),
  },
  wordCounterText: {
    fontSize: fs(11),
    ...TYPOGRAPHY.medium,
    color: Colors.secondaryFontColor,
  },
  wordCounterExceeded: {
    color: Colors.btnColorRed || Colors.red_EF4444,
    ...TYPOGRAPHY.bold,
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
    backgroundColor: Colors.slate_F1F5F9,
  },
  dialogBtnTextMuted: {
    fontSize: fs(13),
    ...TYPOGRAPHY.bold,
    color: Colors.slate_64748B,
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
  dialogBtnDisabled: {
    opacity: 0.6,
  },
  dialogBtnTextConfirm: {
    fontSize: fs(13),
    ...TYPOGRAPHY.bold,
    color: Colors.white,
  },
});
