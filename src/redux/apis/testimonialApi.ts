import { ApiEndpoints } from '../../constants';
import { baseApi } from './baseApi';

export const testimonialApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder: any) => ({
    getTestimonials: builder.query({
      query: (clinicId?: string) => ({
        url: ApiEndpoints.getTestimonialApiUrl,
        params: clinicId ? { clinic_id: clinicId } : {},
      }),
    }),
  }),
});

export const { useGetTestimonialsQuery } = testimonialApi as any;
