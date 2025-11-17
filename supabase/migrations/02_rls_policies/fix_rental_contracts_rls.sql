-- Fix RLS policies for rental_contracts to allow proper contract creation
-- This allows authenticated users to create contracts for applications they can access

-- Drop the restrictive policy
DROP POLICY IF EXISTS "Owners can create contracts for their applications" ON rental_contracts;

-- Create a more permissive policy that allows contract creation for involved parties
CREATE POLICY "Involved parties can create contracts for applications" ON rental_contracts
FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM applications a
        LEFT JOIN properties p ON a.property_id = p.id
        WHERE a.id = rental_contracts.application_id
        AND (
            -- User is the property owner
            (p.owner_id = auth.uid())
            OR
            -- User is the applicant
            (a.applicant_id = auth.uid())
            OR
            -- User is the guarantor
            (a.guarantor_id = auth.uid())
        )
    )
);

-- Also ensure the SELECT policies allow access to created contracts
DROP POLICY IF EXISTS "Owners can view their applications contracts" ON rental_contracts;
DROP POLICY IF EXISTS "Applicants can view their applications contracts" ON rental_contracts;
DROP POLICY IF EXISTS "Guarantors can view contracts where they are guarantor" ON rental_contracts;

CREATE POLICY "Involved parties can view contracts" ON rental_contracts
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM applications a
        LEFT JOIN properties p ON a.property_id = p.id
        WHERE a.id = rental_contracts.application_id
        AND (
            -- User is the property owner
            (p.owner_id = auth.uid())
            OR
            -- User is the applicant
            (a.applicant_id = auth.uid())
            OR
            -- User is the guarantor
            (a.guarantor_id = auth.uid())
        )
    )
);
