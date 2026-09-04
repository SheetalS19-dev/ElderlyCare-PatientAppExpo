import { ApiEndpoints } from '../../constants';
import {
  AppointmentModel,
  BookedTimeSlotModel,
  CouponModel,
  FamilyMemberModel,
  PaymentGatewayModel,
  TimeSlotModel,
} from '../../types';
import { baseApi } from './baseApi';

export interface AddFamilyMemberPayload {
  user_id: string;
  f_name: string;
  l_name: string;
  phone: string;
  gender: string;
  isd_code: string;
  dob: string;
}

export interface UpdateFamilyMemberPayload {
  id: string;
  f_name: string;
  l_name: string;
  phone: string;
  gender: string;
  isd_code: string;
  dob: string;
}

// All the fields the backend expects when creating an appointment / order,
// mirroring AppointmentService.addAppointment / RazorPayService.createOrderAppointment
export interface AppointmentPayload {
  family_member_id: string;
  patient_id: string;
  status: string;
  date: string;
  time_slots: string;
  doct_id: string;
  dept_id: string;
  type: string;
  meeting_id: string;
  meeting_link: string;
  payment_status: string;
  fee: string;
  service_charge: string;
  total_amount: string;
  invoice_description: string;
  payment_method: string;
  payment_transaction_id: string;
  is_wallet_txn: string;
  coupon_id: string;
  coupon_value: string;
  coupon_title: string;
  coupon_off_amount: string;
  tax: string;
  unit_tax_amount: string;
  unit_total_amount: string;
  source: string;
}

export interface CreateRzOrderPayload {
  amount: string;
  key?: string;
  secret?: string;
  payload?: string;
  type?: 'Appointment' | 'Wallet';
  user_id?: string;
  currency?: string;
  receipt?: string;
}

export const bookingApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder: any) => ({
    getFamilyMembers: builder.query({
      query: (uid: string) => `${ApiEndpoints.getFamilyMembersByUIDUrl}/${uid}`,
      providesTags: ['FamilyMember'],
    }),

    addFamilyMember: builder.mutation({
      query: (body: AddFamilyMemberPayload) => ({
        url: ApiEndpoints.addFamilyMemberUrl,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['FamilyMember'],
    }),

    updateFamilyMember: builder.mutation({
      query: (body: UpdateFamilyMemberPayload) => ({
        url: ApiEndpoints.updateFamilyMemberUrl,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['FamilyMember'],
    }),

    deleteFamilyMember: builder.mutation({
      query: (id: string) => ({
        url: ApiEndpoints.deleteFamilyMemberUrl,
        method: 'POST',
        body: { id },
      }),
      invalidatesTags: ['FamilyMember'],
    }),


    // slotType: '1' = clinic visit, '2' = video call (matches AppointmentType)
    getTimeSlots: builder.query({
      query: ({ doctId, day, slotType }: { doctId: string; day: string; slotType: string }) => {
        const base = slotType === '2' ? ApiEndpoints.getVideoTimeSlotsUrl : ApiEndpoints.getTimeSlotsUrl;
        return `${base}/${doctId}/${day}`;
      },
    }),

    getBookedTimeSlots: builder.query({
      query: ({ doctId, date, type }: { doctId: string; date: string; type: string }) => ({
        url: ApiEndpoints.getBookedTimeSlotsUrl,
        params: { doct_id: doctId, date, type },
      }),
    }),

    validateCoupon: builder.mutation({
      query: (body: { user_id: string; title: string; clinic_id: string }) => ({
        url: ApiEndpoints.getValidateUrl,
        method: 'POST',
        body,
      }),
    }),

    getActivePaymentGateway: builder.query({
      query: () => ApiEndpoints.getPaymentGatewayActiveUrl,
      transformResponse: (res: any) => res?.data ?? res,
    }),

    // Direct booking (used for "Pay at Hospital" / "Pay from Wallet" — no Razorpay checkout)
    addAppointment: builder.mutation({
      query: (body: AppointmentPayload) => ({
        url: ApiEndpoints.addAppUrl,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Appointment', 'User', 'WalletTxn'],
    }),

    // Creates the pending appointment + a Razorpay order server-side in one call
    createRzOrder: builder.mutation({
      query: (body: CreateRzOrderPayload) => ({
        url: ApiEndpoints.createRzOrderUrl,
        method: 'POST',
        body,
      }),
      transformResponse: (res: any) => res?.data ?? res,
      invalidatesTags: ['Appointment'],
    }),
  }),
});

export const {
  useGetFamilyMembersQuery,
  useAddFamilyMemberMutation,
  useUpdateFamilyMemberMutation,
  useDeleteFamilyMemberMutation,
  useGetTimeSlotsQuery,
  useGetBookedTimeSlotsQuery,
  useValidateCouponMutation,
  useGetActivePaymentGatewayQuery,
  useAddAppointmentMutation,
  useCreateRzOrderMutation,
} = bookingApi as any;

export type {
  AppointmentModel, BookedTimeSlotModel,
  CouponModel, FamilyMemberModel, PaymentGatewayModel, TimeSlotModel
};

