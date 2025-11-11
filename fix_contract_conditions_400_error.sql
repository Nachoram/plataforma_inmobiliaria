-- =====================================================
-- FIX: Error 400 al guardar condiciones del contrato
-- Ejecutar en SQL Editor de Supabase Dashboard
-- =====================================================

-- 1. AGREGAR COLUMNAS FALTANTES
ALTER TABLE rental_contract_conditions
ADD COLUMN IF NOT EXISTS contract_start_date DATE,
ADD COLUMN IF NOT EXISTS landlord_email TEXT,
ADD COLUMN IF NOT EXISTS is_furnished BOOLEAN DEFAULT FALSE;

-- Comentarios en las columnas
COMMENT ON COLUMN rental_contract_conditions.contract_start_date IS 'Fecha de inicio del contrato de arriendo';
COMMENT ON COLUMN rental_contract_conditions.landlord_email IS 'Email del propietario para comunicaciones del contrato';
COMMENT ON COLUMN rental_contract_conditions.is_furnished IS 'Indica si la propiedad está amoblada';

-- Crear índices para las nuevas columnas
CREATE INDEX IF NOT EXISTS idx_rental_contract_conditions_contract_start_date
ON rental_contract_conditions(contract_start_date);

CREATE INDEX IF NOT EXISTS idx_rental_contract_conditions_landlord_email
ON rental_contract_conditions(landlord_email);

CREATE INDEX IF NOT EXISTS idx_rental_contract_conditions_is_furnished
ON rental_contract_conditions(is_furnished);

-- 2. CORREGIR POLÍTICAS RLS
-- Eliminar TODAS las políticas existentes para evitar conflictos
DROP POLICY IF EXISTS "Owners can view their applications contract conditions" ON rental_contract_conditions;
DROP POLICY IF EXISTS "Applicants can view their applications contract conditions" ON rental_contract_conditions;
DROP POLICY IF EXISTS "Owners can create contract conditions for their applications" ON rental_contract_conditions;
DROP POLICY IF EXISTS "Owners can update contract conditions for their applications" ON rental_contract_conditions;
DROP POLICY IF EXISTS "Authenticated users can view contract conditions" ON rental_contract_conditions;
DROP POLICY IF EXISTS "Authenticated users can create contract conditions" ON rental_contract_conditions;
DROP POLICY IF EXISTS "Authenticated users can update contract conditions" ON rental_contract_conditions;
DROP POLICY IF EXISTS "Authenticated users can delete contract conditions" ON rental_contract_conditions;
DROP POLICY IF EXISTS "Users can view rental contract conditions for their application" ON rental_contract_conditions;
DROP POLICY IF EXISTS "Users can insert rental contract conditions for their applicati" ON rental_contract_conditions;
DROP POLICY IF EXISTS "Users can update rental contract conditions for their applicati" ON rental_contract_conditions;

-- Política permisiva para UPDATE - permite edición a quienes pueden ver
-- (Esto incluye propietarios, aplicantes y garantes)
DROP POLICY IF EXISTS "Property owners can update contract conditions" ON rental_contract_conditions;

CREATE POLICY "Users can update contract conditions they can view" ON rental_contract_conditions
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
            -- User is the applicant
            (a.applicant_id = auth.uid())
            OR
            -- User is the guarantor
            (a.guarantor_id = auth.uid())
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
            -- User is the applicant
            (a.applicant_id = auth.uid())
            OR
            -- User is the guarantor
            (a.guarantor_id = auth.uid())
        )
    )
);

-- Restaurar política SELECT restrictiva
DROP POLICY IF EXISTS "Authenticated users can view contract conditions" ON rental_contract_conditions;

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
        )
    )
);

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
        )
    )
);

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
        )
    )
);

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
        )
    )
);

-- 3. SOLUCIÓN TEMPORAL PARA TESTING (descomenta si aún hay problemas)
-- Desactivar RLS temporalmente para testing
-- ALTER TABLE rental_contract_conditions DISABLE ROW LEVEL SECURITY;

-- Volver a habilitar RLS después de testing:
-- ALTER TABLE rental_contract_conditions ENABLE ROW LEVEL SECURITY;

-- 4. VERIFICACIÓN
-- Verificar que las columnas existen
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'rental_contract_conditions'
    AND column_name IN (
        'contract_start_date',
        'landlord_email',
        'is_furnished',
        'application_id',
        'contract_duration_months',
        'monthly_payment_day',
        'final_rent_price',
        'brokerage_commission',
        'guarantee_amount',
        'official_communication_email',
        'accepts_pets',
        'dicom_clause',
        'additional_conditions',
        'broker_name',
        'broker_rut',
        'account_holder_name',
        'account_holder_rut',
        'bank_name',
        'account_type',
        'account_number',
        'payment_method'
    )
ORDER BY column_name;

-- Verificar políticas RLS
SELECT
    schemaname,
    tablename,
    policyname,
    cmd,
    roles,
    qual
FROM pg_policies
WHERE tablename = 'rental_contract_conditions'
ORDER BY policyname;

-- 4. DEBUG: Verificar permisos del usuario actual (reemplaza 'APPLICATION_ID' con el ID real)
-- SELECT
--     auth.uid() as current_user_id,
--     a.id as application_id,
--     a.applicant_id,
--     a.guarantor_id,
--     p.owner_id as property_owner_id,
--     CASE
--         WHEN p.owner_id = auth.uid() THEN 'PROPERTY_OWNER'
--         WHEN a.applicant_id = auth.uid() THEN 'APPLICANT'
--         WHEN a.guarantor_id = auth.uid() THEN 'GUARANTOR'
--         ELSE 'NO_ACCESS'
--     END as user_role
-- FROM applications a
-- LEFT JOIN properties p ON a.property_id = p.id
-- WHERE a.id = 'APPLICATION_ID';

-- 5. Verificar constraints que podrían estar causando el error 400
SELECT
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    cc.check_clause,
    tc.table_name,
    kcu.column_name
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
LEFT JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'rental_contract_conditions'
ORDER BY tc.constraint_name;

-- 6. Verificar triggers que podrían estar causando problemas
SELECT
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'rental_contract_conditions'
ORDER BY trigger_name;

-- 7. Verificar si hay datos existentes que podrían estar causando conflictos
-- Reemplaza 'YOUR_APPLICATION_ID' con el ID real de la aplicación que estás probando
-- SELECT * FROM rental_contract_conditions WHERE application_id = 'YOUR_APPLICATION_ID';

-- 8. Probar inserción manual para identificar el problema exacto
-- (Comenta/descomenta y reemplaza los valores según sea necesario)
-- INSERT INTO rental_contract_conditions (
--     application_id,
--     contract_duration_months,
--     monthly_payment_day,
--     final_rent_price,
--     brokerage_commission,
--     guarantee_amount,
--     official_communication_email,
--     accepts_pets,
--     dicom_clause,
--     payment_method,
--     broker_name,
--     broker_rut,
--     landlord_email,
--     is_furnished
-- ) VALUES (
--     'YOUR_APPLICATION_ID',
--     12,
--     1,
--     500000.00,
--     0.00,
--     1000000.00,
--     'test@example.com',
--     false,
--     false,
--     'transferencia_bancaria',
--     'Sin corredor',
--     'Sin RUT',
--     'landlord@example.com',
--     false
-- );
