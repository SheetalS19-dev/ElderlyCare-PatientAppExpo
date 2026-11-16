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
        const rawCity = String(args.cityId ?? '').trim();
        const numCityId = Number(rawCity);
        if (
          rawCity &&
          rawCity !== 'ALL' &&
          rawCity !== 'undefined' &&
          rawCity !== 'null' &&
          rawCity !== '0' &&
          !isNaN(numCityId) &&
          numCityId > 0
        ) {
          params.city_id = String(numCityId);
        }
        if (args.search && String(args.search).trim()) {
          params.search = String(args.search).trim();
        }
        return {
          url: ApiEndpoints.getClinicUrl,
          params,
        };
      },
      providesTags: ['Clinic'],
      transformResponse: (res: any) => {
        if (Array.isArray(res)) return res;
        if (Array.isArray(res?.data)) return res.data;
        if (Array.isArray(res?.response)) return res.response;
        if (Array.isArray(res?.result)) return res.result;
        return res?.data ?? res ?? [];
      },
    }),

    getClinicById: builder.query({
      query: (clinicIdOrSlug: string) =>
        `${ApiEndpoints.getClinicByIdUrl}/${encodeURIComponent(String(clinicIdOrSlug).trim())}`,
      providesTags: (_res: any, _err: any, arg: string) => [{ type: 'Clinic', id: arg }],
      transformResponse: (res: any) => {
        const inner = res?.data ?? res;
        if (Array.isArray(inner)) return inner[0] ?? null;
        if (inner && typeof inner === 'object' && ('id' in inner || 'title' in inner || 'name' in inner)) {
          return inner;
        }
        return null;
      },
    }),
  }),
});

export const { useGetClinicsQuery, useGetClinicByIdQuery } = clinicApi as any;
