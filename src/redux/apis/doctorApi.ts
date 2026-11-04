import { ApiEndpoints } from '../../constants';
import { BannerModel, CityModel, DepartmentModel, DoctorModel, DoctorReviewModel } from '../../types';
import { baseApi } from './baseApi';

export const doctorApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder: any) => ({
    getDepartments: builder.query({
      query: () => ApiEndpoints.getDepartmentUrl,
    }),

    getBanners: builder.query({
      query: () => ({
        url: ApiEndpoints.getBannerUrl,
        params: { type: 'Mobile' },
      }),
    }),

    getCities: builder.query({
      query: (search?: string) => ({
        url: ApiEndpoints.getCityUrl,
        params: { search: search ?? '', active: 1 },
      }),
      transformResponse: (res: any) => res?.data ?? res,
    }),

    getCurrentCity: builder.query({
      query: () => ApiEndpoints.getLocationUrl,
      transformResponse: (res: any) => res?.data ?? res,
    }),

    getDoctors: builder.query({
      query: (args: { searchQuery?: string; search?: string; cityId?: string; department?: string } = {}) => {
        const params: Record<string, any> = { active: 1 };
        const queryTerm = args.search ?? args.searchQuery;
        if (queryTerm && queryTerm.trim()) {
          params.search = queryTerm.trim();
        }
        if (args.cityId && String(args.cityId).trim()) {
          params.city_id = String(args.cityId).trim();
        }
        if (args.department && String(args.department).trim()) {
          params.department = String(args.department).trim();
        }
        return {
          url: ApiEndpoints.getDoctorsUrl,
          params,
        };
      },
    }),

    getDoctorsByClinicId: builder.query({
      query: (clinicId: string) => ({
        url: ApiEndpoints.getDoctorsUrl,
        params: { active: '1', clinic_id: clinicId },
      }),
    }),

    getDoctorById: builder.query({
      query: (doctId: string) => `${ApiEndpoints.getDoctorsUrl}/${doctId}`,
      providesTags: (_result: any, _error: any, doctId: string) => [{ type: 'Doctor', id: doctId }],
    }),

    getDoctorReviews: builder.query({
      query: (doctorId: string) => ({
        url: ApiEndpoints.getDoctorReviewUrl,
        params: { doctor_id: doctorId },
      }),
    }),

    getDoctorsByDeptAndCity: builder.query({
      query: ({ deptId, cityId }: { deptId: string; cityId?: string }) => {
        const cId = cityId || '1';
        return `${ApiEndpoints.getDoctorsByDeptAndCityUrl}/${deptId}/${cId}`;
      },
      transformResponse: (res: any) => res?.data ?? res,
    }),
  }),
});

export const {
  useGetDepartmentsQuery,
  useGetBannersQuery,
  useGetCitiesQuery,
  useGetCurrentCityQuery,
  useGetDoctorsQuery,
  useGetDoctorsByClinicIdQuery,
  useGetDoctorByIdQuery,
  useGetDoctorReviewsQuery,
  useGetDoctorsByDeptAndCityQuery,
} = doctorApi as any;

// Re-exported for screens that only need the response shapes
export type { BannerModel, CityModel, DepartmentModel, DoctorModel, DoctorReviewModel };

