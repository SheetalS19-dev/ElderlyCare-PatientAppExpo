export interface ClinicModel {
  id?: number | string;
  name?: string;
  title?: string;
  address?: string;
  city_id?: number | string;
  city_name?: string;
  city_title?: string;
  phone?: string;
  image?: string;
  description?: string;
  pincode?: string;
  latitude?: string | number;
  longitude?: string | number;
  ambulance_btn_enable?: number | boolean;
  ambulance_number?: string;
  opening_hours?: string;
  whatsapp?: string;
  email?: string;
}

export interface CityModel {
  id?: number | string;
  name?: string;
  title?: string;
  state_title?: string;
  status?: number;
}
