-- =====================================================
-- MIGRATION: Update Legacy Properties with property_type_characteristics_id
-- Date: 2025-10-29
-- =====================================================
-- This migration ensures that all existing properties have the 
-- property_type_characteristics_id field populated based on their
-- tipo_propiedad value. This is CRITICAL for contract generation.
--
-- WHY THIS IS NECESSARY:
-- - The property_type_characteristics_id field is REQUIRED for generating contracts
-- - Legacy properties may only have the tipo_propiedad field populated
-- - Without this UUID, the contract generation system (n8n) will fail
-- - This migration maps the text-based tipo_propiedad to the corresponding UUID
-- =====================================================

DO $$ 
DECLARE
    property_record RECORD;
    characteristics_id UUID;
    total_properties INTEGER := 0;
    updated_properties INTEGER := 0;
    missing_properties INTEGER := 0;
BEGIN
    RAISE NOTICE '🔄 INICIANDO ACTUALIZACIÓN DE PROPIEDADES LEGACY...';
    RAISE NOTICE '========================================================';
    
    -- Count total properties
    SELECT COUNT(*) INTO total_properties FROM public.properties;
    RAISE NOTICE '📊 Total de propiedades en la base de datos: %', total_properties;
    
    -- Count properties without UUID
    SELECT COUNT(*) INTO missing_properties 
    FROM public.properties 
    WHERE property_type_characteristics_id IS NULL 
    AND tipo_propiedad IS NOT NULL;
    
    RAISE NOTICE '⚠️  Propiedades sin UUID: %', missing_properties;
    RAISE NOTICE '';
    
    -- If there are no properties to update, exit early
    IF missing_properties = 0 THEN
        RAISE NOTICE '✅ No hay propiedades que requieran actualización';
        RAISE NOTICE '========================================================';
        RETURN;
    END IF;
    
    RAISE NOTICE '🔍 Actualizando propiedades...';
    RAISE NOTICE '';
    
    -- Iterate through all properties without UUID
    FOR property_record IN
        SELECT id, tipo_propiedad, address_street, address_number
        FROM public.properties
        WHERE property_type_characteristics_id IS NULL
        AND tipo_propiedad IS NOT NULL
    LOOP
        -- Get the UUID for this property type
        SELECT id INTO characteristics_id
        FROM public.property_type_characteristics
        WHERE name = property_record.tipo_propiedad::text
        LIMIT 1;
        
        IF characteristics_id IS NOT NULL THEN
            -- Update the property with the UUID
            UPDATE public.properties
            SET property_type_characteristics_id = characteristics_id
            WHERE id = property_record.id;
            
            updated_properties := updated_properties + 1;
            
            RAISE NOTICE '  ✅ Propiedad actualizada: % % (%, tipo: %, UUID: %)', 
                property_record.address_street, 
                property_record.address_number,
                property_record.id,
                property_record.tipo_propiedad,
                characteristics_id;
        ELSE
            RAISE NOTICE '  ❌ ERROR: No se encontró UUID para tipo "%". Propiedad ID: %', 
                property_record.tipo_propiedad,
                property_record.id;
        END IF;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================================';
    RAISE NOTICE '✅ ACTUALIZACIÓN COMPLETADA';
    RAISE NOTICE '📊 Estadísticas finales:';
    RAISE NOTICE '  - Total de propiedades: %', total_properties;
    RAISE NOTICE '  - Propiedades actualizadas: %', updated_properties;
    RAISE NOTICE '  - Propiedades que requerían actualización: %', missing_properties;
    
    IF updated_properties = missing_properties THEN
        RAISE NOTICE '  ✅ Todas las propiedades fueron actualizadas exitosamente';
    ELSE
        RAISE WARNING '  ⚠️  Algunas propiedades no pudieron ser actualizadas. Revise los logs anteriores.';
    END IF;
    
    RAISE NOTICE '========================================================';
END $$;

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================
-- Check if all properties now have the UUID populated

