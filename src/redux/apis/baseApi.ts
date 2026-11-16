import {
  BaseQueryFn,
  createApi,
  FetchArgs,
  fetchBaseQuery,
  FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import { ApiEndpoints, AppConstants } from '../../constants';
import { storageService } from '../../services/storageService';
import { formatApiUrl, logApiCall } from '../../utils/apiLogger';

const getRequestMetadata = (args: string | FetchArgs) => {
  const resolveUrl = (rawUrl: string) =>
    rawUrl.startsWith('http://') || rawUrl.startsWith('https://')
      ? rawUrl
      : `${ApiEndpoints.baseApiUrl.replace(/\/$/, '')}/${rawUrl.replace(/^\//, '')}`;

  if (typeof args === 'string') {
    return { url: resolveUrl(args), method: 'GET', payload: undefined };
  }

  return {
    url: formatApiUrl(resolveUrl(args.url), args.params as Record<string, unknown> | undefined),
    method: args.method || 'GET',
    payload: args.body,
  };
};

// Public endpoints where sending a patient Bearer token causes the backend to
// return empty lists or 403 Access denied.
const PUBLIC_NO_AUTH_ENDPOINTS = new Set(['getClinics', 'getClinicById']);

const rawBaseQuery = fetchBaseQuery({
  baseUrl: ApiEndpoints.baseApiUrl,
  timeout: 20000,
  prepareHeaders: async (headers, { getState, endpoint }) => {
    headers.set('Accept', 'application/json');
    if (endpoint && PUBLIC_NO_AUTH_ENDPOINTS.has(endpoint)) {
      return headers;
    }

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
  const startedAt = Date.now();
  const { url, method, payload } = getRequestMetadata(args);
  const result = await rawBaseQuery(args, api, extraOptions);
  const durationMs = Date.now() - startedAt;
  const httpStatus = (result.meta as any)?.response?.status;

  if (result.error) {
    const errBody: any = result.error.data;
    const message =
      (typeof errBody === 'object' && errBody?.message) ||
      (typeof errBody === 'string' && errBody) ||
      `Request failed${result.error.status ? ` (${result.error.status})` : ''}`;
    logApiCall({
      url,
      method,
      status: httpStatus ?? result.error.status,
      durationMs,
      payload,
      response: errBody,
      error: message,
      isError: true,
    });
    return {
      error: {
        ...result.error,
        data: { ...(typeof errBody === 'object' ? errBody : {}), message },
      } as FetchBaseQueryError,
    };
  }

  const body: any = result.data;
  if (body && typeof body === 'object' && 'response' in body) {
    const hasExplicitFailureStatus =
      body.status === false ||
      body.status === 0 ||
      body.status === 'false' ||
      body.status === '0' ||
      body.status === 'error' ||
      body.success === false ||
      body.success === 0 ||
      body.success === 'false' ||
      body.success === '0';

    const hasSuccessResponseCode =
      body.response === 200 ||
      body.response === 201 ||
      body.response === '200' ||
      body.response === '201' ||
      Number(body.response) === 200 ||
      Number(body.response) === 201;

    const hasSuccessStatus =
      body.status === true ||
      body.status === 200 ||
      body.status === '200' ||
      body.status === 'success' ||
      body.success === true ||
      body.success === 1 ||
      body.success === '1';

    const isSuccess = !hasExplicitFailureStatus && (hasSuccessResponseCode || hasSuccessStatus);

    if (!isSuccess) {
      if (body.message === 'Not Exists') {
        logApiCall({
          url,
          method,
          status: httpStatus ?? body.response,
          durationMs,
          payload,
          response: body,
        });
        return result;
      }
      logApiCall({
        url,
        method,
        status: httpStatus ?? body.response,
        durationMs,
        payload,
        response: body,
        error: body.message || 'Something went wrong',
        isError: true,
      });
      return {
        error: {
          status: 'CUSTOM_ERROR',
          error: body.message || 'Something went wrong',
          data: {
            ...(typeof body === 'object' ? body : {}),
            message: body.message || 'Something went wrong',
          },
        } as FetchBaseQueryError,
      };
    }
  }

  logApiCall({
    url,
    method,
    status: httpStatus ?? body?.response ?? 200,
    durationMs,
    payload,
    response: body,
  });

  return result;
};

export const baseApi = createApi({
  reducerPath: 'baseApi',
  baseQuery: baseQueryWithEnvelope,
  tagTypes: [
    'User',
    'Doctor',
    'Clinic',
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
    'CancellationHistory',
  ],
  endpoints: () => ({}),
});
