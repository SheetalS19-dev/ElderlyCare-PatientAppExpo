import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiEndpoints, AppConstants } from '../constants';
import { formatApiUrl, logApiCall } from '../utils/apiLogger';
import { storageService } from './storageService';

export const apiClient: AxiosInstance = axios.create({
  baseURL: ApiEndpoints.baseApiUrl,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

const resolveAxiosFullUrl = (config?: AxiosRequestConfig): string => {
  const rawUrl = config?.url || '';
  const base = config?.baseURL || ApiEndpoints.baseApiUrl;
  const full =
    rawUrl.startsWith('http://') || rawUrl.startsWith('https://')
      ? rawUrl
      : `${base.replace(/\/$/, '')}/${rawUrl.replace(/^\//, '')}`;
  return formatApiUrl(full, config?.params as Record<string, unknown> | undefined);
};

apiClient.interceptors.request.use(
  async (config) => {
    (config as any)._startedAt = Date.now();
    const token = await storageService.getItem<string>(AppConstants.storageKeys.token);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    const startedAt = (response.config as any)?._startedAt;
    const durationMs = typeof startedAt === 'number' ? Date.now() - startedAt : undefined;
    const fullUrl = resolveAxiosFullUrl(response.config);
    const method = (response.config?.method || 'GET').toUpperCase();

    // Same backend response envelope as baseApi.ts: HTTP 200 doesn't
    // guarantee logical success - check both response code and status flags.
    const body: any = response.data;
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

      const isSuccess =
        !hasExplicitFailureStatus &&
        (body.response === 200 ||
          body.response === 201 ||
          body.response === '200' ||
          body.response === '201' ||
          Number(body.response) === 200 ||
          Number(body.response) === 201 ||
          body.status === true ||
          body.status === 200 ||
          body.status === '200' ||
          body.status === 'success' ||
          body.success === true ||
          body.success === 1);
      if (!isSuccess) {
        logApiCall({
          url: fullUrl,
          method,
          status: response.status ?? body.response,
          durationMs,
          payload: response.config?.data,
          response: body,
          error: body.message || 'Something went wrong',
          isError: true,
        });
        return Promise.reject(new Error(body.message || 'Something went wrong'));
      }
    }

    logApiCall({
      url: fullUrl,
      method,
      status: response.status ?? body?.response ?? 200,
      durationMs,
      payload: response.config?.data,
      response: body,
    });
    return response.data;
  },
  (error) => {
    const startedAt = (error?.config as any)?._startedAt;
    const durationMs = typeof startedAt === 'number' ? Date.now() - startedAt : undefined;
    const fullUrl = resolveAxiosFullUrl(error?.config);
    const method = (error?.config?.method || 'GET').toUpperCase();
    const message = error?.response?.data?.message || error.message || 'Something went wrong';
    logApiCall({
      url: fullUrl,
      method,
      status: error?.response?.status,
      durationMs,
      payload: error?.config?.data,
      response: error?.response?.data,
      error: message,
      isError: true,
    });
    return Promise.reject(new Error(message));
  }
);

export const getRequest = async <T = any>(url: string, params?: object): Promise<T> => {
  return apiClient.get(url, { params }) as unknown as T;
};

export const postRequest = async <T = any>(url: string, data?: object, config?: AxiosRequestConfig): Promise<T> => {
  return apiClient.post(url, data, config) as unknown as T;
};
