/**
 * Global Error Handler - Centralized error handling for the application
 */
import { HttpApiError } from './HttpApiError';

export interface ErrorHandlerConfig {
  showToast?: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  showModal?: (title: string, message: string, traceId?: string) => void;
  redirectToLogin?: () => void;
  redirectToAccessDenied?: () => void;
  setFieldErrors?: (errors: Record<string, string>) => void;
  isDevMode?: boolean;
  isAdmin?: boolean;
}

class GlobalErrorHandler {
  private config: ErrorHandlerConfig = {};

  /**
   * Initialize the error handler with configuration
   */
  init(config: ErrorHandlerConfig) {
    this.config = { ...this.config, ...config };
  }

  /**
   * Handle API errors with appropriate UI responses
   */
  handleApiError(error: unknown, context?: string): void {
    console.error(`API Error${context ? ` in ${context}` : ''}:`, error);

    if (error instanceof HttpApiError) {
      this.handleHttpApiError(error);
    } else if (error instanceof Error) {
      this.handleGenericError(error);
    } else {
      this.handleUnknownError(error);
    }
  }

  /**
   * Handle HttpApiError with specific status code responses
   */
  private handleHttpApiError(error: HttpApiError): void {
    // 401 - Authentication required
    if (error.isAuthError()) {
      this.config.redirectToLogin?.();
      return;
    }

    // 403 - Access denied
    if (error.isForbiddenError()) {
      this.config.showModal?.(
        'Access Denied',
        'You do not have permission to access this resource. Please contact your administrator if you believe this is an error.',
        error.traceId
      );
      this.config.redirectToAccessDenied?.();
      return;
    }

    // 400 - Validation errors (field-level)
    if (error.status === 400 && error.hasFieldErrors()) {
      this.config.setFieldErrors?.(error.getFieldErrors());
      this.config.showToast?.('Please correct the errors below', 'error');
      return;
    }

    // 400 - General validation errors (no field errors)
    if (error.status === 400) {
      this.config.showToast?.(error.body.message || 'Invalid input', 'error');
      return;
    }

    // 422 - Validation errors (field-level)
    if (error.status === 422 && error.hasFieldErrors()) {
      this.config.setFieldErrors?.(error.getFieldErrors());
      this.config.showToast?.('Please correct the errors below', 'error');
      return;
    }

    // 500+ - Server errors
    if (error.isServerError()) {
      const message = error.traceId 
        ? `Something went wrong. If you need help, give support this Trace ID: ${error.traceId}`
        : 'Something went wrong. Please try again later.';
      
      this.config.showModal?.('Server Error', message, error.traceId);
      return;
    }

    // Other client errors (4xx)
    if (error.isClientError()) {
      this.config.showToast?.(error.body.message, 'error');
      return;
    }

    // Fallback for any other HttpApiError
    this.config.showToast?.(error.body.message || 'An error occurred', 'error');
  }

  /**
   * Handle generic JavaScript errors
   */
  private handleGenericError(error: Error): void {
    this.config.showToast?.(error.message || 'An unexpected error occurred', 'error');
  }

  /**
   * Handle unknown error types
   */
  private handleUnknownError(error: unknown): void {
    const message = typeof error === 'string' ? error : 'An unknown error occurred';
    this.config.showToast?.(message, 'error');
  }

  /**
   * Show developer diagnostics (admin/dev only)
   */
  showDeveloperDiagnostics(error: HttpApiError): void {
    if (!this.config.isDevMode && !this.config.isAdmin) {
      return;
    }

    const diagnostics = {
      status: error.status,
      message: error.body.message,
      timestamp: error.body.timestamp,
      traceId: error.traceId,
      fieldErrors: error.getFieldErrors()
    };

    console.group('🔍 Developer Diagnostics');
    console.log('Full Error Object:', error);
    console.log('Diagnostics:', diagnostics);
    console.log('Copy Trace ID:', error.traceId || 'No trace ID available');
    console.groupEnd();

    // In a real app, you might show a developer panel here
    if (this.config.isDevMode) {
      this.config.showModal?.(
        'Developer Diagnostics',
        `Status: ${error.status}\nMessage: ${error.body.message}\nTrace ID: ${error.traceId || 'N/A'}`,
        error.traceId
      );
    }
  }
}

export const errorHandler = new GlobalErrorHandler();
