# Testing Quick Reference

## Common Commands

```bash
# Watch mode (development)
pnpm test

# Run once (CI)
pnpm test:run

# With coverage
pnpm test:coverage

# With UI
pnpm test:ui

# Specific file
pnpm test analytics.service.test.ts

# Pattern match
pnpm test -t "invite code"
```

## Basic Test Structure

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Feature Name', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should do something', () => {
    // Arrange
    const input = 'test';

    // Act
    const result = myFunction(input);

    // Assert
    expect(result).toBe('expected');
  });
});
```

## Mock Supabase

### Basic Query

```typescript
vi.mock('@/lib/supabase', () => ({
  supabase: { from: vi.fn() },
}));

import { supabase } from '@/lib/supabase';

const fromMock = vi.fn();
(supabase.from as any) = fromMock;

fromMock.mockReturnValue({
  select: vi.fn().mockResolvedValue({
    data: [{ id: '1', name: 'Test' }],
    error: null
  }),
});
```

### Chained Query

```typescript
fromMock.mockReturnValue({
  select: vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({
      order: vi.fn().mockResolvedValue({
        data: mockData,
        error: null
      }),
    }),
  }),
});
```

### Multiple Tables

```typescript
fromMock.mockImplementation((table: string) => {
  if (table === 'teams') {
    return { select: vi.fn().mockResolvedValue({ data: teamsData, error: null }) };
  }
  if (table === 'players') {
    return { select: vi.fn().mockResolvedValue({ data: playersData, error: null }) };
  }
});
```

### Error Response

```typescript
fromMock.mockReturnValue({
  select: vi.fn().mockResolvedValue({
    data: null,
    error: { code: 'ERROR_CODE', message: 'Error message' }
  }),
});
```

## Test Hooks

```typescript
import { renderHook } from '@testing-library/react';

vi.mock('@/store', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '@/store';

it('should return expected values', () => {
  (useAuth as any).mockReturnValue({
    user: { role: 'head_coach' },
  });

  const { result } = renderHook(() => useMyHook());

  expect(result.current.someValue).toBe(expected);
});
```

## Common Assertions

```typescript
// Equality
expect(value).toBe(5);
expect(value).toEqual({ key: 'value' });

// Truthiness
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeNull();
expect(value).toBeDefined();

// Numbers
expect(number).toBeGreaterThan(3);
expect(number).toBeGreaterThanOrEqual(3.5);
expect(number).toBeLessThan(5);
expect(number).toBeCloseTo(0.3, 1); // Float comparison

// Strings
expect(string).toMatch(/pattern/);
expect(string).toContain('substring');

// Arrays
expect(array).toHaveLength(3);
expect(array).toContain('item');

// Objects
expect(obj).toHaveProperty('key');
expect(obj).toMatchObject({ key: 'value' });

// Async
await expect(promise).resolves.toBe(value);
await expect(promise).rejects.toThrow();

// Functions
expect(fn).toHaveBeenCalled();
expect(fn).toHaveBeenCalledWith(arg1, arg2);
expect(fn).toHaveBeenCalledTimes(3);
```

## Edge Cases Checklist

Always test:
- ✅ Empty arrays/objects
- ✅ Null/undefined values
- ✅ Zero values
- ✅ Boundary conditions
- ✅ Error conditions
- ✅ Invalid input

## Test Organization

```typescript
describe('Feature', () => {
  describe('SubFeature', () => {
    it('should handle case 1', () => {});
    it('should handle case 2', () => {});
    it('should handle edge case', () => {});
  });

  describe('Error Handling', () => {
    it('should throw on invalid input', () => {});
  });
});
```

## Coverage Commands

```bash
# Generate coverage
pnpm test:coverage

# View HTML report
# Open coverage/index.html in browser

# Coverage thresholds in vitest.config.ts
coverage: {
  lines: 80,
  functions: 80,
  branches: 80,
  statements: 80,
}
```

## Debugging Tests

```bash
# Run single test
pnpm test -t "exact test name"

# Run in debug mode
node --inspect-brk ./node_modules/vitest/vitest.mjs run

# VS Code launch.json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Tests",
  "runtimeExecutable": "pnpm",
  "runtimeArgs": ["test", "--run"],
  "console": "integratedTerminal"
}
```

## Common Patterns

### Test Percentage Calculation

```typescript
it('should calculate percentage', () => {
  const calc = (part: number, total: number) =>
    Math.round((part / total) * 100 * 10) / 10;

  expect(calc(1, 3)).toBe(33.3);
  expect(calc(0, 0)).toBe(0); // Edge case
});
```

### Test Date Ranges

```typescript
it('should filter by date range', () => {
  const events = [
    { date: '2024-01-10T10:00:00Z' },
    { date: '2024-01-20T10:00:00Z' },
  ];

  const filtered = events.filter(e =>
    new Date(e.date) >= new Date('2024-01-15T00:00:00Z')
  );

  expect(filtered).toHaveLength(1);
});
```

### Test Sorting

```typescript
it('should sort descending', () => {
  const items = [{ val: 3 }, { val: 1 }, { val: 2 }];
  const sorted = [...items].sort((a, b) => b.val - a.val);

  expect(sorted[0].val).toBe(3);
});
```

### Test Validation

```typescript
it('should validate format', () => {
  const isValid = (code: string) => /^[A-Z0-9]{6}$/.test(code);

  expect(isValid('ABC123')).toBe(true);
  expect(isValid('abc123')).toBe(false);
  expect(isValid('ABC12')).toBe(false);
});
```

## Troubleshooting

### Mock not working
```typescript
// Make sure mock is before import
vi.mock('@/lib/supabase');
import { supabase } from '@/lib/supabase';
```

### Test timeout
```typescript
it('should complete', async () => {
  // ...
}, 10000); // 10 second timeout
```

### Clear mocks between tests
```typescript
beforeEach(() => {
  vi.clearAllMocks();
});
```

---

**Last Updated**: 2024-01-24
