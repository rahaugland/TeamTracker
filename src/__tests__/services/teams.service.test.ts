import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  generateInviteCode,
  createTeam,
  getTeamByInviteCode,
  regenerateInviteCode,
} from '@/services/teams.service';

// Mock the supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import { supabase } from '@/lib/supabase';

describe('Teams Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateInviteCode', () => {
    it('should generate a 6-character code', () => {
      const code = generateInviteCode();
      expect(code).toHaveLength(6);
    });

    it('should only contain alphanumeric characters', () => {
      const code = generateInviteCode();
      expect(code).toMatch(/^[A-Z0-9]{6}$/);
    });

    it('should generate different codes', () => {
      const codes = new Set();
      for (let i = 0; i < 100; i++) {
        codes.add(generateInviteCode());
      }
      // With 36^6 possible combinations, 100 codes should be unique
      expect(codes.size).toBeGreaterThan(90);
    });

    it('should only use uppercase letters', () => {
      const code = generateInviteCode();
      expect(code).toBe(code.toUpperCase());
      expect(code).not.toMatch(/[a-z]/);
    });

    it('should be valid alphanumeric (A-Z, 0-9)', () => {
      for (let i = 0; i < 20; i++) {
        const code = generateInviteCode();
        for (const char of code) {
          expect('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789').toContain(char);
        }
      }
    });
  });

  describe('createTeam', () => {
    it('should create team with unique invite code', async () => {
      const mockTeam = {
        id: 'team-123',
        name: 'Test Team',
        season_id: 'season-456',
        invite_code: 'ABC123',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      };

      const fromMock = vi.fn();
      (supabase.from as any) = fromMock;

      fromMock.mockImplementation((table: string) => {
        if (table === 'teams') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockTeam, error: null }),
              }),
            }),
          };
        }
      });

      const result = await createTeam({
        name: 'Test Team',
        season_id: 'season-456',
      });

      expect(result).toEqual(mockTeam);
      expect(result.invite_code).toHaveLength(6);
    });

    it('should retry on code collision', async () => {
      const mockTeam = {
        id: 'team-123',
        name: 'Test Team',
        season_id: 'season-456',
        invite_code: 'ABC123',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      };

      const fromMock = vi.fn();
      (supabase.from as any) = fromMock;

      let checkCallCount = 0;

      fromMock.mockImplementation((table: string) => {
        if (table === 'teams') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockImplementation(() => {
                  checkCallCount++;
                  // First call returns existing team (collision), second returns null (unique)
                  if (checkCallCount === 1) {
                    return Promise.resolve({ data: { id: 'existing' }, error: null });
                  }
                  return Promise.resolve({ data: null, error: null });
                }),
              }),
            }),
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockTeam, error: null }),
              }),
            }),
          };
        }
      });

      const result = await createTeam({
        name: 'Test Team',
        season_id: 'season-456',
      });

      expect(checkCallCount).toBeGreaterThan(1);
      expect(result).toEqual(mockTeam);
    });

    it('should throw error after max retry attempts', async () => {
      const fromMock = vi.fn();
      (supabase.from as any) = fromMock;

      fromMock.mockImplementation((table: string) => {
        if (table === 'teams') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                // Always return existing team (simulate constant collision)
                maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'existing' }, error: null }),
              }),
            }),
          };
        }
      });

      await expect(createTeam({
        name: 'Test Team',
        season_id: 'season-456',
      })).rejects.toThrow('Failed to generate unique invite code');
    });
  });

  describe('getTeamByInviteCode', () => {
    it('should find team by invite code', async () => {
      const mockTeam = {
        id: 'team-123',
        name: 'Test Team',
        season_id: 'season-456',
        invite_code: 'ABC123',
        season: {
          id: 'season-456',
          name: '2024 Season',
          start_date: '2024-01-01',
          end_date: '2024-12-31',
          is_active: true,
          archived: false,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      };

      const fromMock = vi.fn();
      (supabase.from as any) = fromMock;

      fromMock.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockTeam, error: null }),
          }),
        }),
      });

      const result = await getTeamByInviteCode('abc123');

      expect(result).toEqual(mockTeam);
    });

    it('should convert code to uppercase', async () => {
      const fromMock = vi.fn();
      (supabase.from as any) = fromMock;

      const eqMock = vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
      });

      fromMock.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: eqMock,
        }),
      });

      await getTeamByInviteCode('abc123');

      expect(eqMock).toHaveBeenCalledWith('invite_code', 'ABC123');
    });

    it('should return null for invalid code', async () => {
      const fromMock = vi.fn();
      (supabase.from as any) = fromMock;

      fromMock.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' } // No rows returned
            }),
          }),
        }),
      });

      const result = await getTeamByInviteCode('INVALID');

      expect(result).toBeNull();
    });

    it('should throw error for non-PGRST116 errors', async () => {
      const fromMock = vi.fn();
      (supabase.from as any) = fromMock;

      const dbError = { code: 'DATABASE_ERROR', message: 'Connection failed' };

      fromMock.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: dbError }),
          }),
        }),
      });

      await expect(getTeamByInviteCode('ABC123')).rejects.toThrow();
    });
  });

  describe('regenerateInviteCode', () => {
    it('should generate new unique code', async () => {
      const mockTeam = {
        id: 'team-123',
        name: 'Test Team',
        season_id: 'season-456',
        invite_code: 'XYZ789',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-16T10:00:00Z',
      };

      const fromMock = vi.fn();
      (supabase.from as any) = fromMock;

      fromMock.mockImplementation((table: string) => {
        if (table === 'teams') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: mockTeam, error: null }),
                }),
              }),
            }),
          };
        }
      });

      const result = await regenerateInviteCode('team-123');

      expect(result).toEqual(mockTeam);
      expect(result.invite_code).toHaveLength(6);
      expect(result.invite_code).toMatch(/^[A-Z0-9]{6}$/);
    });

    it('should update the updated_at timestamp', async () => {
      const originalDate = '2024-01-15T10:00:00Z';
      const newDate = '2024-01-16T10:00:00Z';

      const mockTeam = {
        id: 'team-123',
        name: 'Test Team',
        season_id: 'season-456',
        invite_code: 'NEW123',
        created_at: originalDate,
        updated_at: newDate,
      };

      const fromMock = vi.fn();
      (supabase.from as any) = fromMock;

      const updateMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockTeam, error: null }),
          }),
        }),
      });

      fromMock.mockImplementation((table: string) => {
        if (table === 'teams') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
            update: updateMock,
          };
        }
      });

      await regenerateInviteCode('team-123');

      expect(updateMock).toHaveBeenCalled();
      const updateCall = updateMock.mock.calls[0][0];
      expect(updateCall).toHaveProperty('invite_code');
      expect(updateCall).toHaveProperty('updated_at');
    });
  });

  describe('Invite Code Format Validation', () => {
    it('should only allow specific characters (A-Z, 0-9)', () => {
      const validChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

      for (let i = 0; i < 50; i++) {
        const code = generateInviteCode();
        for (const char of code) {
          expect(validChars.includes(char)).toBe(true);
        }
      }
    });

    it('should not contain special characters', () => {
      const specialChars = /[^A-Z0-9]/;

      for (let i = 0; i < 50; i++) {
        const code = generateInviteCode();
        expect(code).not.toMatch(specialChars);
      }
    });

    it('should not contain lowercase letters', () => {
      for (let i = 0; i < 50; i++) {
        const code = generateInviteCode();
        expect(code).not.toMatch(/[a-z]/);
      }
    });
  });

  describe('Invite Code Collision Probability', () => {
    it('should have low collision rate with realistic usage', () => {
      const codes = new Set<string>();
      const iterations = 1000;

      for (let i = 0; i < iterations; i++) {
        codes.add(generateInviteCode());
      }

      // With 36^6 = 2,176,782,336 possible codes, 1000 codes should have very few collisions
      const uniqueCodes = codes.size;
      const collisionRate = (iterations - uniqueCodes) / iterations;

      expect(collisionRate).toBeLessThan(0.01); // Less than 1% collision rate
      expect(uniqueCodes).toBeGreaterThan(990); // At least 99% unique
    });
  });
});
