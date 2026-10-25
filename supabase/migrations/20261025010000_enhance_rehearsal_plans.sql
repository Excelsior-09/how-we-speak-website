-- ==============================================================================
-- HOW WE SPEAK — ENHANCE REHEARSAL PLANS FOR CORE AI WEB APPLICATION
-- Migration: 20261025010000_enhance_rehearsal_plans.sql
-- Description: Adds situation_category, communication_method, additional_context,
--              structured_result, and custom_edits to rehearsal_plans.
-- ==============================================================================

ALTER TABLE public.rehearsal_plans
    ADD COLUMN IF NOT EXISTS situation_category TEXT DEFAULT 'other',
    ADD COLUMN IF NOT EXISTS communication_method TEXT DEFAULT 'face-to-face',
    ADD COLUMN IF NOT EXISTS additional_context TEXT,
    ADD COLUMN IF NOT EXISTS structured_result JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS custom_edits JSONB DEFAULT '{}'::jsonb;

-- Ensure index on user_id and created_at for fast history list querying
CREATE INDEX IF NOT EXISTS idx_rehearsal_plans_user_created 
    ON public.rehearsal_plans(user_id, created_at DESC);
