-- =====================================================
-- SOLUCIÓN COMPLETA: RLS para rental_contracts
-- =====================================================

-- Paso 1: Hacer contract_content nullable
ALTER TABLE rental_contracts 
ALTER COLUMN contract_content DROP NOT NULL;

-- Paso 2: Verificar y recrear políticas RLS

-- 2.1: Eliminar políticas existentes
DROP POLICY IF EXISTS "Owners can create contracts for their applications" ON rental_contracts;
DROP POLICY IF EXISTS "Owners can view their applications contracts" ON rental_contracts;
DROP POLICY IF EXISTS "Applicants can view their applications contracts" ON rental_contracts;
DROP POLICY IF EXISTS "Guarantors can view contracts where they are guarantor" ON rental_contracts;
DROP POLICY IF EXISTS "Owners can update contracts for their applications" ON rental_contracts;

-- 2.2: Recrear política INSERT (permitir a propietarios crear contratos)
CREATE POLICY "Owners can create contracts for their applications" 
ON rental_contracts
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM applications a
    JOIN properties p ON a.property_id = p.id
    WHERE a.id = rental_contracts.application_id
    AND p.owner_id = auth.uid()
  )
);

-- 2.3: Política SELECT para propietarios
CREATE POLICY "Owners can view their applications contracts" 
ON rental_contracts
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM applications a
    JOIN properties p ON a.property_id = p.id
    WHERE a.id = rental_contracts.application_id
    AND p.owner_id = auth.uid()
  )
);

-- 2.4: Política SELECT para arrendatarios
CREATE POLICY "Applicants can view their applications contracts" 
ON rental_contracts
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM applications a
    WHERE a.id = rental_contracts.application_id
    AND a.applicant_id = auth.uid()
  )
);

-- 2.5: Política UPDATE para propietarios
CREATE POLICY "Owners can update contracts for their applications" 
ON rental_contracts
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM applications a
    JOIN properties p ON a.property_id = p.id
    WHERE a.id = rental_contracts.application_id
    AND p.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM applications a
    JOIN properties p ON a.property_id = p.id
    WHERE a.id = rental_contracts.application_id
    AND p.owner_id = auth.uid()
  )
);

-- Paso 3: Verificar que las políticas se crearon correctamente
SELECT 
  policyname, 
  cmd,
  CASE cmd
    WHEN 'SELECT' THEN 'Ver contratos'
    WHEN 'INSERT' THEN 'Crear contratos'
    WHEN 'UPDATE' THEN 'Actualizar contratos'
  END as descripcion
FROM pg_policies 
WHERE tablename = 'rental_contracts'
ORDER BY cmd, policyname;

