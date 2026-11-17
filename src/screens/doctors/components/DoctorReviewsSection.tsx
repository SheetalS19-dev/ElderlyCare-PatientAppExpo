import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppCard, StarRating } from '../../../components';
import { Colors } from '../../../constants';
import type { DoctorReviewModel } from '../../../types';
import { DateTimeUtils, fs, hs, TYPOGRAPHY, ws } from '../../../utils';

interface DoctorReviewsSectionProps {
  reviews: DoctorReviewModel[];
  doctorName: string;
  reviewCount?: number;
}

export const DoctorReviewsSection = memo(({ reviews, doctorName, reviewCount }: DoctorReviewsSectionProps) => {
  const displayCount = reviewCount != null && reviewCount >= reviews.length ? reviewCount : reviews.length;

  return (
    <>
      <Text style={styles.sectionTitle}>
        Patient Reviews ({displayCount})
      </Text>

      {reviews.length > 0 ? (
        reviews.map((review: DoctorReviewModel, index: number) => {
          const reviewerName =
            [review.f_name, review.l_name].filter(Boolean).join(' ').trim() ||
            [(review as any).user_f_name, (review as any).user_l_name].filter(Boolean).join(' ').trim() ||
            review.user_name ||
            (review as any).patient_name ||
            (review as any).name ||
            'Patient';

          const rawReviewDate =
            review.created_at ||
            review.updated_at ||
            (review as any).date ||
            (review as any).created_date ||
            (review as any).review_date ||
            '';
          const reviewDate = rawReviewDate
            ? DateTimeUtils.getDataFormat(rawReviewDate) || rawReviewDate
            : '';
          const reviewPts = Number(review.points ?? review.rating ?? 5);
          const reviewComment = review.description || review.comment || (review as any).feedback;

          return (
            <AppCard key={review.id ?? index} style={styles.reviewCard}>
              <View style={styles.reviewTopRow}>
                <View style={styles.reviewerAvatar}>
                  <Text style={styles.reviewerInitial}>
                    {reviewerName.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.reviewerMeta}>
                  <View style={styles.reviewerNameRow}>
                    <Text style={styles.reviewerName} numberOfLines={1}>
                      {reviewerName}
                    </Text>
                    {!!reviewDate && (
                      <Text style={styles.reviewDate}>{reviewDate}</Text>
                    )}
                  </View>
                  <Text style={styles.reviewServiceText}>
                    {(review as any).service || (review as any).reason || 'Visited for Consultation'}
                  </Text>
                  <View style={styles.reviewStarsRow}>
                    <StarRating rating={reviewPts} starSize={12} />
                    <Text style={styles.reviewPoints}>{reviewPts.toFixed(1)}</Text>
                  </View>
                </View>
              </View>
              {reviewComment ? (
                <Text style={styles.reviewDescription}>{reviewComment}</Text>
              ) : null}
            </AppCard>
          );
        })
      ) : (
        <View style={styles.emptyReviewsCard}>
          <View style={styles.emptyReviewsIconCircle}>
            <MaterialIcons name="chat-bubble-outline" size={20} color={Colors.primaryColor} />
          </View>
          <View style={styles.emptyReviewsContent}>
            <Text style={styles.emptyReviewsTitle}>No Reviews Yet</Text>
            <Text style={styles.emptyReviewsSub}>
              Be the first to share your experience with {doctorName}.
            </Text>
          </View>
        </View>
      )}
    </>
  );
});

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: fs(14),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
    marginBottom: hs(10),
  },
  reviewCard: {
    padding: ws(14),
    borderRadius: fs(16),
    marginBottom: hs(10),
  },
  reviewTopRow: {
    flexDirection: 'row',
  },
  reviewerAvatar: {
    width: ws(38),
    height: hs(38),
    borderRadius: fs(19),
    backgroundColor: Colors.aquaSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ws(10),
  },
  reviewerInitial: {
    fontSize: fs(15),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryColor,
  },
  reviewerMeta: {
    flex: 1,
  },
  reviewerNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewerName: {
    fontSize: fs(13),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
  },
  reviewDate: {
    fontSize: fs(11),
    ...TYPOGRAPHY.regular,
    color: Colors.secondaryFontColor,
  },
  reviewServiceText: {
    fontSize: fs(11),
    ...TYPOGRAPHY.medium,
    color: Colors.primaryColor,
    marginTop: hs(2),
  },
  reviewStarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(4),
    marginTop: hs(4),
  },
  reviewPoints: {
    fontSize: fs(11),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
  },
  reviewDescription: {
    fontSize: fs(12),
    ...TYPOGRAPHY.regular,
    color: Colors.secondaryFontColor,
    marginTop: hs(8),
    lineHeight: hs(18),
  },
  emptyReviewsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: fs(16),
    padding: ws(16),
    borderWidth: 1,
    borderColor: Colors.borderColor,
    marginBottom: hs(14),
  },
  emptyReviewsIconCircle: {
    width: ws(40),
    height: hs(40),
    borderRadius: fs(20),
    backgroundColor: Colors.aquaSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ws(12),
  },
  emptyReviewsContent: {
    flex: 1,
  },
  emptyReviewsTitle: {
    fontSize: fs(14),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
  },
  emptyReviewsSub: {
    fontSize: fs(12),
    ...TYPOGRAPHY.regular,
    color: Colors.secondaryFontColor,
    marginTop: hs(2),
  },
});
