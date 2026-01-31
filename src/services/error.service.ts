import { logger } from './logger.service';
import { ApiError, parseSupabaseError } from '@/lib/api-error-handler';

/**
 * Error Service
 * Centralized error handling and user-friendly error messages
 */

export interface ErrorInfo {
  title: string;
  message: string;
  isNetworkError: boolean;
  canRetry: boolean;
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: any): boolean {
  return (
    !navigator.onLine ||
    error instanceof TypeError ||
    error?.message?.toLowerCase().includes('network') ||
    error?.message?.toLowerCase().includes('fetch') ||
    error?.code === 'NETWORK_ERROR'
  );
}

/**
 * Get user-friendly error information
 */
export function getErrorInfo(error: any): ErrorInfo {
  // ApiError (from our error handler)
  if (error instanceof ApiError) {
    return {
      title: 'errors.title',
      message: error.userMessage,
      isNetworkError: error.code === 'NETWORK_ERROR',
      canRetry: error.shouldRetry,
    };
  }

  // Network errors
  if (isNetworkError(error)) {
    return {
      title: 'errors.network.title',
      message: 'errors.network.offline',
      isNetworkError: true,
      canRetry: true,
    };
  }

  // Supabase errors
  if (error?.code || error?.message) {
    const errorDetails = parseSupabaseError(error);
    return {
      title: 'errors.title',
      message: errorDetails.userMessage,
      isNetworkError: false,
      canRetry: errorDetails.shouldRetry,
    };
  }

  // Validation errors (from zod or form validation)
  if (error?.name === 'ZodError' || error?.errors) {
    return {
      title: 'errors.validation.title',
      message: 'errors.validation.invalid',
      isNetworkError: false,
      canRetry: false,
    };
  }

  // Default error
  return {
    title: 'errors.title',
    message: 'errors.unknown',
    isNetworkError: false,
    canRetry: false,
  };
}

/**
 * Handle and log error
 */
export function handleError(
  error: any,
  context?: {
    operation?: string;
    userId?: string;
    page?: string;
  }
): ErrorInfo {
  const errorInfo = getErrorInfo(error);

  // Log the error
  logger.error(
    `Error occurred: ${context?.operation || 'Unknown operation'}`,
    error instanceof Error ? error : new Error(String(error)),
    {
      userId: context?.userId,
      page: context?.page,
      isNetworkError: errorInfo.isNetworkError,
    }
  );

  return errorInfo;
}

/**
 * Format error for display
 */
export function formatErrorMessage(error: any): string {
  const errorInfo = getErrorInfo(error);
  return errorInfo.message;
}
