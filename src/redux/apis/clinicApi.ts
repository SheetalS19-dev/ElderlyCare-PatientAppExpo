import { ApiEndpoints } from '../../constants';
import { baseApi } from './baseApi';

export const clinicApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder: any) => ({
    getClinics: builder.query({
      query: (args: { start?: string; end?: string; cityId?: string; search?: string } = {}) => {
        const params: Record<string, any> = { active: 1 };
        if (args.start !== undefined) params.start = args.start;
        if (args.end !== undefined) params.end = args.end;
        if (args.cityId && String(args.cityId).trim()) params.city_id = String(args.cityId).trim();
        if (args.search && String(args.search).trim()) params.search = String(args.search).trim();
        return {
          url: ApiEndpoints.getClinicUrl,
          params,
        };
      },
    }),

    getClinicById: builder.query({
      query: (clinicId: string) => `${ApiEndpoints.getClinicByIdUrl}/${clinicId}`,
    }),
  }),
});

export const { useGetClinicsQuery, useGetClinicByIdQuery } = clinicApi as any;
