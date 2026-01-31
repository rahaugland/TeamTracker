import { z } from 'zod';

/**
 * Zod schema for team creation and editing
 * Based on SPEC.md Team entity
 */
export const teamSchema = z.object({
  name: z
    .string()
    .min(1, 'Team name is required')
    .min(2, 'Team name must be at least 2 characters')
    .max(100, 'Team name must be less than 100 characters'),
  seasonId: z.string().uuid('Invalid season ID'),
});

export type TeamFormData = z.infer<typeof teamSchema>;

/**
 * Zod schema for season creation and editing
 * Based on SPEC.md Season entity
 */
export const seasonSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Season name is required')
      .max(50, 'Season name must be less than 50 characters'),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
  })
  .refine(
    (data) => {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      return end > start;
    },
    {
      message: 'End date must be after start date',
      path: ['endDate'],
    }
  );

export type SeasonFormData = z.infer<typeof seasonSchema>;
