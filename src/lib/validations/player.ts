import { z } from 'zod';

/**
 * Player positions in volleyball
 */
export const playerPositions = [
  'setter',
  'libero',
  'outsideHitter',
  'middleBlocker',
  'oppositeHitter',
  'defensiveSpecialist',
] as const;

export type PlayerPosition = (typeof playerPositions)[number];

/**
 * Zod schema for player creation and editing
 * Based on SPEC.md Player entity
 */
export const playerSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  email: z
    .string()
    .email('Invalid email address')
    .optional()
    .or(z.literal('')),
  phone: z
    .string()
    .regex(/^[\d\s\-+()]*$/, 'Invalid phone number format')
    .optional()
    .or(z.literal('')),
  birthDate: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine(
      (date) => {
        if (!date) return true;
        const parsed = new Date(date);
        return !isNaN(parsed.getTime());
      },
      { message: 'Invalid date format' }
    ),
  positions: z
    .array(z.enum(playerPositions))
    .min(1, 'At least one position is required')
    .max(3, 'Maximum 3 positions allowed'),
  jerseyNumber: z
    .number()
    .int('Jersey number must be an integer')
    .min(0, 'Jersey number must be positive')
    .max(99, 'Jersey number must be less than 100')
    .optional(),
});

export type PlayerFormData = z.infer<typeof playerSchema>;
