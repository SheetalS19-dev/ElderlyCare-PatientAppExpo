import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppButton, AppCard, AppHeader, ErrorState, LoadingIndicator, StarRating } from '../../components';
import { AppConstants, Colors, Typography } from '../../constants';
import { useAuth } from '../../context/AuthContext';
import type { RootStackParamList } from '../../navigation/types';
import {
  useAddAppointmentMutation,
  useCreateRzOrderMutation,
  useGetActivePaymentGatewayQuery,
  useValidateCouponMutation,
} from '../../redux/apis/bookingApi';
import { useGetDoctorByIdQuery, useGetDoctorReviewsQuery, useGetDoctorsByDeptAndCityQuery, useGetDoctorsQuery } from '../../redux/apis/doctorApi';
import { useGetUserProfileQuery } from '../../redux/apis/userApi';
import { useAddWalletMoneyMutation } from '../../redux/apis/walletApi';
import { storageService } from '../../services/storageService';
import type { CouponModel, DoctorModel, DoctorReviewModel, FamilyMemberModel, UserModel } from '../../types';
import { CalculationUtils, DateTimeUtils, formatDoctorName, getImageUrl, showToast } from '../../utils';
import { DateTimeSheet } from './components/DateTimeSheet';
import { FamilyMemberSheet } from './components/FamilyMemberSheet';
import { PaymentMethodChoice, PaymentSheet } from './components/PaymentSheet';

type Props = NativeStackScreenProps<RootStackParamList, 'BookAppointment'>;

interface AppointmentTypeOption {
  code: '1' | '2' | '3';
  name: 'OPD' | 'Video Consultant' | 'Emergency';
  label: string;
  enabled: boolean;
  fee?: number | string;
}

