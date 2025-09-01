/*
  # Update properties table structure for Chilean regions and communes

  1. Schema Changes
    - Remove `city` column and replace with `region` and `commune`
    - Add `apartment_number` for property address details
    - Remove owner contact fields (`owner_email`, `owner_phone`) 
    - Add owner address structure with `owner_apartment_number`, `owner_region`, `owner_commune`
    - Update constraints and defaults

  2. Data Migration
    - Safely migrate existing data where possible
    - Set default values for new required fields

  3. Security
    - Maintain existing RLS policies
    - Update any affected policies if needed
*/

-- Add new columns for property location
DO $$
BEGIN
  -- Add apartment_number for property
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'apartment_number'
  ) THEN
    ALTER TABLE properties ADD COLUMN apartment_number text;
  END IF;

  -- Add region for property
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'region'
  ) THEN
    ALTER TABLE properties ADD COLUMN region text NOT NULL DEFAULT 'region-metropolitana';
  END IF;

  -- Add commune for property
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'commune'
  ) THEN
    ALTER TABLE properties ADD COLUMN commune text NOT NULL DEFAULT 'Santiago';
  END IF;

  -- Add owner apartment number
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'owner_apartment_number'
  ) THEN
    ALTER TABLE properties ADD COLUMN owner_apartment_number text;
  END IF;

  -- Add owner region
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'owner_region'
  ) THEN
    ALTER TABLE properties ADD COLUMN owner_region text NOT NULL DEFAULT 'region-metropolitana';
  END IF;

  -- Add owner commune
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'owner_commune'
  ) THEN
    ALTER TABLE properties ADD COLUMN owner_commune text NOT NULL DEFAULT 'Santiago';
  END IF;
END $$;

-- Migrate existing city data to commune (if city column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'city'
  ) THEN
    -- Update commune with city data where available
    UPDATE properties 
    SET commune = city 
    WHERE city IS NOT NULL AND city != '';
    
    -- Drop the city column
    ALTER TABLE properties DROP COLUMN IF EXISTS city;
  END IF;
END $$;

-- Drop country column if it exists (we're focusing on Chile)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'country'
  ) THEN
    ALTER TABLE properties DROP COLUMN country;
  END IF;
END $$;

-- Remove owner contact columns (email and phone will come from profiles table)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'owner_email'
  ) THEN
    ALTER TABLE properties DROP COLUMN owner_email;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'owner_phone'
  ) THEN
    ALTER TABLE properties DROP COLUMN owner_phone;
  END IF;
END $$;

-- Update owner_address to be required
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'owner_address'
  ) THEN
    -- Set default value for existing null records
    UPDATE properties 
    SET owner_address = 'Dirección no especificada' 
    WHERE owner_address IS NULL OR owner_address = '';
    
    -- Make the column NOT NULL
    ALTER TABLE properties ALTER COLUMN owner_address SET NOT NULL;
    ALTER TABLE properties ALTER COLUMN owner_address SET DEFAULT '';
  END IF;
END $$;

-- Remove default constraints from new required columns after data migration
ALTER TABLE properties ALTER COLUMN region DROP DEFAULT;
ALTER TABLE properties ALTER COLUMN commune DROP DEFAULT;
ALTER TABLE properties ALTER COLUMN owner_region DROP DEFAULT;
ALTER TABLE properties ALTER COLUMN owner_commune DROP DEFAULT;

-- Create visit_requests table if it doesn't exist
CREATE TABLE IF NOT EXISTS visit_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  requested_date date NOT NULL,
  requested_time_slot text NOT NULL CHECK (requested_time_slot IN ('morning', 'afternoon', 'flexible')),
  message text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected', 'completed')),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on visit_requests
ALTER TABLE visit_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for visit_requests
CREATE POLICY "Users can create visit requests"
  ON visit_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own visit requests"
  ON visit_requests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Property owners can read visit requests for their properties"
  ON visit_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = visit_requests.property_id
      AND properties.owner_id = auth.uid()
    )
  );

CREATE POLICY "Property owners can update visit requests for their properties"
  ON visit_requests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = visit_requests.property_id
      AND properties.owner_id = auth.uid()
    )
  );