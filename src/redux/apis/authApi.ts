import { baseApi } from './baseApi';
import { ApiEndpoints } from '../../constants';
import { ApiResponse } from '../../interface';
import { UserModel } from '../../types';

// The backend returns login/register payloads shaped like:
// { response: 200, message: "Successfully", token: "...", data: { id, f_name, l_name, phone, ... } }
// (see UserService.loginUser / addUser + PostService.postReq in the Flutter app)
export interface AuthResult {
  response?: number;
  status?: boolean;
  message?: string;
  token?: string;
  data?: UserModel;
  id?: number | string;
}

export interface RegisterUserPayload {
  f_name: string;
  l_name: string;
  phone: string;
  isd_code: string;
  gender?: string;
  dob?: string;
  email?: string;
  [key: string]: any;
}

export const authApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    loginWithPhone: builder.mutation<AuthResult, FormData | { phone: string; password?: string }>({
      query: (body) => {
        let formData: FormData;
        if (body instanceof FormData) {
          formData = body;
        } else {
          formData = new FormData();
          formData.append('phone', body.phone);
          if (body.password) {
            formData.append('password', body.password);
          }
        }
        return {
          url: ApiEndpoints.loginPhoneUrl,
          method: 'POST',
          body: formData,
        };
      },
    }),
    registerUser: builder.mutation<AuthResult, FormData | RegisterUserPayload>({
      query: (body) => {
        let formData: FormData;
        if (body instanceof FormData) {
          formData = body;
        } else {
          formData = new FormData();
          Object.keys(body).forEach((key) => {
            if (body[key] !== undefined && body[key] !== null && body[key] !== '') {
              formData.append(key, String(body[key]));
            }
          });
        }
        return {
          url: ApiEndpoints.addUserUrl,
          method: 'POST',
          body: formData,
        };
      },
    }),
    forgetPassword: builder.mutation<AuthResult, FormData | { email: string }>({
      query: (body) => {
        let formData: FormData;
        if (body instanceof FormData) {
          formData = body;
        } else {
          formData = new FormData();
          formData.append('email', body.email);
        }
        return {
          url: ApiEndpoints.forgetPasswordUrl,
          method: 'POST',
          body: formData,
        };
      },
    }),
    getLoginScreenImages: builder.query<ApiResponse<any>, void>({
      query: () => ApiEndpoints.getLoginImageUrl,
    }),
  }),
});

export const {
  useLoginWithPhoneMutation,
  useRegisterUserMutation,
  useForgetPasswordMutation,
  useGetLoginScreenImagesQuery,
} = authApi;
