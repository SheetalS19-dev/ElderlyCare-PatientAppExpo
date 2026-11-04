import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import {
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AppCard,
  AppHeader,
  ErrorState,
  LoadingIndicator,
  StarRating
} from '../../components';
import { AppConstants, Colors } from '../../constants';
import { useAuth } from '../../context/AuthContext';
import type { RootStackParamList } from '../../navigation/types';
import { useGetDoctorByIdQuery, useGetDoctorReviewsQuery } from '../../redux/apis/doctorApi';
import type { DoctorModel, DoctorReviewModel } from '../../types';
import {
  DateTimeUtils,
  formatDoctorName,
  fs,
  getImageUrl,
  hs,
  showToast,
  TYPOGRAPHY,
  ws,
} from '../../utils';

type Props = NativeStackScreenProps<RootStackParamList, 'DoctorDetails'>;

type ConsultationMode = 'clinic' | 'video' | 'emergency';

export const DoctorDetailsScreen = ({ navigation, route }: Props) => {
  const { doctId } = route.params;
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();

  const [selectedMode, setSelectedMode] = useState<ConsultationMode>('clinic');

  const { data: rawDoctor, isLoading, isError, refetch } = useGetDoctorByIdQuery(doctId);
  const { data: rawReviews } = useGetDoctorReviewsQuery(doctId);

  const doctor: DoctorModel | null = useMemo(() => {
    if (!rawDoctor) return null;
    let target = (rawDoctor as any)?.data ?? (rawDoctor as any)?.response ?? rawDoctor;
    if (Array.isArray(target)) return target[0] ?? null;
    return target ?? null;
  }, [rawDoctor]);

  const reviews: DoctorReviewModel[] = useMemo(() => {
    if (!rawReviews) return [];
    if (Array.isArray(rawReviews)) return rawReviews;
    if (Array.isArray((rawReviews as any)?.data)) return (rawReviews as any).data;
    if (Array.isArray((rawReviews as any)?.response)) return (rawReviews as any).response;
    return [];
  }, [rawReviews]);

  // Dynamic Consultation Modes verified from database
  const consultationModes = useMemo(() => {
    if (!doctor) return [];
    return [
      Number(doctor.clinic_appointment) === 1 || Boolean(doctor.opd_fee)
        ? {
          id: 'clinic' as ConsultationMode,
          label: 'Clinic Visit',
          fee: doctor.opd_fee != null ? `${AppConstants.appCurrency}${doctor.opd_fee}` : '--',
          subtext: '(In-person)',
          icon: 'hospital-building',
          isCommunity: true,
        }
        : null,
      Number(doctor.video_appointment) === 1 || Boolean(doctor.video_fee)
        ? {
          id: 'video' as ConsultationMode,
          label: 'Video Consultation',
          fee: doctor.video_fee != null ? `${AppConstants.appCurrency}${doctor.video_fee}` : '--',
          subtext: '(Online)',
          icon: 'videocam',
          isCommunity: false,
        }
        : null,
      Number(doctor.emergency_appointment) === 1 || (doctor.emergency_appointment as any) === '1'
        ? {
          id: 'emergency' as ConsultationMode,
          label: 'Emergency',
          fee: doctor.emg_fee != null ? `${AppConstants.appCurrency}${doctor.emg_fee}` : '--',
          subtext: '(In-person only)',
          icon: 'ambulance',
          isCommunity: true,
        }
        : null,
    ].filter(Boolean) as {
      id: ConsultationMode;
      label: string;
      fee: string;
      subtext: string;
      icon: string;
      isCommunity: boolean;
    }[];
  }, [doctor]);

  useEffect(() => {
    if (consultationModes.length > 0 && !consultationModes.some((m) => m.id === selectedMode)) {
      setSelectedMode(consultationModes[0].id);
    }
  }, [consultationModes, selectedMode]);

  const handleOpenUrl = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        showToast('Cannot open link on this device');
      }
    } catch {
      showToast('Action could not be completed');
    }
  };

  const handleOpenDirections = (addressQuery: string) => {
    const query = encodeURIComponent(addressQuery);
    handleOpenUrl(`https://www.google.com/maps/search/?api=1&query=${query}`);
  };

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
  const reviewCount = Number(doctor.number_of_reviews ?? reviews.length);
  const reviewCountText = `${rating > 0 ? rating.toFixed(1) : '0.0'} (${reviewCount} ${reviewCount === 1 ? 'Review' : 'Reviews'
    })`;

  const bookingDisabled = doctor.stop_booking === 1;

  // Dynamic Clinic Details
  const clinicTitle =
    doctor.clinic_title || doctor.clinic_name || (doctor as any).clinics_name || '';
  const clinicPhone =
    (doctor as any).clinic_phone || doctor.phone || (doctor as any).clinics_phone || '';
  const clinicEmail =
    (doctor as any).clinic_email || doctor.email || (doctor as any).clinics_email || '';
  const clinicAddress =
    doctor.clinics_address || doctor.clinic_address || '';

  const clinicImgRaw = Array.isArray(doctor.clinic_image)
    ? doctor.clinic_image[0]
    : doctor.clinic_image || doctor.clinic_thumb_image || (doctor as any).clinics_image;
  const clinicImgUrl = getImageUrl(clinicImgRaw);

  const hasClinicSection = Boolean(
    clinicTitle || clinicPhone || clinicEmail || clinicAddress
  );

  const expValue = doctor.ex_year ?? doctor.experience;
  const patientsCount = doctor.total_appointment_done ?? (doctor as any).patients_served;

  return (
    <View style={styles.container}>
      {/* Fixed Header */}
      <AppHeader title="Doctor Details" onBackPress={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + hs(80) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 6. Doctor Profile Card */}
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
            </View>

            <View style={styles.profileInfo}>
              <Text style={styles.name}>{fullName || 'Doctor'}</Text>
              {!!(doctor.department_name || (doctor as any).dept_name || (doctor as any).dept_title || doctor.specialization) && (
                <Text style={styles.specialization}>
                  {doctor.department_name || (doctor as any).dept_name || (doctor as any).dept_title || doctor.specialization}
                </Text>
              )}
              {!!((doctor as any).degree || (doctor as any).qualification) && (
                <Text style={styles.degreeText}>
                  {(doctor as any).degree || (doctor as any).qualification}
                </Text>
              )}
              {expValue != null && (
                <Text style={styles.experienceText}>
                  {expValue}+ Years Experience
                </Text>
              )}

              {/* 7. Ratings */}
              <View style={styles.ratingRow}>
                <StarRating rating={rating} starSize={13} />
                <Text style={styles.ratingText}>{reviewCountText}</Text>
              </View>

              {/* Patients Treated */}
              {patientsCount != null && (
                <View style={styles.patientsRow}>
                  <MaterialIcons name="people" size={14} color="#2563EB" />
                  <Text style={styles.patientsText}>
                    {patientsCount} Patients Treated
                  </Text>
                </View>
              )}
            </View>
          </View>
        </AppCard>

        {/* 8. Consultation Modes & Fees Section */}
        <Text style={styles.sectionTitle}>Consultation Modes & Fees</Text>
        {consultationModes.length > 0 ? (
          <View style={styles.feeCardsRow}>
            {consultationModes.map((mode) => {
              const isSelected = selectedMode === mode.id;
              const isEmergency = mode.id === 'emergency';
              return (
                <TouchableOpacity
                  key={`mode-${mode.id}`}
                  style={[
                    styles.feeCard,
                    isSelected && styles.feeCardSelected,
                    isEmergency && styles.feeCardEmergency,
                    isEmergency && isSelected && styles.feeCardEmergencySelected,
                  ]}
                  onPress={() => setSelectedMode(mode.id)}
                  activeOpacity={0.8}
                >
                  {isSelected ? (
                    <View
                      style={[
                        styles.selectedBadgeCorner,
                        isEmergency && { backgroundColor: '#EF4444' },
                      ]}
                    >
                      <MaterialIcons name="check" size={12} color={Colors.white} />
                    </View>
                  ) : (
                    <View style={styles.unselectedRadioCorner} />
                  )}

                  <View
                    style={[
                      styles.feeIconCircle,
                      {
                        backgroundColor:
                          isEmergency ? '#FEE2E2' : '#EFF6FF',
                      },
                    ]}
                  >
                    {isEmergency ? (
                      <MaterialCommunityIcons
                        name="ambulance"
                        size={22}
                        color="#EF4444"
                      />
                    ) : mode.isCommunity ? (
                      <MaterialCommunityIcons
                        name={mode.icon as any}
                        size={20}
                        color="#2563EB"
                      />
                    ) : (
                      <MaterialIcons
                        name={mode.icon as any}
                        size={20}
                        color="#2563EB"
                      />
                    )}
                  </View>

                  <Text style={styles.feeLabel}>{mode.label}</Text>
                  <Text style={styles.feeValue}>{mode.fee}</Text>
                  <Text style={styles.feeModeSubtext}>{mode.subtext}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyInfoCard}>
            <MaterialIcons name="event-busy" size={18} color="#64748B" />
            <Text style={styles.emptyInfoText}>
              Consultation modes and fees are currently unavailable for this doctor.
            </Text>
          </View>
        )}

        {/* About Section */}
        <Text style={styles.sectionTitle}>About Doctor</Text>
        {doctor.description ? (
          <AppCard style={styles.aboutCard}>
            <Text style={styles.aboutText}>{doctor.description}</Text>
          </AppCard>
        ) : (
          <View style={styles.emptyInfoCard}>
            <MaterialIcons name="info-outline" size={18} color="#64748B" />
            <Text style={styles.emptyInfoText}>
              Profile description is not provided for this doctor.
            </Text>
          </View>
        )}

        {/* 9. Dynamic Clinic Contact & Location Section */}
        <Text style={styles.sectionTitle}>Clinic Contact & Location</Text>
        {hasClinicSection ? (
          <AppCard style={styles.clinicContactCard}>
            <TouchableOpacity
              style={styles.clinicHeaderRow}
              onPress={() => {
                const cId = (doctor as any).clinic_id || (doctor as any).clinics_id;
                if (cId) {
                  navigation.navigate('Clinic', { clinicId: String(cId) });
                }
              }}
              activeOpacity={0.8}
            >
              <View style={styles.clinicIconCircle}>
                {clinicImgUrl ? (
                  <Image
                    source={{ uri: clinicImgUrl }}
                    style={styles.clinicLogoImg}
                    resizeMode="cover"
                  />
                ) : (
                  <MaterialIcons name="local-hospital" size={22} color={Colors.primaryColor} />
                )}
              </View>
              <View style={styles.clinicInfoText}>
                <Text style={styles.clinicTitle}>
                  {clinicTitle || 'Consulting Clinic'}
                </Text>
                <Text style={styles.clinicSubtitle}>Primary Consulting Clinic</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color="#94A3B8" />
            </TouchableOpacity>

            <View style={styles.contactDivider} />

            {/* Clickable Phone */}
            {!!clinicPhone && (
              <TouchableOpacity
                style={styles.contactRowItem}
                onPress={() => handleOpenUrl(`tel:${clinicPhone}`)}
                activeOpacity={0.7}
              >
                <View style={styles.contactIconCircle}>
                  <MaterialIcons name="phone" size={16} color="#2563EB" />
                </View>
                <View style={styles.contactMeta}>
                  <Text style={styles.contactLabel}>Phone</Text>
                  <Text style={styles.contactValueLink}>{clinicPhone}</Text>
                </View>
                <MaterialIcons name="chevron-right" size={18} color="#94A3B8" />
              </TouchableOpacity>
            )}

            {/* Clickable Email */}
            {!!clinicEmail && (
              <TouchableOpacity
                style={styles.contactRowItem}
                onPress={() => handleOpenUrl(`mailto:${clinicEmail}`)}
                activeOpacity={0.7}
              >
                <View style={styles.contactIconCircle}>
                  <MaterialIcons name="email" size={16} color="#2563EB" />
                </View>
                <View style={styles.contactMeta}>
                  <Text style={styles.contactLabel}>Email</Text>
                  <Text style={styles.contactValueLink}>{clinicEmail}</Text>
                </View>
                <MaterialIcons name="chevron-right" size={18} color="#94A3B8" />
              </TouchableOpacity>
            )}

            {/* Clinic Address */}
            {!!clinicAddress && (
              <View style={styles.contactRowItem}>
                <View style={styles.contactIconCircle}>
                  <MaterialIcons name="location-on" size={16} color="#2563EB" />
                </View>
                <View style={styles.contactMeta}>
                  <Text style={styles.contactLabel}>Clinic Address</Text>
                  <Text style={styles.contactValue}>{clinicAddress}</Text>
                </View>
              </View>
            )}

            {/* Directions Action Buttons */}
            {!!clinicAddress && (
              <View style={styles.clinicActionButtonsRow}>
                <TouchableOpacity
                  style={styles.directionsBtn}
                  onPress={() =>
                    handleOpenDirections(`${clinicTitle || ''}, ${clinicAddress}`)
                  }
                  activeOpacity={0.8}
                >
                  <MaterialIcons name="directions" size={16} color="#2563EB" />
                  <Text style={styles.directionsBtnText}>Get Directions</Text>
                </TouchableOpacity>
              </View>
            )}
          </AppCard>
        ) : (
          <View style={styles.emptyInfoCard}>
            <MaterialIcons name="location-off" size={18} color="#64748B" />
            <Text style={styles.emptyInfoText}>
              Primary clinic information is not listed for this doctor.
            </Text>
          </View>
        )}

        {/* 10. Dynamic Patient Reviews Section */}
        <Text style={styles.sectionTitle}>
          Patient Reviews ({reviews.length})
        </Text>

        {reviews.length > 0 ? (
          reviews.map((review: DoctorReviewModel, index: number) => {
            const reviewerName = review.user_name || 'Patient';
            const rawReviewDate =
              review.created_at ||
              (review as any).date ||
              (review as any).created_date ||
              (review as any).review_date ||
              (review as any).updated_at ||
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
                {!!reviewComment && (
                  <Text style={styles.reviewDescription}>{reviewComment}</Text>
                )}
              </AppCard>
            );
          })
        ) : (
          <View style={styles.emptyReviewsCard}>
            <View style={styles.emptyReviewsIconCircle}>
              <MaterialIcons name="chat-bubble-outline" size={20} color="#2563EB" />
            </View>
            <View style={styles.emptyReviewsContent}>
              <Text style={styles.emptyReviewsTitle}>No Reviews Yet</Text>
              <Text style={styles.emptyReviewsSub}>
                Be the first to share your experience with {fullName}.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Floating Bottom Book Appointment Bar */}
      <View
        style={[
          styles.bookBar,
          { paddingBottom: Math.max(insets.bottom + 8, 12) },
        ]}
      >
        <TouchableOpacity
          style={[styles.bookBtn, bookingDisabled && styles.bookBtnDisabled]}
          disabled={bookingDisabled}
          onPress={() => {
            if (!isAuthenticated) {
              navigation.navigate('Login');
              return;
            }
            navigation.navigate('BookAppointment', {
              doctId,
              initialMode: selectedMode,
            });
          }}
          activeOpacity={0.85}
        >
          <MaterialIcons name="event" size={18} color="#FFFFFF" />
          <Text style={styles.bookBtnText}>
            {bookingDisabled ? 'Not Accepting Appointments' : 'Book Appointment'}
          </Text>
        </TouchableOpacity>
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
    padding: ws(16),
  },
  sectionTitle: {
    fontSize: fs(13.5),
    ...TYPOGRAPHY.bold,
    color: '#1E293B',
    marginTop: hs(14),
    marginBottom: hs(8),
  },

  // Profile Card
  profileCard: {
    borderRadius: fs(16),
    padding: ws(14),
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: ws(12),
  },
  avatar: {
    width: ws(76),
    height: ws(76),
    borderRadius: fs(16),
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
    borderWidth: 2,
    borderColor: '#DBEAFE',
  },
  avatarCheckBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: ws(18),
    height: ws(18),
    borderRadius: 999,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: fs(15),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
  },
  specialization: {
    fontSize: fs(12),
    ...TYPOGRAPHY.medium,
    color: '#2563EB',
    marginTop: hs(2),
  },
  degreeText: {
    fontSize: fs(11),
    ...TYPOGRAPHY.regular,
    color: '#64748B',
    marginTop: hs(1),
  },
  experienceText: {
    fontSize: fs(11),
    ...TYPOGRAPHY.medium,
    color: '#475569',
    marginTop: hs(2),
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(4),
    marginTop: hs(4),
    flexWrap: 'wrap',
  },
  verifiedDoctorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(3),
    backgroundColor: '#EFF6FF',
    paddingHorizontal: ws(6),
    paddingVertical: hs(2),
    borderRadius: fs(4),
  },
  verifiedDoctorText: {
    fontSize: fs(10),
    ...TYPOGRAPHY.bold,
    color: '#2563EB',
  },
  verifiedTooltipBadge: {
    backgroundColor: '#1E293B',
    paddingHorizontal: ws(6),
    paddingVertical: hs(2),
    borderRadius: fs(4),
  },
  verifiedTooltipText: {
    fontSize: fs(8.5),
    ...TYPOGRAPHY.medium,
    color: '#F8FAFC',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(4),
    marginTop: hs(4),
  },
  ratingText: {
    fontSize: fs(11),
    ...TYPOGRAPHY.bold,
    color: '#D97706',
  },
  patientsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(4),
    marginTop: hs(4),
  },
  patientsText: {
    fontSize: fs(11),
    ...TYPOGRAPHY.medium,
    color: '#2563EB',
  },

  // 8. Consultation Mode Cards
  feeCardsRow: {
    flexDirection: 'row',
    gap: ws(6),
  },
  feeCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: fs(12),
    paddingVertical: hs(10),
    paddingHorizontal: ws(4),
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    position: 'relative',
  },
  feeCardSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#F8FAFC',
  },
  feeCardEmergency: {
    borderColor: '#FEE2E2',
    backgroundColor: '#FFFDFD',
  },
  feeCardEmergencySelected: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  selectedBadgeCorner: {
    position: 'absolute',
    top: hs(4),
    right: ws(4),
    width: ws(16),
    height: ws(16),
    borderRadius: 999,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unselectedRadioCorner: {
    position: 'absolute',
    top: hs(5),
    right: ws(5),
    width: ws(14),
    height: ws(14),
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  infoBadgeCorner: {
    position: 'absolute',
    top: hs(4),
    right: ws(4),
    justifyContent: 'center',
    alignItems: 'center',
  },
  feeIconCircle: {
    width: ws(36),
    height: ws(36),
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hs(4),
  },
  feeLabel: {
    fontSize: fs(11),
    ...TYPOGRAPHY.bold,
    color: '#1E293B',
    textAlign: 'center',
  },
  feeValue: {
    fontSize: fs(14),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryFontColor,
    marginTop: hs(2),
  },
  feeModeSubtext: {
    fontSize: fs(9),
    ...TYPOGRAPHY.regular,
    color: '#64748B',
    marginTop: hs(1),
  },
  emergencyNoticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: fs(8),
    paddingHorizontal: ws(12),
    paddingVertical: hs(8),
    marginTop: hs(10),
    gap: ws(8),
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  emergencyNoticeBannerText: {
    flex: 1,
    fontSize: fs(11),
    ...TYPOGRAPHY.medium,
    color: '#DC2626',
    lineHeight: fs(15),
  },

  // About Doctor
  aboutCard: {
    padding: ws(12),
    borderRadius: fs(12),
    backgroundColor: Colors.white,
  },
  aboutText: {
    fontSize: fs(12),
    ...TYPOGRAPHY.regular,
    color: '#475569',
    lineHeight: fs(18),
  },

  // Clinic Contact Card
  clinicContactCard: {
    padding: ws(14),
    borderRadius: fs(14),
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  clinicHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clinicIconCircle: {
    width: ws(40),
    height: ws(40),
    borderRadius: fs(8),
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ws(10),
  },
  clinicLogoImg: {
    width: ws(40),
    height: ws(40),
    borderRadius: fs(8),
  },
  clinicInfoText: {
    flex: 1,
  },
  clinicTitle: {
    fontSize: fs(13),
    ...TYPOGRAPHY.bold,
    color: '#1E293B',
  },
  clinicSubtitle: {
    fontSize: fs(10.5),
    ...TYPOGRAPHY.regular,
    color: '#64748B',
    marginTop: hs(1),
  },
  contactDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: hs(10),
  },
  contactRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hs(6),
  },
  contactIconCircle: {
    width: ws(28),
    height: ws(28),
    borderRadius: 999,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ws(10),
  },
  contactMeta: {
    flex: 1,
  },
  contactLabel: {
    fontSize: fs(10),
    ...TYPOGRAPHY.medium,
    color: '#64748B',
  },
  contactValue: {
    fontSize: fs(12),
    ...TYPOGRAPHY.medium,
    color: '#1E293B',
    marginTop: hs(1),
  },
  contactValueLink: {
    fontSize: fs(12),
    ...TYPOGRAPHY.bold,
    color: '#2563EB',
    marginTop: hs(1),
  },
  clinicActionButtonsRow: {
    flexDirection: 'row',
    gap: ws(8),
    marginTop: hs(12),
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: hs(10),
  },
  directionsBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ws(4),
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingVertical: hs(8),
    borderRadius: fs(8),
  },
  directionsBtnText: {
    fontSize: fs(11.5),
    ...TYPOGRAPHY.bold,
    color: '#2563EB',
  },
  // Reviews Card
  reviewCard: {
    padding: ws(12),
    borderRadius: fs(12),
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: hs(8),
  },
  reviewTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: hs(6),
  },
  reviewerAvatar: {
    width: ws(34),
    height: ws(34),
    borderRadius: 999,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: ws(10),
    marginTop: hs(2),
  },
  reviewerInitial: {
    fontSize: fs(13),
    ...TYPOGRAPHY.bold,
    color: '#2563EB',
  },
  reviewerMeta: {
    flex: 1,
  },
  reviewerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: ws(8),
  },
  reviewerName: {
    fontSize: fs(12),
    ...TYPOGRAPHY.bold,
    color: '#1E293B',
    flexShrink: 1,
  },
  reviewDate: {
    fontSize: fs(10.5),
    ...TYPOGRAPHY.regular,
    color: '#64748B',
  },
  reviewServiceText: {
    fontSize: fs(10),
    ...TYPOGRAPHY.regular,
    color: '#64748B',
    marginTop: hs(1),
  },
  reviewStarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(4),
    marginTop: hs(3),
  },
  reviewPoints: {
    fontSize: fs(11),
    ...TYPOGRAPHY.bold,
    color: '#D97706',
  },
  reviewDescription: {
    fontSize: fs(11.5),
    ...TYPOGRAPHY.regular,
    color: '#475569',
    lineHeight: fs(17),
  },
  emptyReviewsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: fs(12),
    padding: ws(14),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: hs(10),
    gap: ws(10),
  },
  emptyReviewsIconCircle: {
    width: ws(36),
    height: ws(36),
    borderRadius: 999,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyReviewsContent: {
    flex: 1,
  },
  emptyReviewsTitle: {
    fontSize: fs(12.5),
    ...TYPOGRAPHY.bold,
    color: '#1E293B',
  },
  emptyReviewsSub: {
    fontSize: fs(10.5),
    ...TYPOGRAPHY.regular,
    color: '#64748B',
    marginTop: hs(2),
  },
  emptyInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: fs(12),
    padding: ws(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: hs(10),
    gap: ws(8),
  },
  emptyInfoText: {
    fontSize: fs(11),
    ...TYPOGRAPHY.regular,
    color: '#64748B',
    flex: 1,
  },

  // Bottom Action Bar
  bookBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    paddingHorizontal: ws(16),
    paddingTop: hs(8),
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  emergencyActionBtn: {
    height: hs(44),
    borderRadius: fs(10),
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ws(6),
  },
  emergencyActionBtnText: {
    fontSize: fs(13),
    ...TYPOGRAPHY.bold,
    color: '#FFFFFF',
  },
  bookBtn: {
    height: hs(44),
    borderRadius: fs(10),
    backgroundColor: Colors.primaryColor,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ws(6),
  },
  bookBtnDisabled: {
    opacity: 0.5,
  },
  bookBtnText: {
    fontSize: fs(13),
    ...TYPOGRAPHY.bold,
    color: '#FFFFFF',
  },
});
