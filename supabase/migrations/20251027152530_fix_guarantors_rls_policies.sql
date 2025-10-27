-- ============================================================================
-- Migración: Corregir Políticas RLS de guarantors
-- Descripción: Resolver error 403 al crear/actualizar avales desde RentalApplicationForm
--              Permitir que usuarios autenticados creen avales y los actualicen
-- Fecha: 2025-10-27
-- ============================================================================

-- PASO 1: Eliminar políticas existentes de guarantors (si existen)
DROP POLICY IF EXISTS "Users can insert guarantors" ON guarantors;
DROP POLICY IF EXISTS "Users can update guarantors" ON guarantors;
DROP POLICY IF EXISTS "Users can view guarantors they created" ON guarantors;
DROP POLICY IF EXISTS "Users can view guarantors for their applications" ON guarantors;
DROP POLICY IF EXISTS "Property owners can view guarantors" ON guarantors;
DROP POLICY IF EXISTS "Guarantors are viewable by authenticated users" ON guarantors;
DROP POLICY IF EXISTS "guarantors_select" ON guarantors;
DROP POLICY IF EXISTS "guarantors_insert" ON guarantors;
DROP POLICY IF EXISTS "guarantors_update" ON guarantors;
DROP POLICY IF EXISTS "guarantors_delete" ON guarantors;

-- PASO 2: Verificar que RLS está habilitado
ALTER TABLE guarantors ENABLE ROW LEVEL SECURITY;

-- PASO 3: Política de INSERT - Permitir a usuarios autenticados crear avales
CREATE POLICY "authenticated_users_can_insert_guarantors"
  ON guarantors
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Verificar que el usuario está autenticado
    auth.uid() IS NOT NULL
    AND
    -- El created_by debe ser el usuario actual
    created_by = auth.uid()
  );

-- PASO 4: Política de UPDATE - Permitir actualizar a quien creó el aval
CREATE POLICY "users_can_update_own_guarantors"
  ON guarantors
  FOR UPDATE
  TO authenticated
  USING (
    -- Solo puede actualizar quien lo creó
    created_by = auth.uid()
  )
  WITH CHECK (
    -- Asegurar que no cambie el created_by
    created_by = auth.uid()
  );

-- PASO 5: Política de SELECT - Ver avales propios o relacionados a aplicaciones
CREATE POLICY "users_can_view_own_guarantors"
  ON guarantors
  FOR SELECT
  TO authenticated
  USING (
    -- Puede ver sus propios avales
    created_by = auth.uid()
    OR
    -- O avales relacionados con sus aplicaciones
    id IN (
      SELECT guarantor_id
      FROM applications
      WHERE applicant_id = auth.uid()
      AND guarantor_id IS NOT NULL
    )
    OR
    -- O avales en propiedades que le pertenecen (como propietario)
    id IN (
      SELECT a.guarantor_id
      FROM applications a
      INNER JOIN properties p ON p.id = a.property_id
      WHERE p.owner_id = auth.uid()
      AND a.guarantor_id IS NOT NULL
    )
  );

-- PASO 6: Política de DELETE - Solo quien creó puede eliminar (opcional)
CREATE POLICY "users_can_delete_own_guarantors"
  ON guarantors
  FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid()
  );

-- PASO 7: Verificar que el campo created_by existe y tiene el tipo correcto
DO $$
BEGIN
  -- Verificar si la columna created_by existe
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'guarantors'
    AND column_name = 'created_by'
  ) THEN
    -- Si no existe, crearla
    ALTER TABLE guarantors
    ADD COLUMN created_by UUID REFERENCES auth.users(id);

    RAISE NOTICE '✅ Columna created_by añadida a guarantors';
  ELSE
    RAISE NOTICE 'ℹ️ Columna created_by ya existe en guarantors';
  END IF;

  -- Asegurar que created_by no sea nullable para nuevos registros
  -- (permitir NULL para registros antiguos)
  ALTER TABLE guarantors
  ALTER COLUMN created_by SET DEFAULT auth.uid();

  RAISE NOTICE '✅ Default value set for created_by';
END $$;

-- PASO 8: Crear índice para mejorar performance de las políticas
CREATE INDEX IF NOT EXISTS idx_guarantors_created_by
  ON guarantors(created_by);

-- PASO 9: Comentarios descriptivos
COMMENT ON POLICY "authenticated_users_can_insert_guarantors" ON guarantors IS
  'Permite a usuarios autenticados crear avales. El created_by debe ser el usuario actual.';

COMMENT ON POLICY "users_can_update_own_guarantors" ON guarantors IS
  'Permite actualizar avales solo a quien los creó';

COMMENT ON POLICY "users_can_view_own_guarantors" ON guarantors IS
  'Permite ver avales propios, o avales de aplicaciones relacionadas';

-- Log de éxito
DO $$
BEGIN
  RAISE NOTICE '==================================================';
  RAISE NOTICE '✅ Políticas RLS de guarantors actualizadas exitosamente';
  RAISE NOTICE '📋 Políticas creadas:';
  RAISE NOTICE '   1. authenticated_users_can_insert_guarantors (INSERT)';
  RAISE NOTICE '   2. users_can_update_own_guarantors (UPDATE)';
  RAISE NOTICE '   3. users_can_view_own_guarantors (SELECT)';
  RAISE NOTICE '   4. users_can_delete_own_guarantors (DELETE)';
  RAISE NOTICE '==================================================';
END $$;
