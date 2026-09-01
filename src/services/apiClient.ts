import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiEndpoints, AppConstants } from '../constants';
import { storageService } from './storageService';

export const apiClient: AxiosInstance = axios.create({
  baseURL: ApiEndpoints.baseApiUrl,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

apiClient.interceptors.request.use(
  async (config) => {
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
    // Same backend response envelope as baseApi.ts: HTTP 200 doesn't
    // guarantee logical success - check response.data.response too.
    const body: any = response.data;
    if (body && typeof body === 'object' && 'response' in body && body.response !== 200) {
      return Promise.reject(new Error(body.message || 'Something went wrong'));
    }
    return response.data;
  },
  (error) => {
    const message = error?.response?.data?.message || error.message || 'Something went wrong';
    return Promise.reject(new Error(message));
  }
);

export const getRequest = async <T = any>(url: string, params?: object): Promise<T> => {
  return apiClient.get(url, { params }) as unknown as T;
};

export const postRequest = async <T = any>(url: string, data?: object, config?: AxiosRequestConfig): Promise<T> => {
  return apiClient.post(url, data, config) as unknown as T;
};
