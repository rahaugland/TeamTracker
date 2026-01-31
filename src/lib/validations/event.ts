import { z } from 'zod';

/**
 * Event types in the system
 */
export const eventTypes = [
  'practice',
  'game',
  'tournament',
  'meeting',
  'other',
] as const;

export type EventType = (typeof eventTypes)[number];

/**
 * Zod schema for event creation and editing
 * Based on SPEC.md Event entity
 */
export const eventSchema = z
  .object({
    title: z
      .string()
      .min(1, 'Event title is required')
      .max(100, 'Title must be less than 100 characters'),
    type: z.enum(eventTypes),
    startTime: z.string().min(1, 'Start time is required'),
    endTime: z.string().min(1, 'End time is required'),
    location: z
      .string()
      .max(200, 'Location must be less than 200 characters')
      .optional()
      .or(z.literal('')),
    opponent: z
      .string()
      .max(100, 'Opponent name must be less than 100 characters')
      .optional()
      .or(z.literal('')),
    opponentTier: z
      .number()
      .min(1)
      .max(9)
      .optional(),
    notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional(),
    // Recurring fields (only for practices)
    isRecurring: z.boolean().optional(),
    recurringDays: z.array(z.number().min(0).max(6)).optional(), // 0 = Sunday, 6 = Saturday
    recurringWeeks: z.number().min(1).max(52).optional(),
  })
  .refine(
    (data) => {
      const start = new Date(data.startTime);
      const end = new Date(data.endTime);
      return end > start;
    },
    {
      message: 'End time must be after start time',
      path: ['endTime'],
    }
  )
  .refine(
    (data) => {
      // Opponent is required for games
      if (data.type === 'game' && !data.opponent) {
        return false;
      }
      return true;
    },
    {
      message: 'Opponent is required for games',
      path: ['opponent'],
    }
  );

export type EventFormData = z.infer<typeof eventSchema>;
