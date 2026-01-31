import { z } from 'zod';

/**
 * Practice plan validation schema
 */
export const practicePlanSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  team_id: z.string().uuid('Invalid team ID'),
  date: z.string().optional().or(z.literal('')),
  notes: z.string().optional(),
});

export type PracticePlanFormData = z.infer<typeof practicePlanSchema>;

/**
 * Practice block types
 */
export const blockTypes = [
  'warmup',
  'drill',
  'scrimmage',
  'cooldown',
  'break',
  'custom',
] as const;

/**
 * Practice block validation schema
 */
export const practiceBlockSchema = z.object({
  type: z.enum(blockTypes),
  drill_id: z.string().uuid().optional().nullable(),
  custom_title: z.string().optional(),
  duration_minutes: z.number().int().min(1, 'Duration must be at least 1 minute'),
  notes: z.string().optional(),
}).refine(
  (data) => {
    // If type is 'drill', drill_id is required
    if (data.type === 'drill') {
      return !!data.drill_id;
    }
    // If type is 'custom', custom_title is required
    if (data.type === 'custom') {
      return !!data.custom_title && data.custom_title.trim().length > 0;
    }
    return true;
  },
  {
    message: 'Drill blocks require a drill selection, custom blocks require a title',
    path: ['drill_id'],
  }
);

export type PracticeBlockFormData = z.infer<typeof practiceBlockSchema>;
