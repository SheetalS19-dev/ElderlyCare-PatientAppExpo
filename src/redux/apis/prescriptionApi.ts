import { ApiEndpoints } from '../../constants';
import { baseApi } from './baseApi';

export interface GetPrescriptionsParams {
  userId: string | number;
  patientId?: string | number;
  familyMemberId?: string | number;
  start?: number;
  end?: number;
}

export const prescriptionApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder: any) => ({
    getPrescriptions: builder.query({
      query: (arg: string | GetPrescriptionsParams) => {
        if (typeof arg === 'object' && arg !== null) {
          const params: Record<string, any> = { user_id: arg.userId };
          const pId = arg.patientId ?? arg.familyMemberId;
          if (pId !== undefined && String(pId) !== '' && String(pId) !== 'ALL' && String(pId) !== '0') {
            params.patient_id = pId;
          }
          if (arg.start !== undefined) params.start = arg.start;
          if (arg.end !== undefined) params.end = arg.end;
          return {
            url: ApiEndpoints.getPrescriptionsUrl,
            params,
          };
        }
        return {
          url: ApiEndpoints.getPrescriptionsUrl,
          params: { user_id: arg },
        };
      },
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
