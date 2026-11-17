import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  AppCard,
  AppHeader,
  EmptyState,
  ErrorState,
  LoadingIndicator,
  SearchBox,
  StarRating,
} from '../../components';
import { Colors } from '../../constants';
import type { DoctorReviewModel } from '../../types';
import { DateTimeUtils, fs, getImageUrl, hs, TYPOGRAPHY, ws } from '../../utils';
import { type ReviewFilterKey, useDoctorReviews } from './useDoctorReviews';

export const DoctorReviewsScreen: React.FC = () => {
  const {
    navigation,
    insets,
    doctorFullName,
    doctorDepartment,
    doctorImage,
    allReviews,
    filteredReviews,
    avgRating,
    totalReviewsCount,
    distribution,
    selectedFilter,
    setSelectedFilter,
    searchQuery,
    setSearchQuery,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useDoctorReviews();

  const filterChips: { key: ReviewFilterKey; label: string; count?: number }[] = [
    { key: 'all', label: 'All', count: allReviews.length },
    { key: '5', label: '5 ★', count: distribution.counts[5] },
    { key: '4', label: '4 ★', count: distribution.counts[4] },
    { key: '3', label: '3 ★', count: distribution.counts[3] },
    { key: 'with_comments', label: 'With Feedback' },
  ];

  return (
    <View style={styles.container}>
      <AppHeader title="Patient Reviews" onBackPress={() => navigation.goBack()} />

      {isLoading && allReviews.length === 0 ? (
        <LoadingIndicator />
      ) : isError ? (
        <ErrorState message="Could not load patient reviews" onRetry={refetch} />
      ) : (
        <FlatList
          data={filteredReviews}
          keyExtractor={(item, index) => `review-${item.id ?? index}`}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom + hs(16), hs(24)) },
          ]}
          showsVerticalScrollIndicator={false}
          refreshing={isFetching}
          onRefresh={refetch}
          ListHeaderComponent={
            <>
              {/* Doctor Summary Hero Card */}
              <AppCard style={styles.heroCard}>
                <View style={styles.doctorHeaderRow}>
                  {doctorImage ? (
                    <Image
                      source={{ uri: getImageUrl(doctorImage) }}
                      style={styles.doctorAvatar}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <MaterialIcons name="person" size={fs(26)} color={Colors.primaryColor} />
                    </View>
                  )}
                  <View style={styles.doctorMeta}>
                    <Text style={styles.doctorName} numberOfLines={1}>
                      {doctorFullName}
                    </Text>
                    <Text style={styles.doctorSpecialty} numberOfLines={1}>
                      {doctorDepartment}
                    </Text>
                    <View style={styles.verifiedRow}>
                      <MaterialIcons name="verified" size={fs(14)} color={Colors.green_10B981} />
                      <Text style={styles.verifiedDoctorText}>Verified Specialist</Text>
                    </View>
                  </View>
                </View>

                {/* Score & Breakdown Row */}
                <View style={styles.ratingOverviewRow}>
                  {/* Left: Overall Score */}
                  <View style={styles.overallScoreBox}>
                    <Text style={styles.overallScoreText}>{avgRating.toFixed(1)}</Text>
                    <StarRating rating={avgRating} starSize={14} />
                    <Text style={styles.totalReviewsSubText}>
                      Based on {totalReviewsCount} {totalReviewsCount === 1 ? 'review' : 'reviews'}
                    </Text>
                  </View>

                  <View style={styles.dividerVertical} />

                  {/* Right: Distribution Bars */}
                  <View style={styles.breakdownBox}>
                    {[5, 4, 3, 2, 1].map((stars) => {
                      const count = distribution.counts[stars as keyof typeof distribution.counts];
                      const pct = distribution.percentages[stars as keyof typeof distribution.percentages];
                      return (
                        <View key={`bar-${stars}`} style={styles.barRow}>
                          <Text style={styles.barLabel}>{stars} ★</Text>
                          <View style={styles.barTrack}>
                            <View style={[styles.barFill, { width: `${pct}%` }]} />
                          </View>
                          <Text style={styles.barCount}>{count}</Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              </AppCard>

              {/* Search Within Reviews */}
              {allReviews.length > 3 && (
                <View style={styles.searchWrapper}>
                  <SearchBox
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Search reviews by keyword or patient..."
                  />
                </View>
              )}

              {/* Filter Pills */}
              <View style={styles.filterPillsRow}>
                {filterChips.map((chip) => {
                  const isActive = selectedFilter === chip.key;
                  return (
                    <TouchableOpacity
                      key={chip.key}
                      style={[styles.filterChip, isActive && styles.filterChipActive]}
                      onPress={() => setSelectedFilter(chip.key)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                        {chip.label}
                        {chip.count != null ? ` (${chip.count})` : ''}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Reviews Header Label */}
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>
                  {selectedFilter === 'all'
                    ? `All Reviews (${filteredReviews.length})`
                    : `Filtered Reviews (${filteredReviews.length})`}
                </Text>
              </View>
            </>
          }
          ListEmptyComponent={
            <EmptyState
              message={
                searchQuery
                  ? `No reviews match "${searchQuery}"`
                  : selectedFilter !== 'all'
                    ? 'No reviews found for this rating filter.'
                    : `No reviews yet for ${doctorFullName}.`
              }
              subtitle="Be the first patient to share your consultation experience!"
            />
          }
          renderItem={({ item }) => {
            const reviewerName =
              [item.f_name, item.l_name].filter(Boolean).join(' ').trim() ||
              [(item as any).user_f_name, (item as any).user_l_name].filter(Boolean).join(' ').trim() ||
              item.user_name ||
              (item as any).patient_name ||
              (item as any).name ||
              'Patient';

            const rawReviewDate =
              item.created_at ||
              (item as any).updated_at ||
              (item as any).date ||
              (item as any).created_date ||
              '';
            const reviewDate = rawReviewDate
              ? DateTimeUtils.getDataFormat(rawReviewDate) || rawReviewDate
              : 'Recently';
            const reviewPts = Number(item.points ?? item.rating ?? 5);
            const reviewComment = (item.description || item.comment || (item as any).feedback || '').trim();
            const serviceReason = (item as any).service || (item as any).reason || 'Doctor Consultation';

            return (
              <AppCard style={styles.reviewCard}>
                <View style={styles.reviewTopRow}>
                  {/* Avatar Initial */}
                  <View style={styles.reviewerAvatar}>
                    <Text style={styles.reviewerInitial}>
                      {reviewerName.charAt(0).toUpperCase()}
                    </Text>
                  </View>

                  {/* Reviewer Meta */}
                  <View style={styles.reviewerMeta}>
                    <View style={styles.reviewerNameRow}>
                      <Text style={styles.reviewerName} numberOfLines={1}>
                        {reviewerName}
                      </Text>
                      <View style={styles.verifiedBadge}>
                        <MaterialIcons name="check-circle" size={fs(12)} color={Colors.green_10B981} />
                        <Text style={styles.verifiedBadgeText}>Verified Patient</Text>
                      </View>
                    </View>

                    <View style={styles.serviceAndDateRow}>
                      <Text style={styles.serviceText} numberOfLines={1}>
                        {serviceReason}
                      </Text>
                      <Text style={styles.dateDot}>•</Text>
                      <Text style={styles.reviewDate}>{reviewDate}</Text>
                    </View>

                    {/* Star Rating */}
                    <View style={styles.starsRow}>
                      <StarRating rating={reviewPts} starSize={13} />
                      <Text style={styles.scoreText}>{reviewPts.toFixed(1)}</Text>
                    </View>
                  </View>
                </View>

                {/* Comment Body */}
                {!!reviewComment && (
                  <View style={styles.commentBox}>
                    <Text style={styles.commentText}>{reviewComment}</Text>
                  </View>
                )}
              </AppCard>
            );
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgColor,
  },
  listContent: {
    padding: ws(16),
  },
  heroCard: {
    padding: ws(16),
    borderRadius: fs(18),
    marginBottom: hs(14),
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  doctorHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: hs(14),
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: hs(14),
  },
  doctorAvatar: {
    width: ws(54),
    height: ws(54),
    borderRadius: 999,
    overflow: 'hidden',
    marginRight: ws(12),
    backgroundColor: Colors.slate_F1F5F9,
  },
  avatarPlaceholder: {
    width: ws(54),
    height: ws(54),
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: Colors.aquaSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ws(12),
  },
  doctorMeta: {
    flex: 1,
  },
  doctorName: {
    fontSize: fs(16),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
    marginBottom: hs(2),
  },
  doctorSpecialty: {
    fontSize: fs(12),
    ...TYPOGRAPHY.medium,
    color: Colors.secondaryFontColor,
    marginBottom: hs(4),
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(4),
  },
  verifiedDoctorText: {
    fontSize: fs(11),
    ...TYPOGRAPHY.medium,
    color: Colors.green_10B981,
  },
  ratingOverviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  overallScoreBox: {
    alignItems: 'center',
    justifyContent: 'center',
    width: ws(110),
    paddingRight: ws(10),
  },
  overallScoreText: {
    fontSize: fs(34),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryColor,
    marginBottom: hs(2),
  },
  totalReviewsSubText: {
    fontSize: fs(10),
    ...TYPOGRAPHY.regular,
    color: Colors.secondaryFontColor,
    textAlign: 'center',
    marginTop: hs(4),
  },
  dividerVertical: {
    width: 1,
    height: '85%',
    backgroundColor: Colors.border,
    marginRight: ws(12),
  },
  breakdownBox: {
    flex: 1,
    gap: hs(5),
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(6),
  },
  barLabel: {
    width: ws(24),
    fontSize: fs(10),
    ...TYPOGRAPHY.medium,
    color: Colors.secondaryFontColor,
  },
  barTrack: {
    flex: 1,
    height: hs(6),
    backgroundColor: Colors.slate_F1F5F9,
    borderRadius: fs(3),
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: Colors.yellow_FFC107,
    borderRadius: fs(3),
  },
  barCount: {
    width: ws(24),
    fontSize: fs(10),
    ...TYPOGRAPHY.medium,
    color: Colors.slate_94A3B8,
    textAlign: 'right',
  },
  searchWrapper: {
    marginBottom: hs(10),
  },
  filterPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ws(8),
    marginBottom: hs(14),
  },
  filterChip: {
    backgroundColor: Colors.white,
    paddingHorizontal: ws(12),
    paddingVertical: hs(6),
    borderRadius: fs(14),
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primaryColor,
    borderColor: Colors.primaryColor,
  },
  filterChipText: {
    fontSize: fs(12),
    ...TYPOGRAPHY.medium,
    color: Colors.secondaryFontColor,
  },
  filterChipTextActive: {
    color: Colors.white,
    ...TYPOGRAPHY.bold,
  },
  sectionHeaderRow: {
    marginBottom: hs(10),
  },
  sectionTitle: {
    fontSize: fs(14),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
  },
  reviewCard: {
    padding: ws(14),
    borderRadius: fs(16),
    marginBottom: hs(10),
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  reviewTopRow: {
    flexDirection: 'row',
  },
  reviewerAvatar: {
    width: ws(38),
    height: ws(38),
    borderRadius: 999,
    overflow: 'hidden',
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
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hs(2),
  },
  reviewerName: {
    fontSize: fs(13),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
    flex: 1,
    marginRight: ws(6),
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(3),
    backgroundColor: Colors.green_ECFDF5,
    paddingHorizontal: ws(6),
    paddingVertical: hs(2),
    borderRadius: fs(6),
  },
  verifiedBadgeText: {
    fontSize: fs(9),
    ...TYPOGRAPHY.medium,
    color: Colors.green_059669,
  },
  serviceAndDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hs(4),
  },
  serviceText: {
    fontSize: fs(11),
    ...TYPOGRAPHY.regular,
    color: Colors.secondaryFontColor,
  },
  dateDot: {
    marginHorizontal: ws(4),
    fontSize: fs(10),
    color: Colors.slate_94A3B8,
  },
  reviewDate: {
    fontSize: fs(11),
    ...TYPOGRAPHY.regular,
    color: Colors.slate_94A3B8,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(4),
  },
  scoreText: {
    fontSize: fs(11),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
  },
  commentBox: {
    marginTop: hs(10),
    paddingTop: hs(10),
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  commentText: {
    fontSize: fs(12),
    ...TYPOGRAPHY.regular,
    color: Colors.primaryFontColor,
    lineHeight: fs(18),
  },
});
