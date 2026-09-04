import {
  BaseQueryFn,
  createApi,
  FetchArgs,
  fetchBaseQuery,
  FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import { ApiEndpoints, AppConstants } from '../../constants';
import { storageService } from '../../services/storageService';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: ApiEndpoints.baseApiUrl,
  prepareHeaders: async (headers, { getState }) => {
    const state: any = getState();
    const user = state?.auth?.user;
    let token =
      state?.auth?.token ||
      user?.token ||
      user?.api_token ||
      user?.auth_token ||
      (await storageService.getItem<string>(AppConstants.storageKeys.token)) ||
      (user?.id ? String(user.id) : undefined);

    if (token) {
      const cleanToken = typeof token === 'string' ? token.trim() : String(token);
      if (cleanToken.toLowerCase().startsWith('bearer ')) {
        headers.set('Authorization', cleanToken);
      } else {
        headers.set('Authorization', `Bearer ${cleanToken}`);
      }
    }
    headers.set('Accept', 'application/json');
    return headers;
  },
});

/**
 * The backend always answers with HTTP 200 but embeds its own success/failure
 * flag in the body, e.g. `{ response: 200, data: {...} }` on success or
 * `{ response: 201, message: "..." }` on a logical failure (mirrors the
 * Flutter app's PostService/GetService helpers, which check `jsonData['response']`
 * instead of trusting the HTTP status code alone).
 *
 * fetchBaseQuery only looks at the HTTP status, so without this wrapper a
 * "logical" backend error (response !== 200) would silently look like a
 * success to RTK Query - it would come back as normal `data`, not `error`,
 * and screens like LoginScreen would just fall through to a generic
 * "Something went wrong" instead of showing the real reason, or would treat
 * a failed call as successful.
 *
 * This also normalizes actual HTTP-level errors (4xx/5xx) so every screen
 * can reliably read `error.data.message`.
 */
const baseQueryWithEnvelope: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  const result = await rawBaseQuery(args, api, extraOptions);

  if (result.error) {
    const errBody: any = result.error.data;
    const message =
      (typeof errBody === 'object' && errBody?.message) ||
      (typeof errBody === 'string' && errBody) ||
      `Request failed${result.error.status ? ` (${result.error.status})` : ''}`;
    return {
      error: {
        ...result.error,
        data: { ...(typeof errBody === 'object' ? errBody : {}), message },
      } as FetchBaseQueryError,
    };
  }

  const body: any = result.data;
  if (body && typeof body === 'object' && 'response' in body && body.response !== 200) {
    if (body.message === 'Not Exists') {
      return result;
    }
    return {
      error: {
        status: 'CUSTOM_ERROR',
        error: body.message || 'Something went wrong',
        data: { message: body.message || 'Something went wrong' },
      } as FetchBaseQueryError,
    };
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: 'baseApi',
  baseQuery: baseQueryWithEnvelope,
  tagTypes: [
    'User',
    'Doctor',
    'FamilyMember',
    'Appointment',
    'WalletTxn',
    'Prescription',
    'PatientFiles',
    'Vitals',
    'Blog',
    'BlogCategory',
    'BlogTag',
    'BlogComment',
  ],
  endpoints: () => ({}),
});
