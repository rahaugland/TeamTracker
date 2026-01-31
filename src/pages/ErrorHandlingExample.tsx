import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/useToast';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { logger } from '@/services/logger.service';
import { ApiError } from '@/lib/api-error-handler';

/**
 * Example page demonstrating error handling and logging features
 * This file can be removed in production - it's for demonstration only
 */
export function ErrorHandlingExample() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { handleApiError, showSuccess, showError } = useErrorHandler();
  const { isOnline, isOffline } = useOfflineStatus();
  const [simulatedError, setSimulatedError] = useState<string>('');

  // Example 1: Direct toast usage
  const handleToastExample = () => {
    toast.success('This is a success message!');
  };

  const handleToastError = () => {
    toast.error('This is an error message', {
      title: 'Error Title',
    });
  };

  const handleToastWarning = () => {
    toast.warning('This is a warning message');
  };

  const handleToastInfo = () => {
    toast.info('This is an info message');
  };

  // Example 2: Simulated API call with error
  const simulateApiCall = async (shouldFail: boolean = false) => {
    return new Promise<string>((resolve, reject) => {
      setTimeout(() => {
        if (shouldFail) {
          reject(
            new ApiError({
              message: 'API call failed',
              code: 'NETWORK_ERROR',
              userMessage: 'errors.network.failed',
              shouldRetry: true,
            })
          );
        } else {
          resolve('API call succeeded!');
        }
      }, 1000);
    });
  };

  // Example 3: Using handleApiError
  const handleApiCallSuccess = async () => {
    await handleApiError(() => simulateApiCall(false), {
      successMessage: 'common.messages.saved',
      errorContext: {
        operation: 'simulateSuccess',
        page: 'ErrorHandlingExample',
      },
    });
  };

  const handleApiCallError = async () => {
    await handleApiError(() => simulateApiCall(true), {
      errorContext: {
        operation: 'simulateError',
        page: 'ErrorHandlingExample',
      },
    });
  };

  // Example 4: Manual error handling
  const handleManualError = async () => {
    try {
      await simulateApiCall(true);
      showSuccess('Operation completed');
    } catch (error) {
      showError(error, {
        operation: 'manualErrorTest',
        page: 'ErrorHandlingExample',
      });
    }
  };

  // Example 5: Logging examples
  const handleLoggingExample = () => {
    logger.debug('This is a debug message', {
      page: 'ErrorHandlingExample',
      action: 'loggingTest',
    });

    logger.info('This is an info message', {
      page: 'ErrorHandlingExample',
      data: { count: 5 },
    });

    logger.warn('This is a warning message', {
      page: 'ErrorHandlingExample',
      reason: 'test',
    });

    logger.error(
      'This is an error message',
      new Error('Test error'),
      {
        page: 'ErrorHandlingExample',
      }
    );

    toast.info('Check browser console for log messages');
  };

  // Example 6: Throw error to test Error Boundary
  const handleThrowError = () => {
    throw new Error('This error will be caught by Error Boundary');
  };

  // Example 7: Simulate different error types
  const handleSimulateError = async (errorType: string) => {
    setSimulatedError(errorType);

    const errorMap: Record<string, ApiError> = {
      network: new ApiError({
        message: 'Network error',
        code: 'NETWORK_ERROR',
        userMessage: 'errors.network.offline',
        shouldRetry: true,
      }),
      unauthorized: new ApiError({
        message: 'Unauthorized',
        code: 'PGRST301',
        userMessage: 'errors.unauthorized',
        shouldRetry: false,
        statusCode: 401,
      }),
      notFound: new ApiError({
        message: 'Not found',
        code: 'PGRST116',
        userMessage: 'errors.notFound',
        shouldRetry: false,
        statusCode: 404,
      }),
      validation: new ApiError({
        message: 'Validation error',
        code: '23502',
        userMessage: 'errors.validation.invalid',
        shouldRetry: false,
        statusCode: 400,
      }),
    };

    const error = errorMap[errorType];
    if (error) {
      showError(error, {
        operation: `simulate${errorType}Error`,
        page: 'ErrorHandlingExample',
      });
    }

    setSimulatedError('');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Error Handling & Logging Examples</h1>
        <p className="text-gray-600">
          This page demonstrates the error handling and logging features. Check browser console
          for detailed logs.
        </p>
      </div>

      {/* Network Status */}
      <Card>
        <CardHeader>
          <CardTitle>Network Status</CardTitle>
          <CardDescription>Current online/offline status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}
            />
            <span className="font-medium">
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Toast Examples */}
      <Card>
        <CardHeader>
          <CardTitle>1. Toast Notifications</CardTitle>
          <CardDescription>Different types of toast messages</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button onClick={handleToastExample} variant="default">
            Success Toast
          </Button>
          <Button onClick={handleToastError} variant="destructive">
            Error Toast
          </Button>
          <Button onClick={handleToastWarning} variant="outline">
            Warning Toast
          </Button>
          <Button onClick={handleToastInfo} variant="outline">
            Info Toast
          </Button>
        </CardContent>
      </Card>

      {/* API Call Examples */}
      <Card>
        <CardHeader>
          <CardTitle>2. API Call Error Handling</CardTitle>
          <CardDescription>Simulated API calls with success and error scenarios</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button onClick={handleApiCallSuccess} variant="default">
            Successful API Call
          </Button>
          <Button onClick={handleApiCallError} variant="destructive">
            Failed API Call
          </Button>
          <Button onClick={handleManualError} variant="outline">
            Manual Error Handling
          </Button>
        </CardContent>
      </Card>

      {/* Logging Examples */}
      <Card>
        <CardHeader>
          <CardTitle>3. Logging Examples</CardTitle>
          <CardDescription>Check browser console to see different log levels</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleLoggingExample} variant="default">
            Trigger Logging Examples
          </Button>
        </CardContent>
      </Card>

      {/* Error Types */}
      <Card>
        <CardHeader>
          <CardTitle>4. Simulate Different Error Types</CardTitle>
          <CardDescription>See how different errors are handled and displayed</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button
            onClick={() => handleSimulateError('network')}
            variant="outline"
            disabled={simulatedError === 'network'}
          >
            Network Error
          </Button>
          <Button
            onClick={() => handleSimulateError('unauthorized')}
            variant="outline"
            disabled={simulatedError === 'unauthorized'}
          >
            Unauthorized (401)
          </Button>
          <Button
            onClick={() => handleSimulateError('notFound')}
            variant="outline"
            disabled={simulatedError === 'notFound'}
          >
            Not Found (404)
          </Button>
          <Button
            onClick={() => handleSimulateError('validation')}
            variant="outline"
            disabled={simulatedError === 'validation'}
          >
            Validation Error
          </Button>
        </CardContent>
      </Card>

      {/* Error Boundary Test */}
      <Card>
        <CardHeader>
          <CardTitle>5. Error Boundary Test</CardTitle>
          <CardDescription>
            This will throw an error that should be caught by the Error Boundary
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleThrowError} variant="destructive">
            Throw Error (Test Error Boundary)
          </Button>
        </CardContent>
      </Card>

      {/* Documentation */}
      <Card>
        <CardHeader>
          <CardTitle>Documentation</CardTitle>
          <CardDescription>Learn more about error handling</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            See <code className="bg-gray-100 px-2 py-1 rounded">ERROR_HANDLING_GUIDE.md</code> for
            complete documentation on how to use the error handling and logging system in your
            components.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
