import { describe, it, expect } from 'vitest';
import { eventSchema } from './event';

describe('eventSchema', () => {
  describe('valid data', () => {
    it('should validate a complete practice event', () => {
      const validEvent = {
        title: 'Evening Practice',
        type: 'practice' as const,
        startTime: '2026-02-01T18:00',
        endTime: '2026-02-01T20:00',
        location: 'Main Gym',
        notes: 'Focus on serving drills',
      };

      const result = eventSchema.safeParse(validEvent);
      expect(result.success).toBe(true);
    });

    it('should validate a game with opponent', () => {
      const validEvent = {
        title: 'League Game',
        type: 'game' as const,
        startTime: '2026-02-05T19:00',
        endTime: '2026-02-05T21:00',
        location: 'Away Gym',
        opponent: 'Vikings VK',
      };

      const result = eventSchema.safeParse(validEvent);
      expect(result.success).toBe(true);
    });

    it('should validate minimal event with only required fields', () => {
      const minimalEvent = {
        title: 'Team Meeting',
        type: 'meeting' as const,
        startTime: '2026-02-01T17:00',
        endTime: '2026-02-01T18:00',
      };

      const result = eventSchema.safeParse(minimalEvent);
      expect(result.success).toBe(true);
    });

    it('should allow empty strings for optional fields', () => {
      const event = {
        title: 'Practice',
        type: 'practice' as const,
        startTime: '2026-02-01T18:00',
        endTime: '2026-02-01T20:00',
        location: '',
        opponent: '',
        notes: '',
      };

      const result = eventSchema.safeParse(event);
      expect(result.success).toBe(true);
    });
  });

  describe('invalid data', () => {
    it('should reject missing title', () => {
      const invalidEvent = {
        type: 'practice' as const,
        startTime: '2026-02-01T18:00',
        endTime: '2026-02-01T20:00',
      };

      const result = eventSchema.safeParse(invalidEvent);
      expect(result.success).toBe(false);
    });

    it('should reject invalid event type', () => {
      const invalidEvent = {
        title: 'Test Event',
        type: 'invalid-type',
        startTime: '2026-02-01T18:00',
        endTime: '2026-02-01T20:00',
      };

      const result = eventSchema.safeParse(invalidEvent);
      expect(result.success).toBe(false);
    });

    it('should reject end time before start time', () => {
      const invalidEvent = {
        title: 'Test Event',
        type: 'practice' as const,
        startTime: '2026-02-01T20:00',
        endTime: '2026-02-01T18:00',
      };

      const result = eventSchema.safeParse(invalidEvent);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('endTime');
      }
    });

    it('should reject game without opponent', () => {
      const invalidEvent = {
        title: 'Game',
        type: 'game' as const,
        startTime: '2026-02-01T18:00',
        endTime: '2026-02-01T20:00',
        opponent: '',
      };

      const result = eventSchema.safeParse(invalidEvent);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('opponent');
        expect(result.error.issues[0].message).toContain('required');
      }
    });

    it('should reject missing start time', () => {
      const invalidEvent = {
        title: 'Test Event',
        type: 'practice' as const,
        endTime: '2026-02-01T20:00',
      };

      const result = eventSchema.safeParse(invalidEvent);
      expect(result.success).toBe(false);
    });

    it('should reject missing end time', () => {
      const invalidEvent = {
        title: 'Test Event',
        type: 'practice' as const,
        startTime: '2026-02-01T18:00',
      };

      const result = eventSchema.safeParse(invalidEvent);
      expect(result.success).toBe(false);
    });

    it('should reject title that is too long', () => {
      const invalidEvent = {
        title: 'A'.repeat(101),
        type: 'practice' as const,
        startTime: '2026-02-01T18:00',
        endTime: '2026-02-01T20:00',
      };

      const result = eventSchema.safeParse(invalidEvent);
      expect(result.success).toBe(false);
    });

    it('should reject notes that are too long', () => {
      const invalidEvent = {
        title: 'Practice',
        type: 'practice' as const,
        startTime: '2026-02-01T18:00',
        endTime: '2026-02-01T20:00',
        notes: 'A'.repeat(1001),
      };

      const result = eventSchema.safeParse(invalidEvent);
      expect(result.success).toBe(false);
    });
  });

  describe('conditional validation', () => {
    it('should allow practice without opponent', () => {
      const event = {
        title: 'Practice',
        type: 'practice' as const,
        startTime: '2026-02-01T18:00',
        endTime: '2026-02-01T20:00',
      };

      const result = eventSchema.safeParse(event);
      expect(result.success).toBe(true);
    });

    it('should allow tournament without opponent', () => {
      const event = {
        title: 'Tournament',
        type: 'tournament' as const,
        startTime: '2026-02-01T08:00',
        endTime: '2026-02-01T18:00',
      };

      const result = eventSchema.safeParse(event);
      expect(result.success).toBe(true);
    });
  });
});
