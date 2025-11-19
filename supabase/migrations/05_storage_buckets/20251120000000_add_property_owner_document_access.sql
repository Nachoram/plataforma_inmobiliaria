-- =====================================================
-- MIGRACION: Acceso de propietarios a documentos de postulaciones
-- Fecha: 2025-11-20
-- Descripción: Agrega política RLS para que propietarios de propiedades
--              puedan acceder a documentos de postulaciones a sus propiedades
-- =====================================================

-- Política adicional para que propietarios de propiedades puedan ver documentos de postulaciones
CREATE POLICY "Property owners can view application documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'user-documents' AND
  -- Extraer application_id del path: user-uid/applications/app-id/...
  -- Path structure: user-uid/applications/app-id/applicants|guarantors/entity-type/filename
  EXISTS (
    SELECT 1 FROM applications a
    JOIN properties p ON a.property_id = p.id
    WHERE p.owner_id = auth.uid()
    AND a.id::text = split_part(name, '/', 3)
  )
);

-- =====================================================
-- MENSAJE DE CONFIRMACIÓN
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Política RLS agregada para acceso de propietarios a documentos';
  RAISE NOTICE '📋 Política: Property owners can view application documents';
  RAISE NOTICE '🎯 Permite a propietarios ver documentos de postulaciones a sus propiedades';
END $$;
