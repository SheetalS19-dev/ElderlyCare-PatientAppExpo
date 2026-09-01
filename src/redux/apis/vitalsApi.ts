import { ApiEndpoints } from '../../constants';
import { baseApi } from './baseApi';

export interface GetVitalsParams {
  familyMemberId: string | number;
  type: string; // "Blood Pressure" | "Sugar" | "Weight" | "Temperature" | "SpO2"
  startDate?: string;
  endDate?: string;
}

export interface AddVitalPayload {
  user_id: string | number;
  family_member_id: string | number;
  type: string;
  bp_systolic?: string;
  bp_diastolic?: string;
  weight?: string;
  spo2?: string;
  temperature?: string;
  sugar_random?: string;
  sugar_fasting?: string;
  date?: string;
  time?: string;
}

export interface UpdateVitalPayload extends AddVitalPayload {
  id: string | number;
}

export const vitalsApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder: any) => ({
    getVitals: builder.query({
      query: (params: GetVitalsParams) => ({
        url: ApiEndpoints.getVitalsByFamilyIDUrl,
        params: {
          family_member_id: params.familyMemberId,
          type: params.type,
          ...(params.startDate ? { start_date: params.startDate } : {}),
          ...(params.endDate ? { end_date: params.endDate } : {}),
        },
      }),
      transformResponse: (res: any) => {
        if (Array.isArray(res)) return res;
        if (Array.isArray(res?.data)) return res.data;
        if (Array.isArray(res?.result)) return res.result;
        return [];
      },
      providesTags: ['Vitals'],
    }),

    addVital: builder.mutation({
      query: (body: AddVitalPayload) => ({
        url: ApiEndpoints.addVitalsUrl,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Vitals'],
    }),

    updateVital: builder.mutation({
      query: (body: UpdateVitalPayload) => ({
        url: ApiEndpoints.updateVitalsUrl,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Vitals'],
    }),

    deleteVital: builder.mutation({
      query: (body: { id: string | number }) => ({
        url: ApiEndpoints.deleteVitalsUrl,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Vitals'],
    }),
  }),
});

export const {
  useGetVitalsQuery,
  useAddVitalMutation,
  useUpdateVitalMutation,
  useDeleteVitalMutation,
} = vitalsApi as any;
