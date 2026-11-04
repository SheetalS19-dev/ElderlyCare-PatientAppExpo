import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
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
import { AppCard, AppHeader, ErrorState, LoadingIndicator, StarRating } from '../../components';
import { AppConstants, Colors } from '../../constants';
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
  subtext: string;
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

  const [isReviewsExpanded, setIsReviewsExpanded] = useState(false);

  const reviews: DoctorReviewModel[] = useMemo(() => {
    if (Array.isArray(rawReviews)) return rawReviews;
    if (Array.isArray((rawReviews as any)?.data)) return (rawReviews as any).data;
    return [];
  }, [rawReviews]);

  const displayedReviews = useMemo(() => {
    if (isReviewsExpanded) return reviews;
    return reviews.slice(0, 3);
  }, [reviews, isReviewsExpanded]);

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

  const initialModeApplied = React.useRef(false);

  const typeOptions: AppointmentTypeOption[] = useMemo(() => {
    if (!doctor) return [];
    const isClinicEnabled =
      Number(doctor.clinic_appointment) === 1 ||
      (doctor.clinic_appointment as any) === '1' ||
      Boolean(doctor.opd_fee);

    const isVideoEnabled =
      Number(doctor.video_appointment) === 1 ||
      (doctor.video_appointment as any) === '1' ||
      Boolean(doctor.video_fee);

    const isEmgEnabled =
      Number(doctor.emergency_appointment) === 1 ||
      (doctor.emergency_appointment as any) === '1';

    return [
      {
        code: '1' as const,
        name: 'OPD' as const,
        label: 'Clinic Visit',
        subtext: '(In-person)',
        enabled: Boolean(isClinicEnabled),
        fee: doctor.opd_fee ?? 0,
      },
      {
        code: '2' as const,
        name: 'Video Consultant' as const,
        label: 'Video Consultation',
        subtext: '(Online)',
        enabled: Boolean(isVideoEnabled),
        fee: doctor.video_fee ?? 0,
      },
      {
        code: '3' as const,
        name: 'Emergency' as const,
        label: 'Emergency',
        subtext: '(In-person only)',
        enabled: Boolean(isEmgEnabled),
        fee: doctor.emg_fee ?? 0,
      },
    ].filter((o) => o.enabled);
  }, [doctor]);

  React.useEffect(() => {
    if (typeOptions.length === 0) return;

    if (!initialModeApplied.current) {
      initialModeApplied.current = true;
      const initialMode = (route.params as any)?.initialMode;
      if (initialMode) {
        const code = initialMode === 'clinic' ? '1' : initialMode === 'video' ? '2' : '3';
        const match = typeOptions.find((t) => t.code === code);
        if (match) {
          setSelectedType(match);
          return;
        }
      }
    }

    if (!selectedType || !typeOptions.some((t) => t.code === selectedType.code)) {
      setSelectedType(typeOptions[0]);
    }
  }, [typeOptions, (route.params as any)?.initialMode]);

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
              {/* Avatar without unverified badge */}
              <View style={styles.avatarWrapper}>
                <Image
                  source={
                    doctor.image
                      ? { uri: getImageUrl(doctor.image) }
                      : require('../../../assets/icons/user.png')
                  }
                  style={styles.doctorAvatar}
                />
              </View>

              {/* Doctor Info */}
              <View style={styles.doctorMetaColumn}>
                <Text style={styles.doctorNameText}>{fullName || 'Doctor'}</Text>
                {!!(doctor.department_name || (doctor as any).dept_name || (doctor as any).dept_title || doctor.specialization) && (
                  <Text style={styles.doctorSpecializationText}>
                    {doctor.department_name || (doctor as any).dept_name || (doctor as any).dept_title || doctor.specialization}
                  </Text>
                )}

                <View style={styles.doctorRatingRow}>
                  <StarRating rating={Number(doctor.average_rating ?? 0)} starSize={13} />
                  <Text style={styles.doctorRatingCountText}>
                    {Number(doctor.average_rating ?? 0).toFixed(1)} ({doctor.number_of_reviews ?? reviews.length} reviews)
                  </Text>
                </View>

                {/* Patients Treated - verified from database */}
                {(doctor.total_appointment_done != null || (doctor as any).patients_served != null) && (
                  <View style={styles.doctorPatientsRow}>
                    <MaterialIcons name="people" size={13} color="#2563EB" />
                    <Text style={styles.doctorPatientsText}>
                      {doctor.total_appointment_done ?? (doctor as any).patients_served} Patients Treated
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </AppCard>

          {/* Clinic Location Info */}
          {(() => {
            const clinicTitle = doctor.clinic_title || (doctor as any).clinic_name || (doctor as any).clinics_name;
            const clinicAddress = doctor.clinics_address || (doctor as any).clinic_address;

            if (clinicTitle) {
              return (
                <TouchableOpacity
                  style={styles.clinicCard}
                  onPress={() => {
                    const cId = (doctor as any).clinic_id || (doctor as any).clinics_id;
                    if (cId) {
                      navigation.navigate('Clinic', { clinicId: String(cId) });
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <View style={styles.clinicPinCircle}>
                    <MaterialIcons name="location-on" size={18} color="#2563EB" />
                  </View>
                  <View style={styles.clinicMeta}>
                    <Text style={styles.clinicTitle}>{clinicTitle}</Text>
                    {!!clinicAddress && (
                      <Text style={styles.clinicAddress} numberOfLines={2}>
                        {clinicAddress}
                      </Text>
                    )}
                  </View>
                  <MaterialIcons name="chevron-right" size={20} color="#94A3B8" />
                </TouchableOpacity>
              );
            }

            return (
              <View style={styles.emptyInfoCard}>
                <MaterialIcons name="location-off" size={18} color="#64748B" />
                <Text style={styles.emptyInfoText}>
                  Primary clinic information is not listed for this doctor.
                </Text>
              </View>
            );
          })()}

          {/* Consultation Fee / Appointment Type Cards */}
          <Text style={styles.sectionTitle}>Consultation Type</Text>
          {typeOptions.length > 0 ? (
            <View style={styles.feeCardsRow}>
              {typeOptions.map((opt) => {
                const isSelected = selectedType?.code === opt.code;
                const isEmergency = opt.code === '3';

                return (
                  <TouchableOpacity
                    key={opt.code}
                    style={[
                      styles.feeCard,
                      isSelected && styles.feeCardSelected,
                      isEmergency && styles.feeCardEmergency,
                      isEmergency && isSelected && styles.feeCardEmergencySelected,
                    ]}
                    onPress={() => {
                      setSelectedType(opt);
                      setSelectedDate(null);
                      setSelectedTimeStart(null);
                    }}
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
                        { backgroundColor: isEmergency ? '#FEE2E2' : '#EFF6FF' },
                      ]}
                    >
                      {opt.code === '1' ? (
                        <MaterialCommunityIcons name="hospital-building" size={20} color="#2563EB" />
                      ) : opt.code === '2' ? (
                        <MaterialIcons name="videocam" size={20} color="#2563EB" />
                      ) : (
                        <MaterialCommunityIcons name="ambulance" size={22} color="#EF4444" />
                      )}
                    </View>
                    <Text style={styles.feeLabel}>
                      {opt.label}
                    </Text>
                    <Text style={styles.feeValue}>
                      {AppConstants.appCurrency}{opt.fee || 0}
                    </Text>
                    <Text style={styles.feeModeSubtext}>{opt.subtext}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyInfoCard}>
              <MaterialIcons name="event-busy" size={18} color="#64748B" />
              <Text style={styles.emptyInfoText}>
                No consultation modes are currently active for this doctor.
              </Text>
            </View>
          )}

          {/* Date & Time Selector Cards */}
          {selectedType && selectedType.code !== '3' && (
            <>
              <Text style={styles.sectionTitle}>Select Slot *</Text>
              <View style={styles.dateTimeRow}>
                {/* Date Card */}
                <TouchableOpacity
                  style={styles.dateTimeSelectorCard}
                  onPress={() => setShowDateTimeSheet(true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.selectorLabel}>Date *</Text>
                  <View style={styles.selectorValueRow}>
                    <MaterialIcons name="calendar-today" size={15} color="#2563EB" />
                    <Text style={styles.selectorValueText} numberOfLines={1}>
                      {selectedDate ? DateTimeUtils.getDataFormat(selectedDate) : 'Select Date'}
                    </Text>
                    <MaterialIcons name="chevron-right" size={16} color="#94A3B8" />
                  </View>
                </TouchableOpacity>

                {/* Time Card */}
                <TouchableOpacity
                  style={styles.dateTimeSelectorCard}
                  onPress={() => setShowDateTimeSheet(true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.selectorLabel}>Time *</Text>
                  <View style={styles.selectorValueRow}>
                    <MaterialIcons name="access-time" size={15} color="#2563EB" />
                    <Text style={styles.selectorValueText} numberOfLines={1}>
                      {selectedTimeStart
                        ? DateTimeUtils.formatTimeToAmPm(selectedTimeStart)
                        : 'Select Time'}
                    </Text>
                    <MaterialIcons name="chevron-right" size={16} color="#94A3B8" />
                  </View>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* Patient Selection Card */}
          <Text style={styles.sectionTitle}>Select Patient *</Text>
          <TouchableOpacity
            style={styles.patientSelectorCard}
            onPress={() => setShowFamilySheet(true)}
            activeOpacity={0.8}
          >
            <View style={styles.patientIconCircle}>
              <MaterialIcons name="person" size={20} color="#2563EB" />
            </View>
            <Text style={styles.patientSelectorText} numberOfLines={1}>
              {selectedMember ? patientDisplayName : 'Choose a patient'}
            </Text>
            <MaterialIcons name="chevron-right" size={18} color="#94A3B8" />
          </TouchableOpacity>

          {/* Coupon Code Section */}
          <Text style={styles.sectionTitle}>Coupon Code</Text>
          <View style={styles.couponContainer}>
            <View style={styles.couponInputWrapper}>
              <MaterialIcons name="confirmation-number" size={18} color="#2563EB" style={{ marginLeft: ws(12) }} />
              <TextInput
                style={styles.couponInput}
                placeholder="Enter coupon code"
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
                  styles.couponApplyBtn,
                  appliedCoupon && styles.couponRemoveBtn,
                  isValidatingCoupon && { opacity: 0.7 },
                ]}
                onPress={appliedCoupon ? handleRemoveCoupon : handleApplyCoupon}
                disabled={isValidatingCoupon}
                activeOpacity={0.85}
              >
                {isValidatingCoupon ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.couponApplyBtnText}>
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

          {/* Price Breakdown */}
          <AppCard style={styles.priceBreakdownCard}>
            <Text style={styles.priceBreakdownTitle}>Price Breakdown</Text>
            <View style={styles.priceBreakdownRow}>
              <Text style={styles.priceBreakdownLabel}>Consultation Type</Text>
              <View style={styles.priceBreakdownTypeBadge}>
                <MaterialIcons
                  name={selectedType?.code === '2' ? 'videocam' : 'location-city'}
                  size={14}
                  color={Colors.primaryColor}
                />
                <Text style={styles.priceBreakdownTypeValue}>
                  {selectedType?.label ?? 'Clinic Visit'}{' '}
                  <Text style={styles.priceBreakdownTypeSub}>{selectedType?.subtext ?? ''}</Text>
                </Text>
              </View>
            </View>
            <View style={styles.priceBreakdownRow}>
              <Text style={styles.priceBreakdownLabel}>Consultation Fee</Text>
              <Text style={styles.priceBreakdownValue}>{AppConstants.appCurrency}{fee}</Text>
            </View>
            <View style={styles.priceBreakdownRow}>
              <Text style={styles.priceBreakdownLabel}>Service Fee</Text>
              <Text style={styles.priceBreakdownValue}>{AppConstants.appCurrency}{taxAmount.toFixed(0)}</Text>
            </View>
            {couponDiscount > 0 && (
              <View style={styles.priceBreakdownRow}>
                <Text style={styles.priceBreakdownDiscountLabel}>Discount ({appliedCoupon?.code || couponCode})</Text>
                <Text style={styles.priceBreakdownDiscountValue}>-{AppConstants.appCurrency}{couponDiscount.toFixed(0)}</Text>
              </View>
            )}
            <View style={styles.priceBreakdownDivider} />
            <View style={styles.priceBreakdownRow}>
              <Text style={styles.priceBreakdownTotalLabel}>Total Amount</Text>
              <Text style={styles.priceBreakdownTotalValue}>{AppConstants.appCurrency}{total.toFixed(0)}</Text>
            </View>
          </AppCard>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[styles.reviewBar, { paddingBottom: Math.max(insets.bottom + 12, 16) }]}>
        {!canReview && (
          <View style={styles.incompleteWarningRow}>
            <MaterialIcons name="info" size={13} color="#EF4444" />
            <Text style={styles.incompleteWarningText}>
              Select a date, time, and patient to continue
            </Text>
          </View>
        )}
        <TouchableOpacity
          style={[styles.reviewPayBtn, !canReview && styles.reviewPayBtnDisabled]}
          disabled={!canReview}
          onPress={() => setShowPaymentSheet(true)}
          activeOpacity={0.85}
        >
          <MaterialIcons name="lock" size={16} color={Colors.white} />
          <Text style={styles.reviewPayBtnText}>
            Review & Pay {AppConstants.appCurrency}{total.toFixed(2)}
          </Text>
        </TouchableOpacity>
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
    borderRadius: fs(14),
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  doctorHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: ws(12),
  },
  doctorAvatar: {
    width: ws(72),
    height: ws(72),
    aspectRatio: 1,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: '#E2E8F0',
  },
  doctorMetaColumn: {
    flex: 1,
  },
  doctorNameText: {
    fontSize: fs(15),
    ...TYPOGRAPHY.bold,
    color: '#1A202C',
  },
  doctorSpecializationText: {
    fontSize: fs(11.5),
    ...TYPOGRAPHY.medium,
    color: '#718096',
    marginTop: hs(2),
  },
  doctorRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hs(3),
    gap: ws(4),
  },
  doctorRatingCountText: {
    fontSize: fs(11),
    ...TYPOGRAPHY.medium,
    color: '#718096',
  },
  doctorPatientsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(4),
    marginTop: hs(4),
  },
  doctorPatientsText: {
    fontSize: fs(11),
    ...TYPOGRAPHY.medium,
    color: '#2563EB',
  },
  emptyInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: fs(12),
    padding: ws(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: hs(10),
    gap: ws(8),
  },
  emptyInfoText: {
    fontSize: fs(11),
    ...TYPOGRAPHY.regular,
    color: '#64748B',
    flex: 1,
  },
  clinicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: fs(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: ws(12),
    marginTop: hs(10),
    gap: ws(10),
  },
  clinicPinCircle: {
    width: ws(36),
    height: ws(36),
    borderRadius: 999,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clinicMeta: {
    flex: 1,
  },
  clinicTitle: {
    fontSize: fs(13),
    ...TYPOGRAPHY.bold,
    color: '#1A202C',
  },
  clinicAddress: {
    marginTop: hs(2),
    fontSize: fs(11),
    ...TYPOGRAPHY.regular,
    color: '#718096',
    lineHeight: fs(15),
  },
  sectionTitle: {
    marginTop: hs(14),
    marginBottom: hs(8),
    fontSize: fs(13.5),
    ...TYPOGRAPHY.bold,
    color: '#1E293B',
  },
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
  dateTimeRow: {
    flexDirection: 'row',
    gap: ws(10),
    marginTop: hs(4),
  },
  dateTimeSelectorCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: fs(10),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: ws(10),
  },
  selectorLabel: {
    fontSize: fs(11),
    ...TYPOGRAPHY.medium,
    color: '#64748B',
    marginBottom: hs(4),
  },
  selectorValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(6),
  },
  selectorValueText: {
    fontSize: fs(12.5),
    ...TYPOGRAPHY.bold,
    color: '#1E293B',
    flex: 1,
  },
  patientSelectorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: fs(10),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: ws(10),
    gap: ws(10),
  },
  patientIconCircle: {
    width: ws(32),
    height: ws(32),
    borderRadius: 999,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  patientSelectorText: {
    fontSize: fs(13),
    ...TYPOGRAPHY.bold,
    color: '#1E293B',
    flex: 1,
  },
  couponContainer: {
    marginTop: hs(2),
    width: '100%',
  },
  couponInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: fs(10),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: hs(46),
    overflow: 'hidden',
  },
  couponInput: {
    flex: 1,
    height: hs(46),
    paddingHorizontal: ws(10),
    fontSize: fs(13),
    ...TYPOGRAPHY.medium,
    color: '#1E293B',
  },
  couponApplyBtn: {
    height: '100%',
    paddingHorizontal: ws(20),
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  couponRemoveBtn: {
    backgroundColor: '#EF4444',
  },
  couponApplyBtnText: {
    fontSize: fs(13),
    ...TYPOGRAPHY.bold,
    color: '#FFFFFF',
  },
  couponErrorText: {
    fontSize: fs(11),
    ...TYPOGRAPHY.regular,
    color: '#EF4444',
    marginTop: hs(4),
  },
  couponSuccessBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(4),
    marginTop: hs(4),
  },
  couponSuccessText: {
    fontSize: fs(11),
    ...TYPOGRAPHY.medium,
    color: '#16A34A',
  },
  priceBreakdownCard: {
    marginTop: hs(14),
    padding: ws(14),
    borderRadius: fs(12),
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  priceBreakdownTitle: {
    fontSize: fs(13.5),
    ...TYPOGRAPHY.bold,
    color: '#1E293B',
    marginBottom: hs(10),
  },
  priceBreakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: hs(3),
  },
  priceBreakdownLabel: {
    fontSize: fs(12.5),
    ...TYPOGRAPHY.regular,
    color: '#64748B',
  },
  priceBreakdownTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(4),
    backgroundColor: '#EFF6FF',
    paddingHorizontal: ws(8),
    paddingVertical: hs(3),
    borderRadius: fs(6),
  },
  priceBreakdownTypeValue: {
    fontSize: fs(12),
    ...TYPOGRAPHY.bold,
    color: Colors.primaryColor,
  },
  priceBreakdownTypeSub: {
    fontSize: fs(11),
    ...TYPOGRAPHY.medium,
    color: '#3B82F6',
  },
  priceBreakdownValue: {
    fontSize: fs(12.5),
    ...TYPOGRAPHY.bold,
    color: '#1E293B',
  },
  priceBreakdownDiscountLabel: {
    fontSize: fs(12.5),
    ...TYPOGRAPHY.medium,
    color: '#16A34A',
  },
  priceBreakdownDiscountValue: {
    fontSize: fs(12.5),
    ...TYPOGRAPHY.bold,
    color: '#16A34A',
  },
  priceBreakdownDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: hs(8),
  },
  priceBreakdownTotalLabel: {
    fontSize: fs(14),
    ...TYPOGRAPHY.bold,
    color: '#1E293B',
  },
  priceBreakdownTotalValue: {
    fontSize: fs(16),
    ...TYPOGRAPHY.bold,
    color: '#2563EB',
  },
  reviewSection: { marginTop: 0, marginBottom: 0 },
  patientReviewCard: {
    backgroundColor: Colors.white,
    borderRadius: fs(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: ws(12),
    marginBottom: hs(8),
  },
  reviewUserHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: hs(6) },
  reviewerAvatarCircle: {
    width: ws(34),
    height: ws(34),
    borderRadius: 999,
    overflow: 'hidden',
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
  reviewerMeta: { flex: 1 },
  reviewerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: ws(8),
  },
  reviewerName: { fontSize: fs(12), ...TYPOGRAPHY.bold, color: '#1E293B', flexShrink: 1 },
  reviewDateText: {
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
  reviewRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ws(4),
    marginTop: hs(3),
  },
  reviewRatingPts: {
    fontSize: fs(11),
    ...TYPOGRAPHY.bold,
    color: '#D97706',
  },
  reviewCommentText: {
    fontSize: fs(11.5),
    ...TYPOGRAPHY.regular,
    color: '#475569',
    lineHeight: fs(17),
    marginTop: hs(4),
  },
  emptyReviewsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: fs(12),
    padding: ws(14),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 0,
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
  suggestedSection: { marginTop: 0, marginBottom: hs(8) },
  suggestedTitle: {
    fontSize: fs(13.5),
    ...TYPOGRAPHY.bold,
    color: '#1E293B',
    marginBottom: hs(8),
  },
  suggestedGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  suggestedGridCard: {
    width: '48%',
    backgroundColor: Colors.white,
    borderRadius: fs(12),
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: ws(10),
    alignItems: 'center',
    marginBottom: hs(10),
  },
  suggestedAvatarWrapper: {
    width: ws(56),
    height: ws(56),
    borderRadius: 999,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hs(6),
    overflow: 'hidden',
  },
  suggestedAvatarImg: { width: ws(56), height: ws(56), borderRadius: 999, overflow: 'hidden' },
  suggestedCardName: { fontSize: fs(12), ...TYPOGRAPHY.bold, color: '#1E293B', textAlign: 'center' },
  suggestedCardDept: { marginTop: hs(2), fontSize: fs(10), color: '#64748B', textAlign: 'center', lineHeight: hs(14) },
  suggestedRatingRow: { flexDirection: 'row', alignItems: 'center', marginTop: hs(4), gap: ws(4) },
  suggestedRatingText: { fontSize: fs(9.5), color: '#64748B' },
  viewMoreToggleBtn: {
    alignSelf: 'flex-end',
    paddingVertical: hs(4),
    paddingHorizontal: ws(4),
    marginTop: hs(2),
    marginBottom: 0,
  },
  viewMoreToggleText: { fontSize: fs(11.5), color: '#2563EB', ...TYPOGRAPHY.medium },
  bottomSpacer: { height: hs(20) },
  reviewBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: ws(16),
    paddingTop: hs(8),
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  incompleteWarningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ws(4),
    marginBottom: hs(6),
  },
  incompleteWarningText: {
    fontSize: fs(11),
    ...TYPOGRAPHY.medium,
    color: '#EF4444',
  },
  reviewPayBtn: {
    height: hs(44),
    borderRadius: fs(10),
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ws(6),
  },
  reviewPayBtnDisabled: {
    backgroundColor: '#94A3B8',
    opacity: 0.7,
  },
  reviewPayBtnText: {
    fontSize: fs(13),
    ...TYPOGRAPHY.bold,
    color: '#FFFFFF',
  },
});
