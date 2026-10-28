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
import { CalculationUtils, DateTimeUtils, formatDoctorName, fs, getImageUrl, hs, showToast, TYPOGRAPHY, ws } from '../../utils';
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

  React.useEffect(() => {
    if (user && !selectedMember) {
      const selfMember: FamilyMemberModel = {
        id: user.id,
        user_id: user.id,
        f_name: user.f_name || 'Self',
        l_name: user.l_name || '',
        phone: user.phone || '',
        gender: user.gender || '',
        dob: user.dob || '',
        isd_code: user.isd_code || '+91',
        relationship: 'Self',
      };
      (selfMember as any).is_self = true;
      setSelectedMember(selfMember);
    }
  }, [user, selectedMember]);

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
            <AppCard style={{ marginTop: hs(10) }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: ws(6) }}>
                <MaterialIcons name="location-on" size={fs(18)} color={Colors.primaryColor} style={{ marginTop: hs(2) }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.clinicTitle}>{doctor.clinic_title}</Text>
                  {!!doctor.clinics_address && (
                    <Text style={[styles.clinicAddress, { marginLeft: 0 }]}>{doctor.clinics_address}</Text>
                  )}
                </View>
              </View>
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
                  !selectedMember && { color: Colors.secondaryFontColor, ...TYPOGRAPHY.medium },
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
                          resizeMode="cover"
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
        selectedMemberId={selectedMember?.id}
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
  scrollContent: { padding: ws(14), paddingBottom: hs(110) },
  doctorCard: {
    padding: ws(12),
  },
  doctorHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: ws(14),
  },
  doctorAvatar: {
    width: ws(80),
    height: ws(80),
    aspectRatio: 1,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: '#E2E8F0',
  },
  onlineDotOuter: {
    position: 'absolute',
    top: hs(4),
    right: ws(4),
    width: ws(14),
    height: ws(14),
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineDotInner: {
    width: ws(10),
    height: ws(10),
    borderRadius: 999,
    backgroundColor: '#16A34A',
  },
  doctorMetaColumn: {
    flex: 1,
  },
  doctorNameText: {
    fontSize: fs(16),
    ...TYPOGRAPHY.bold,
    color: '#1A202C',
  },
  doctorSpecializationText: {
    fontSize: fs(12),
    ...TYPOGRAPHY.medium,
    color: '#718096',
    marginTop: hs(2),
  },
  doctorRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hs(4),
    gap: ws(6),
  },
  doctorRatingCountText: {
    fontSize: fs(11),
    ...TYPOGRAPHY.medium,
    color: '#718096',
  },
  doctorDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(5),
    marginTop: hs(5),
  },
  doctorDetailText: {
    fontSize: fs(12),
    ...TYPOGRAPHY.regular,
    color: '#4A5568',
  },
  clinicTitle: {
    fontSize: fs(14),
    ...TYPOGRAPHY.bold,
    color: '#1A202C',
  },
  clinicAddress: {
    marginTop: hs(2),
    fontSize: fs(12),
    ...TYPOGRAPHY.regular,
    color: '#718096',
    marginLeft: ws(24),
  },
  sectionTitle: {
    marginTop: hs(16),
    marginBottom: hs(8),
    fontSize: fs(14),
    ...TYPOGRAPHY.bold,
    color: '#1A202C',
  },
  typeCardsRow: {
    flexDirection: 'row',
    gap: ws(8),
  },
  typeCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: fs(10),
    paddingVertical: hs(12),
    paddingHorizontal: ws(6),
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
    width: ws(44),
    height: ws(44),
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hs(6),
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: hs(1) },
    shadowOpacity: 0.08,
    shadowRadius: fs(2),
    elevation: 1,
  },
  typeCardAssetImg: {
    width: ws(26),
    height: hs(26),
  },
  typeCardTitle: {
    fontSize: fs(12),
    ...TYPOGRAPHY.medium,
    color: '#2D3748',
    textAlign: 'center',
  },
  typeCardFee: {
    fontSize: fs(12),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryColor,
    marginTop: hs(2),
    textAlign: 'center',
  },
  typeCardTextActive: {
    color: '#FFFFFF',
  },
  dateTimeContainer: {
    marginTop: hs(12),
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: ws(10),
  },
  dateTimeColumn: {
    flex: 1,
  },
  inputSubLabel: {
    fontSize: fs(12),
    ...TYPOGRAPHY.medium,
    color: '#4A5568',
    marginBottom: hs(4),
  },
  dateTimeTile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: fs(8),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: ws(12),
    height: hs(48),
  },
  dateTimeValueText: {
    fontSize: fs(13),
    ...TYPOGRAPHY.medium,
    color: '#1A202C',
    flex: 1,
  },
  tileIconBox: {
    width: ws(28),
    height: hs(28),
    borderRadius: fs(6),
    backgroundColor: '#1A202C',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: ws(6),
  },
  patientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: fs(10),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: ws(12),
  },
  patientAvatarBox: {
    width: ws(40),
    height: ws(40),
    borderRadius: 999,
    backgroundColor: '#EBF8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: ws(12),
  },
  patientInfoBox: {
    flex: 1,
  },
  patientNameText: {
    fontSize: fs(14),
    ...TYPOGRAPHY.bold,
    color: '#1A202C',
  },
  patientPhoneText: {
    fontSize: fs(12),
    ...TYPOGRAPHY.regular,
    color: '#718096',
    marginTop: hs(2),
  },
  couponContainer: {
    marginTop: hs(6),
    width: '100%',
  },
  couponRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(10),
  },
  couponTextInput: {
    flex: 1,
    minHeight: hs(48),
    height: hs(48),
    backgroundColor: '#FFFFFF',
    borderRadius: fs(8),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: ws(14),
    paddingVertical: Platform.OS === 'ios' ? hs(10) : hs(6),
    fontSize: fs(14),
    ...TYPOGRAPHY.medium,
    color: '#1E293B',
    textAlignVertical: 'center',
  },
  couponInputError: {
    borderColor: '#EF4444',
  },
  couponActionBtn: {
    height: hs(48),
    paddingHorizontal: ws(20),
    borderRadius: fs(8),
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: ws(84),
    flexShrink: 0,
  },
  couponApplyBtn: {
    backgroundColor: Colors.primaryColor,
  },
  couponRemoveBtn: {
    backgroundColor: '#EF4444',
  },
  couponActionBtnText: {
    fontSize: fs(14),
    ...TYPOGRAPHY.bold,
    color: '#FFFFFF',
  },
  couponErrorText: {
    fontSize: fs(12),
    ...TYPOGRAPHY.regular,
    color: '#EF4444',
    marginTop: hs(6),
  },
  couponSuccessBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(6),
    marginTop: hs(6),
    paddingHorizontal: ws(2),
  },
  couponSuccessText: {
    fontSize: fs(12),
    ...TYPOGRAPHY.medium,
    color: '#16A34A',
  },
  reviewSection: { marginTop: hs(20), marginBottom: hs(8) },
  patientReviewCard: { width: ws(280), backgroundColor: Colors.white, borderRadius: fs(12), borderWidth: 1, borderColor: Colors.border, padding: ws(12), marginRight: ws(12) },
  reviewUserHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: hs(8) },
  reviewerAvatarCircle: { width: ws(36), height: ws(36), aspectRatio: 1, borderRadius: 999, overflow: 'hidden', backgroundColor: Colors.primaryColor, justifyContent: 'center', alignItems: 'center', marginRight: ws(10) },
  reviewerMeta: { flex: 1 },
  reviewerName: { fontSize: fs(Typography.fontSize.xs), ...TYPOGRAPHY.bold, color: Colors.primaryFontColor },
  reviewCommentText: { fontSize: fs(Typography.fontSize.xs), ...TYPOGRAPHY.regular, color: Colors.secondaryFontColor, fontStyle: 'italic', lineHeight: hs(18) },
  suggestedSection: { marginTop: hs(24), marginBottom: hs(8) },
  suggestedTitle: { fontSize: fs(Typography.fontSize.md), ...TYPOGRAPHY.bold, color: Colors.primaryFontColor, marginBottom: hs(12) },
  suggestedGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  suggestedGridCard: { width: '48%', backgroundColor: Colors.white, borderRadius: fs(12), borderWidth: 1, borderColor: Colors.border, padding: ws(12), alignItems: 'center', marginBottom: hs(12) },
  suggestedAvatarWrapper: { width: ws(64), height: ws(64), aspectRatio: 1, borderRadius: 999, backgroundColor: '#EBF5FF', justifyContent: 'center', alignItems: 'center', marginBottom: hs(8), overflow: 'hidden' },
  suggestedAvatarImg: { width: ws(64), height: ws(64), aspectRatio: 1, borderRadius: 999, overflow: 'hidden' },
  suggestedCardName: { fontSize: fs(Typography.fontSize.xs), ...TYPOGRAPHY.bold, color: Colors.primaryFontColor, textAlign: 'center' },
  suggestedCardDept: { marginTop: hs(3), fontSize: fs(10), color: Colors.secondaryFontColor, textAlign: 'center', lineHeight: hs(14) },
  suggestedRatingRow: { flexDirection: 'row', alignItems: 'center', marginTop: hs(6) },
  suggestedRatingText: { marginLeft: ws(4), fontSize: fs(10), color: Colors.secondaryFontColor },
  viewMoreToggleBtn: { alignSelf: 'flex-end', paddingVertical: hs(6), paddingHorizontal: ws(4) },
  viewMoreToggleText: { fontSize: fs(Typography.fontSize.xs), color: Colors.secondaryFontColor, ...TYPOGRAPHY.medium },
  bottomSpacer: { height: hs(20) },
  reviewBar: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: ws(16), backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.border },
});
