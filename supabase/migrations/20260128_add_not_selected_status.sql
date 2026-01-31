-- Migration: Add 'not_selected' attendance status
-- Date: 2026-01-28
-- Description: Add status for players who were available but not selected for the game squad

ALTER TYPE attendance_status ADD VALUE 'not_selected';
