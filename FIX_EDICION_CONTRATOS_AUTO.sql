-- ============================================================================
-- FIX AUTOMÁTICO: Habilitar edición de contratos
-- ============================================================================
-- Este script:
-- 1. Diagnostica el problema
-- 2. Aplica la solución automáticamente
-- 3. Verifica que funcionó
-- ============================================================================

-- ============================================================================
-- PASO 1: DIAGNÓSTICO
-- ============================================================================

DO $$
DECLARE
    tiene_columna BOOLEAN;
    tiene_politica BOOLEAN;
    num_contratos INT;
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE '🔍 DIAGNÓSTICO INICIAL';
    RAISE NOTICE '============================================';
    
    -- Verificar si existe la columna contract_content
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'rental_contracts'
        AND column_name = 'contract_content'
    ) INTO tiene_columna;
    
    IF tiene_columna THEN
        RAISE NOTICE '✅ Columna contract_content existe';
    ELSE
        RAISE NOTICE '❌ Falta columna contract_content';
    END IF;
    
    -- Verificar si existe política UPDATE
    SELECT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'rental_contracts'
        AND cmd = 'UPDATE'
    ) INTO tiene_politica;
    
    IF tiene_politica THEN
        RAISE NOTICE '✅ Existe política UPDATE';
    ELSE
        RAISE NOTICE '❌ Falta política UPDATE';
    END IF;
    
    -- Contar contratos
    SELECT COUNT(*) INTO num_contratos FROM rental_contracts;
    RAISE NOTICE '📊 Total de contratos: %', num_contratos;
    
    RAISE NOTICE '';
END $$;

-- ============================================================================
-- PASO 2: AGREGAR COLUMNA SI NO EXISTE
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'rental_contracts'
        AND column_name = 'contract_content'
    ) THEN
        ALTER TABLE rental_contracts 
        ADD COLUMN contract_content jsonb;
        
        RAISE NOTICE '✅ Columna contract_content agregada';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'rental_contracts'
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE rental_contracts 
        ADD COLUMN updated_at timestamptz DEFAULT now();
        
        RAISE NOTICE '✅ Columna updated_at agregada';
    END IF;
END $$;

-- ============================================================================
-- PASO 3: LIMPIAR POLÍTICAS VIEJAS
-- ============================================================================

DROP POLICY IF EXISTS "contracts_update_related" ON rental_contracts;
DROP POLICY IF EXISTS "contracts_update_owner" ON rental_contracts;
DROP POLICY IF EXISTS "rental_contracts_update_policy" ON rental_contracts;
DROP POLICY IF EXISTS "contracts_update_temp_permissive" ON rental_contracts;
DROP POLICY IF EXISTS "contracts_select_related" ON rental_contracts;
DROP POLICY IF EXISTS "contracts_insert_owner" ON rental_contracts;

-- ============================================================================
-- PASO 4: CREAR POLÍTICAS CORRECTAS
-- ============================================================================

-- Asegurar que RLS está habilitado
ALTER TABLE rental_contracts ENABLE ROW LEVEL SECURITY;

-- SELECT: Ver contratos donde eres propietario o aplicante
CREATE POLICY "contracts_select_related" ON rental_contracts
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM applications a
      LEFT JOIN properties p ON p.id = a.property_id
      WHERE a.id = rental_contracts.application_id
      AND (
        a.applicant_id = auth.uid() OR
        p.owner_id = auth.uid()
      )
    )
  );

-- INSERT: Solo propietarios pueden crear contratos
CREATE POLICY "contracts_insert_owner" ON rental_contracts
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM applications a
      JOIN properties p ON p.id = a.property_id
      WHERE a.id = rental_contracts.application_id
      AND p.owner_id = auth.uid()
    )
  );

-- UPDATE: Propietarios y aplicantes pueden editar
CREATE POLICY "contracts_update_related" ON rental_contracts
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM applications a
      LEFT JOIN properties p ON p.id = a.property_id
      WHERE a.id = rental_contracts.application_id
      AND (
        a.applicant_id = auth.uid() OR
        p.owner_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM applications a
      LEFT JOIN properties p ON p.id = a.property_id
      WHERE a.id = rental_contracts.application_id
      AND (
        a.applicant_id = auth.uid() OR
        p.owner_id = auth.uid()
      )
    )
  );

-- ============================================================================
-- PASO 5: ASEGURAR PERMISOS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE ON rental_contracts TO authenticated;

-- ============================================================================
-- PASO 6: VERIFICACIÓN FINAL
-- ============================================================================

DO $$
DECLARE
    num_policies INT;
    tiene_grant BOOLEAN;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '============================================';
    RAISE NOTICE '✅ SOLUCIÓN APLICADA';
    RAISE NOTICE '============================================';
    RAISE NOTICE '';
    
    -- Contar políticas
    SELECT COUNT(*) INTO num_policies
    FROM pg_policies
    WHERE tablename = 'rental_contracts';
    
    RAISE NOTICE '📋 Políticas RLS creadas: %', num_policies;
    
    -- Verificar permisos
    SELECT EXISTS (
        SELECT 1 FROM information_schema.role_table_grants
        WHERE table_name = 'rental_contracts'
        AND grantee = 'authenticated'
        AND privilege_type = 'UPDATE'
    ) INTO tiene_grant;
    
    IF tiene_grant THEN
        RAISE NOTICE '✅ Permisos UPDATE otorgados';
    ELSE
        RAISE NOTICE '⚠️  Verificar permisos UPDATE';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '============================================';
    RAISE NOTICE '🎯 PRÓXIMOS PASOS:';
    RAISE NOTICE '============================================';
    RAISE NOTICE '1. Recarga tu aplicación (Ctrl + F5)';
    RAISE NOTICE '2. Abre un contrato';
    RAISE NOTICE '3. Click en "Editar"';
    RAISE NOTICE '4. Haz cambios y guarda';
    RAISE NOTICE '';
    RAISE NOTICE 'Si aún no funciona:';
    RAISE NOTICE '  - Abre consola del navegador (F12)';
    RAISE NOTICE '  - Captura el error';
    RAISE NOTICE '  - Ejecuta: DIAGNOSTICO_EDICION_CONTRATOS.sql';
    RAISE NOTICE '============================================';
END $$;

-- ============================================================================
-- PRUEBA RÁPIDA (opcional)
-- ============================================================================

-- Ver tus contratos editables
SELECT 
    '=== TUS CONTRATOS EDITABLES ===' as info;

SELECT 
    rc.id,
    rc.status,
    CONCAT(p.address_street, ' ', p.address_number, ', ', p.address_commune) as propiedad,
    CASE 
        WHEN p.owner_id = auth.uid() THEN '✅ Propietario'
        WHEN a.applicant_id = auth.uid() THEN '✅ Aplicante'
        ELSE '❌ Sin permisos'
    END as tu_rol
FROM rental_contracts rc
LEFT JOIN applications a ON a.id = rc.application_id
LEFT JOIN properties p ON p.id = a.property_id
WHERE (
    p.owner_id = auth.uid() OR
    a.applicant_id = auth.uid()
)
ORDER BY rc.created_at DESC
LIMIT 5;

