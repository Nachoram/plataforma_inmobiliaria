-- Limpiar políticas RLS conflictivas para applications
-- Fecha: 9 de noviembre de 2025
-- Descripción: Eliminar políticas conflictivas y mantener solo las correctas

-- ========================================
-- ELIMINAR POLÍTICAS CONFLICTIVAS
-- ========================================

-- Eliminar las políticas que agregamos que causan conflictos
DROP POLICY IF EXISTS "Authenticated users can create applications" ON applications;
DROP POLICY IF EXISTS "Users can view their own applications" ON applications;
DROP POLICY IF EXISTS "Users can update their own applications" ON applications;
DROP POLICY IF EXISTS "Users can delete their own applications" ON applications;

-- ========================================
-- VERIFICACIÓN FINAL
-- ========================================

-- Verificar que solo quedan las políticas correctas
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
ORDER BY cmd, policyname;

-- Verificar que RLS sigue habilitado
SELECT
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'applications';
