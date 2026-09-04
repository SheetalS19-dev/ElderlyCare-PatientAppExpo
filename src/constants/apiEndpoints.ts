// API Endpoints converted from Flutter api_content.dart

const WEB_API_URL = 'https://new.elderlycare.life';
const BASE_API_URL = `${WEB_API_URL}/api/v1`;

export const ApiEndpoints = {
  webApiUrl: WEB_API_URL,
  baseApiUrl: BASE_API_URL,
  imageUrl: `${WEB_API_URL}/api/public/storage`,
  prescriptionUrl: `${BASE_API_URL}/prescription/generatePDF`,
  invoiceUrl: `${BASE_API_URL}/invoice/generatePDF`,

  // Doctors
  getDoctorsUrl: `${BASE_API_URL}/get_doctor`,

  // Review
  addDoctorsReviewUrl: `${BASE_API_URL}/add_doctor_review`,
  getDoctorReviewUrl: `${BASE_API_URL}/get_all_doctor_review`,

  // Time Slots
  getTimeSlotsUrl: `${BASE_API_URL}/get_doctor_time_interval`,
  getVideoTimeSlotsUrl: `${BASE_API_URL}/get_doctor_video_time_interval`,
  getBookedTimeSlotsUrl: `${BASE_API_URL}/get_booked_time_slots`,

  // Patients
  getPatientsUrl: `${BASE_API_URL}/get_patients`,
  addPatientsUrl: `${BASE_API_URL}/add_patient`,

  // Appointment
  addAppUrl: `${BASE_API_URL}/add_appointment`,
  getAppByUIDUrl: `${BASE_API_URL}/get_appointments`,
  getAppByIDUrl: `${BASE_API_URL}/get_appointment`,

  // Appointment Cancellation
  appointmentCancellationUrl: `${BASE_API_URL}/appointment_cancellation`,
  deleteAppointmentCancellationUrl: `${BASE_API_URL}/delete_appointment_cancellation`,
  getAppointmentCancellationUrlByAppId: `${BASE_API_URL}/get_appointment_cancel_req/appointment`,

  // Invoice
  getInvoiceByAppIdUrl: `${BASE_API_URL}/get_invoice/appointment`,

  // Department
  getDepartmentUrl: `${BASE_API_URL}/get_department_active`,

  // Transaction
  getWalletByUidUrl: `${BASE_API_URL}/get_all_transaction`,
  addWalletMoneyUrl: `${BASE_API_URL}/add_wallet_money`,

  // Prescription
  getPrescription: `${BASE_API_URL}/get_prescription`,
  getPrescriptionByAppIdUrl: `${BASE_API_URL}/get_prescription`,

  // Family Member
  getFamilyMembersByUIDUrl: `${BASE_API_URL}/get_family_members/user`,
  addFamilyMemberUrl: `${BASE_API_URL}/add_family_member`,
  deleteFamilyMemberUrl: `${BASE_API_URL}/delete_family_member`,
  updateFamilyMemberUrl: `${BASE_API_URL}/update_family_member`,

  // Login Screen
  getLoginImageUrl: `${BASE_API_URL}/get_login_screen_images`,

  // User
  getUserUrl: `${BASE_API_URL}/get_user`,
  addUserUrl: `${BASE_API_URL}/add_user`,
  updateUserUrl: `${BASE_API_URL}/update_user`,
  useSoftDeleteUrl: `${BASE_API_URL}/user_soft_delete`,

  // Login
  loginPhoneUrl: `${BASE_API_URL}/patient_login`,
  loginOutUrl: `${BASE_API_URL}/logout`,
  forgetPasswordUrl: `${BASE_API_URL}/forget_password`,

  // WebPage
  getWebApiUrl: `${BASE_API_URL}/get_web_page/page`,
  getFaqUrl: `${WEB_API_URL}/page/faq`,

  // Testimonial
  getTestimonialApiUrl: `${BASE_API_URL}/get_testimonial`,

  // Configurations
  getConfigByIdNameApiUrl: `${BASE_API_URL}/get_configurations/id_name`,
  getConfigByGroupNameApiUrl: `${BASE_API_URL}/get_configurations/group_name`,

  // Social Media
  getSocialMediaApiUrl: `${BASE_API_URL}/get_social_media`,

  // Notification
  getNotifyByDateUrl: `${BASE_API_URL}/get_user_notification/date`,
  getUserNotificationUrl: `${BASE_API_URL}/get_user_notification`,

  // Notification Seen
  usersNotificationSeenStatusUrl: `${BASE_API_URL}/users_notification_seen_status`,

  // Vitals
  getVitalsByFamilyID: `${BASE_API_URL}/get_vitals_family_member_id_type`,
  addVitalsId: `${BASE_API_URL}/add_vitals`,
  deleteVitalsUrl: `${BASE_API_URL}/delete_vitals`,
  updateVitalsUrl: `${BASE_API_URL}/update_vitals`,

  // Coupon
  getValidateUrl: `${BASE_API_URL}/get_validate`,

  // Checkin
  getAppointmentCheckInUserUrl: `${BASE_API_URL}/get_appointment_check_in`,

  // Razorpay
  createRzOrderUrl: `${BASE_API_URL}/create_rz_order`,

  // Payment Gateway
  getPaymentGatewayActiveUrl: `${BASE_API_URL}/get_payment_gateway_active`,

  // Stripe
  createStripeIntentUrl: `${BASE_API_URL}/create_intent`,

  // Files
  getPatientFileUrl: `${BASE_API_URL}/get_patient_file`,

  // Clinic
  getClinicUrl: `${BASE_API_URL}/get_clinic_page`,
  getClinicByIdUrl: `${BASE_API_URL}/get_clinic`,

  // City
  getCityUrl: `${BASE_API_URL}/get_city`,
  getLocationUrl: `${BASE_API_URL}/get_current_city`,

  // Banner & Blogs
  getBannerUrl: `${BASE_API_URL}/get_banner`,
  getBlogsUrl: `${BASE_API_URL}/latest_blogs`,
  getLatestBlogsUrl: `${BASE_API_URL}/latest_blogs`,
  getBlogSearchUrl: `${BASE_API_URL}/blog_search`,
  getBlogCategoriesUrl: `${BASE_API_URL}/get_blog_categories`,
  getBlogTagsUrl: `${BASE_API_URL}/tags`,
  getBlogDetailUrl: `${BASE_API_URL}/get_blog`,
  getBlogCommentsUrl: `${BASE_API_URL}/blog_comments`,
  saveBlogCommentUrl: `${BASE_API_URL}/save_blog_comment`,
  getDoctorsByDeptAndCityUrl: `${BASE_API_URL}/get_doctor`,
  getPatientFilesUrl: `${BASE_API_URL}/get_patient_file`,
  getPrescriptionsUrl: `${BASE_API_URL}/get_prescription`,
  getVitalsByFamilyIDUrl: `${BASE_API_URL}/get_vitals_family_member_id_type`,
  addVitalsUrl: `${BASE_API_URL}/add_vitals`,
} as const;
