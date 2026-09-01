import { ApiEndpoints } from '../../constants';
import { baseApi } from './baseApi';

export const notificationApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder: any) => ({
    getNotificationsByDate: builder.query({
      query: ({ uid, date }: { uid: string; date: string }) =>
        `${ApiEndpoints.getNotifyByDateUrl}/${uid}/${date}`,
    }),

    getNotificationById: builder.query({
      query: (nId: string) => `${ApiEndpoints.getUserNotificationUrl}/${nId}`,
    }),
  }),
});

export const { useGetNotificationsByDateQuery, useGetNotificationByIdQuery } = notificationApi as any;
