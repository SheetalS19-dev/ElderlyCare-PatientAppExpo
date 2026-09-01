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
        if (params.searchQuery && params.searchQuery.trim()) {
          queryParams.search = params.searchQuery.trim();
          queryParams.search_query = params.searchQuery.trim();
        }
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
  }),
});

export const { useGetPatientFilesQuery } = patientFilesApi as any;
