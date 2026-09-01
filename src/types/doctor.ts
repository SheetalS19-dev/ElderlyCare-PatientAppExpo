export interface DepartmentModel {
  id?: number | string;
  name?: string;
  title?: string;
  image?: string;
  description?: string;
  status?: number;
}

export interface DoctorModel {
  id?: number | string;
  user_id?: number | string;
  doctId?: number | string;
  name?: string;
  f_name?: string;
  l_name?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  department_id?: number | string;
  department_name?: string;
  dept_id?: number | string;
  dept_title?: string;
  dept_name?: string;
  specialization?: string;
  specialty?: string;
  categoryName?: string;
  experience?: string | number;
  ex_year?: string | number;
  qualification?: string;
  consultation_fee?: number | string;
  video_consultation_fee?: number | string;
  opd_fee?: number | string;
  video_fee?: number | string;
  emg_fee?: number | string;
  clinic_appointment?: number;
  video_appointment?: number;
  emergency_appointment?: number;
  stop_booking?: number;
  total_appointment_done?: number;
  about_us?: string;
  desc?: string;
  description?: string;
  image?: string;
  rating?: number;
  average_rating?: number;
  number_of_reviews?: number;
  clinic_id?: number | string;
  clinic_title?: string;
  clinic_name?: string;
  clinics_name?: string;
  address?: string;
  clinic_address?: string;
  clinics_address?: string;
  clinic_image?: any[];
  clinic_thumb_image?: string;
  clinic_stop_booking?: number;
  clinic_coupon_enable?: number;
  clinic_tax?: number | string;
  city_id?: number | string;
  city_title?: string;
  fb_link?: string;
  insta_link?: string;
  twitter_link?: string;
  youtube_link?: string;
}

export interface DoctorReviewModel {
  id?: number | string;
  doctor_id?: number | string;
  user_id?: number | string;
  user_name?: string;
  rating?: number;
  points?: number;
  comment?: string;
  description?: string;
  created_at?: string;
}

export type Doctor = DoctorModel;
