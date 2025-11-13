# 🔧 Instrucciones de Instalación del Sistema de Documentos

## ⚠️ ERROR SOLUCIONADO

Si recibiste el error:
```
ERROR: 42703: column "id" referenced in foreign key constraint does not exist
```

Esto significa que las tablas `application_applicants` y `application_guarantors` no existen aún en tu base de datos.

---

## 📋 Orden de Ejecución de Migraciones

Para instalar el sistema de documentos correctamente, debes ejecutar las migraciones en este orden:

### Paso 1: Verificar Tablas Prerequisito ✅

Primero, verifica si ya tienes las tablas necesarias:

```sql
-- Ejecuta este query en Supabase SQL Editor
SELECT 
    table_name,
    CASE 
        WHEN table_name IN ('application_applicants', 'application_guarantors') THEN '✅ Existe'
        ELSE '❌ No existe'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('application_applicants', 'application_guarantors')
ORDER BY table_name;
```

**Resultado esperado:**
```
table_name                  | status
----------------------------|------------
application_applicants      | ✅ Existe
application_guarantors      | ✅ Existe
```

---

### Paso 2A: Si las tablas NO existen ❌

Ejecuta primero esta migración:

```bash
# Ubicación del archivo
supabase/migrations/20251104_create_application_applicants_guarantors_tables.sql
```

**Opción A: Con Supabase CLI**
```bash
supabase db push
```

**Opción B: Manualmente**
1. Ve a Supabase Dashboard
2. Abre SQL Editor
3. Copia y pega el contenido de `20251104_create_application_applicants_guarantors_tables.sql`
4. Ejecuta la migración
5. Verifica que las tablas se crearon:
   ```sql
   SELECT COUNT(*) FROM application_applicants;
   SELECT COUNT(*) FROM application_guarantors;
   ```

---

### Paso 2B: Si las tablas SÍ existen ✅

¡Perfecto! Puedes continuar al Paso 3.

---

### Paso 3: Ejecutar Migración de Documentos 📄

Ahora sí, ejecuta la migración de documentos:

```bash
# Ubicación del archivo
supabase/migrations/20251113000000_add_applicant_guarantor_documents.sql
```

**Opción A: Con Supabase CLI**
```bash
supabase db push
```

**Opción B: Manualmente**
1. Ve a Supabase Dashboard
2. Abre SQL Editor
3. Copia y pega el contenido de `20251113000000_add_applicant_guarantor_documents.sql`
4. Ejecuta la migración

La migración ahora incluye una **verificación automática** de prerequisitos. Si las tablas no existen, recibirás un mensaje claro:

```
EXCEPTION: La tabla application_applicants no existe. 
Por favor, ejecuta primero la migración 20251104_create_application_applicants_guarantors_tables.sql
```

---

### Paso 4: Verificar Instalación ✅

Verifica que todo se instaló correctamente:

```sql
-- 1. Verificar que las tablas de documentos existen
SELECT 
    table_name,
    '✅' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('applicant_documents', 'guarantor_documents');

-- 2. Verificar índices
SELECT 
    tablename,
    indexname,
    '✅' as status
FROM pg_indexes 
WHERE schemaname = 'public'
  AND tablename IN ('applicant_documents', 'guarantor_documents')
ORDER BY tablename, indexname;

-- 3. Verificar políticas RLS
SELECT 
    tablename,
    policyname,
    cmd,
    '✅' as status
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('applicant_documents', 'guarantor_documents')
ORDER BY tablename, policyname;

-- 4. Verificar vistas
SELECT 
    table_name,
    '✅' as status
FROM information_schema.views 
WHERE table_schema = 'public' 
  AND table_name IN ('applicant_documents_complete', 'guarantor_documents_complete');

-- 5. Verificar funciones
SELECT 
    routine_name,
    '✅' as status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name LIKE '%_document%'
ORDER BY routine_name;
```

**Resultado esperado:**
- ✅ 2 tablas (`applicant_documents`, `guarantor_documents`)
- ✅ 8 índices
- ✅ 8 políticas RLS (4 por tabla)
- ✅ 2 vistas
- ✅ 4 funciones

---

## 🚀 Script de Instalación Rápida

Si prefieres ejecutar todo de una vez, aquí está el script completo:

