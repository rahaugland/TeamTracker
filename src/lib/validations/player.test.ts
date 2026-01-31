import { describe, it, expect } from 'vitest';
import { playerSchema } from './player';

describe('playerSchema', () => {
  describe('valid data', () => {
    it('should validate a complete player', () => {
      const validPlayer = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+47 123 45 678',
        birthDate: '2000-01-15',
        positions: ['setter'],
        jerseyNumber: 12,
      };

      const result = playerSchema.safeParse(validPlayer);
      expect(result.success).toBe(true);
    });

    it('should validate a minimal player with only required fields', () => {
      const minimalPlayer = {
        name: 'Jane Smith',
        positions: ['libero', 'defensiveSpecialist'],
      };

      const result = playerSchema.safeParse(minimalPlayer);
      expect(result.success).toBe(true);
    });

    it('should allow up to 3 positions', () => {
      const player = {
        name: 'Multi Position Player',
        positions: ['setter', 'libero', 'outsideHitter'],
      };

      const result = playerSchema.safeParse(player);
      expect(result.success).toBe(true);
    });

    it('should allow empty strings for optional fields', () => {
      const player = {
        name: 'Test Player',
        email: '',
        phone: '',
        birthDate: '',
        positions: ['middleBlocker'],
      };

      const result = playerSchema.safeParse(player);
      expect(result.success).toBe(true);
    });
  });

  describe('invalid data', () => {
    it('should reject missing name', () => {
      const invalidPlayer = {
        positions: ['setter'],
      };

      const result = playerSchema.safeParse(invalidPlayer);
      expect(result.success).toBe(false);
    });

    it('should reject name that is too short', () => {
      const invalidPlayer = {
        name: 'A',
        positions: ['setter'],
      };

      const result = playerSchema.safeParse(invalidPlayer);
      expect(result.success).toBe(false);
    });

    it('should reject invalid email format', () => {
      const invalidPlayer = {
        name: 'Test Player',
        email: 'not-an-email',
        positions: ['setter'],
      };

      const result = playerSchema.safeParse(invalidPlayer);
      expect(result.success).toBe(false);
    });

    it('should reject invalid phone format', () => {
      const invalidPlayer = {
        name: 'Test Player',
        phone: 'abc123!@#',
        positions: ['setter'],
      };

      const result = playerSchema.safeParse(invalidPlayer);
      expect(result.success).toBe(false);
    });

    it('should reject empty positions array', () => {
      const invalidPlayer = {
        name: 'Test Player',
        positions: [],
      };

      const result = playerSchema.safeParse(invalidPlayer);
      expect(result.success).toBe(false);
    });

    it('should reject more than 3 positions', () => {
      const invalidPlayer = {
        name: 'Test Player',
        positions: ['setter', 'libero', 'outsideHitter', 'middleBlocker'],
      };

      const result = playerSchema.safeParse(invalidPlayer);
      expect(result.success).toBe(false);
    });

    it('should reject jersey number outside valid range', () => {
      const invalidPlayer = {
        name: 'Test Player',
        positions: ['setter'],
        jerseyNumber: 100,
      };

      const result = playerSchema.safeParse(invalidPlayer);
      expect(result.success).toBe(false);
    });

    it('should reject negative jersey number', () => {
      const invalidPlayer = {
        name: 'Test Player',
        positions: ['setter'],
        jerseyNumber: -1,
      };

      const result = playerSchema.safeParse(invalidPlayer);
      expect(result.success).toBe(false);
    });
  });
});
