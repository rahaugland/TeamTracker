import { z } from 'zod';
import type { VolleyballPosition } from '@/types/database.types';

/**
 * Player positions matching database enum
 */
export const volleyballPositions: VolleyballPosition[] = [
  'setter',
  'outside_hitter',
  'middle_blocker',
  'opposite',
  'libero',
  'defensive_specialist',
  'all_around',
];

/**
 * Zod schema for player creation and editing
 */
export const playerSchemaNew = z.object({
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
    .array(
      z.enum([
        'setter',
        'outside_hitter',
        'middle_blocker',
        'opposite',
        'libero',
        'defensive_specialist',
        'all_around',
      ])
    )
    .min(1, 'At least one position is required')
    .max(3, 'Maximum 3 positions allowed'),
  photoUrl: z
    .string()
    .url('Invalid URL format')
    .optional()
    .or(z.literal('')),
});

export type PlayerFormDataNew = z.infer<typeof playerSchemaNew>;

/**
 * Coach note validation
 */
export const coachNoteSchema = z.object({
  content: z
    .string()
    .min(1, 'Note content is required')
    .max(5000, 'Note must be less than 5000 characters'),
  tags: z.array(z.string()).optional().default([]),
});

export type CoachNoteFormData = z.infer<typeof coachNoteSchema>;
