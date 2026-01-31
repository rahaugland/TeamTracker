import { vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Mock Supabase client for testing
 * Provides mocked versions of common Supabase methods
 */

export interface MockQueryBuilder {
  select: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  neq: ReturnType<typeof vi.fn>;
  gt: ReturnType<typeof vi.fn>;
  gte: ReturnType<typeof vi.fn>;
  lt: ReturnType<typeof vi.fn>;
  lte: ReturnType<typeof vi.fn>;
  in: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
  maybeSingle: ReturnType<typeof vi.fn>;
}

export const createMockQueryBuilder = (): MockQueryBuilder => {
  const builder: any = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn(),
    maybeSingle: vi.fn(),
  };
  return builder;
};

export const createMockSupabaseClient = (): Partial<SupabaseClient> => {
  const queryBuilder = createMockQueryBuilder();

  return {
    from: vi.fn(() => queryBuilder as any),
    auth: {
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      getUser: vi.fn(),
      onAuthStateChange: vi.fn(),
    } as any,
  };
};

export const mockSupabase = createMockSupabaseClient();

// Helper to reset all mocks
export const resetSupabaseMocks = () => {
  vi.clearAllMocks();
};

// Helper to setup successful query response
export const mockSupabaseQuery = (data: any, error: any = null) => {
  const queryBuilder = createMockQueryBuilder();
  queryBuilder.single.mockResolvedValue({ data, error });
  queryBuilder.maybeSingle.mockResolvedValue({ data, error });

  // For queries without single/maybeSingle
  (queryBuilder as any).then = (resolve: (value: any) => void) => {
    resolve({ data, error });
  };

  return queryBuilder;
};

// Helper to setup error response
export const mockSupabaseError = (error: any) => {
  const queryBuilder = createMockQueryBuilder();
  queryBuilder.single.mockResolvedValue({ data: null, error });
  queryBuilder.maybeSingle.mockResolvedValue({ data: null, error });
  return queryBuilder;
};
