export interface ApiResponse<T = any> {
  status?: boolean | number;
  message?: string;
  data?: T;
}
