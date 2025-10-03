-- Final cleanup: Remove duplicate INSERT policy

-- Drop the duplicate policy that remained from previous attempts
DROP POLICY IF EXISTS "Partes involucradas pueden crear contratos" ON rental_contracts;

-- Verify final state
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'rental_contracts'
ORDER BY policyname;
