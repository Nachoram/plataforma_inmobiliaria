-- 📜 Script para Corregir Estados de Propiedades en la Plataforma Inmobiliaria
-- OBJETIVO: Asegurar que todas las propiedades tengan el estado correcto ('disponible')
-- para aparecer en el listado público.
-- CAUSA RAÍZ: Inconsistencia entre el código frontend (usando 'activa') y la base de datos
-- (usando 'disponible' como estado por defecto después de la migración).

-- ================================================================================================
-- PASO 1: Actualizar propiedades con estado 'activa' a 'disponible'
-- ================================================================================================
-- Este comando buscará todas las propiedades que tienen estado 'activa'
-- y las cambiará a 'disponible' para que sean consistentes con el esquema actual.
UPDATE public.properties
SET status = 'disponible'
WHERE status = 'activa';

-- ================================================================================================
-- PASO 2: Actualizar propiedades con estado 'pausada' a 'disponible'
-- ================================================================================================
-- También actualizamos las propiedades que puedan estar en estado 'pausada'
UPDATE public.properties
SET status = 'disponible'
WHERE status = 'pausada';

-- ================================================================================================
-- PASO 3: Verificar el cambio
-- ================================================================================================
-- Ejecuta esta consulta para ver el estado actual de todas tus propiedades.
SELECT
id,
address_street,
address_number,
status,
listing_type,
created_at
FROM
public.properties
ORDER BY created_at DESC;

-- ================================================================================================
-- PASO 4: Verificar propiedades visibles públicamente
-- ================================================================================================
-- Esta consulta muestra solo las propiedades que serán visibles en el listado público
SELECT
id,
address_street,
address_number,
status,
listing_type
FROM
public.properties
WHERE status = 'disponible'
ORDER BY created_at DESC;

-- ================================================================================================
-- INSTRUCCIONES DE EJECUCIÓN:
-- ================================================================================================
-- 1. Copia este archivo completo
-- 2. Ve a tu proyecto de Supabase -> SQL Editor
-- 3. Pega el contenido en una nueva consulta
-- 4. Ejecuta cada bloque por separado (o todo junto)
-- 5. Verifica los resultados con las consultas SELECT
