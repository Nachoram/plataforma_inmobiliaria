/*
  # Update applications table for advanced rental applications

  1. New Columns
    - `applicant_data` (jsonb) - Stores complete applicant and guarantor information
    - `documents_urls` (text[]) - Array of uploaded document URLs
  
  2. Changes
    - Extends existing applications table to support advanced rental application data
    - Maintains backward compatibility with existing simple applications
*/

-- Add new columns to applications table
DO $$
BEGIN
  -- Add applicant_data column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applications' AND column_name = 'applicant_data'
  ) THEN
    ALTER TABLE applications ADD COLUMN applicant_data jsonb DEFAULT '{}';
  END IF;

  -- Add documents_urls column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'applications' AND column_name = 'documents_urls'
  ) THEN
    ALTER TABLE applications ADD COLUMN documents_urls text[] DEFAULT '{}';
  END IF;
END $$;