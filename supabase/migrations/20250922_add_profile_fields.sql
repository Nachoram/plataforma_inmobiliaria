-- Migration: Add extended profile fields for rental applications
-- Purpose: Align profiles with RentalApplicationForm requirements

BEGIN;

-- monthly income for applicant
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS monthly_income_clp bigint DEFAULT 0;

-- nationality of applicant
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS nationality text DEFAULT 'Chilena';

-- date of birth (used to derive age)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS date_of_birth date;

-- job seniority (human-readable text or enum in the future)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS job_seniority text;

COMMIT;


