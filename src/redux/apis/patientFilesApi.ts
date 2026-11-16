import { ApiEndpoints } from '../../constants';
import { baseApi } from './baseApi';

export interface GetPatientFilesParams {
  userId: string;
  searchQuery?: string;
  familyMemberId?: string;
}

export const patientFilesApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder: any) => ({
    getPatientFiles: builder.query({
      query: (params: GetPatientFilesParams) => {
        const queryParams: any = {
          user_id: params.userId,
        };
        // Note: The backend endpoint crashes with 500 ("Illegal mix of collations")
        // if search / search_query is passed in the URL.
        // File search is handled seamlessly client-side in PatientFileScreen.
        if (params.familyMemberId && params.familyMemberId !== 'all') {
          queryParams.family_member_id = params.familyMemberId;
          queryParams.patient_id = params.familyMemberId;
          queryParams.member_id = params.familyMemberId;
        }
        return {
          url: ApiEndpoints.getPatientFilesUrl,
          params: queryParams,
        };
      },
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
