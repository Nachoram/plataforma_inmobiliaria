/*
  # Fix Offers Table Foreign Key Relationship

  This migration ensures that the offers table has the correct foreign key
  relationship with the profiles table, fixing the PGRST200 error.

  ## Problem Solved
  - PostgREST error: "Could not find a relationship between 'offers' and 'profiles' in the schema cache"
  - Frontend was trying to JOIN using incorrect column name (buyer_id vs offerer_id)

  ## Changes Made
  - Verifies offers table exists and has correct structure
  - Ensures offerer_id column exists with correct foreign key constraint
  - Recreates foreign key constraint if needed
  - Updates RLS policies to use correct column name
*/

-- =====================================================
-- STEP 1: VERIFY OFFERS TABLE EXISTS
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'offers'
  ) THEN
    RAISE EXCEPTION 'Table offers does not exist. Please run the main migration first.';
  END IF;
END $$;

-- =====================================================
-- STEP 2: ENSURE OFFERER_ID COLUMN EXISTS
-- =====================================================

-- Add offerer_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'offers'
    AND column_name = 'offerer_id'
  ) THEN
    ALTER TABLE public.offers ADD COLUMN offerer_id UUID;
    RAISE NOTICE 'Added offerer_id column to offers table';
  END IF;
END $$;

-- =====================================================
-- STEP 3: ENSURE FOREIGN KEY CONSTRAINT EXISTS
-- =====================================================

-- Drop existing constraint if it exists (to recreate it)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public'
    AND table_name = 'offers'
    AND constraint_name = 'offers_offerer_id_fkey'
  ) THEN
    ALTER TABLE public.offers DROP CONSTRAINT offers_offerer_id_fkey;
    RAISE NOTICE 'Dropped existing offers_offerer_id_fkey constraint';
  END IF;
END $$;

-- Create the foreign key constraint
ALTER TABLE public.offers
ADD CONSTRAINT offers_offerer_id_fkey
FOREIGN KEY (offerer_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- =====================================================
-- STEP 4: UPDATE RLS POLICIES TO USE CORRECT COLUMN
-- =====================================================

-- Drop old policies that might reference incorrect column names
DROP POLICY IF EXISTS "Users can view their own offers" ON public.offers;
DROP POLICY IF EXISTS "Property owners can view offers for their properties" ON public.offers;
DROP POLICY IF EXISTS "Users can create offers" ON public.offers;
DROP POLICY IF EXISTS "Property owners can update offers for their properties" ON public.offers;

-- Recreate policies with correct column references
CREATE POLICY "Users can view their own offers"
  ON public.offers FOR SELECT
  TO authenticated
  USING (auth.uid() = offerer_id);

CREATE POLICY "Property owners can view offers for their properties"
  ON public.offers FOR SELECT
  TO authenticated
  USING (
    property_id IN (
      SELECT id FROM public.properties WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can create offers"
  ON public.offers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = offerer_id);

CREATE POLICY "Property owners can update offers for their properties"
  ON public.offers FOR UPDATE
  TO authenticated
  USING (
    property_id IN (
      SELECT id FROM public.properties WHERE owner_id = auth.uid()
    )
  );

-- =====================================================
-- STEP 5: CREATE INDEX FOR BETTER PERFORMANCE
-- =====================================================

-- Ensure the index exists for the foreign key
CREATE INDEX IF NOT EXISTS idx_offers_offerer_id
ON public.offers(offerer_id);

-- =====================================================
-- STEP 6: MIGRATE EXISTING DATA (IF NEEDED)
-- =====================================================

-- If there's a buyer_id column from old code, migrate data
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'offers'
    AND column_name = 'buyer_id'
  ) THEN
    -- Copy data from buyer_id to offerer_id if buyer_id has data
    UPDATE public.offers
    SET offerer_id = buyer_id
    WHERE offerer_id IS NULL AND buyer_id IS NOT NULL;

    -- Drop the old column
    ALTER TABLE public.offers DROP COLUMN buyer_id;
    RAISE NOTICE 'Migrated data from buyer_id to offerer_id and dropped buyer_id column';
  END IF;
END $$;

-- =====================================================
-- STEP 7: VALIDATE THE FIX
-- =====================================================

-- Test that the foreign key works
DO $$
DECLARE
  test_count INTEGER;
BEGIN
  -- Count offers with valid offerer_id references
  SELECT COUNT(*) INTO test_count
  FROM public.offers o
  WHERE EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = o.offerer_id
  );

  RAISE NOTICE 'Found % offers with valid profile references', test_count;

  -- Check for any orphaned offers
  SELECT COUNT(*) INTO test_count
  FROM public.offers o
  WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = o.offerer_id
  );

  IF test_count > 0 THEN
    RAISE WARNING 'Found % orphaned offers (without valid profile references)', test_count;
  ELSE
    RAISE NOTICE 'All offers have valid profile references ✅';
  END IF;
END $$;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'Offers foreign key fix migration completed successfully!';
  RAISE NOTICE '✅ Foreign key constraint offers_offerer_id_fkey created';
  RAISE NOTICE '✅ RLS policies updated to use offerer_id';
  RAISE NOTICE '✅ Index on offerer_id created for performance';
  RAISE NOTICE '🔄 Schema cache should now recognize offers-profiles relationship';
END $$;
