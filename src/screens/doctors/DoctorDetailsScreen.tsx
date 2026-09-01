import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppButton, AppCard, AppHeader, ErrorState, LoadingIndicator, StarRating } from '../../components';
import { Colors, Typography } from '../../constants';
import { useAuth } from '../../context/AuthContext';
import type { RootStackParamList } from '../../navigation/types';
import { useGetDoctorByIdQuery, useGetDoctorReviewsQuery } from '../../redux/apis/doctorApi';
import type { DoctorModel, DoctorReviewModel } from '../../types';
import { formatDoctorName, getImageUrl } from '../../utils';

type Props = NativeStackScreenProps<RootStackParamList, 'DoctorDetails'>;

export const DoctorDetailsScreen = ({ navigation, route }: Props) => {
  const { doctId } = route.params;
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();
  const { data: rawDoctor, isLoading, isError, refetch } = useGetDoctorByIdQuery(doctId);
  const { data: rawReviews } = useGetDoctorReviewsQuery(doctId);

  const doctor: DoctorModel | null = React.useMemo(() => {
    if (!rawDoctor) return null;
    let target = (rawDoctor as any)?.data ?? (rawDoctor as any)?.response ?? rawDoctor;
    if (Array.isArray(target)) return target[0] ?? null;
    return target ?? null;
  }, [rawDoctor]);

  const reviews: DoctorReviewModel[] = React.useMemo(() => {
    if (!rawReviews) return [];
    if (Array.isArray(rawReviews)) return rawReviews;
    if (Array.isArray((rawReviews as any)?.data)) return (rawReviews as any).data;
    if (Array.isArray((rawReviews as any)?.response)) return (rawReviews as any).response;
    return [];
  }, [rawReviews]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <AppHeader title="Doctor Details" onBackPress={() => navigation.goBack()} />
        <LoadingIndicator variant="detail" />
      </View>
    );
  }

  if (isError || !doctor) {
    return (
      <View style={styles.container}>
        <AppHeader title="Doctor Details" onBackPress={() => navigation.goBack()} />
        <ErrorState message="Couldn't load doctor's details" onRetry={refetch} />
      </View>
    );
  }

  const fullName = formatDoctorName(doctor.f_name, doctor.l_name);
  const rating = Number(doctor.average_rating ?? 0);

  const fees = [
    doctor.clinic_appointment
      ? {
          label: 'Clinic Visit',
          value: doctor.opd_fee,
          iconSource: require('../../../assets/icons/medical-appointment.png'),
          bgColor: '#EFF6FF',
        }
      : null,
    doctor.video_appointment
      ? {
          label: 'Video Call',
          value: doctor.video_fee,
          iconSource: require('../../../assets/icons/Play.png'),
          bgColor: '#EFF6FF',
        }
      : null,
    doctor.emergency_appointment
      ? {
          label: 'Emergency',
          value: doctor.emg_fee,
          iconSource: require('../../../assets/icons/ambulance.png'),
          bgColor: '#EFF6FF',
        }
      : null,
  ].filter(Boolean) as { label: string; value?: number | string; iconSource: any; bgColor: string }[];

  const clinicImgRaw = Array.isArray(doctor.clinic_image)
    ? doctor.clinic_image[0]
    : doctor.clinic_image || doctor.clinic_thumb_image || (doctor as any).clinics_image;
  const clinicImgUrl = getImageUrl(clinicImgRaw);

  const bookingDisabled = doctor.stop_booking === 1;

  return (
    <View style={styles.container}>
      <AppHeader title="Doctor Details" onBackPress={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + 90, 110) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <AppCard style={styles.profileCard}>
          <View style={styles.profileRow}>
            <View style={styles.avatarWrapper}>
              <Image
                source={
                  getImageUrl(doctor.image)
                    ? { uri: getImageUrl(doctor.image) }
                    : require('../../../assets/icons/user.png')
                }
                style={styles.avatar}
              />
              <View style={styles.verifiedBadge}>
                <MaterialIcons name="verified" size={16} color={Colors.primaryColor} />
              </View>
            </View>

            <View style={styles.profileInfo}>
              <Text style={styles.name}>{fullName || 'Doctor'}</Text>
              {!!(doctor.specialization || doctor.dept_title) && (
                <Text style={styles.specialization}>
                  {doctor.specialization || (doctor as any).dept_title}
                </Text>
              )}
              {!!((doctor as any).degree || (doctor as any).qualification) && (
                <Text style={styles.degreeText}>
                  {(doctor as any).degree || (doctor as any).qualification}
                </Text>
              )}
              <View style={styles.ratingRow}>
                <StarRating rating={rating} starSize={14} />
                <Text style={styles.ratingText}>
                  {rating.toFixed(1)} ({doctor.number_of_reviews ?? 0} Reviews)
                </Text>
              </View>
            </View>
          </View>

          {/* Stats Bar */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{doctor.ex_year ?? doctor.experience ?? '--'}</Text>
              <Text style={styles.statLabel}>Years Exp.</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{doctor.total_appointment_done ?? 0}+</Text>
              <Text style={styles.statLabel}>Patients Served</Text>
            </View>
          </View>
        </AppCard>

        {/* Consultation Fees Section */}
        {!!fees.length && (
          <>
            <Text style={styles.sectionTitle}>Consultation Modes & Fees</Text>
            <View style={styles.feeRow}>
              {fees.map((fee) => (
                <AppCard key={fee.label} style={styles.feeCard}>
                  <View style={[styles.feeIconCircle, { backgroundColor: fee.bgColor }]}>
                    <Image source={fee.iconSource} style={styles.feeAssetImg} resizeMode="contain" />
                  </View>
                  <Text style={styles.feeLabel}>{fee.label}</Text>
                  <Text style={styles.feeValue}>₹{fee.value ?? '--'}</Text>
                </AppCard>
              ))}
            </View>
          </>
        )}

        {/* About Section */}
        {!!doctor.description && (
          <>
            <Text style={styles.sectionTitle}>About Doctor</Text>
            <AppCard>
              <Text style={styles.aboutText}>{doctor.description}</Text>
            </AppCard>
          </>
        )}

        {/* Clinic & Contact Details Section (Web Compatible) */}
        <Text style={styles.sectionTitle}>Clinic Contact & Location</Text>
        <AppCard style={styles.clinicContactCard}>
          <View style={styles.clinicHeaderRow}>
            <View style={styles.clinicIconCircle}>
              {clinicImgUrl ? (
                <Image
                  source={{ uri: clinicImgUrl }}
                  style={styles.clinicLogoImg}
                  resizeMode="cover"
                />
              ) : (
                <MaterialIcons name="local-hospital" size={24} color={Colors.primaryColor} />
              )}
            </View>
            <View style={styles.clinicInfoText}>
              <Text style={styles.clinicTitle}>
                {doctor.clinic_title || doctor.clinic_name || (doctor as any).clinics_name || 'Jagrani Hospital Lucknow'}
              </Text>
              <Text style={styles.clinicSubtitle}>Primary Consulting Clinic</Text>
            </View>
          </View>

          <View style={styles.contactDivider} />

          <View style={styles.contactDetailsList}>
            {/* Phone */}
            <View style={styles.contactRowItem}>
              <View style={styles.contactIconCircle}>
                <MaterialIcons name="phone" size={18} color={Colors.primaryColor} />
              </View>
              <View style={styles.contactMeta}>
                <Text style={styles.contactLabel}>Phone</Text>
                <Text style={styles.contactValue}>
                  {(doctor as any).clinic_phone || doctor.phone || (doctor as any).clinics_phone || '9876543227'}
                </Text>
              </View>
            </View>

            {/* Email */}
            <View style={styles.contactRowItem}>
              <View style={styles.contactIconCircle}>
                <MaterialIcons name="email" size={18} color={Colors.primaryColor} />
              </View>
              <View style={styles.contactMeta}>
                <Text style={styles.contactLabel}>Email</Text>
                <Text style={styles.contactValue}>
                  {(doctor as any).clinic_email || doctor.email || (doctor as any).clinics_email || 'amit@gmail.com'}
                </Text>
              </View>
            </View>

            {/* Address */}
            <View style={styles.contactRowItem}>
              <View style={styles.contactIconCircle}>
                <MaterialIcons name="location-on" size={18} color={Colors.primaryColor} />
              </View>
              <View style={styles.contactMeta}>
                <Text style={styles.contactLabel}>Clinic Address</Text>
                <Text style={styles.contactValue}>
                  {doctor.clinics_address || doctor.clinic_address || 'Jagrani Hospital Lucknow, Lucknow'}
                </Text>
              </View>
            </View>
          </View>
        </AppCard>



        {/* Reviews Section */}
        {!!reviews.length && (
          <>
            <Text style={styles.sectionTitle}>Patient Reviews ({reviews.length})</Text>
            {reviews.slice(0, 5).map((review: DoctorReviewModel, index: number) => (
              <AppCard key={review.id ?? index} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewerName}>{review.user_name ?? 'Patient'}</Text>
                  <StarRating rating={Number(review.points ?? 0)} starSize={13} />
                </View>
                {!!review.description && <Text style={styles.reviewText}>{review.description}</Text>}
              </AppCard>
            ))}
          </>
        )}
      </ScrollView>

      {/* Floating Bottom Action Bar with Insets Safety */}
      <View
        style={[
          styles.bookBar,
          { paddingBottom: Math.max(insets.bottom + 12, 16) },
        ]}
      >
        <AppButton
          title={bookingDisabled ? 'Not Accepting Appointments' : 'Book Appointment'}
          disabled={bookingDisabled}
          onPress={() => {
            if (!isAuthenticated) {
              navigation.navigate('Login');
              return;
            }
            navigation.navigate('BookAppointment', { doctId });
          }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgColor,
  },
  scrollContent: {
    padding: 16,
  },
  profileCard: {
    borderRadius: 18,
    padding: 16,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 14,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: Colors.inputTextBgColor,
    borderWidth: 2,
    borderColor: Colors.primaryColor,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: Colors.white,
    borderRadius: 10,
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryFontColor,
  },
  specialization: {
    marginTop: 3,
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primaryColor,
  },
  degreeText: {
    marginTop: 2,
    fontSize: 11,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.secondaryFontColor,
  },
  ratingRow: {

    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  ratingText: {
    marginLeft: 8,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.secondaryFontColor,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#F1F5F9',
  },
  statValue: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryColor,
  },
  statLabel: {
    marginTop: 2,
    fontSize: Typography.fontSize.xs,
    color: Colors.secondaryFontColor,
    fontFamily: Typography.fontFamily.regular,
  },
  sectionTitle: {
    marginTop: 20,
    marginBottom: 10,
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryFontColor,
  },
  feeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  feeCard: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    borderRadius: 14,
  },
  feeIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  feeAssetImg: {
    width: 24,
    height: 24,
  },
  feeLabel: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.secondaryFontColor,
  },
  feeValue: {
    marginTop: 4,
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryFontColor,
  },
  aboutText: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.primaryFontColor,
    lineHeight: 22,
  },
  clinicContactCard: {
    padding: 16,
    borderRadius: 16,
  },
  clinicHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clinicIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  clinicLogoImg: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  clinicInfoText: {
    flex: 1,
  },
  clinicTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryFontColor,
  },
  clinicSubtitle: {
    marginTop: 2,
    fontSize: 11,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.primaryColor,
  },

  contactDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },
  contactDetailsList: {
    gap: 12,
  },
  contactRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  contactIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactMeta: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.secondaryFontColor,
  },
  contactValue: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryFontColor,
    marginTop: 2,
  },

  reviewCard: {
    marginBottom: 10,
    padding: 14,
    borderRadius: 14,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewerName: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryFontColor,
  },
  reviewText: {
    marginTop: 8,
    fontSize: Typography.fontSize.xs,
    color: Colors.secondaryFontColor,
    lineHeight: 18,
  },
  bookBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 100,
  },
});
