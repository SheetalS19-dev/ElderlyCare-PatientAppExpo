import type { RouteProp } from '@react-navigation/native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useMemo, useState } from 'react';
import { AppConstants } from '../../constants';
import { useAuth } from '../../context/AuthContext';
import type { RootStackParamList } from '../../navigation/types';
import {
  useAddAppointmentMutation,
  useAddFamilyMemberMutation,
  useGetActivePaymentGatewayQuery,
  useGetFamilyMembersQuery,
  useValidateCouponMutation,
} from '../../redux/apis/bookingApi';
import {
  useGetDoctorByIdQuery,
  useGetDoctorReviewsQuery,
} from '../../redux/apis/doctorApi';
import { useGetUserProfileQuery } from '../../redux/apis/userApi';
import { useAddWalletMoneyMutation } from '../../redux/apis/walletApi';
import { storageService } from '../../services/storageService';
import type {
  CouponModel,
  DoctorModel,
  DoctorReviewModel,
  FamilyMemberModel,
  UserModel,
} from '../../types';
import {
  CalculationUtils,
  isUserSelfMember,
  markAppointmentAsRescheduled,
  showToast,
} from '../../utils';
import type {
  AppointmentTypeOption,
  PaymentMethodChoice,
} from './components';

export const useBookAppointment = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'BookAppointment'>>();
  const { doctId, isReschedule, rescheduledFromAppId } = route.params;
  const { user, isAuthenticated, updateUser } = useAuth();

  React.useEffect(() => {
    if (!isAuthenticated) {
      navigation.replace('Login');
    }
  }, [isAuthenticated, navigation]);

  const uid = String(user?.id ?? (user as any)?.user_id ?? '');

  const { data: userProfileData, refetch: refetchUserProfile } = useGetUserProfileQuery(uid, {
    skip: !uid,
    refetchOnMountOrArgChange: true,
  });

  const currentUser: UserModel | null = useMemo(() => {
    return userProfileData?.data ?? userProfileData ?? user ?? null;
  }, [userProfileData, user]);

  const { data: rawDoctorData, isLoading, isError, refetch } = useGetDoctorByIdQuery(doctId);
  const { data: rawReviews } = useGetDoctorReviewsQuery(doctId);
  const { data: gateway } = useGetActivePaymentGatewayQuery();
  const [validateCoupon, { isLoading: isValidatingCoupon }] = useValidateCouponMutation();
  const [addAppointment] = useAddAppointmentMutation();
  const [addWalletMoney] = useAddWalletMoneyMutation();
  const [addFamilyMember] = useAddFamilyMemberMutation();

  const { data: rawFamilyData, refetch: refetchFamilyMembers } = useGetFamilyMembersQuery(uid, {
    skip: !uid,
    refetchOnMountOrArgChange: true,
  });

  const familyMembersList: FamilyMemberModel[] = useMemo(() => {
    let list: FamilyMemberModel[] = [];
    if (Array.isArray(rawFamilyData)) list = rawFamilyData;
    else if (Array.isArray((rawFamilyData as any)?.data)) list = (rawFamilyData as any).data;
    else if (Array.isArray((rawFamilyData as any)?.response)) list = (rawFamilyData as any).response;
    return list;
  }, [rawFamilyData]);

  const doctor: DoctorModel | null = useMemo(() => {
    if (!rawDoctorData) return null;
    let target = (rawDoctorData as any)?.data ?? (rawDoctorData as any)?.response ?? rawDoctorData;
    if (Array.isArray(target)) {
      const match = target.find(
        (d: any) => String(d.id || d.doct_id || d.user_id) === String(doctId)
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
    if (!user) return;

    const realSelf = familyMembersList.find((m) => isUserSelfMember(m, user));

    if (!selectedMember) {
      if (realSelf) {
        setSelectedMember({
          ...realSelf,
          relationship: 'Self',
          is_self: true,
        } as any);
      } else {
        const selfMember: FamilyMemberModel = {
          id: undefined as any,
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
    } else {
      const isSelectedSelf =
        (selectedMember as any).is_self ||
        selectedMember.relationship === 'Self' ||
        isUserSelfMember(selectedMember, user);

      if (isSelectedSelf && realSelf && String(selectedMember.id) !== String(realSelf.id)) {
        setSelectedMember({
          ...realSelf,
          relationship: 'Self',
          is_self: true,
        } as any);
      }
    }
  }, [user, familyMembersList, selectedMember]);

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<CouponModel | null>(null);
  const [couponError, setCouponError] = useState<string | undefined>();

  const reviews: DoctorReviewModel[] = useMemo(() => {
    if (Array.isArray(rawReviews)) return rawReviews;
    if (Array.isArray((rawReviews as any)?.data)) return (rawReviews as any).data;
    return [];
  }, [rawReviews]);

  const reviewsCount = useMemo(() => {
    // 1. Direct from doctor API if available
    if (doctor?.number_of_reviews != null && Number(doctor.number_of_reviews) >= 0) {
      return Number(doctor.number_of_reviews);
    }
    const rawApiCount = (rawReviews as any)?.number_of_reviews ?? (rawReviews as any)?.total_record;
    if (rawApiCount != null && Number(rawApiCount) >= 0) {
      return Number(rawApiCount);
    }
    if (reviews.length > 0) return reviews.length;
    return 0;
  }, [doctor?.number_of_reviews, rawReviews, reviews.length]);

  const ratingAverage = useMemo(() => {
    // 1. Direct from doctor API if available
    if (doctor?.average_rating != null && Number(doctor.average_rating) > 0) {
      return Number(doctor.average_rating);
    }
    const rawApiRating = (rawReviews as any)?.average_rating;
    if (rawApiRating != null && Number(rawApiRating) > 0) {
      return Number(rawApiRating);
    }
    if (reviews.length > 0) {
      const sum = reviews.reduce((acc, r) => acc + Number(r.points ?? r.rating ?? 0), 0);
      if (sum > 0) return sum / reviews.length;
    }
    return 0;
  }, [doctor?.average_rating, rawReviews, reviews]);

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

  const handleApplyCoupon = useCallback(async () => {
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
  }, [couponCode, doctId, validateCoupon]);

  const handleRemoveCoupon = useCallback(() => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError(undefined);
  }, []);

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

    const resolveFamilyMemberId = async (member: FamilyMemberModel): Promise<string> => {
      // 1. If member already has an id that matches an existing record in familyMembersList
      const inList = familyMembersList.find((m) => String(m.id) === String(member.id));
      if (inList && inList.id) {
        return String(inList.id);
      }

      // 2. If it's Self, find the real record in familyMembersList
      const isSelf =
        (member as any).is_self ||
        member.relationship === 'Self' ||
        isUserSelfMember(member, user);

      if (isSelf) {
        const foundSelf = familyMembersList.find((m) => isUserSelfMember(m, user));
        if (foundSelf && foundSelf.id) {
          return String(foundSelf.id);
        }

        // 3. If no self member in familyMembersList, auto-create one
        try {
          const createRes: any = await addFamilyMember({
            user_id: userId,
            f_name: currentUser?.f_name || user?.f_name || 'Self',
            l_name: currentUser?.l_name || user?.l_name || '',
            phone: currentUser?.phone || user?.phone || '',
            gender: currentUser?.gender || user?.gender || 'Male',
            dob: currentUser?.dob || user?.dob || '2000-01-01',
            isd_code: currentUser?.isd_code || user?.isd_code || '+91',
            relationship: 'Self',
          }).unwrap();

          const createdId =
            createRes?.data?.id ??
            createRes?.data?.member_id ??
            createRes?.response?.id ??
            createRes?.id;

          if (createdId) {
            await refetchFamilyMembers();
            return String(createdId);
          }
        } catch (createErr) {
          console.warn('Failed to auto-create self family member for booking:', createErr);
        }

        // 4. Try refetching family members
        const fresh = await refetchFamilyMembers();
        const freshList: FamilyMemberModel[] = Array.isArray(fresh?.data)
          ? fresh.data
          : Array.isArray((fresh?.data as any)?.data)
            ? (fresh.data as any).data
            : [];
        const freshSelf = freshList.find((m) => isUserSelfMember(m, user));
        if (freshSelf && freshSelf.id) {
          return String(freshSelf.id);
        }
      }

      // 5. If member has an id, use it
      if (member.id) {
        return String(member.id);
      }

      throw new Error('Unable to verify patient family member. Please select a patient again.');
    };

    const familyMemberId = await resolveFamilyMemberId(selectedMember);

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

      const isRescheduleMode = Boolean(isReschedule);
      const payload: any = {
        user_id: userId,
        family_member_id: familyMemberId,
        status: isRescheduleMode ? 'Rescheduled' : 'Confirmed',
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
        is_reschedule: isRescheduleMode ? 1 : 0,
        rescheduled_from: rescheduledFromAppId ? String(rescheduledFromAppId) : undefined,
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
        await addWalletMoney(walletDebitPayload).unwrap();
      }

      const bookingRes = await addAppointment(payload).unwrap();

      if (isRescheduleMode) {
        const newAppId = bookingRes?.data?.id || bookingRes?.id || bookingRes?.appointment_id;
        if (newAppId) {
          await markAppointmentAsRescheduled(newAppId, rescheduledFromAppId);
        }
      }

      setShowPaymentSheet(false);
      showToast(isRescheduleMode ? 'Consultation rescheduled successfully!' : 'Appointment booked successfully!');

      if (choice === 'wallet') {
        const nextBalance = Math.max(0, walletBalance - total);
        await updateUser({
          ...(user || {}),
          wallet_amount: nextBalance,
          wallet_balance: nextBalance,
        });
      }

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
        routes: [
          { name: 'Main' },
          {
            name: 'MyBookings',
            params: isRescheduleMode
              ? { initialTab: 'upcoming', initialSubFilter: 'rescheduled' }
              : undefined,
          },
        ],
      });
    } catch (e: any) {
      showToast(e?.data?.message || e?.message || e?.error || 'Failed to book appointment');
    }
  };

  return {
    navigation,
    doctId,
    isReschedule,
    rescheduledFromAppId,
    user,
    currentUser,
    doctor,
    isLoading,
    isError,
    refetch,
    reviews,
    reviewsCount,
    ratingAverage,
    typeOptions,
    selectedType,
    setSelectedType,
    selectedMember,
    setSelectedMember,
    selectedDate,
    setSelectedDate,
    selectedTimeStart,
    setSelectedTimeStart,
    fee,
    taxPercent,
    taxAmount,
    couponDiscount,
    total,
    walletBalance,
    couponCode,
    setCouponCode,
    appliedCoupon,
    couponError,
    setCouponError,
    isValidatingCoupon,
    showFamilySheet,
    setShowFamilySheet,
    showDateTimeSheet,
    setShowDateTimeSheet,
    showPaymentSheet,
    setShowPaymentSheet,
    handleApplyCoupon,
    handleRemoveCoupon,
    handleSubmitPayment,
  };
};
