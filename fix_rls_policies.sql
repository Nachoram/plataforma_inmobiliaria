-- ========================================
-- ARREGLAR POLÍTICAS RLS PARA application_applicants y application_guarantors
-- ========================================

-- PRIMERO: Verificar políticas actuales
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('application_applicants', 'application_guarantors')
ORDER BY tablename, policyname;

-- POLÍTICAS PARA ADMINISTRADORES (acceso completo)
-- Nota: Asumiendo que hay un rol 'admin' o que los usuarios autenticados pueden acceder

-- Para application_applicants
DROP POLICY IF EXISTS "Applicants can view their own application applicants" ON application_applicants;
DROP POLICY IF EXISTS "Property owners can view applicants for their properties" ON application_applicants;
DROP POLICY IF EXISTS "Users can insert applicants for their applications" ON application_applicants;
DROP POLICY IF EXISTS "Applicants can update their own application applicants" ON application_applicants;

-- Crear políticas más permisivas para desarrollo
CREATE POLICY "Authenticated users can view all application applicants"
ON application_applicants FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert application applicants"
ON application_applicants FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update application applicants"
ON application_applicants FOR UPDATE
USING (auth.role() = 'authenticated');

-- Para application_guarantors
DROP POLICY IF EXISTS "Applicants can view their own application guarantors" ON application_guarantors;
DROP POLICY IF EXISTS "Property owners can view guarantors for their properties" ON application_guarantors;
DROP POLICY IF EXISTS "Users can insert guarantors for their applications" ON application_guarantors;
DROP POLICY IF EXISTS "Applicants can update their own application guarantors" ON application_guarantors;

-- Crear políticas más permisivas para desarrollo
CREATE POLICY "Authenticated users can view all application guarantors"
ON application_guarantors FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert application guarantors"
ON application_guarantors FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update application guarantors"
ON application_guarantors FOR UPDATE
USING (auth.role() = 'authenticated');

-- Verificar que las políticas se aplicaron
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename IN ('application_applicants', 'application_guarantors')
ORDER BY tablename, policyname;

-- Probar una consulta básica
SELECT COUNT(*) as applicants_count FROM application_applicants;
SELECT COUNT(*) as guarantors_count FROM application_guarantors;