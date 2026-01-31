import { PostgrestError } from '@supabase/supabase-js';
import { logger } from '@/services/logger.service';
import { supabase } from '@/lib/supabase';

/**
 * API Error Handler
 * Centralizes error handling for Supabase API calls
 */

export interface ApiErrorDetails {
  message: string;
  code?: string;
  userMessage: string;
  shouldRetry: boolean;
  statusCode?: number;
}

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  code?: string;
  userMessage: string;
  shouldRetry: boolean;
  statusCode?: number;

  constructor(details: ApiErrorDetails) {
    super(details.message);
    this.name = 'ApiError';
    this.code = details.code;
    this.userMessage = details.userMessage;
    this.shouldRetry = details.shouldRetry;
    this.statusCode = details.statusCode;
  }
}

/**
 * Network error detection
 */
export function isNetworkError(error: any): boolean {
  return (
    !navigator.onLine ||
    error?.message?.toLowerCase().includes('network') ||
    error?.message?.toLowerCase().includes('fetch') ||
    error?.code === 'NETWORK_ERROR'
  );
}

/**
 * Parse Supabase/Postgres error into user-friendly message
 */
export function parseSupabaseError(error: PostgrestError | any): ApiErrorDetails {
  // Network/Offline errors
  if (isNetworkError(error)) {
    return {
      message: error.message || 'Network error',
      code: 'NETWORK_ERROR',
      userMessage: 'errors.network.offline',
      shouldRetry: true,
      statusCode: 0,
    };
  }

  // Supabase PostgrestError
  if (error?.code) {
    const code = error.code;

    // Common Postgres/Supabase error codes
    switch (code) {
      case 'PGRST116':
        // No rows returned (not found)
        return {
          message: error.message,
          code,
          userMessage: 'errors.notFound',
          shouldRetry: false,
          statusCode: 404,
        };

      case 'PGRST301':
        // Unauthorized
        return {
          message: error.message,
          code,
          userMessage: 'errors.unauthorized',
          shouldRetry: false,
          statusCode: 401,
        };

      case '23505':
        // Unique constraint violation
        return {
          message: error.message,
          code,
          userMessage: 'errors.duplicate',
          shouldRetry: false,
          statusCode: 409,
        };

      case '23503':
        // Foreign key violation
        return {
          message: error.message,
          code,
          userMessage: 'errors.invalidReference',
          shouldRetry: false,
          statusCode: 400,
        };

      case '23502':
        // Not null violation
        return {
          message: error.message,
          code,
          userMessage: 'errors.validation.required',
          shouldRetry: false,
          statusCode: 400,
        };

      case '42501':
        // Insufficient privileges
        return {
          message: error.message,
          code,
          userMessage: 'errors.forbidden',
          shouldRetry: false,
          statusCode: 403,
        };

      case 'PGRST204':
        // Success but no content
        return {
          message: 'No content returned',
          code,
          userMessage: 'errors.noContent',
          shouldRetry: false,
          statusCode: 204,
        };

      default:
        // Unknown database error
        return {
          message: error.message,
          code,
          userMessage: 'errors.database',
          shouldRetry: false,
          statusCode: 500,
        };
    }
  }

  // Rate limiting (429)
  if (error?.statusCode === 429 || error?.status === 429) {
    return {
      message: error.message || 'Too many requests',
      code: 'RATE_LIMIT',
      userMessage: 'errors.rateLimit',
      shouldRetry: true,
      statusCode: 429,
    };
  }

  // Default error
  return {
    message: error?.message || 'Unknown error occurred',
    code: 'UNKNOWN',
    userMessage: 'errors.unknown',
    shouldRetry: false,
    statusCode: 500,
  };
}

/**
 * Refresh session if it's expired
 */
export async function refreshSessionIfNeeded(error: any): Promise<boolean> {
  if (error?.statusCode === 401 || error?.code === 'PGRST301') {
    try {
      const { data, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError || !data.session) {
        logger.warn('Session refresh failed', { error: refreshError?.message });
        return false;
      }
      logger.info('Session refreshed successfully');
      return true;
    } catch (err) {
      logger.error('Error refreshing session', err as Error);
      return false;
    }
  }
  return false;
}

/**
 * Retry logic for transient failures
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: any;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const errorDetails = parseSupabaseError(error);

      // Don't retry if error is not retryable
      if (!errorDetails.shouldRetry) {
        throw new ApiError(errorDetails);
      }

      // Try to refresh session on 401
      if (errorDetails.statusCode === 401) {
        const refreshed = await refreshSessionIfNeeded(error);
        if (refreshed && attempt < maxRetries - 1) {
          continue; // Try again with refreshed session
        }
      }

      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries - 1) {
        const delay = delayMs * Math.pow(2, attempt);
        logger.info(`Retrying operation (attempt ${attempt + 1}/${maxRetries}) after ${delay}ms`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  // All retries failed
  const errorDetails = parseSupabaseError(lastError);
  throw new ApiError(errorDetails);
}

/**
 * Wrapper for API calls with error handling
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context?: {
    operation: string;
    userId?: string;
    retry?: boolean;
  }
): Promise<T> {
  try {
    logger.debug(`API call started: ${context?.operation || 'unknown'}`, {
      userId: context?.userId,
    });

    const result = context?.retry
      ? await retryOperation(operation)
      : await operation();

    logger.debug(`API call succeeded: ${context?.operation || 'unknown'}`, {
      userId: context?.userId,
    });

    return result;
  } catch (error) {
    const errorDetails = parseSupabaseError(error);

    logger.error(
      `API call failed: ${context?.operation || 'unknown'}`,
      error as Error,
      {
        userId: context?.userId,
        code: errorDetails.code,
        statusCode: errorDetails.statusCode,
      }
    );

    throw new ApiError(errorDetails);
  }
}
