-- Add approval tracking fields to applications table
-- Migration: 20251003_add_approval_tracking_to_applications

DO $$
BEGIN
  -- Add approved_by column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applications' AND column_name = 'approved_by'
  ) THEN
    ALTER TABLE applications ADD COLUMN approved_by uuid REFERENCES profiles(id) ON DELETE SET NULL;
    RAISE NOTICE 'Added approved_by column to applications table';
  ELSE
    RAISE NOTICE 'approved_by column already exists';
  END IF;

  -- Add approved_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applications' AND column_name = 'approved_at'
  ) THEN
    ALTER TABLE applications ADD COLUMN approved_at timestamptz;
    RAISE NOTICE 'Added approved_at column to applications table';
  ELSE
    RAISE NOTICE 'approved_at column already exists';
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_applications_approved_by ON applications(approved_by);
CREATE INDEX IF NOT EXISTS idx_applications_approved_at ON applications(approved_at);