DO $$
DECLARE
    properties_with_uuid INTEGER;
    properties_without_uuid INTEGER;
    total_properties INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔍 VERIFICACIÓN FINAL...';
    RAISE NOTICE '========================================================';
    
    SELECT COUNT(*) INTO total_properties FROM public.properties;
    SELECT COUNT(*) INTO properties_with_uuid 
    FROM public.properties 
    WHERE property_type_characteristics_id IS NOT NULL;
    
    SELECT COUNT(*) INTO properties_without_uuid 
    FROM public.properties 
    WHERE property_type_characteristics_id IS NULL;
    
    RAISE NOTICE '📊 Resultado de la verificación:';
    RAISE NOTICE '  - Total de propiedades: %', total_properties;
    RAISE NOTICE '  - Propiedades con UUID: % (%.%% )', 
        properties_with_uuid,
        ROUND((properties_with_uuid::NUMERIC / NULLIF(total_properties, 0)) * 100, 1);
    RAISE NOTICE '  - Propiedades sin UUID: % (%.%% )', 
        properties_without_uuid,
        ROUND((properties_without_uuid::NUMERIC / NULLIF(total_properties, 0)) * 100, 1);
    
    IF properties_without_uuid = 0 THEN
        RAISE NOTICE '  ✅ ÉXITO: Todas las propiedades tienen UUID asignado';
    ELSE
        RAISE WARNING '  ⚠️  ATENCIÓN: Hay % propiedades sin UUID. Revise manualmente.', properties_without_uuid;
    END IF;
    
    RAISE NOTICE '========================================================';
END $$;

-- =====================================================
-- OPTIONAL: Display properties that still don't have UUID
-- =====================================================

DO $$
DECLARE
    r RECORD;
    count INTEGER := 0;
BEGIN
    FOR r IN 
        SELECT id, address_street, address_number, tipo_propiedad
        FROM public.properties
        WHERE property_type_characteristics_id IS NULL
        LIMIT 10
    LOOP
        IF count = 0 THEN
            RAISE NOTICE '';
            RAISE NOTICE '⚠️  PROPIEDADES SIN UUID (primeras 10):';
            RAISE NOTICE '========================================================';
        END IF;
        
        count := count + 1;
        RAISE NOTICE '  % - ID: %, Dirección: % %, Tipo: %',
            count,
            r.id,
            COALESCE(r.address_street, 'Sin calle'),
            COALESCE(r.address_number, 'S/N'),
            COALESCE(r.tipo_propiedad::text, 'Sin tipo');
    END LOOP;
    
    IF count > 0 THEN
        RAISE NOTICE '========================================================';
    END IF;
END $$;

-- =====================================================
-- CREATE INDEX FOR BETTER PERFORMANCE (if not exists)
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_properties_property_type_characteristics_id 
ON public.properties(property_type_characteristics_id);

COMMENT ON INDEX idx_properties_property_type_characteristics_id IS 
'Index for better performance when joining properties with property_type_characteristics';

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ Índice creado/verificado para mejor rendimiento';
END $$;

Quiero implementar en el repositorio la función de un botón "Deshacer Aceptación" dentro del PostulationAdminPanel. El flujo esperado es:

Al presionar este botón sobre una postulación aceptada:

Se debe revocar/modificar el estado a “En Revisión” (“revertir aceptación”) en la tabla de postulaciones/applications.

Se deberá borrar o invalidar la aceptación anterior: esto significa eliminar, actualizar o poner en status “cancelado” cualquier registro relacionado (en especial en rental_contract_conditions y/o rental_contracts) que se hubiera generado por la aceptación.

Tras “deshacer”:

El botón “Aceptar Postulación” debe quedar nuevamente habilitado (visible/activo en el front).

El historial/auditoría debe dejar constancia del cambio, quién y cuándo lo hizo (idealmente log en tabla o campo de tracking).

Todo el flujo/estados debe estar soportado tanto en backend (actualización de tablas, constraints) como visualmente en front.

Validaciones:

Solo puede revocarse si aún no existen firmas ni contratos “finalizados/firmados”.

El cambio debe ser reversible (puede volver a aceptar una vez deshecho).

Si hay contratos firmados, la acción debe estar bloqueada y mostrar advertencia al usuario.

Acciones requeridas:

Backend:

Implementar endpoint o mutación que permita cambiar el estado de la postulación a “en revisión” y revertir/borrar/inutilizar (soft delete/status) las condiciones/contratos generados.

Garantizar integridad referencial: no dejar registros huérfanos ni en estados incoherentes.

Frontend:

Agregar botón visible solo cuando la postulación está “aceptada” y el contrato aún puede revertirse.

Recargar el estado tras acción, mostrar snakbar/toast confirmando, y habilitar botón de aceptación otra vez.

Mostrar advertencia si la acción no es posible (contrato firmado, error del backend).

Ejemplo visual UX:

Botón rojo “Deshacer Aceptación”

Al confirmar, volver a pantalla de postulación editable, botón “Aceptar” habilitado.

Mensaje: “Aceptación revertida. Puedes volver a aceptar esta postulación.”

¿Sugerencias para queries/upserts en Supabase o naming de estados que maximicen la trazabilidad y la reversibilidad de las postulaciones? ¿Patrones para el borrado seguro/reversible en los módulos críticos?