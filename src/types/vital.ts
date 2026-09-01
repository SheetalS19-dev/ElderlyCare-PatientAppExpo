export interface VitalModel {
  id?: number | string;
  user_id?: number | string;
  family_member_id?: number | string;
  type?: string;
  vital_type?: string;
  value?: string | number;
  secondary_value?: string | number;
  bp_systolic?: string | number | null;
  bp_diastolic?: string | number | null;
  sugar_fasting?: string | number | null;
  sugar_random?: string | number | null;
  weight?: string | number | null;
  temperature?: string | number | null;
  spo2?: string | number | null;
  date?: string;
  time?: string;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}
