/**
 * HttpApiError - Structured error class for API responses
 */
export class HttpApiError extends Error {
  public readonly status: number;
  public readonly body: ApiError;
  public readonly traceId?: string;

  constructor(status: number, body: ApiError, traceId?: string) {
    super(body.message || `HTTP ${status}: ${body.error}`);
    this.name = 'HttpApiError';
    this.status = status;
    this.body = body;
    this.traceId = traceId;
  }

  /**
   * Check if this is a validation error with field-specific errors
   */
  hasFieldErrors(): boolean {
    return !!(this.body.errors && Object.keys(this.body.errors).length > 0);
  }

  /**
   * Get field-specific validation errors
   */
  getFieldErrors(): Record<string, string> {
    return this.body.errors || {};
  }

  /**
   * Check if this is a client error (4xx)
   */
  isClientError(): boolean {
    return this.status >= 400 && this.status < 500;
  }

  /**
   * Check if this is a server error (5xx)
   */
  isServerError(): boolean {
    return this.status >= 500;
  }

  /**
   * Check if this is an authentication error
   */
  isAuthError(): boolean {
    return this.status === 401;
  }

  /**
   * Check if this is an authorization error
   */
  isForbiddenError(): boolean {
    return this.status === 403;
  }
}

export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  errors?: Record<string, string>;
  traceId?: string;
}
