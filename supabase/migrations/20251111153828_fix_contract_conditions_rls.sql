-- =====================================================
-- MIGRACIÓN: Corregir políticas RLS para rental_contract_conditions
-- =====================================================
-- Fecha: 2025-11-11
-- Descripción: Permitir acceso a usuarios autenticados para gestionar condiciones de contrato
-- =====================================================

-- Eliminar políticas restrictivas existentes
DROP POLICY IF EXISTS "Owners can view their applications contract conditions" ON rental_contract_conditions;
DROP POLICY IF EXISTS "Applicants can view their applications contract conditions" ON rental_contract_conditions;
DROP POLICY IF EXISTS "Owners can create contract conditions for their applications" ON rental_contract_conditions;
DROP POLICY IF EXISTS "Owners can update contract conditions for their applications" ON rental_contract_conditions;

-- Crear políticas más permisivas para usuarios autenticados
-- Permitir SELECT para usuarios involucrados en la aplicación
CREATE POLICY "Authenticated users can view contract conditions" ON rental_contract_conditions
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM applications a
        LEFT JOIN properties p ON a.property_id = p.id
        WHERE a.id = rental_contract_conditions.application_id
        AND (
            -- User is the property owner
            (p.owner_id = auth.uid())
            OR
            -- User is the applicant
            (a.applicant_id = auth.uid())
            OR
            -- User is the guarantor
            (a.guarantor_id = auth.uid())
            OR
            -- User is admin (has admin role in profiles)
            EXISTS (
                SELECT 1 FROM profiles
                WHERE id = auth.uid() AND role = 'admin'
            )
        )
    )
);

-- Permitir INSERT para propietarios y admins
CREATE POLICY "Authenticated users can create contract conditions" ON rental_contract_conditions
FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM applications a
        LEFT JOIN properties p ON a.property_id = p.id
        WHERE a.id = rental_contract_conditions.application_id
        AND (
            -- User is the property owner
            (p.owner_id = auth.uid())
            OR
            -- User is admin
            EXISTS (
                SELECT 1 FROM profiles
                WHERE id = auth.uid() AND role = 'admin'
            )
        )
    )
);

-- Permitir UPDATE para propietarios y admins
CREATE POLICY "Authenticated users can update contract conditions" ON rental_contract_conditions
FOR UPDATE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM applications a
        LEFT JOIN properties p ON a.property_id = p.id
        WHERE a.id = rental_contract_conditions.application_id
        AND (
            -- User is the property owner
            (p.owner_id = auth.uid())
            OR
            -- User is admin
            EXISTS (
                SELECT 1 FROM profiles
                WHERE id = auth.uid() AND role = 'admin'
            )
        )
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM applications a
        LEFT JOIN properties p ON a.property_id = p.id
        WHERE a.id = rental_contract_conditions.application_id
        AND (
            -- User is the property owner
            (p.owner_id = auth.uid())
            OR
            -- User is admin
            EXISTS (
                SELECT 1 FROM profiles
                WHERE id = auth.uid() AND role = 'admin'
            )
        )
    )
);

-- Permitir DELETE para propietarios y admins
CREATE POLICY "Authenticated users can delete contract conditions" ON rental_contract_conditions
FOR DELETE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM applications a
        LEFT JOIN properties p ON a.property_id = p.id
        WHERE a.id = rental_contract_conditions.application_id
        AND (
            -- User is the property owner
            (p.owner_id = auth.uid())
            OR
            -- User is admin
            EXISTS (
                SELECT 1 FROM profiles
                WHERE id = auth.uid() AND role = 'admin'
            )
        )
    )
);

-- =====================================================
-- VERIFICACIÓN DE LA MIGRACIÓN
-- =====================================================
-- Para verificar que la migración se aplicó correctamente:
--
-- 1. Verificar políticas activas:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies
-- WHERE tablename = 'rental_contract_conditions';
--
-- 2. Verificar que RLS está habilitado:
-- SELECT tablename, rowsecurity
-- FROM pg_tables
-- WHERE tablename = 'rental_contract_conditions';
-- =====================================================
