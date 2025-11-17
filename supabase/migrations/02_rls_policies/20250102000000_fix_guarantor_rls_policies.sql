/*
  # Fix Guarantor RLS Policies Migration

  This migration fixes the Row Level Security policies for the guarantors table.
  The issue was that the UPDATE policy only allowed users to update guarantors
  associated with their applications, but during upsert operations, users need
  to be able to update guarantors they have created.

  ## Changes
  - Add created_by field to guarantors table to track who created each guarantor
  - Update RLS policies to allow users to update guarantors they created
  - Add index on created_by field for performance
*/

-- =====================================================
-- STEP 1: ADD CREATED_BY FIELD TO GUARANTORS TABLE
-- =====================================================

ALTER TABLE guarantors ADD COLUMN created_by uuid REFERENCES auth.users(id);

-- Update existing guarantors to have a created_by value (use a default user or set to null)
-- Since we don't know who created existing guarantors, we'll set them to null
-- This means they'll only be updatable by users who have applications with them

-- =====================================================
-- STEP 2: CREATE INDEX FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_guarantors_created_by ON guarantors(created_by);

-- =====================================================
-- STEP 3: UPDATE RLS POLICIES FOR GUARANTORS
-- =====================================================

-- Drop ALL existing policies to avoid conflicts - using a more comprehensive approach
DO $$
DECLARE
    policy_name text;
BEGIN
    FOR policy_name IN
        SELECT polname FROM pg_policy WHERE polrelid = 'guarantors'::regclass
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(policy_name) || ' ON guarantors';
    END LOOP;
END $$;

-- Create clean, simple policies
CREATE POLICY "guarantors_select"
  ON guarantors FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT guarantor_id FROM applications
      WHERE applicant_id = auth.uid() OR property_id IN (
        SELECT id FROM properties WHERE owner_id = auth.uid()
      )
    ) OR created_by = auth.uid()
  );

CREATE POLICY "guarantors_insert"
  ON guarantors FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "guarantors_update"
  ON guarantors FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid() OR
    id IN (
      SELECT guarantor_id FROM applications WHERE applicant_id = auth.uid()
    )
  );

-- =====================================================
-- STEP 4: UPDATE APPLICATION CODE TO SET CREATED_BY
-- =====================================================

-- The application code in RentalApplicationForm.tsx needs to be updated
-- to set the created_by field when inserting guarantors.
-- This will be handled in the frontend code update.

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'Guarantor RLS policies fixed successfully!';
  RAISE NOTICE 'Added created_by field to track guarantor ownership';
  RAISE NOTICE 'Updated policies to allow proper upsert operations';
END $$;
