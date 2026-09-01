import { ApiEndpoints } from '../../constants';
import { baseApi } from './baseApi';

export const clinicApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder: any) => ({
    getClinics: builder.query({
      query: (args: { start?: string; end?: string; cityId?: string } = {}) => ({
        url: ApiEndpoints.getClinicUrl,
        params: {
          start: args.start ?? '0',
          end: args.end ?? '20',
          city_id: args.cityId ?? '',
          active: 1,
        },
      }),
    }),

    getClinicById: builder.query({
      query: (clinicId: string) => `${ApiEndpoints.getClinicByIdUrl}/${clinicId}`,
    }),
  }),
});

export const { useGetClinicsQuery, useGetClinicByIdQuery } = clinicApi as any;
