import { AxiosError } from 'axios';

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

export class ApiErrorHandler {
  static getErrorMessage(error: unknown): string {
    if (error instanceof AxiosError) {
      return error.response?.data?.message || error.message || 'An error occurred';
    }
    
    if (error instanceof Error) {
      return error.message;
    }
    
    return 'An unknown error occurred';
  }

  static handle(error: unknown): ApiError {
    if (error instanceof AxiosError) {
      return {
        message: error.response?.data?.message || error.message || 'An error occurred',
        status: error.response?.status,
        code: error.code,
      };
    }
    
    if (error instanceof Error) {
      return {
        message: error.message,
      };
    }
    
    return {
      message: 'An unknown error occurred',
    };
  }

  static isNetworkError(error: unknown): boolean {
    return error instanceof AxiosError && !error.response;
  }

  static isAuthError(error: unknown): boolean {
    return error instanceof AxiosError && error.response?.status === 401;
  }

  static isValidationError(error: unknown): boolean {
    return error instanceof AxiosError && error.response?.status === 400;
  }
}
