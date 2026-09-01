export interface NotificationModel {
  id?: number | string;
  user_id?: number | string;
  title?: string;
  body?: string;
  image?: string;
  file_id?: number | string;
  prescription_id?: number | string;
  txn_id?: number | string;
  appointment_id?: number | string;
  created_at?: string;
  updated_at?: string;
}
