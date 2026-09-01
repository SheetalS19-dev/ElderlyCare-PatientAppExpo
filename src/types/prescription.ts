export interface PrescriptionModel {
  id?: number | string;
  appointment_id?: number | string;
  clinic_id?: number | string;
  doct_id?: number | string;
  patient_id?: number | string;
  prescription?: string;
  pdf_file_url?: string;
  doctor_f_name?: string;
  doctor_l_name?: string;
  patient_f_name?: string;
  patient_l_name?: string;
  created_at?: string;
  updated_at?: string;
}
