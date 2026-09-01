// Field names match the raw API response (see Flutter user_model.dart /
// family_members_model.dart)

export interface UserModel {
  id?: number | string;
  clinic_id?: number | string | null;
  wallet_amount?: number | string;
  wallet_balance?: number | string;
  f_name?: string;
  l_name?: string;
  phone?: string;
  isd_code?: string;
  gender?: string;
  dob?: string;
  email?: string;
  image?: string;
  image_url?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: number | string;
  isd_code_sec?: string | null;
  phone_sec?: string | null;
  email_verified_at?: string | null;
  marital_status?: string;
  occupation?: string;
  blood_group?: string;
  fcm?: string;
  web_fcm?: string | null;
  remember_token?: string | null;
  notification_seen_at?: string | null;
  created_at?: string;
  updated_at?: string;
  is_deleted?: number;
  deleted_at?: string | null;
  role_id?: number | string | null;
  role_assign_id?: number | string | null;
  role_name?: string | null;
}

export interface FamilyMemberModel {
  id?: number | string;
  user_id?: number | string;
  f_name?: string;
  l_name?: string;
  name?: string;
  phone?: string;
  gender?: string;
  dob?: string;
  isd_code?: string;
  relationship?: string;
}

export const getUserFullName = (user?: Pick<UserModel, 'f_name' | 'l_name'> | null): string => {
  if (!user) return '';
  return `${user.f_name ?? ''} ${user.l_name ?? ''}`.trim();
};

export interface TxnModel {
  id?: number | string;
  user_id?: number | string;
  clinic_id?: number | string | null;
  patient_id?: number | string | null;
  appointment_id?: number | string | null;
  payment_transaction_id?: string;
  transaction_id?: string;
  amount?: number | string;
  transaction_type?: 'Credited' | 'Debited' | string;
  type?: string;
  description?: string;
  is_wallet_txn?: number;

  last_wallet_amount?: number | string;
  new_wallet_amount?: number | string;
  notes?: string | null;
  note?: string;
  created_at?: string;
  updated_at?: string;
  patient_f_name?: string | null;
  patient_l_name?: string | null;
  user_f_name?: string;
  user_l_name?: string;
  doct_id?: number | string | null;
  payment_method?: string;
}
