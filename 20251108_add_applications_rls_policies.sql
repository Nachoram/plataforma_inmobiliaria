-- Agregar políticas RLS para la tabla applications
-- Fecha: 8 de noviembre de 2025
-- Descripción: Configurar políticas de seguridad para permitir creación y gestión de aplicaciones

-- ========================================
-- HABILITAR RLS EN TABLA APPLICATIONS
-- ========================================

-- Habilitar Row Level Security
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- ========================================
-- POLÍTICAS PARA APPLICATIONS
-- ========================================

-- Política: Usuarios autenticados pueden crear aplicaciones
DROP POLICY IF EXISTS "Authenticated users can create applications" ON applications;
CREATE POLICY "Authenticated users can create applications"
    ON applications FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Política: Usuarios pueden ver sus propias aplicaciones (como postulantes)
DROP POLICY IF EXISTS "Users can view their own applications" ON applications;
CREATE POLICY "Users can view their own applications"
    ON applications FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Política: Propietarios de propiedades pueden ver aplicaciones para sus propiedades
DROP POLICY IF EXISTS "Property owners can view applications for their properties" ON applications;
CREATE POLICY "Property owners can view applications for their properties"
    ON applications FOR SELECT
    USING (
        property_id IN (
            SELECT id FROM properties WHERE owner_id = auth.uid()
        )
    );

-- Política: Usuarios pueden actualizar sus propias aplicaciones
DROP POLICY IF EXISTS "Users can update their own applications" ON applications;
CREATE POLICY "Users can update their own applications"
    ON applications FOR UPDATE
    USING (auth.uid() IS NOT NULL);

-- Política: Usuarios pueden eliminar sus propias aplicaciones (opcional)
DROP POLICY IF EXISTS "Users can delete their own applications" ON applications;
CREATE POLICY "Users can delete their own applications"
    ON applications FOR DELETE
    USING (auth.uid() IS NOT NULL);

-- ========================================
-- VERIFICACIÓN
-- ========================================

-- Verificar que RLS esté habilitado
SELECT
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'applications';

-- Listar todas las políticas activas para applications
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'applications'
ORDER BY policyname;
