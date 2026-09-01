import { ApiEndpoints } from '../../constants';
import { baseApi } from './baseApi';

export interface UpdateUserProfilePayload {
  id: string | number;
  f_name: string;
  l_name: string;
  email?: string;
  phone?: string;
  isd_code?: string;
  gender?: string;
  dob?: string;
  image?: any;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string | number;
  marital_status?: string;
  occupation?: string;
  blood_group?: string;
}

export const userApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder: any) => ({
    getUserProfile: builder.query({
      query: (uid: string) => `${ApiEndpoints.getUserUrl}/${uid}`,
      providesTags: ['User'],
    }),

    updateUserProfile: builder.mutation({
      query: (body: FormData | UpdateUserProfilePayload) => ({
        url: ApiEndpoints.updateUserUrl,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['User'],
    }),

    softDeleteUser: builder.mutation({
      query: (userId: string) => ({
        url: ApiEndpoints.useSoftDeleteUrl,
        method: 'POST',
        body: { user_id: userId },
      }),
      invalidatesTags: ['User'],
    }),

    updateNotificationSeen: builder.mutation({
      query: (userId: string) => ({
        url: ApiEndpoints.updateUserUrl,
        method: 'POST',
        body: { id: userId, notification_seen_at: 'update' },
      }),
      invalidatesTags: ['User'],
    }),
  }),
});

export const {
  useGetUserProfileQuery,
  useUpdateUserProfileMutation,
  useSoftDeleteUserMutation,
  useUpdateNotificationSeenMutation,
} = userApi as any;