export const BookAppointmentScreen = ({ navigation, route }: Props) => {
  const { doctId } = route.params;
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated, updateUser } = useAuth();

  React.useEffect(() => {
    if (!isAuthenticated) {
      navigation.replace('Login');
    }
  }, [isAuthenticated, navigation]);

  const uid = String(user?.id ?? (user as any)?.user_id ?? '');

  const { data: userProfileData, refetch: refetchUserProfile } = useGetUserProfileQuery(uid, {
    skip: !uid,
  });

  const currentUser: UserModel | null = useMemo(() => {
    return userProfileData?.data ?? userProfileData ?? user ?? null;
  }, [userProfileData, user]);

  const { data: rawDoctorData, isLoading, isError, refetch } = useGetDoctorByIdQuery(doctId);
  const { data: rawReviews } = useGetDoctorReviewsQuery(doctId);
  const { data: gateway } = useGetActivePaymentGatewayQuery();
  const [validateCoupon, { isLoading: isValidatingCoupon }] = useValidateCouponMutation();
  const [addAppointment, { isLoading: isBooking }] = useAddAppointmentMutation();
  const [createRzOrder, { isLoading: isCreatingOrder }] = useCreateRzOrderMutation();
  const [addWalletMoney] = useAddWalletMoneyMutation();

  const doctor: DoctorModel | null = useMemo(() => {
    if (!rawDoctorData) return null;
    let target = (rawDoctorData as any)?.data ?? (rawDoctorData as any)?.response ?? rawDoctorData;
    if (Array.isArray(target)) {
      const match = target.find(
        (d: any) =>
          String(d.id || d.doct_id || d.user_id) === String(doctId)
      );
      return match ?? target[0] ?? null;
    }
    return target ?? null;
  }, [rawDoctorData, doctId]);

  const [selectedType, setSelectedType] = useState<AppointmentTypeOption | null>(null);
  const [selectedMember, setSelectedMember] = useState<FamilyMemberModel | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTimeStart, setSelectedTimeStart] = useState<string | null>(null);

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<CouponModel | null>(null);
  const [couponError, setCouponError] = useState<string | undefined>();
  const [isSuggestedExpanded, setIsSuggestedExpanded] = useState(false);

  const reviews: DoctorReviewModel[] = useMemo(() => {
    if (Array.isArray(rawReviews)) return rawReviews;
    if (Array.isArray((rawReviews as any)?.data)) return (rawReviews as any).data;
    return [];
  }, [rawReviews]);

  const deptId = String(
    (doctor as any)?.dept_id ??
    (doctor as any)?.department_id ??
    (doctor as any)?.deptId ??
    (doctor as any)?.departmentId ??
    (doctor as any)?.department?.id ??
    (doctor as any)?.dept?.id ??
    (doctor as any)?.category_id ??
    '1'
  );
  const cityId = String((doctor as any)?.city_id ?? '1');

  const { data: rawSuggested } = useGetDoctorsByDeptAndCityQuery(
    { deptId, cityId },
    { skip: !doctor }
  );

  const { data: rawFallbackDocs } = useGetDoctorsQuery(
    { cityId },
    { skip: !doctor }
  );

  const suggestedDoctors: DoctorModel[] = useMemo(() => {
    const fromDept = Array.isArray(rawSuggested)
      ? rawSuggested
      : Array.isArray((rawSuggested as any)?.data)
        ? (rawSuggested as any).data
        : [];
    const fromFallback = Array.isArray(rawFallbackDocs)
      ? rawFallbackDocs
      : Array.isArray((rawFallbackDocs as any)?.data)
        ? (rawFallbackDocs as any).data
        : [];
    const combined = fromDept.length > 0 ? fromDept : fromFallback;
    return combined.filter((d: any) => String(d.user_id || d.id) !== String(doctId));
  }, [rawSuggested, rawFallbackDocs, doctId]);

  const displayedSuggestedDoctors = useMemo(() => {
    return isSuggestedExpanded ? suggestedDoctors : suggestedDoctors.slice(0, 2);
  }, [suggestedDoctors, isSuggestedExpanded]);

  const [showFamilySheet, setShowFamilySheet] = useState(false);
  const [showDateTimeSheet, setShowDateTimeSheet] = useState(false);
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);

  const typeOptions: AppointmentTypeOption[] = useMemo(() => {
    if (!doctor) return [];
    return [
      { code: '1' as const, name: 'OPD' as const, label: 'Clinic Visit', enabled: doctor.clinic_appointment === 1, fee: doctor.opd_fee },
      { code: '2' as const, name: 'Video Consultant' as const, label: 'Video Call', enabled: doctor.video_appointment === 1, fee: doctor.video_fee },
      { code: '3' as const, name: 'Emergency' as const, label: 'Emergency', enabled: doctor.emergency_appointment === 1, fee: doctor.emg_fee },
    ].filter((o) => o.enabled);
  }, [doctor]);

  React.useEffect(() => {
    if (!selectedType && typeOptions.length > 0) {
      setSelectedType(typeOptions[0]);
      setSelectedDate(null);
      setSelectedTimeStart(null);
    }
  }, [typeOptions, selectedType]);

  const fee = useMemo(() => {
    if (!selectedType?.fee) return 0;
    return Number(selectedType.fee) || 0;
  }, [selectedType]);

  const taxPercent = useMemo(() => {
    const rawVal =
      (gateway as any)?.tax_percent ??
      (gateway as any)?.tax ??
      (gateway as any)?.tax_amount;
    const num = Number(rawVal);
    if (!isNaN(num) && num > 0) return num;
    return 12;
  }, [gateway]);

  const taxAmount = useMemo(() => {
    return (fee * taxPercent) / 100;
  }, [fee, taxPercent]);

  const couponDiscount = useMemo(() => {
    if (!appliedCoupon) return 0;
    return CalculationUtils.calculateDiscountAmount(
      fee,
      appliedCoupon.discount,
      appliedCoupon.type
    );
  }, [appliedCoupon, fee]);

  const total = useMemo(() => {
    return Math.max(0, fee + taxAmount - couponDiscount);
  }, [fee, taxAmount, couponDiscount]);

  const walletBalance = useMemo(() => {
    const val =
      (currentUser as any)?.wallet_amount ??
      (currentUser as any)?.wallet_balance ??
      (currentUser as any)?.wallet ??
      (user as any)?.wallet_amount ??
      (user as any)?.wallet_balance ??
      0;
    return Number(val) || 0;
  }, [currentUser, user]);

  const patientDisplayName = useMemo(() => {
    if (selectedMember) {
      const first = (selectedMember.f_name ?? '').trim();
      const last = (selectedMember.l_name ?? '').trim();
      const full = `${first} ${last}`.trim();
      if (full) return full;
      if ((selectedMember as any).name) return String((selectedMember as any).name).trim();
    }
    return '';
  }, [selectedMember]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }
    setCouponError(undefined);
    try {
      const res: any = await validateCoupon({ couponCode, doctId }).unwrap();
      if (res?.data || res?.coupon) {
        setAppliedCoupon(res.data || res.coupon);
        showToast('Coupon applied successfully');
      } else {
        setCouponError('Invalid coupon code');
      }
    } catch (e: any) {
      setCouponError(e?.data?.message || 'Invalid coupon code');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError(undefined);
  };

  const handleSubmitPayment = async (choice: PaymentMethodChoice) => {
    if (!selectedType) {
      showToast('Please select an appointment type');
      return;
    }
    const isEmergencyType = selectedType?.code === '3';
    if (!isEmergencyType && !selectedDate) {
      showToast('Please select an appointment date');
      return;
    }
    if (!isEmergencyType && !selectedTimeStart) {
      showToast('Please select a time slot');
      return;
    }

    if (!selectedMember) {
      showToast('Please select a patient');
      setShowFamilySheet(true);
      return;
    }

    const userId = String(user?.id ?? (user as any)?.user_id ?? '');
    const familyMemberId = String(selectedMember.id ?? userId);

    const targetDoctId = String(
      (doctor as any)?.user_id ??
      (doctor as any)?.doct_id ??
      (doctor as any)?.id ??
      doctId
    );

    const isEmergency = selectedType?.code === '3';
    const effectiveDate = selectedDate || (isEmergency ? new Date().toISOString().split('T')[0] : '');
    const effectiveTime = selectedTimeStart || (isEmergency ? new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '10:00');

    const departmentId = String(
      (doctor as any)?.dept_id ??
      (doctor as any)?.department_id ??
      (doctor as any)?.deptId ??
      (doctor as any)?.departmentId ??
      (doctor as any)?.department?.id ??
      (doctor as any)?.dept?.id ??
      (doctor as any)?.category_id ??
      '5'
    );

    let paymentTxnId = '';

    try {
      if (choice === 'razorpay') {
        paymentTxnId = `pay_${Date.now()}`;
      }

      const payload: any = {
        user_id: userId,
        family_member_id: familyMemberId,
        status: 'Confirmed',
        date: effectiveDate,
        time_slots: effectiveTime,
        doct_id: targetDoctId,
        dept_id: departmentId,
        type: selectedType.name,
        payment_status: choice === 'cash' ? 'Unpaid' : 'Paid',
        fee: fee,
        service_charge: 0,
        tax: taxPercent,
        unit_tax_amount: taxAmount,
        total_amount: total,
        unit_total_amount: total,
        invoice_description: selectedType.name,
        payment_method: choice === 'wallet' ? 'Wallet' : choice === 'razorpay' ? 'Online' : 'Hospital',
        payment_transaction_id: paymentTxnId,
        is_wallet_txn: choice === 'wallet' ? 1 : 0,
        source: 'Web',
        coupon_off_amount: couponDiscount,
      };

      const storedToken = await storageService.getItem<string>(AppConstants.storageKeys.token);
      const userToken =
        storedToken ||
        (user as any)?.api_token ||
        (user as any)?.token ||
        (user as any)?.auth_token ||
        userId;

      if (userToken) {
        payload.api_token = userToken;
        payload.token = userToken;
        payload.auth_token = userToken;
      }

      if (appliedCoupon?.id) {
        payload.coupon_id = String(appliedCoupon.id);
        payload.coupon_title = appliedCoupon.title || appliedCoupon.code || '';
        payload.coupon_value = String(appliedCoupon.discount || 0);
      }

      if (choice === 'wallet') {
        const patientNote = patientDisplayName ? ` for ${patientDisplayName}` : '';
        const walletDebitPayload = {
          user_id: userId,
          amount: String(total),
          payment_transaction_id: `wallet_${Date.now()}`,
          payment_method: 'Wallet',
          transaction_type: 'Debited',
          type: 'Debited',
          description: `Appointment booking${patientNote} (${selectedType.name})`,
          notes: `Appointment booking${patientNote} (${selectedType.name})`,
          is_wallet_txn: '1',
        };
        try {
          await addWalletMoney(walletDebitPayload).unwrap();
        } catch (walletErr: any) {
          console.warn('Wallet debit call:', walletErr);
        }
      }

      try {
        await addAppointment(payload).unwrap();
      } catch (firstErr: any) {
        const errMsg = String(firstErr?.data?.message || firstErr?.message || firstErr?.error || '');
        if (errMsg.toLowerCase().includes('foreign key') && payload.family_member_id !== userId) {
          payload.family_member_id = userId;
          await addAppointment(payload).unwrap();
        } else {
          throw firstErr;
        }
      }

      setShowPaymentSheet(false);
      showToast('Appointment booked successfully!');

      try {
        const freshProfile = await refetchUserProfile();
        if (freshProfile?.data) {
          const freshUser = (freshProfile.data as any)?.data ?? freshProfile.data;
          await updateUser({ ...(user || {}), ...freshUser });
        }
      } catch (profileErr) {
        console.warn('Could not refresh user profile after booking:', profileErr);
      }

      navigation.reset({
        index: 1,
        routes: [{ name: 'Main' }, { name: 'MyBookings' }],
      });
    } catch (e: any) {
      showToast(e?.data?.message || e?.message || e?.error || 'Failed to book appointment');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <AppHeader title="Book Appointment" onBackPress={() => navigation.goBack()} />
        <LoadingIndicator />
      </View>
    );
  }

  if (isError || !doctor) {
    return (
      <View style={styles.container}>
        <AppHeader title="Book Appointment" onBackPress={() => navigation.goBack()} />
        <ErrorState message="Couldn't load doctor details" onRetry={refetch} />
      </View>
    );
  }

  const fullName = formatDoctorName(doctor.f_name, doctor.l_name);
  const isEmergencyType = selectedType?.code === '3';
  const canReview =
    !!selectedType &&
    !!selectedMember &&
    (isEmergencyType || (!!selectedDate && !!selectedTimeStart));

  return (
    <View style={styles.container}>
      <AppHeader title="Book Appointment" onBackPress={() => navigation.goBack()} />

      <KeyboardAvoidingView
        style={styles.flexOne}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView
          style={styles.flexOne}
          contentContainerStyle={[styles.scrollContent, { flexGrow: 1, paddingBottom: Math.max(insets.bottom + 100, 120) }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Doctor Header Card matching Flutter */}
          <AppCard style={styles.doctorCard}>
            <View style={styles.doctorHeaderRow}>
              {/* Avatar with Online Status Dot */}
              <View style={styles.avatarWrapper}>
                <Image
                  source={
                    doctor.image
                      ? { uri: getImageUrl(doctor.image) }
                      : require('../../../assets/icons/user.png')
                  }
                  style={styles.doctorAvatar}
                />
                <View style={styles.onlineDotOuter}>
                  <View style={styles.onlineDotInner} />
                </View>
              </View>

              {/* Doctor Info */}
              <View style={styles.doctorMetaColumn}>
                <Text style={styles.doctorNameText}>{fullName}</Text>
                {!!doctor.specialization && (
                  <Text style={styles.doctorSpecializationText}>{doctor.specialization}</Text>
                )}

                <View style={styles.doctorRatingRow}>
                  <StarRating rating={Number(doctor.average_rating ?? 5)} starSize={14} />
                  <Text style={styles.doctorRatingCountText}>
                    {Number(doctor.average_rating ?? 0).toFixed(1)} ({doctor.number_of_reviews ?? 0} Review)
                  </Text>
                </View>

                {doctor.experience != null && (
                  <View style={styles.doctorDetailRow}>
                    <MaterialIcons name="work-outline" size={14} color={Colors.primaryColor} />
                    <Text style={styles.doctorDetailText}>
                      Experience {doctor.experience || doctor.ex_year || 0} Year
                    </Text>
                  </View>
                )}

                {doctor.total_appointment_done != null && (
                  <View style={styles.doctorDetailRow}>
                    <MaterialIcons name="check-circle" size={14} color="#16A34A" />
                    <Text style={styles.doctorDetailText}>
                      {doctor.total_appointment_done} Appointments Done
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </AppCard>

          {/* Clinic Location Info */}
          {!!doctor.clinic_title && (
            <AppCard style={{ marginTop: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <MaterialIcons name="location-on" size={18} color={Colors.primaryColor} />
                <Text style={styles.clinicTitle}>{doctor.clinic_title}</Text>
              </View>
              {!!doctor.clinics_address && (
                <Text style={styles.clinicAddress}>{doctor.clinics_address}</Text>
              )}
            </AppCard>
          )}

          {/* Consultation Fee / Appointment Type Cards */}
          <Text style={styles.sectionTitle}>Consultation Type</Text>
          <View style={styles.typeCardsRow}>
            {typeOptions.map((opt) => {
              const active = selectedType?.code === opt.code;
              const assetSource =
                opt.code === '1'
                  ? require('../../../assets/icons/medical-appointment.png')
                  : opt.code === '2'
                    ? require('../../../assets/icons/Play.png')
                    : require('../../../assets/icons/ambulance.png');

              return (
                <TouchableOpacity
                  key={opt.code}
                  style={[styles.typeCard, active && styles.typeCardActive]}
                  onPress={() => {
                    setSelectedType(opt);
                    setSelectedDate(null);
                    setSelectedTimeStart(null);
                  }}
                  activeOpacity={0.8}
                >
                  <View style={styles.typeIconContainer}>
                    <Image
                      source={assetSource}
                      style={[
                        styles.typeCardAssetImg,
                      ]}
                      resizeMode="contain"
                    />
                  </View>
                  <Text style={[styles.typeCardTitle, active && styles.typeCardTextActive]}>
                    {opt.label}
                  </Text>
                  <Text style={[styles.typeCardFee, active && styles.typeCardTextActive]}>
                    Fee {AppConstants.appCurrency}{opt.fee || 0}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Date & Time Selector Cards */}
          {selectedType && selectedType.code !== '3' && (
            <View style={styles.dateTimeContainer}>
              <View style={styles.dateTimeRow}>
                {/* Date Card */}
                <View style={styles.dateTimeColumn}>
                  <Text style={styles.inputSubLabel}>Date</Text>
                  <TouchableOpacity
                    style={styles.dateTimeTile}
                    onPress={() => setShowDateTimeSheet(true)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.dateTimeValueText} numberOfLines={1}>
                      {selectedDate ? DateTimeUtils.getDataFormat(selectedDate) : '--'}
                    </Text>
                    <View style={styles.tileIconBox}>
                      <MaterialIcons name="calendar-today" size={16} color="#FFFFFF" />
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Time Card */}
                <View style={styles.dateTimeColumn}>
                  <Text style={styles.inputSubLabel}>Time</Text>
                  <TouchableOpacity
                    style={styles.dateTimeTile}
                    onPress={() => setShowDateTimeSheet(true)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.dateTimeValueText} numberOfLines={1}>
                      {selectedTimeStart
                        ? DateTimeUtils.formatTimeToAmPm(selectedTimeStart)
                        : '--'}
                    </Text>
                    <View style={styles.tileIconBox}>
                      <MaterialIcons name="access-time" size={16} color="#FFFFFF" />
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* Patient Selection Card */}
          <Text style={styles.sectionTitle}>Patient Details</Text>
          <TouchableOpacity
            style={styles.patientCard}
            onPress={() => setShowFamilySheet(true)}
            activeOpacity={0.8}
          >
            <View style={styles.patientAvatarBox}>
              <MaterialIcons
                name={selectedMember ? 'person' : 'person-add'}
                size={24}
                color={selectedMember ? Colors.primaryColor : Colors.secondaryFontColor}
              />
            </View>
            <View style={styles.patientInfoBox}>
              <Text
                style={[
                  styles.patientNameText,
                  !selectedMember && { color: Colors.secondaryFontColor, fontFamily: Typography.fontFamily.medium },
                ]}
                numberOfLines={1}
              >
                {selectedMember ? patientDisplayName : 'Select Patient'}
              </Text>
              <Text style={styles.patientPhoneText}>
                {selectedMember?.phone
                  ? `${selectedMember.isd_code ? `${selectedMember.isd_code} ` : ''}${selectedMember.phone}`
                  : 'Tap to choose or add patient'}
              </Text>
            </View>
            <MaterialIcons name="edit" size={20} color={Colors.primaryColor} />
          </TouchableOpacity>

          {/* Coupon Code Section */}
          <Text style={styles.sectionTitle}>Coupon Code</Text>
          <View style={styles.couponContainer}>
            <View style={styles.couponRow}>
              <TextInput
                style={[
                  styles.couponTextInput,
                  couponError ? styles.couponInputError : null,
                ]}
                placeholder="Enter Coupon Code"
                placeholderTextColor="#94A3B8"
                value={couponCode}
                onChangeText={(text) => {
                  setCouponCode(text);
                  if (couponError) setCouponError(undefined);
                }}
                autoCapitalize="characters"
                editable={!appliedCoupon}
              />
              <TouchableOpacity
                style={[
                  styles.couponActionBtn,
                  appliedCoupon ? styles.couponRemoveBtn : styles.couponApplyBtn,
                  isValidatingCoupon && { opacity: 0.7 },
                ]}
                onPress={appliedCoupon ? handleRemoveCoupon : handleApplyCoupon}
                disabled={isValidatingCoupon}
                activeOpacity={0.85}
              >
                {isValidatingCoupon ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.couponActionBtnText}>
                    {appliedCoupon ? 'Remove' : 'Apply'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
            {couponError && <Text style={styles.couponErrorText}>{couponError}</Text>}
            {appliedCoupon && (
              <View style={styles.couponSuccessBadge}>
                <MaterialIcons name="check-circle" size={14} color="#16A34A" />
                <Text style={styles.couponSuccessText}>
                  Coupon "{appliedCoupon.code || couponCode}" applied
                </Text>
              </View>
            )}
          </View>

          {/* Patient Reviews Card */}
          {reviews.length > 0 && (
            <View style={styles.reviewSection}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -4 }}>
                {reviews.map((rev: any, idx: number) => (
                  <View key={`rev-${rev.id ?? idx}`} style={styles.patientReviewCard}>
                    <View style={styles.reviewUserHeader}>
                      <View style={styles.reviewerAvatarCircle}>
                        <MaterialIcons name="person" size={20} color={Colors.white} />
                      </View>
                      <View style={styles.reviewerMeta}>
                        <Text style={styles.reviewerName}>{rev.user_name || 'Patient'}</Text>
                        <StarRating rating={Number(rev.points ?? 5)} starSize={12} />
                      </View>
                    </View>
                    {!!rev.description && (
                      <Text style={styles.reviewCommentText} numberOfLines={3}>
                        "{rev.description}"
                      </Text>
                    )}
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Suggested Doctors Section */}
          {suggestedDoctors.length > 0 && (
            <View style={styles.suggestedSection}>
              <Text style={styles.suggestedTitle}>Suggested Doctors</Text>

              <View style={styles.suggestedGrid}>
                {displayedSuggestedDoctors.map((doc: DoctorModel) => {
                  const docRating = Number(doc.average_rating ?? 0);
                  const docReviewsCount = Number(doc.number_of_reviews ?? 0);
                  return (
                    <TouchableOpacity
                      key={`sug-${doc.id ?? doc.user_id}`}
                      style={styles.suggestedGridCard}
                      activeOpacity={0.8}
                      onPress={() => navigation.push('BookAppointment', { doctId: String(doc.user_id || doc.id) })}
                    >
                      <View style={styles.suggestedAvatarWrapper}>
                        <Image
                          source={doc.image ? { uri: getImageUrl(doc.image) } : require('../../../assets/icons/user.png')}
                          style={styles.suggestedAvatarImg}
                        />
                      </View>
                      <Text style={styles.suggestedCardName} numberOfLines={1}>
                        {formatDoctorName(doc.f_name, doc.l_name)}
                      </Text>
                      <Text style={styles.suggestedCardDept} numberOfLines={2}>
                        {doc.specialization || (doc as any).dept_title || 'Specialist'}
                      </Text>
                      <View style={styles.suggestedRatingRow}>
                        <StarRating rating={docRating} starSize={11} />
                        <Text style={styles.suggestedRatingText}>
                          {docRating.toFixed(1)} ({docReviewsCount} reviews)
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {suggestedDoctors.length > 2 && (
                <TouchableOpacity
                  style={styles.viewMoreToggleBtn}
                  onPress={() => setIsSuggestedExpanded(!isSuggestedExpanded)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.viewMoreToggleText}>
                    {isSuggestedExpanded ? 'View Less <' : 'View More >'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[styles.reviewBar, { paddingBottom: Math.max(insets.bottom + 12, 16) }]}>
        <AppButton
          title={`Review & Pay ${AppConstants.appCurrency}${total.toFixed(2)}`}
          disabled={!canReview}
          onPress={() => setShowPaymentSheet(true)}
        />
      </View>

      <FamilyMemberSheet
        visible={showFamilySheet}
        onClose={() => setShowFamilySheet(false)}
        onSelect={setSelectedMember}
      />

      {selectedType && (
        <DateTimeSheet
          visible={showDateTimeSheet}
          onClose={() => setShowDateTimeSheet(false)}
          doctId={String(doctId)}
          appointmentType={selectedType.code}
          appointmentTypeName={selectedType.name}
          selectedDate={selectedDate || undefined}
          selectedTimeSlot={selectedTimeStart || undefined}
          onConfirm={(date, timeStart) => {
            setSelectedDate(date);
            setSelectedTimeStart(timeStart);
          }}
        />
      )}

      <PaymentSheet
        visible={showPaymentSheet}
        onClose={() => setShowPaymentSheet(false)}
        doctorName={
          fullName ||
          (doctor ? `${doctor.f_name || ''} ${doctor.l_name || ''}`.trim() : 'Doctor')
        }
        patientName={patientDisplayName}
        appointmentType={selectedType?.label || selectedType?.name || 'OPD'}
        selectedDate={
          selectedDate ||
          (selectedType?.code === '3' ? new Date().toISOString().split('T')[0] : '')
        }
        selectedTime={
          selectedTimeStart || (selectedType?.code === '3' ? 'Emergency Slot' : '')
        }
        allowPayAtHospital={selectedType?.code === '1'}
        fee={fee}
        taxPercent={taxPercent}
        taxAmount={taxAmount}
        couponDiscount={couponDiscount}
        couponTitle={appliedCoupon?.title || appliedCoupon?.code || ''}
        total={total}
        walletBalance={walletBalance}
        submitting={isBooking || isCreatingOrder}
        onSubmit={handleSubmitPayment}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgColor },
  flexOne: { flex: 1 },
  scrollContent: { padding: 14, paddingBottom: 110 },
  doctorCard: {
    padding: 12,
  },
  doctorHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 14,
  },
  doctorAvatar: {
    width: 80,
    height: 90,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
  },
  onlineDotOuter: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineDotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#16A34A',
  },
  doctorMetaColumn: {
    flex: 1,
  },
  doctorNameText: {
    fontSize: 16,
    fontFamily: Typography.fontFamily.bold,
    color: '#1A202C',
  },
  doctorSpecializationText: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.medium,
    color: '#718096',
    marginTop: 2,
  },
  doctorRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  doctorRatingCountText: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.medium,
    color: '#718096',
  },
  doctorDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 5,
  },
  doctorDetailText: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.regular,
    color: '#4A5568',
  },
  clinicTitle: {
    fontSize: 14,
    fontFamily: Typography.fontFamily.bold,
    color: '#1A202C',
  },
  clinicAddress: {
    marginTop: 2,
    fontSize: 12,
    fontFamily: Typography.fontFamily.regular,
    color: '#718096',
    marginLeft: 24,
  },
  sectionTitle: {
    marginTop: 16,
    marginBottom: 8,
    fontSize: 14,
    fontFamily: Typography.fontFamily.bold,
    color: '#1A202C',
  },
  typeCardsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typeCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1,
  },
  typeCardActive: {
    backgroundColor: Colors.primaryColor,
    borderColor: Colors.primaryColor,
  },
  typeIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  typeCardAssetImg: {
    width: 26,
    height: 26,
  },
  typeCardTitle: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.medium,
    color: '#2D3748',
    textAlign: 'center',
  },
  typeCardFee: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryColor,
    marginTop: 2,
    textAlign: 'center',
  },
  typeCardTextActive: {
    color: '#FFFFFF',
  },
  dateTimeContainer: {
    marginTop: 12,
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dateTimeColumn: {
    flex: 1,
  },
  inputSubLabel: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.medium,
    color: '#4A5568',
    marginBottom: 4,
  },
  dateTimeTile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 48,
  },
  dateTimeValueText: {
    fontSize: 13,
    fontFamily: Typography.fontFamily.medium,
    color: '#1A202C',
    flex: 1,
  },
  tileIconBox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#1A202C',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  patientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
  },
  patientAvatarBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EBF8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  patientInfoBox: {
    flex: 1,
  },
  patientNameText: {
    fontSize: 14,
    fontFamily: Typography.fontFamily.bold,
    color: '#1A202C',
  },
  patientPhoneText: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.regular,
    color: '#718096',
    marginTop: 2,
  },
  couponContainer: {
    marginTop: 6,
    width: '100%',
  },
  couponRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  couponTextInput: {
    flex: 1,
    minHeight: 48,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    fontSize: 14,
    fontFamily: Typography.fontFamily.medium,
    color: '#1E293B',
    textAlignVertical: 'center',
  },
  couponInputError: {
    borderColor: '#EF4444',
  },
  couponActionBtn: {
    height: 48,
    paddingHorizontal: 20,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 84,
    flexShrink: 0,
  },
  couponApplyBtn: {
    backgroundColor: Colors.primaryColor,
  },
  couponRemoveBtn: {
    backgroundColor: '#EF4444',
  },
  couponActionBtnText: {
    fontSize: 14,
    fontFamily: Typography.fontFamily.bold,
    color: '#FFFFFF',
  },
  couponErrorText: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.regular,
    color: '#EF4444',
    marginTop: 6,
  },
  couponSuccessBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    paddingHorizontal: 2,
  },
  couponSuccessText: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.medium,
    color: '#16A34A',
  },
  reviewSection: { marginTop: 20, marginBottom: 8 },
  patientReviewCard: { width: 280, backgroundColor: Colors.white, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, padding: 12, marginRight: 12 },
  reviewUserHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  reviewerAvatarCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primaryColor, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  reviewerMeta: { flex: 1 },
  reviewerName: { fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.bold, color: Colors.primaryFontColor },
  reviewCommentText: { fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.regular, color: Colors.secondaryFontColor, fontStyle: 'italic', lineHeight: 18 },
  suggestedSection: { marginTop: 24, marginBottom: 8 },
  suggestedTitle: { fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.bold, color: Colors.primaryFontColor, marginBottom: 12 },
  suggestedGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  suggestedGridCard: { width: '48%', backgroundColor: Colors.white, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, padding: 12, alignItems: 'center', marginBottom: 12 },
  suggestedAvatarWrapper: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#EBF5FF', justifyContent: 'center', alignItems: 'center', marginBottom: 8, overflow: 'hidden' },
  suggestedAvatarImg: { width: 64, height: 64, borderRadius: 32 },
  suggestedCardName: { fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.bold, color: Colors.primaryFontColor, textAlign: 'center' },
  suggestedCardDept: { marginTop: 3, fontSize: 10, color: Colors.secondaryFontColor, textAlign: 'center', lineHeight: 14 },
  suggestedRatingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  suggestedRatingText: { marginLeft: 4, fontSize: 10, color: Colors.secondaryFontColor },
  viewMoreToggleBtn: { alignSelf: 'flex-end', paddingVertical: 6, paddingHorizontal: 4 },
  viewMoreToggleText: { fontSize: Typography.fontSize.xs, color: Colors.secondaryFontColor, fontFamily: Typography.fontFamily.medium },
  bottomSpacer: { height: 20 },
  reviewBar: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16, backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.border },
});
