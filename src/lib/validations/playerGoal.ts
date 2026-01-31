import { z } from 'zod';

export const playerGoalSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  description: z.string().max(500).optional(),
  metric_type: z.enum(['kill_pct', 'pass_rating', 'serve_pct', 'attendance', 'custom']),
  target_value: z.number().min(0, 'Target must be positive'),
  deadline: z.string().optional(),
});

export type PlayerGoalFormData = z.infer<typeof playerGoalSchema>;
