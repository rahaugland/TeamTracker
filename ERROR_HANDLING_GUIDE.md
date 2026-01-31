# Error Handling & Logging Guide

This guide explains how to use the comprehensive error handling and logging system in TeamTracker.

## Table of Contents

1. [Overview](#overview)
2. [Toast Notifications](#toast-notifications)
3. [Error Handling in Services](#error-handling-in-services)
4. [Error Handling in Components](#error-handling-in-components)
5. [Logging](#logging)
6. [Error Boundary](#error-boundary)
7. [Offline Handling](#offline-handling)

## Overview

The error handling system provides:

- **Centralized error handling** for all API calls
- **User-friendly toast notifications** for success/error messages
- **Automatic retry logic** for transient failures
- **Session refresh** on 401 errors
- **Structured logging** with different log levels
- **Error boundaries** to catch React errors
- **Offline detection** and indicators
- **i18n support** for error messages

## Toast Notifications

### Using the useToast Hook

```typescript
import { useToast } from '@/hooks/useToast';

function MyComponent() {
  const { toast } = useToast();

  const handleSuccess = () => {
    toast.success('Player created successfully!');
  };

  const handleError = () => {
    toast.error('Failed to create player', {
      title: 'Error',
      duration: 7000, // Custom duration in ms (default: 5000)
    });
  };

  const handleWarning = () => {
    toast.warning('This action cannot be undone');
  };

  const handleInfo = () => {
    toast.info('New features available!');
  };

  return (
    <div>
      {/* Your component */}
    </div>
  );
}
```

### Toast Variants

- `success` - Green toast for successful operations
- `error` - Red toast for errors
- `warning` - Yellow toast for warnings
- `info` - Blue toast for informational messages

## Error Handling in Services

### Using withErrorHandling

All service functions should use `withErrorHandling` wrapper:

```typescript
import { withErrorHandling } from '@/lib/api-error-handler';
import { supabase } from '@/lib/supabase';

export async function getPlayers(): Promise<Player[]> {
  return withErrorHandling(
    async () => {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .order('name');

      if (error) throw error;
      return data || [];
    },
    {
      operation: 'getPlayers',
      retry: true, // Enable automatic retry for transient failures
    }
  );
}

export async function createPlayer(input: CreatePlayerInput): Promise<Player> {
  return withErrorHandling(
    async () => {
      const { data, error } = await supabase
        .from('players')
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    {
      operation: 'createPlayer',
      // retry: false by default for mutations
    }
  );
}
```

### Benefits of withErrorHandling

- Automatic error parsing and logging
- User-friendly error messages via i18n
- Automatic session refresh on 401 errors
- Retry logic for network failures
- Standardized error format

## Error Handling in Components

### Using useErrorHandler Hook

The `useErrorHandler` hook combines error handling with toast notifications:

```typescript
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { getPlayers } from '@/services/players.service';

function PlayersPage() {
  const { handleApiError, showSuccess, showError } = useErrorHandler();
  const [players, setPlayers] = useState<Player[]>([]);

  // Option 1: Simple error handling with toast
  const loadPlayers = async () => {
    const result = await handleApiError(
      () => getPlayers(),
      {
        errorContext: {
          operation: 'loadPlayers',
          page: 'PlayersPage',
        },
      }
    );

    if (result) {
      setPlayers(result);
    }
  };

  // Option 2: With success message and callbacks
  const createPlayer = async (input: CreatePlayerInput) => {
    await handleApiError(
      () => createPlayer(input),
      {
        successMessage: 'common.messages.saved',
        errorContext: {
          operation: 'createPlayer',
          page: 'PlayersPage',
        },
        onSuccess: (player) => {
          setPlayers([...players, player]);
          navigate(`/players/${player.id}`);
        },
        onError: (error) => {
          // Custom error handling if needed
          console.error('Failed to create player:', error);
        },
      }
    );
  };

  // Option 3: Manual error handling
  const deletePlayer = async (id: string) => {
    try {
      await deletePlayer(id);
      showSuccess('common.messages.deleted');
      loadPlayers();
    } catch (error) {
      showError(error, {
        operation: 'deletePlayer',
        page: 'PlayersPage',
      });
    }
  };

  return (
    <div>
      {/* Your component */}
    </div>
  );
}
```

## Logging

### Using the Logger Service

```typescript
import { logger } from '@/services/logger.service';

// Debug logs (development only)
logger.debug('User clicked button', {
  userId: user.id,
  page: 'DashboardPage',
  button: 'createPlayer',
});

// Info logs
logger.info('Player created successfully', {
  userId: user.id,
  playerId: player.id,
});

// Warning logs
logger.warn('Session about to expire', {
  userId: user.id,
  expiresIn: '5 minutes',
});

// Error logs
logger.error('Failed to save player', error, {
  userId: user.id,
  playerId: player.id,
  page: 'EditPlayerPage',
});
```

### Log Levels

- `debug` - Detailed information for debugging (dev only)
- `info` - General informational messages
- `warn` - Warning messages for potential issues
- `error` - Error messages for failures

### Automatic Sanitization

The logger automatically redacts sensitive data:

```typescript
logger.info('User logged in', {
  userId: user.id,
  email: user.email,
  password: 'secret123', // Will be redacted to [REDACTED]
  token: 'abc123', // Will be redacted to [REDACTED]
});
```

## Error Boundary

The Error Boundary catches runtime errors in the React component tree.

### Automatic Setup

Error boundaries are already set up in `App.tsx` to catch all errors:

```typescript
import { ErrorBoundary } from '@/components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      {/* Your app routes */}
    </ErrorBoundary>
  );
}
```

### Custom Error Boundary

You can create custom error boundaries for specific parts of your app:

```typescript
import { ErrorBoundary } from '@/components/ErrorBoundary';

function DashboardPage() {
  return (
    <div>
      <h1>Dashboard</h1>

      <ErrorBoundary
        fallback={(error, reset) => (
          <div>
            <p>Failed to load widgets</p>
            <button onClick={reset}>Try Again</button>
          </div>
        )}
      >
        <DashboardWidgets />
      </ErrorBoundary>
    </div>
  );
}
```

## Offline Handling

### Offline Indicator

The offline indicator automatically appears when the user loses internet connection:

```typescript
import { OfflineIndicator } from '@/components/common/OfflineIndicator';

// Already included in App.tsx
function App() {
  return (
    <>
      <OfflineIndicator />
      {/* Your app */}
    </>
  );
}
```

### Detecting Offline Status

Use the `useOfflineStatus` hook to detect offline status in your components:

```typescript
import { useOfflineStatus } from '@/hooks/useOfflineStatus';

function MyComponent() {
  const { isOnline, isOffline } = useOfflineStatus();

  if (isOffline) {
    return <div>You are offline. Some features may not be available.</div>;
  }

  return <div>{/* Your component */}</div>;
}
```

### Offline Queue

The existing offline sync system (using Dexie) automatically queues operations when offline and retries when back online.

## Error Message Translation

All error messages are internationalized. Add new error messages to translation files:

### English (`src/i18n/locales/en/translation.json`)

```json
{
  "errors": {
    "playerNotFound": "Player not found",
    "teamFull": "Team is full. Cannot add more players."
  }
}
```

### Norwegian (`src/i18n/locales/no/translation.json`)

```json
{
  "errors": {
    "playerNotFound": "Spiller ikke funnet",
    "teamFull": "Laget er fullt. Kan ikke legge til flere spillere."
  }
}
```

## Best Practices

1. **Always use withErrorHandling** for service functions
2. **Use useErrorHandler** in components for consistent error handling
3. **Provide context** in error logs (userId, page, operation)
4. **Use i18n keys** for all user-facing error messages
5. **Enable retry** only for read operations, not mutations
6. **Show success toasts** for user actions (create, update, delete)
7. **Log errors** with appropriate severity levels
8. **Don't log sensitive data** (passwords, tokens, etc.)
9. **Test offline scenarios** to ensure graceful degradation
10. **Use Error Boundaries** around complex components

## Common Error Codes

| Code | Description | User Message Key |
|------|-------------|------------------|
| `NETWORK_ERROR` | No internet connection | `errors.network.offline` |
| `PGRST116` | Not found | `errors.notFound` |
| `PGRST301` | Unauthorized | `errors.unauthorized` |
| `23505` | Duplicate entry | `errors.duplicate` |
| `23503` | Foreign key violation | `errors.invalidReference` |
| `42501` | Insufficient privileges | `errors.forbidden` |
| `RATE_LIMIT` | Too many requests | `errors.rateLimit` |

## Example: Complete Component

```typescript
import { useState, useEffect } from 'react';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { getPlayers, createPlayer } from '@/services/players.service';
import { logger } from '@/services/logger.service';

function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const { handleApiError, showSuccess } = useErrorHandler();
  const { isOffline } = useOfflineStatus();

  // Load players on mount
  useEffect(() => {
    loadPlayers();
  }, []);

  const loadPlayers = async () => {
    setLoading(true);

    const result = await handleApiError(
      () => getPlayers(),
      {
        errorContext: {
          operation: 'loadPlayers',
          page: 'PlayersPage',
        },
      }
    );

    if (result) {
      setPlayers(result);
      logger.info('Players loaded successfully', {
        count: result.length,
        page: 'PlayersPage',
      });
    }

    setLoading(false);
  };

  const handleCreatePlayer = async (input: CreatePlayerInput) => {
    await handleApiError(
      () => createPlayer(input),
      {
        successMessage: 'common.messages.saved',
        errorContext: {
          operation: 'createPlayer',
          page: 'PlayersPage',
        },
        onSuccess: (player) => {
          setPlayers([...players, player]);
          logger.info('Player created', {
            playerId: player.id,
            page: 'PlayersPage',
          });
        },
      }
    );
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {isOffline && (
        <div className="bg-yellow-50 p-4 rounded">
          You are offline. Changes will be synced when you reconnect.
        </div>
      )}

      <h1>Players</h1>
      {/* Your component UI */}
    </div>
  );
}
```

## Troubleshooting

### Toast not appearing

- Ensure `ToastContainer` is rendered in `App.tsx`
- Check that you're using the `toast` function from `useToast()`

### Errors not being logged

- Check browser console (logs appear in development)
- Verify logger service is imported correctly
- Ensure you're calling logger methods with correct parameters

### Error boundary not catching errors

- Error boundaries only catch errors in child components
- They don't catch errors in event handlers or async code
- Use try/catch in event handlers and async functions

### Offline indicator not showing

- Check that `OfflineIndicator` is rendered in `App.tsx`
- Verify browser's network status detection is working
- Test with browser DevTools network throttling
