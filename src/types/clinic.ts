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
  state_id?: number | string;
  state_title?: string;
  default_city?: string | number;
  active?: number;
  status?: number;
}

export interface StateModel {
  id: number | string;
  title: string;
  country_id?: number | string;
  country_title?: string;
  active?: number;
}

export interface PostalCodeModel {
  id: number | string;
  city_id?: number | string;
  postal_code: string | number;
  area?: string;
  city_title?: string;
  state_title?: string;
  active?: number;
}
