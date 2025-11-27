-- Debug: Verificar estado de calendar_events

-- 1. Ver cuántos registros hay en total
SELECT
  COUNT(*) as total_events,
  COUNT(CASE WHEN type = 'availability' THEN 1 END) as availability_events,
  COUNT(CASE WHEN availability_data IS NOT NULL THEN 1 END) as events_with_data
FROM calendar_events;

-- 2. Ver los últimos 10 eventos de disponibilidad
SELECT
  id,
  property_id,
  start_date,
  type,
  availability_data,
  created_by,
  created_at
FROM calendar_events
WHERE type = 'availability'
ORDER BY created_at DESC
LIMIT 10;

-- 3. Ver si hay propiedades en el sistema
SELECT
  COUNT(*) as total_properties,
  COUNT(CASE WHEN status = 'available' THEN 1 END) as available_properties
FROM properties;

-- 4. Ver usuarios recientes
SELECT
  id,
  email,
  created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;
