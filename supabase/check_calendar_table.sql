-- Verificar si la tabla calendar_events existe y tiene datos
SELECT
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE tablename = 'calendar_events';

-- Verificar estructura de la tabla
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'calendar_events'
ORDER BY ordinal_position;

-- Verificar si hay datos en la tabla
SELECT
  COUNT(*) as total_events,
  type,
  COUNT(*) as count_by_type
FROM calendar_events
GROUP BY type;

-- Verificar permisos RLS
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'calendar_events';

-- Verificar políticas RLS
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
WHERE tablename = 'calendar_events';



