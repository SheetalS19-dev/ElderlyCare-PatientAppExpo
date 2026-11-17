import { ApiEndpoints } from '../../constants';
import { baseApi } from './baseApi';

export interface GetPatientFilesParams {
  userId: string | number;
  searchQuery?: string;
  familyMemberId?: string;
}

export const patientFilesApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder: any) => ({
    getPatientFiles: builder.query({
      query: (arg: string | number | GetPatientFilesParams) => {
        const uId = typeof arg === 'object' && arg !== null ? arg.userId : arg;
        return {
          url: ApiEndpoints.getPatientFilesUrl,
          params: {
            user_id: uId,
          },
        };
      },
      transformResponse: (res: any) => res?.data ?? res,
      providesTags: ['PatientFiles'],
    }),
    uploadPatientFile: builder.mutation({
      query: (formData: FormData) => ({
        url: ApiEndpoints.addPatientFileUrl,
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['PatientFiles'],
    }),
  }),
});

export const { useGetPatientFilesQuery, useUploadPatientFileMutation } = patientFilesApi as any;
