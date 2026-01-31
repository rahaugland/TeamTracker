import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getPlayerAttendanceRates,
  getTeamAttendanceRate,
  getPracticeFrequency,
  getTopDrills,
  getDateRangePreset
} from '@/services/analytics.service';
import type { DateRange } from '@/services/analytics.service';

// Mock the supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import { supabase } from '@/lib/supabase';

describe('Analytics Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPlayerAttendanceRates', () => {
    it('should calculate attendance rates correctly', async () => {
      const mockMemberships = [
        {
          player_id: 'player1',
          player: { id: 'player1', name: 'John Doe', photo_url: null },
        },
        {
          player_id: 'player2',
          player: { id: 'player2', name: 'Jane Smith', photo_url: 'https://example.com/photo.jpg' },
        },
      ];

      const mockEvents = [
        { id: 'event1', start_time: '2024-01-15T10:00:00Z' },
        { id: 'event2', start_time: '2024-01-20T10:00:00Z' },
        { id: 'event3', start_time: '2024-01-25T10:00:00Z' },
      ];

      const mockAttendance = [
        { player_id: 'player1', status: 'present' },
        { player_id: 'player1', status: 'present' },
        { player_id: 'player1', status: 'late' },
        { player_id: 'player2', status: 'present' },
        { player_id: 'player2', status: 'absent' },
        { player_id: 'player2', status: 'excused' },
      ];

      // Mock the chained query calls
      const fromMock = vi.fn();
      (supabase.from as any) = fromMock;

      fromMock.mockImplementation((table: string) => {
        if (table === 'team_memberships') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ data: mockMemberships, error: null }),
              }),
            }),
          };
        }
        if (table === 'events') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: mockEvents, error: null }),
              }),
            }),
          };
        }
        if (table === 'attendance_records') {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({ data: mockAttendance, error: null }),
            }),
          };
        }
      });

      const result = await getPlayerAttendanceRates('team1');

      expect(result).toHaveLength(2);

      // Player 1: 2 present + 1 late = 3/3 = 100%
      const player1 = result.find(p => p.playerId === 'player1');
      expect(player1).toBeDefined();
      expect(player1?.attendanceRate).toBe(100);
      expect(player1?.presentCount).toBe(2);
      expect(player1?.lateCount).toBe(1);
      expect(player1?.absentCount).toBe(0);
      expect(player1?.totalEvents).toBe(3);

      // Player 2: 1 present + 0 late = 1/3 = 33.3%
      const player2 = result.find(p => p.playerId === 'player2');
      expect(player2).toBeDefined();
      expect(player2?.attendanceRate).toBe(33.3);
      expect(player2?.presentCount).toBe(1);
      expect(player2?.absentCount).toBe(1);
      expect(player2?.excusedCount).toBe(1);
    });

    it('should return empty array when no events exist', async () => {
      const fromMock = vi.fn();
      (supabase.from as any) = fromMock;

      fromMock.mockImplementation((table: string) => {
        if (table === 'team_memberships') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: [{ player_id: 'p1', player: { name: 'Test' } }],
                  error: null
                }),
              }),
            }),
          };
        }
        if (table === 'events') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          };
        }
      });

      const result = await getPlayerAttendanceRates('team1');
      expect(result).toEqual([]);
    });

    it('should filter by date range', async () => {
      const dateRange: DateRange = {
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-01-31T23:59:59Z',
      };

      const fromMock = vi.fn();
      (supabase.from as any) = fromMock;

      const gteCall = vi.fn().mockReturnValue({
        lte: vi.fn().mockResolvedValue({ data: [], error: null }),
      });

      fromMock.mockImplementation((table: string) => {
        if (table === 'team_memberships') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          };
        }
        if (table === 'events') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  gte: gteCall,
                }),
              }),
            }),
          };
        }
      });

      await getPlayerAttendanceRates('team1', dateRange);

      expect(gteCall).toHaveBeenCalledWith('start_time', dateRange.startDate);
    });
  });

  describe('getTeamAttendanceRate', () => {
    it('should calculate team average and trend correctly', async () => {
      const fromMock = vi.fn();
      (supabase.from as any) = fromMock;

      fromMock.mockImplementation((table: string) => {
        if (table === 'teams') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'team1', name: 'Test Team' },
                  error: null
                }),
              }),
            }),
          };
        }
        if (table === 'team_memberships') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: [
                    { player_id: 'p1', player: { name: 'Player 1' } },
                    { player_id: 'p2', player: { name: 'Player 2' } },
                  ],
                  error: null
                }),
              }),
            }),
          };
        }
        if (table === 'events') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: [
                    { id: 'e1', start_time: '2024-01-15T10:00:00Z' },
                    { id: 'e2', start_time: '2024-01-20T10:00:00Z' },
                  ],
                  error: null
                }),
              }),
            }),
          };
        }
        if (table === 'attendance_records') {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: [
                  { player_id: 'p1', status: 'present' },
                  { player_id: 'p1', status: 'present' },
                  { player_id: 'p2', status: 'present' },
                  { player_id: 'p2', status: 'absent' },
                ],
                error: null
              }),
            }),
          };
        }
      });

      const result = await getTeamAttendanceRate('team1');

      expect(result).toBeDefined();
      expect(result?.teamName).toBe('Test Team');
      // Player 1: 100%, Player 2: 50%, Average: 75%
      expect(result?.averageAttendanceRate).toBe(75);
      expect(result?.totalEvents).toBe(2);
      expect(result?.trend).toBe('stable');
    });

    it('should detect upward trend', async () => {
      const dateRange: DateRange = {
        startDate: '2024-02-01T00:00:00Z',
        endDate: '2024-02-29T23:59:59Z',
      };

      const fromMock = vi.fn();
      (supabase.from as any) = fromMock;

      let callCount = 0;

      fromMock.mockImplementation((table: string) => {
        if (table === 'teams') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'team1', name: 'Test Team' },
                  error: null
                }),
              }),
            }),
          };
        }
        if (table === 'team_memberships') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: [{ player_id: 'p1', player: { name: 'Player 1' } }],
                  error: null
                }),
              }),
            }),
          };
        }
        if (table === 'events') {
          callCount++;
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  gte: vi.fn().mockReturnValue({
                    lte: vi.fn().mockResolvedValue({
                      data: [{ id: `e${callCount}`, start_time: '2024-02-15T10:00:00Z' }],
                      error: null
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        if (table === 'attendance_records') {
          return {
            select: vi.fn().mockReturnValue({
              in: vi.fn().mockResolvedValue({
                data: callCount === 1
                  ? [{ player_id: 'p1', status: 'present' }] // Current: 100%
                  : [{ player_id: 'p1', status: 'absent' }],  // Previous: 0%
                error: null
              }),
            }),
          };
        }
      });

      const result = await getTeamAttendanceRate('team1', dateRange);

      expect(result?.trend).toBe('up');
    });

    it('should handle empty team gracefully', async () => {
      const fromMock = vi.fn();
      (supabase.from as any) = fromMock;

      fromMock.mockImplementation((table: string) => {
        if (table === 'teams') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'team1', name: 'Empty Team' },
                  error: null
                }),
              }),
            }),
          };
        }
        if (table === 'team_memberships') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          };
        }
      });

      const result = await getTeamAttendanceRate('team1');

      expect(result).toBeDefined();
      expect(result?.averageAttendanceRate).toBe(0);
      expect(result?.totalEvents).toBe(0);
      expect(result?.trend).toBe('stable');
    });
  });

  describe('getPracticeFrequency', () => {
    it('should calculate practice frequency correctly', async () => {
      const dateRange: DateRange = {
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-01-31T23:59:59Z', // 31 days
      };

      const mockPractices = Array(12).fill(null).map((_, i) => ({
        id: `practice${i}`,
        start_time: `2024-01-${i + 1}T10:00:00Z`,
      }));

      const fromMock = vi.fn();
      (supabase.from as any) = fromMock;

      fromMock.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              gte: vi.fn().mockReturnValue({
                lte: vi.fn().mockResolvedValue({ data: mockPractices, error: null }),
              }),
            }),
          }),
        }),
      });

      const result = await getPracticeFrequency('team1', dateRange);

      expect(result.totalPractices).toBe(12);
      // 31 days ≈ 4.43 weeks, 12 practices / 4.43 weeks ≈ 2.7
      expect(result.practicesPerWeek).toBeGreaterThan(2.5);
      expect(result.practicesPerWeek).toBeLessThan(3.0);
      // 31 days ≈ 1.03 months, 12 practices / 1.03 months ≈ 11.6
      expect(result.practicesPerMonth).toBeGreaterThan(11.0);
      expect(result.practicesPerMonth).toBeLessThan(12.0);
    });

    it('should return zeros when no date range provided', async () => {
      const fromMock = vi.fn();
      (supabase.from as any) = fromMock;

      fromMock.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      });

      const result = await getPracticeFrequency('team1');

      expect(result.totalPractices).toBe(0);
      expect(result.practicesPerWeek).toBe(0);
      expect(result.practicesPerMonth).toBe(0);
    });
  });

  describe('getTopDrills', () => {
    it('should return top drills sorted by execution count', async () => {
      const mockExecutions = [
        { drill_id: 'drill1', drill: { name: 'Passing Drill' }, coach_rating: 5, executed_at: '2024-01-15T10:00:00Z' },
        { drill_id: 'drill1', drill: { name: 'Passing Drill' }, coach_rating: 4, executed_at: '2024-01-16T10:00:00Z' },
        { drill_id: 'drill1', drill: { name: 'Passing Drill' }, coach_rating: 5, executed_at: '2024-01-17T10:00:00Z' },
        { drill_id: 'drill2', drill: { name: 'Serving Drill' }, coach_rating: 3, executed_at: '2024-01-15T10:00:00Z' },
        { drill_id: 'drill2', drill: { name: 'Serving Drill' }, coach_rating: 4, executed_at: '2024-01-16T10:00:00Z' },
        { drill_id: 'drill3', drill: { name: 'Blocking Drill' }, coach_rating: 5, executed_at: '2024-01-15T10:00:00Z' },
      ];

      const fromMock = vi.fn();
      (supabase.from as any) = fromMock;

      fromMock.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: mockExecutions, error: null }),
        }),
      });

      const result = await getTopDrills('team1', 3);

      expect(result).toHaveLength(3);
      expect(result[0].drillId).toBe('drill1');
      expect(result[0].executionCount).toBe(3);
      expect(result[0].averageRating).toBe(4.7); // (5+4+5)/3 = 4.666... ≈ 4.7
      expect(result[1].drillId).toBe('drill2');
      expect(result[1].executionCount).toBe(2);
      expect(result[2].drillId).toBe('drill3');
      expect(result[2].executionCount).toBe(1);
    });

    it('should return empty array when no executions exist', async () => {
      const fromMock = vi.fn();
      (supabase.from as any) = fromMock;

      fromMock.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      });

      const result = await getTopDrills('team1');
      expect(result).toEqual([]);
    });

    it('should track last execution date', async () => {
      const mockExecutions = [
        { drill_id: 'drill1', drill: { name: 'Test' }, coach_rating: 5, executed_at: '2024-01-15T10:00:00Z' },
        { drill_id: 'drill1', drill: { name: 'Test' }, coach_rating: 5, executed_at: '2024-01-20T10:00:00Z' },
      ];

      const fromMock = vi.fn();
      (supabase.from as any) = fromMock;

      fromMock.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: mockExecutions, error: null }),
        }),
      });

      const result = await getTopDrills('team1');

      expect(result[0].lastExecuted).toBe('2024-01-20T10:00:00Z');
    });
  });

  describe('getDateRangePreset', () => {
    it('should generate correct date range for week preset', () => {
      const result = getDateRangePreset('week');

      const start = new Date(result.startDate);
      const end = new Date(result.endDate);
      const diffDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

      expect(diffDays).toBe(7);
    });

    it('should generate correct date range for month preset', () => {
      const result = getDateRangePreset('month');

      const start = new Date(result.startDate);
      const end = new Date(result.endDate);
      const diffDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

      expect(diffDays).toBe(30);
    });

    it('should generate correct date range for season preset', () => {
      const result = getDateRangePreset('season');

      const start = new Date(result.startDate);
      const end = new Date(result.endDate);
      const diffDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

      expect(diffDays).toBe(180);
    });

    it('should return ISO string dates', () => {
      const result = getDateRangePreset('week');

      expect(() => new Date(result.startDate)).not.toThrow();
      expect(() => new Date(result.endDate)).not.toThrow();
      expect(result.startDate).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(result.endDate).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });
});
