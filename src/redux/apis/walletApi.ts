import { ApiEndpoints } from '../../constants';
import { TxnModel } from '../../types';
import { baseApi } from './baseApi';

export interface AddWalletMoneyPayload {
  user_id: string;
  amount: string | number;
  payment_transaction_id: string;
  payment_method: string;
  transaction_type: string;
  description: string;
}

export const walletApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder: any) => ({
    getWalletTransactions: builder.query({
      query: (arg: any) => {
        const uid = typeof arg === 'string' ? arg : arg?.user_id;
        const page = typeof arg === 'object' ? arg?.page : undefined;
        const limit = typeof arg === 'object' ? arg?.limit : undefined;
        return {
          url: ApiEndpoints.getWalletByUidUrl,
          params: {
            user_id: uid,
            ...(page !== undefined ? { page, limit: limit ?? 10 } : {}),
          },
        };
      },
      transformResponse: (res: any) => {
        if (Array.isArray(res)) return res;
        if (Array.isArray(res?.data)) return res.data;
        if (Array.isArray(res?.result)) return res.result;
        return [];
      },
      providesTags: ['WalletTxn'],
    }),

    addWalletMoney: builder.mutation({
      query: (body: any) => {
        let formData: FormData;
        if (body instanceof FormData) {
          formData = body;
        } else {
          formData = new FormData();
          Object.keys(body).forEach((key) => {
            const val = body[key];
            if (val !== undefined && val !== null) {
              formData.append(key, String(val));
            }
          });
        }
        return {
          url: ApiEndpoints.addWalletMoneyUrl,
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: ['WalletTxn'],
    }),
  }),
});

export const { useGetWalletTransactionsQuery, useAddWalletMoneyMutation } = walletApi as any;

export type { TxnModel };

