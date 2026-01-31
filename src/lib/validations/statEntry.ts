import { z } from 'zod';

/**
 * Zod schema for stat entry creation and editing
 */
export const statEntrySchema = z
  .object({
    kills: z.number().min(0, 'Kills cannot be negative').default(0),
    attack_errors: z.number().min(0, 'Attack errors cannot be negative').default(0),
    attack_attempts: z.number().min(0, 'Attack attempts cannot be negative').default(0),
    aces: z.number().min(0, 'Aces cannot be negative').default(0),
    service_errors: z.number().min(0, 'Service errors cannot be negative').default(0),
    serve_attempts: z.number().min(0, 'Serve attempts cannot be negative').default(0),
    digs: z.number().min(0, 'Digs cannot be negative').default(0),
    block_solos: z.number().min(0, 'Block solos cannot be negative').default(0),
    block_assists: z.number().min(0, 'Block assists cannot be negative').default(0),
    block_touches: z.number().min(0, 'Block touches cannot be negative').default(0),
    set_attempts: z.number().min(0, 'Set attempts cannot be negative').default(0),
    set_sum: z.number().min(0, 'Set sum cannot be negative').default(0),
    setting_errors: z.number().min(0, 'Setting errors cannot be negative').default(0),
    ball_handling_errors: z.number().min(0, 'Ball handling errors cannot be negative').default(0),
    pass_attempts: z.number().min(0, 'Pass attempts cannot be negative').default(0),
    pass_sum: z.number().min(0, 'Pass sum cannot be negative').default(0),
    rotation: z.number().min(1).max(6).optional().nullable(),
    sets_played: z.number().min(0, 'Sets played cannot be negative').default(0),
    rotations_played: z.number().min(0, 'Rotations played cannot be negative').default(0),
  })
  .refine(
    (data) => {
      // Attack attempts must be >= kills + attack errors
      return data.attack_attempts >= data.kills + data.attack_errors;
    },
    {
      message: 'Attack attempts must be at least the sum of kills and attack errors',
      path: ['attack_attempts'],
    }
  )
  .refine(
    (data) => {
      // Serve attempts must be >= aces + service errors
      return data.serve_attempts >= data.aces + data.service_errors;
    },
    {
      message: 'Serve attempts must be at least the sum of aces and service errors',
      path: ['serve_attempts'],
    }
  )
  .refine(
    (data) => {
      // If pass_attempts > 0, pass_sum should be reasonable (max 3 per attempt)
      if (data.pass_attempts > 0) {
        return data.pass_sum <= data.pass_attempts * 3;
      }
      return true;
    },
    {
      message: 'Pass sum cannot exceed 3 times the number of pass attempts',
      path: ['pass_sum'],
    }
  )
  .refine(
    (data) => {
      // If set_attempts > 0, set_sum should be reasonable (max 3 per attempt)
      if (data.set_attempts > 0) {
        return data.set_sum <= data.set_attempts * 3;
      }
      return true;
    },
    {
      message: 'Set sum cannot exceed 3 times the number of set attempts',
      path: ['set_sum'],
    }
  );

export type StatEntryFormData = z.infer<typeof statEntrySchema>;