```sql
-- ============================================
-- SCRIPT DE INSTALACIÓN COMPLETA
-- Sistema de Documentos para Postulantes y Avales
-- ============================================

-- Paso 1: Verificar prerequisitos
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'application_applicants'
    ) THEN
        RAISE EXCEPTION '❌ ERROR: Debes ejecutar primero 20251104_create_application_applicants_guarantors_tables.sql';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'application_guarantors'
    ) THEN
        RAISE EXCEPTION '❌ ERROR: Debes ejecutar primero 20251104_create_application_applicants_guarantors_tables.sql';
    END IF;

    RAISE NOTICE '✅ Prerequisitos verificados correctamente';
END $$;

-- Paso 2: Ejecutar migración completa
-- Copia aquí el contenido completo de 20251113000000_add_applicant_guarantor_documents.sql
-- ... (todo el contenido de la migración)

-- Paso 3: Verificación final
DO $$
DECLARE
    tables_count int;
    indexes_count int;
    policies_count int;
    views_count int;
    functions_count int;
BEGIN
    -- Contar tablas
    SELECT COUNT(*) INTO tables_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name IN ('applicant_documents', 'guarantor_documents');

    -- Contar índices
    SELECT COUNT(*) INTO indexes_count
    FROM pg_indexes 
    WHERE schemaname = 'public'
      AND tablename IN ('applicant_documents', 'guarantor_documents');

    -- Contar políticas
    SELECT COUNT(*) INTO policies_count
    FROM pg_policies 
    WHERE schemaname = 'public'
      AND tablename IN ('applicant_documents', 'guarantor_documents');

    -- Contar vistas
    SELECT COUNT(*) INTO views_count
    FROM information_schema.views 
    WHERE table_schema = 'public' 
      AND table_name IN ('applicant_documents_complete', 'guarantor_documents_complete');

    -- Contar funciones
    SELECT COUNT(*) INTO functions_count
    FROM information_schema.routines 
    WHERE routine_schema = 'public' 
      AND routine_name LIKE '%_document%';

    -- Mostrar resultados
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ INSTALACIÓN COMPLETADA';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Tablas creadas: % de 2', tables_count;
    RAISE NOTICE 'Índices creados: % de 8', indexes_count;
    RAISE NOTICE 'Políticas RLS: % de 8', policies_count;
    RAISE NOTICE 'Vistas creadas: % de 2', views_count;
    RAISE NOTICE 'Funciones creadas: % de 4', functions_count;
    RAISE NOTICE '========================================';

    -- Verificar que todo esté correcto
    IF tables_count < 2 THEN
        RAISE WARNING '⚠️ Faltan tablas por crear';
    END IF;
    IF indexes_count < 8 THEN
        RAISE WARNING '⚠️ Faltan índices por crear';
    END IF;
    IF policies_count < 8 THEN
        RAISE WARNING '⚠️ Faltan políticas RLS por crear';
    END IF;
    IF views_count < 2 THEN
        RAISE WARNING '⚠️ Faltan vistas por crear';
    END IF;
    IF functions_count < 4 THEN
        RAISE WARNING '⚠️ Faltan funciones por crear';
    END IF;
END $$;
```

---

## 🔍 Resolución de Problemas

### Error: "column id does not exist"

**Causa:** Las tablas `application_applicants` o `application_guarantors` no existen.

**Solución:** Ejecuta primero la migración `20251104_create_application_applicants_guarantors_tables.sql`

---

### Error: "relation applicant_documents already exists"

**Causa:** Ya ejecutaste esta migración antes.

**Solución:** 
```sql
-- Opción 1: Eliminar y recrear (¡CUIDADO! Perderás datos)
DROP TABLE IF EXISTS applicant_documents CASCADE;
DROP TABLE IF EXISTS guarantor_documents CASCADE;
-- Luego ejecuta la migración nuevamente

-- Opción 2: Saltarse la migración si ya está aplicada
SELECT 'La tabla ya existe, todo correcto ✅' as status
FROM information_schema.tables 
WHERE table_name = 'applicant_documents';
```

---

### Error: "permission denied for schema public"

**Causa:** El usuario no tiene permisos suficientes.

**Solución:** Ejecuta como usuario administrador o con rol `postgres`:
```sql
GRANT ALL ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
```

---

## 📞 Soporte

Si continúas teniendo problemas:

1. **Verifica las tablas existentes:**
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   ORDER BY table_name;
   ```

2. **Verifica el log de Supabase** en Dashboard → Database → Logs

3. **Consulta la documentación completa:** `GUIA_SISTEMA_DOCUMENTOS_POSTULANTES_AVALES.md`

---

## ✅ Checklist de Instalación

- [ ] Verificar que `application_applicants` existe
- [ ] Verificar que `application_guarantors` existe
- [ ] Ejecutar migración `20251113000000_add_applicant_guarantor_documents.sql`
- [ ] Verificar que `applicant_documents` se creó
- [ ] Verificar que `guarantor_documents` se creó
- [ ] Verificar índices (8)
- [ ] Verificar políticas RLS (8)
- [ ] Verificar vistas (2)
- [ ] Verificar funciones (4)
- [ ] Probar upload de documento en frontend

---

**¡Listo! El sistema de documentos está instalado y funcionando** 🎉

