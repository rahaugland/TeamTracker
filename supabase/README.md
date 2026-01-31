# Supabase Database Schema

This directory contains SQL migration files for the TeamTracker database.

## Files

- `20260123_initial_schema.sql` - Complete database schema with all tables, indexes, and triggers
- `20260123_rls_policies.sql` - Row Level Security policies for role-based access control

## Schema Overview

### Core Entities

- **profiles** - User accounts (extends Supabase auth.users)
- **players** - Player profiles (continuous across seasons)
- **teams** - Team definitions
- **seasons** - Season management
- **team_memberships** - Links players to teams with history

### Scheduling & Attendance

- **events** - Practices, games, meetings
- **rsvps** - Pre-event availability responses
- **attendance_records** - Post-event actual attendance

### Practice Planning

- **drills** - Drill library with progressions
- **practice_plans** - Practice templates
- **practice_blocks** - Drill sequences within practice plans
- **drill_executions** - Track when drills are performed

### Analytics (Phase 2)

- **stat_entries** - Game statistics

### Access Control

- **coach_assignments** - Links coaches to teams
- **coach_notes** - Private coach notes (RLS protected)
- **parent_child_links** - Parent-child relationships

## Applying Migrations

### Using Supabase CLI

```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Apply migrations
supabase db push
```

### Manual Application

1. Open Supabase Dashboard
2. Navigate to SQL Editor
3. Run each migration file in order:
   - `20260123_initial_schema.sql`
   - `20260123_rls_policies.sql`

## Row Level Security

All tables have RLS enabled with policies that enforce:

- **Head Coaches**: Full access to their teams
- **Assistant Coaches**: Full access except user management
- **Players**: View own data, RSVP for events
- **Parents**: View child's data, RSVP on behalf of child
- **Coach Notes**: PRIVATE - only coaches can view

## TypeScript Types

Generated TypeScript types are in `src/types/database.types.ts`.

## Development vs Production

Use separate Supabase projects for:
- **Development**: Testing and development
- **Production**: Live data

Keep `.env` files separate:
- `.env.local` (dev)
- `.env.production` (prod)

## Future Migrations

When adding new migrations:
1. Name with timestamp: `YYYYMMDD_description.sql`
2. Always use `IF NOT EXISTS` for safety
3. Test in development first
4. Document changes in this README
