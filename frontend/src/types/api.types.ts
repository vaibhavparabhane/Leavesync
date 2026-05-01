// API response types

export interface ApiError {
  message: string;
  status_code: number;
  errors?: Record<string, string[]>;
}

export interface ApiSuccessResponse<T = any> {
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  error: string;
  message: string;
}
