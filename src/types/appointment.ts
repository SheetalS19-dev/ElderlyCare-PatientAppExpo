export interface AppointmentModel {
  id?: number | string;
  user_id?: number | string;
  patient_id?: number | string;
  family_member_id?: number | string;
  patient_f_name?: string;
  patient_l_name?: string;
  patient_phone?: string;
  patient_name?: string;
  patientName?: string;
  doct_id?: number | string;
  doctor_id?: number | string;
  doct_f_name?: string;
  doct_l_name?: string;
  doct_image?: string;
  doct_specialization?: string;
  doctor_name?: string;
  doctorName?: string;
  clinic_id?: number | string;
  clinic_name?: string;
  clinicName?: string;
  clinic_title?: string;
  dept_id?: number | string;
  dept_title?: string;
  department_name?: string;
  type?: string;
  status?: string;
  payment_status?: string;
  date?: string;
  appointment_date?: string;
  appointmentDate?: string;
  time_slots?: string;
  timeSlot?: string;
  appointment_time?: string;
  meeting_id?: string | null;
  meeting_link?: string | null;
  current_cancel_req_status?: string | null;
  source?: string;
  created_at?: string;
  updated_at?: string;
  amount?: number | string;
  average_rating?: number | string;
  number_of_reviews?: number | string;
}

export type Appointment = AppointmentModel;

export interface TimeSlotModel {
  id?: number | string;
  start_time?: string;
  end_time?: string;
  time_start?: string;
  timeStart?: string;
  time_end?: string;
  timeEnd?: string;
  time?: string;
  day?: string;
  is_booked?: boolean;
}

export interface BookedTimeSlotModel {
  id?: number | string;
  slot?: string;
  date?: string;
}

export interface CouponModel {
  id?: number | string;
  code?: string;
  discount?: number | string;
  discount_type?: string;
  type?: string;
  title?: string;
}

export interface PaymentGatewayModel {
  id?: number | string;
  name?: string;
  title?: string;
  status?: number;
}

export interface BannerModel {
  id?: number | string;
  image?: string;
  title?: string;
  link?: string;
}

export interface AppointmentCancellationModel {
  id?: number | string;
  appointment_id?: number | string;
  reason?: string;
  status?: string;
  created_at?: string;
}

export const UpcomingStatuses = [
  'pending', 'confirmed', 'rescheduled', 'scheduled',
  'Pending', 'Confirmed', 'Rescheduled', 'Scheduled',
  'PENDING', 'CONFIRMED', 'RESCHEDULED', 'SCHEDULED'
];

export const ClosedStatuses = [
  'completed', 'visited', 'rejected', 'cancelled', 'canceled',
  'Completed', 'Visited', 'Rejected', 'Cancelled', 'Canceled',
  'COMPLETED', 'VISITED', 'REJECTED', 'CANCELLED', 'CANCELED'
];
