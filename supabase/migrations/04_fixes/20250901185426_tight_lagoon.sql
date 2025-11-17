/*
  # Add visit availability fields to properties table

  1. New Fields
    - `available_days` (text array) - Days of the week when visits are available
    - `available_time_slots` (text array) - Time slots when visits are available
  
  2. Changes
    - Add two new optional fields to store visit availability preferences
    - These fields will help coordinate visits between property owners and interested parties
*/

-- Add visit availability fields to properties table
DO $$
BEGIN
  -- Add available_days column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'available_days'
  ) THEN
    ALTER TABLE properties ADD COLUMN available_days text[] DEFAULT '{}';
  END IF;

  -- Add available_time_slots column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'available_time_slots'
  ) THEN
    ALTER TABLE properties ADD COLUMN available_time_slots text[] DEFAULT '{}';
  END IF;
END $$;