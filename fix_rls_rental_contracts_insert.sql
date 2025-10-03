-- Verificar políticas RLS actuales
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'rental_contracts' 
  AND cmd = 'INSERT';

-- El problema es que no hay una política INSERT que permita crear contratos

-- SOLUCIÓN: Agregar política INSERT
-- Los propietarios pueden crear contratos para aplicaciones de sus propiedades

DROP POLICY IF EXISTS "Owners can create contracts for their applications" ON rental_contracts;

CREATE POLICY "Owners can create contracts for their applications" ON rental_contracts
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM applications a
    JOIN properties p ON a.property_id = p.id
    WHERE a.id = rental_contracts.application_id
    AND p.owner_id = auth.uid()
  )
);

-- Verificar que se creó
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'rental_contracts' 
  AND cmd = 'INSERT';

