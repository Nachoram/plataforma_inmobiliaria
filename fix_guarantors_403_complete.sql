-- =====================================================
-- SCRIPT COMPLETO PARA SOLUCIONAR ERROR 403 EN TABLA GUARANTORS
-- =====================================================
-- Este script resolverá el problema de permisos 403 Forbidden
-- al intentar insertar datos en la tabla guarantors
-- Ejecuta TODO el script en tu Editor SQL de Supabase

-- 1. VERIFICAR SI LA TABLA EXISTE
-- Si la tabla no existe, este query no retornará resultados
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'guarantors';

-- 2. HABILITAR RLS EN LA TABLA (si no está habilitado)
-- Esto es ESENCIAL para que las políticas funcionen
ALTER TABLE public.guarantors ENABLE ROW LEVEL SECURITY;

-- 3. ELIMINAR POLÍTICAS EXISTENTES QUE PUEDAN CAUSAR CONFLICTOS
-- Primero listamos las políticas existentes
SELECT 
    policyname as policy_name,
    cmd as operation,
    permissive,
    roles
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'guarantors';

-- Eliminar políticas existentes (si las hay)
-- NOTA: Si alguna da error porque no existe, ignóralo
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.guarantors;
DROP POLICY IF EXISTS "Allow authenticated users to insert into guarantors" ON public.guarantors;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.guarantors;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.guarantors;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON public.guarantors;

-- 4. CREAR POLÍTICAS NUEVAS Y COMPLETAS
-- Estas políticas cubren todos los casos de uso típicos

-- Política para SELECT (lectura)
-- Permite que usuarios autenticados lean todos los registros
CREATE POLICY "Allow authenticated to read guarantors"
ON public.guarantors
FOR SELECT
TO authenticated
USING (true);

-- Política para INSERT (inserción)
-- Permite que usuarios autenticados inserten nuevos registros
CREATE POLICY "Allow authenticated to insert guarantors"
ON public.guarantors
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Política para UPDATE (actualización)
-- Permite que usuarios autenticados actualicen registros
-- Puedes modificar la condición si necesitas más restricciones
CREATE POLICY "Allow authenticated to update guarantors"
ON public.guarantors
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Política para DELETE (eliminación)
-- Permite que usuarios autenticados eliminen registros
-- Puedes modificar la condición si necesitas más restricciones
CREATE POLICY "Allow authenticated to delete guarantors"
ON public.guarantors
FOR DELETE
TO authenticated
USING (true);

-- 5. OPCIONAL: Si también necesitas acceso para usuarios anónimos
-- Descomenta las siguientes líneas si tu aplicación necesita que
-- usuarios no autenticados puedan acceder a la tabla

-- CREATE POLICY "Allow anon to read guarantors"
-- ON public.guarantors
-- FOR SELECT
-- TO anon
-- USING (true);

-- CREATE POLICY "Allow anon to insert guarantors"
-- ON public.guarantors
-- FOR INSERT
-- TO anon
-- WITH CHECK (true);

-- 6. VERIFICAR QUE LAS POLÍTICAS SE CREARON CORRECTAMENTE
-- Este query debe mostrar las 4 políticas creadas
SELECT 
    policyname as policy_name,
    cmd as operation,
    permissive,
    roles,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'guarantors'
ORDER BY policyname;

-- 7. VERIFICAR QUE RLS ESTÁ HABILITADO
-- Debe retornar 't' (true)
SELECT relrowsecurity 
FROM pg_class 
WHERE relname = 'guarantors' 
  AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================
-- Si después de ejecutar este script sigues teniendo el error 403,
-- por favor verifica lo siguiente en tu aplicación:
-- 
-- 1. Que el usuario esté autenticado correctamente antes de hacer el POST
-- 2. Que el token JWT se esté enviando en el header Authorization
-- 3. Que el token no esté expirado
-- 4. Que estés usando el API key correcto (anon key para aplicaciones cliente)
--
-- Para depurar, en las herramientas de desarrollo del navegador:
-- - Ve a la pestaña Network
-- - Busca la petición POST a guarantors
-- - Revisa que el header Authorization contenga: Bearer [tu-token-jwt]
-- - Si el token dice "anon" en lugar de "authenticated", 
--   el usuario no está autenticado correctamente
