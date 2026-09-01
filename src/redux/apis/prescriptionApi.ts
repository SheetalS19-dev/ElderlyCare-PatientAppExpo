import { ApiEndpoints } from '../../constants';
import { baseApi } from './baseApi';

export const prescriptionApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder: any) => ({
    getPrescriptions: builder.query({
      query: (userId: string) => ({
        url: ApiEndpoints.getPrescriptionsUrl,
        params: { user_id: userId },
      }),
      providesTags: ['Prescription'],
    }),

    getPrescriptionsByAppId: builder.query({
      query: (appId: string) => ({
        url: ApiEndpoints.getPrescriptionsUrl,
        params: { appointment_id: appId },
      }),
    }),
  }),
});

export const {
  useGetPrescriptionsQuery,
  useGetPrescriptionsByAppIdQuery,
} = prescriptionApi as any;
