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
      invalidatesTags: ['WalletTxn', 'User'],
      async onQueryStarted(arg: any, { dispatch, queryFulfilled }: any) {
        try {
          await queryFulfilled;
          if (arg && !(arg instanceof FormData) && arg.user_id) {
            const uid = String(arg.user_id);
            const syntheticTxn: TxnModel = {
              id: `temp-${Date.now()}`,
              user_id: uid,
              amount: Number(arg.amount ?? 0),
              payment_transaction_id: arg.payment_transaction_id,
              payment_method: arg.payment_method || 'Online',
              transaction_type: arg.transaction_type || arg.type || 'Credited',
              type: arg.type || arg.transaction_type || 'Credited',
              description: arg.description || 'Wallet Transaction',
              notes: arg.notes || arg.description || 'Wallet Transaction',
              is_wallet_txn: arg.is_wallet_txn ?? 1,
              created_at: new Date().toISOString(),
            } as any;

            dispatch(
              (walletApi as any).util.updateQueryData('getWalletTransactions', uid, (draft: any) => {
                const list = Array.isArray(draft)
                  ? draft
                  : Array.isArray(draft?.data)
                  ? draft.data
                  : null;
                if (list) {
                  const exists = syntheticTxn.payment_transaction_id
                    ? list.some((t: any) => t?.payment_transaction_id === syntheticTxn.payment_transaction_id)
                    : false;
                  if (!exists) {
                    list.unshift(syntheticTxn);
                  }
                }
              })
            );
          }
        } catch {
          // Failed mutation leaves cache untouched
        }
      },
    }),
  }),
});

export const { useGetWalletTransactionsQuery, useAddWalletMoneyMutation } = walletApi as any;

export type { TxnModel };

