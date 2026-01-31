import React, { Component, ReactNode } from 'react';
import { AlertTriangle, Home, RotateCw, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { logger } from '@/services/logger.service';
import { isNetworkError } from '@/services/error.service';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * Error Boundary Component
 * Catches runtime errors in component tree and displays fallback UI
 */
class ErrorBoundaryClass extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details
    logger.error('React Error Boundary caught an error', error, {
      componentStack: errorInfo.componentStack,
      page: window.location.pathname,
    });

    this.setState({
      error,
      errorInfo,
    });
  }

  reset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.reset);
      }

      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          reset={this.reset}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Default error fallback UI
 */
interface ErrorFallbackProps {
  error: Error;
  errorInfo: React.ErrorInfo | null;
  reset: () => void;
}

function ErrorFallback({ error, errorInfo, reset }: ErrorFallbackProps) {
  const isOffline = isNetworkError(error);

  const handleGoHome = () => {
    reset();
    window.location.href = '/dashboard';
  };

  const handleTryAgain = () => {
    reset();
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          {isOffline ? (
            <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
              <WifiOff className="w-8 h-8 text-orange-600" />
            </div>
          ) : (
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          )}
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {isOffline ? 'No Internet Connection' : 'Something Went Wrong'}
        </h1>

        <p className="text-gray-600 mb-6">
          {isOffline
            ? 'Please check your internet connection and try again.'
            : 'An unexpected error occurred. We apologize for the inconvenience.'}
        </p>

        {import.meta.env.DEV && (
          <div className="mb-6 p-4 bg-gray-100 rounded-lg text-left">
            <p className="text-sm font-mono text-red-600 mb-2">{error.message}</p>
            {errorInfo?.componentStack && (
              <details className="text-xs text-gray-600">
                <summary className="cursor-pointer font-semibold mb-1">
                  Component Stack
                </summary>
                <pre className="overflow-auto max-h-40 whitespace-pre-wrap">
                  {errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        )}

        <div className="flex gap-3 justify-center">
          <Button onClick={handleTryAgain} className="gap-2">
            <RotateCw className="w-4 h-4" />
            Try Again
          </Button>
          <Button onClick={handleGoHome} variant="outline" className="gap-2">
            <Home className="w-4 h-4" />
            Go Home
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Wrapper component to use hooks in error boundary
 */
export function ErrorBoundary({ children, fallback }: ErrorBoundaryProps) {
  return (
    <ErrorBoundaryClass fallback={fallback}>
      {children}
    </ErrorBoundaryClass>
  );
}
