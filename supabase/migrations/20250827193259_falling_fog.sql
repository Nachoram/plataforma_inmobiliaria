/*
  # Update offers table for advanced offer form

  1. New Columns
    - `financing_type` (text) - How the buyer plans to finance the purchase
    - `selected_services` (text[]) - Array of selected service IDs
    - `services_total_cost` (numeric) - Total cost of selected services
    - `buyer_info` (jsonb) - Complete buyer information including personal details
    - `payment_status` (text) - Status of service payment

  2. Security
    - Maintain existing RLS policies
    - Add constraints for new fields

  3. Data Migration
    - Set default values for existing records
    - Ensure backward compatibility
*/

-- Add new columns to offers table
DO $$
BEGIN
  -- Add financing_type column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'offers' AND column_name = 'financing_type'
  ) THEN
    ALTER TABLE offers ADD COLUMN financing_type text DEFAULT 'contado';
  END IF;

  -- Add selected_services column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'offers' AND column_name = 'selected_services'
  ) THEN
    ALTER TABLE offers ADD COLUMN selected_services text[] DEFAULT '{}';
  END IF;

  -- Add services_total_cost column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'offers' AND column_name = 'services_total_cost'
  ) THEN
    ALTER TABLE offers ADD COLUMN services_total_cost numeric DEFAULT 0;
  END IF;

  -- Add buyer_info column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'offers' AND column_name = 'buyer_info'
  ) THEN
    ALTER TABLE offers ADD COLUMN buyer_info jsonb DEFAULT '{}';
  END IF;

  -- Add payment_status column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'offers' AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE offers ADD COLUMN payment_status text DEFAULT 'no_aplica';
  END IF;
END $$;

-- Add constraints for new fields
DO $$
BEGIN
  -- Constraint for financing_type
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'offers_financing_type_check'
  ) THEN
    ALTER TABLE offers ADD CONSTRAINT offers_financing_type_check 
    CHECK (financing_type IN ('contado', 'credito_preaprobado', 'credito_tramitacion'));
  END IF;

  -- Constraint for payment_status
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'offers_payment_status_check'
  ) THEN
    ALTER TABLE offers ADD CONSTRAINT offers_payment_status_check 
    CHECK (payment_status IN ('no_aplica', 'pendiente', 'pagado', 'cancelado'));
  END IF;
END $$;