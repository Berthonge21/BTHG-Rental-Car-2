import { AxiosError } from 'axios';

export interface ApiErrorData {
  message: string | string[];
  error?: string;
  statusCode: number;
}

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly errors: string[];
  public readonly originalError?: AxiosError;

  constructor(
    message: string,
    statusCode: number,
    errors: string[] = [],
    originalError?: AxiosError
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errors = errors;
    this.originalError = originalError;
  }

  static fromAxiosError(error: AxiosError<ApiErrorData>): ApiError {
    const data = error.response?.data;
    const statusCode = error.response?.status || 500;

    let message = 'An unexpected error occurred';
    let errors: string[] = [];

    if (data) {
      if (Array.isArray(data.message)) {
        message = data.message[0] || message;
        errors = data.message;
      } else if (typeof data.message === 'string') {
        message = data.message;
        errors = [data.message];
      }
    } else if (error.message) {
      message = error.message;
    }

    return new ApiError(message, statusCode, errors, error);
  }

  get isUnauthorized(): boolean {
    return this.statusCode === 401;
  }

  get isForbidden(): boolean {
    return this.statusCode === 403;
  }

  get isNotFound(): boolean {
    return this.statusCode === 404;
  }

  get isValidationError(): boolean {
    return this.statusCode === 400;
  }

  get isServerError(): boolean {
    return this.statusCode >= 500;
  }
}

export class NetworkError extends Error {
  constructor(message: string = 'Network error occurred') {
    super(message);
    this.name = 'NetworkError';
  }
}
