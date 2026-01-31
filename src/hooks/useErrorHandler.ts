import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from './useToast';
import { handleError } from '@/services/error.service';
import { ApiError } from '@/lib/api-error-handler';
import { useAuth } from '@/store';

/**
 * Hook to handle errors with toast notifications
 */
export function useErrorHandler() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();

  const showError = useCallback(
    (error: any, context?: { operation?: string; page?: string }) => {
      const errorInfo = handleError(error, {
        ...context,
        userId: user?.id,
      });

      // Show error toast with translated message
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      toast.error(t(errorInfo.message as any), {
        title: t(errorInfo.title as any),
      });

      return errorInfo;
    },
    [t, toast, user?.id]
  );

  const showSuccess = useCallback(
    (message: string, title?: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      toast.success(t(message as any), title ? { title: t(title as any) } : undefined);
    },
    [t, toast]
  );

  const handleApiError = useCallback(
    async <T,>(
      operation: () => Promise<T>,
      options?: {
        onSuccess?: (data: T) => void;
        onError?: (error: ApiError) => void;
        successMessage?: string;
        errorContext?: { operation?: string; page?: string };
      }
    ): Promise<T | null> => {
      try {
        const result = await operation();

        if (options?.successMessage) {
          showSuccess(options.successMessage);
        }

        if (options?.onSuccess) {
          options.onSuccess(result);
        }

        return result;
      } catch (error) {
        showError(error, options?.errorContext);

        if (options?.onError && error instanceof ApiError) {
          options.onError(error);
        }

        return null;
      }
    },
    [showError, showSuccess]
  );

  return {
    showError,
    showSuccess,
    handleApiError,
  };
}
