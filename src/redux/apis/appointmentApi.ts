import { ApiEndpoints } from '../../constants';
import { AppointmentCancellationModel, AppointmentModel } from '../../types';
import { baseApi } from './baseApi';

export interface AddReviewPayload {
  doctor_id: string;
  points: string;
  description: string;
  appointment_id: string;
  user_id: string;
}

export const appointmentApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder: any) => ({
    getAppointments: builder.query({
      query: (uid: string) => ({
        url: ApiEndpoints.getAppByUIDUrl,
        params: { user_id: uid },
      }),
      providesTags: ['Appointment'],
    }),

    getAppointmentById: builder.query({
      query: (appId: string) => `${ApiEndpoints.getAppByIDUrl}/${appId}`,
      providesTags: (_r: any, _e: any, appId: string) => [{ type: 'Appointment', id: appId }],
    }),

    getCancellationHistory: builder.query({
      query: (appId: string) => `${ApiEndpoints.getAppointmentCancellationUrlByAppId}/${appId}`,
    }),

    addCancellationRequest: builder.mutation({
      query: (body: { appointment_id: string; status: string }) => ({
        url: ApiEndpoints.appointmentCancellationUrl,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Appointment'],
    }),

    deleteCancellationRequest: builder.mutation({
      query: (body: { appointment_id: string }) => ({
        url: ApiEndpoints.deleteAppointmentCancellationUrl,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Appointment'],
    }),

    addDoctorReview: builder.mutation({
      query: (body: AddReviewPayload) => ({
        url: ApiEndpoints.addDoctorsReviewUrl,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Appointment'],
    }),
  }),
});

export const {
  useGetAppointmentsQuery,
  useGetAppointmentByIdQuery,
  useGetCancellationHistoryQuery,
  useAddCancellationRequestMutation,
  useDeleteCancellationRequestMutation,
  useAddDoctorReviewMutation,
} = appointmentApi as any;

export type { AppointmentCancellationModel, AppointmentModel };

