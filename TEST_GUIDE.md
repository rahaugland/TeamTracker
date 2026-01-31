# TeamTracker Testing Guide

This guide covers the testing infrastructure and practices for the TeamTracker volleyball app.

## Table of Contents

- [Testing Stack](#testing-stack)
- [Running Tests](#running-tests)
- [Test Structure](#test-structure)
- [Writing Tests](#writing-tests)
- [Mocking Supabase](#mocking-supabase)
- [Best Practices](#best-practices)
- [Coverage Goals](#coverage-goals)

## Testing Stack

- **Test Runner**: [Vitest](https://vitest.dev/) - Fast, Vite-native test runner
- **Testing Library**: [@testing-library/react](https://testing-library.com/react) - Component testing utilities
- **DOM Environment**: [jsdom](https://github.com/jsdom/jsdom) - Browser-like environment for Node
- **Assertions**: [Vitest](https://vitest.dev/api/) - Built-in matchers + @testing-library/jest-dom
- **Coverage**: [v8](https://v8.dev/blog/javascript-code-coverage) - Native code coverage

## Running Tests

```bash
# Run tests in watch mode (development)
pnpm test

# Run tests once (CI/CD)
pnpm test:run

# Run tests with UI
pnpm test:ui

# Run tests with coverage report
pnpm test:coverage
```

### Coverage Reports

After running `pnpm test:coverage`, open `coverage/index.html` in your browser to view the detailed coverage report.

## Test Structure

```
src/
├── __mocks__/
│   └── supabase.ts              # Mock Supabase client
├── __tests__/
│   ├── services/
│   │   ├── analytics.service.test.ts
│   │   └── teams.service.test.ts
│   ├── hooks/
│   │   └── usePermissions.test.ts
│   └── utils/
│       └── helpers.test.ts
└── setupTests.ts                 # Global test setup
```

## Writing Tests

### Service Tests

Service tests focus on business logic and API interactions. Mock Supabase responses to test different scenarios.

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { myService } from '@/services/myService';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import { supabase } from '@/lib/supabase';

describe('MyService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should do something', async () => {
    // Setup mock
    const fromMock = vi.fn();
    (supabase.from as any) = fromMock;

    fromMock.mockReturnValue({
      select: vi.fn().mockResolvedValue({
        data: [{ id: '1', name: 'Test' }],
        error: null
      }),
    });

    // Execute
    const result = await myService();

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Test');
  });
});
```

### Hook Tests

Use `@testing-library/react` to test custom hooks.

```typescript
import { renderHook } from '@testing-library/react';
import { useMyHook } from '@/hooks/useMyHook';

describe('useMyHook', () => {
  it('should return expected values', () => {
    const { result } = renderHook(() => useMyHook());

    expect(result.current.someValue).toBe(expectedValue);
  });
});
```

### Utility Tests

Test pure functions with simple input/output assertions.

```typescript
import { describe, it, expect } from 'vitest';
import { myUtilFunction } from '@/utils/helpers';

describe('myUtilFunction', () => {
  it('should transform input correctly', () => {
    const input = 'test';
    const result = myUtilFunction(input);

    expect(result).toBe('TEST');
  });

  it('should handle edge cases', () => {
    expect(myUtilFunction('')).toBe('');
    expect(myUtilFunction(null)).toBe(null);
  });
});
```

## Mocking Supabase

The `src/__mocks__/supabase.ts` file provides utilities for mocking Supabase operations.

### Basic Query Mock

```typescript
import { supabase } from '@/lib/supabase';

const fromMock = vi.fn();
(supabase.from as any) = fromMock;

fromMock.mockReturnValue({
  select: vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue({
      data: [{ id: '1', name: 'Test' }],
      error: null
    }),
  }),
});
```

### Chained Query Mock

```typescript
fromMock.mockReturnValue({
  select: vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({
      order: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue({
          data: mockData,
          error: null
        }),
      }),
    }),
  }),
});
```

### Error Mock

```typescript
fromMock.mockReturnValue({
  select: vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue({
      data: null,
      error: { code: 'DATABASE_ERROR', message: 'Connection failed' }
    }),
  }),
});
```

### Conditional Mocks (Multiple Tables)

```typescript
fromMock.mockImplementation((table: string) => {
  if (table === 'teams') {
    return {
      select: vi.fn().mockResolvedValue({ data: teamsData, error: null }),
    };
  }
  if (table === 'players') {
    return {
      select: vi.fn().mockResolvedValue({ data: playersData, error: null }),
    };
  }
});
```

## Best Practices

### 1. Test Business Logic, Not Implementation

✅ **Good**: Test what the function returns
```typescript
it('should calculate attendance rate correctly', () => {
  const result = calculateAttendanceRate(3, 10);
  expect(result).toBe(30);
});
```

❌ **Bad**: Test internal implementation details
```typescript
it('should call Math.round', () => {
  const mathSpy = vi.spyOn(Math, 'round');
  calculateAttendanceRate(3, 10);
  expect(mathSpy).toHaveBeenCalled();
});
```

### 2. Use Descriptive Test Names

✅ **Good**:
```typescript
it('should return empty array when no events exist', () => {
  // ...
});
```

❌ **Bad**:
```typescript
it('test 1', () => {
  // ...
});
```

### 3. Follow AAA Pattern

```typescript
it('should do something', () => {
  // Arrange: Set up test data and mocks
  const input = 'test';
  const expected = 'TEST';

  // Act: Execute the function
  const result = transform(input);

  // Assert: Verify the result
  expect(result).toBe(expected);
});
```

### 4. Test Edge Cases

Always test:
- Empty arrays/objects
- Null/undefined values
- Zero values
- Boundary conditions
- Error conditions

### 5. Keep Tests Independent

Each test should be able to run in isolation. Use `beforeEach` to reset state.

```typescript
describe('MyComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Tests...
});
```

### 6. Mock External Dependencies

Always mock:
- API calls (Supabase)
- Date/time functions (if testing time-dependent logic)
- Random functions (for predictable tests)
- External libraries

## Coverage Goals

### Current Coverage Focus

We prioritize testing **business logic** over UI components:

1. **Services**: Aim for 80%+ coverage
   - Analytics calculations
   - Data transformations
   - API interactions

2. **Hooks**: Aim for 70%+ coverage
   - Permission logic
   - State management
   - Data fetching hooks

3. **Utilities**: Aim for 90%+ coverage
   - Pure functions
   - Validators
   - Formatters

4. **UI Components**: Lower priority
   - Focus on component logic, not rendering
   - Test user interactions in integration tests

### Files Excluded from Coverage

- `src/main.tsx` - App entry point
- `src/setupTests.ts` - Test configuration
- `src/components/ui/**` - Generated UI components
- `**/*.config.*` - Configuration files
- `**/*.d.ts` - Type definitions

## Test Examples

### Example 1: Testing Attendance Rate Calculation

```typescript
describe('getPlayerAttendanceRates', () => {
  it('should calculate attendance rates correctly', async () => {
    // Mock data
    const mockAttendance = [
      { player_id: 'p1', status: 'present' },
      { player_id: 'p1', status: 'late' },
      { player_id: 'p1', status: 'absent' },
    ];

    // Mock Supabase
    setupMockSupabase(mockAttendance);

    // Execute
    const result = await getPlayerAttendanceRates('team1');

    // Assert
    // Player has 2 present/late out of 3 = 66.7%
    expect(result[0].attendanceRate).toBe(66.7);
  });
});
```

### Example 2: Testing Invite Code Generation

```typescript
describe('generateInviteCode', () => {
  it('should generate 6-character alphanumeric code', () => {
    const code = generateInviteCode();

    expect(code).toHaveLength(6);
    expect(code).toMatch(/^[A-Z0-9]{6}$/);
  });

  it('should generate unique codes', () => {
    const codes = new Set();
    for (let i = 0; i < 100; i++) {
      codes.add(generateInviteCode());
    }

    expect(codes.size).toBeGreaterThan(90);
  });
});
```

### Example 3: Testing Permissions

```typescript
describe('usePermissions', () => {
  it('should return correct permissions for head coach', () => {
    mockAuthStore({ role: 'head_coach' });

    const { result } = renderHook(() => usePermissions());

    expect(result.current.canCreateTeam).toBe(true);
    expect(result.current.canDeletePlayer).toBe(true);
    expect(result.current.isCoach).toBe(true);
  });
});
```

## Debugging Tests

### Run Single Test File

```bash
pnpm test src/__tests__/services/teams.service.test.ts
```

### Run Tests Matching Pattern

```bash
pnpm test -t "invite code"
```

### Debug in VS Code

Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Vitest Tests",
  "runtimeExecutable": "pnpm",
  "runtimeArgs": ["test", "--run"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

## CI/CD Integration

Add to your CI pipeline:

```yaml
# .github/workflows/test.yml
- name: Run tests
  run: pnpm test:run

- name: Generate coverage
  run: pnpm test:coverage

- name: Upload coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/coverage-final.json
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Docs](https://testing-library.com/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Effective Snapshot Testing](https://kentcdodds.com/blog/effective-snapshot-testing)

## Getting Help

If you encounter issues:

1. Check the [Vitest troubleshooting guide](https://vitest.dev/guide/troubleshooting.html)
2. Review existing test files for examples
3. Ask the team in the #testing channel

---

**Last Updated**: 2024-01-24
