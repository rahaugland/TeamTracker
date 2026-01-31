import { z } from 'zod';
import { SKILL_TAGS } from '@/types/database.types';

/**
 * Drill validation schema
 */
export const drillSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().min(1, 'Description is required'),
  skill_tags: z.array(z.string()).min(1, 'At least one skill tag is required'),
  custom_tags: z.array(z.string()).optional(),
  progression_level: z.number().min(1).max(5),
  parent_drill_id: z.string().uuid().optional().nullable(),
  min_players: z.number().int().min(1).optional().nullable(),
  max_players: z.number().int().min(1).optional().nullable(),
  equipment_needed: z.array(z.string()).optional(),
  duration_minutes: z.number().int().min(1).optional().nullable(),
  video_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
}).refine(
  (data) => {
    if (data.min_players && data.max_players) {
      return data.max_players >= data.min_players;
    }
    return true;
  },
  {
    message: 'Maximum players must be greater than or equal to minimum players',
    path: ['max_players'],
  }
);

export type DrillFormData = z.infer<typeof drillSchema>;

export const skillTags = [...SKILL_TAGS] as const;
