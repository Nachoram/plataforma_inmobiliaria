-- Agregar política RLS para permitir que usuarios vean eventos de disponibilidad

-- Eliminar política existente si existe
DROP POLICY IF EXISTS "Anyone can view availability events" ON calendar_events;

-- Crear nueva política que permite ver eventos de disponibilidad a cualquier usuario autenticado
CREATE POLICY "Anyone can view availability events" ON calendar_events
    FOR SELECT USING (
        type = 'availability' AND
        auth.uid() IS NOT NULL
    );

-- Verificar que la política se aplicó
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'calendar_events' AND policyname = 'Anyone can view availability events';


