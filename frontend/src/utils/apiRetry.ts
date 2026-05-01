import { AxiosError, AxiosRequestConfig } from 'axios';

interface RetryConfig {
  maxRetries?: number;
  retryDelay?: number;
  retryableStatuses?: number[];
}

const DEFAULT_CONFIG: Required<RetryConfig> = {
  maxRetries: 3,
  retryDelay: 1000,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
};

export class ApiRetry {
  static async executeWithRetry<T>(
    apiCall: () => Promise<T>,
    config: RetryConfig = {}
  ): Promise<T> {
    const { maxRetries, retryDelay, retryableStatuses } = {
      ...DEFAULT_CONFIG,
      ...config,
    };

    let lastError: any;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await apiCall();
      } catch (error: any) {
        lastError = error;

        const isRetryable = this.isRetryableError(error, retryableStatuses);
        const isLastAttempt = attempt === maxRetries;

        if (!isRetryable || isLastAttempt) {
          throw error;
        }

        await this.delay(retryDelay * Math.pow(2, attempt));
      }
    }

    throw lastError;
  }

  private static isRetryableError(error: any, retryableStatuses: number[]): boolean {
    if (!error.response) {
      return true; // Network errors are retryable
    }

    return retryableStatuses.includes(error.response.status);
  }

  private static delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
