# 🗑️ Database Rollback Scripts - Revertir Cambios

Este directorio contiene scripts SQL para revertir cambios de base de datos y volver a un estado anterior. **Usar con extrema precaución**.

## 📁 Estructura de Archivos

```
supabase/rollback/
├── complete_rollback.sql    # 🚨 Script maestro completo (ELIMINA TODO)
├── rollback_00_schema.sql   # 🗂️ Eliminar tablas y tipos
├── rollback_01_indexes.sql  # 🏷️ Eliminar índices
├── rollback_02_rls_policies.sql # 🔒 Eliminar políticas RLS
├── rollback_03_triggers.sql # ⚡ Eliminar triggers y funciones
├── rollback_04_fixes.sql    # 🔧 Revertir ALTER TABLE
├── rollback_05_storage.sql  # 📦 Vaciar y eliminar buckets
└── README.md               # 📖 Este archivo
```

## 🚨 ADVERTENCIAS CRÍTICAS

### ⚠️ PELIGRO EXTREMO
- **Estos scripts ELIMINAN DATOS PERMANENTEMENTE**
- **NO EJECUTAR en producción bajo ninguna circunstancia**
- **Crear backup antes de ejecutar cualquier rollback**
- **No hay "undo" para estos scripts**

### 📊 Impacto por Script

| Script | Impacto | Reversibilidad |
|--------|---------|----------------|
| `rollback_05_storage.sql` | Elimina archivos y buckets | ❌ Irreversible |
| `rollback_04_fixes.sql` | Modifica estructura de tablas | ⚠️ Parcial |
| `rollback_03_triggers.sql` | Elimina automatizaciones | ✅ Recreable |
| `rollback_02_rls_policies.sql` | Elimina seguridad | ✅ Recreable |
| `rollback_01_indexes.sql` | Elimina optimizaciones | ✅ Recreable |
| `rollback_00_schema.sql` | **DESTRUYE TODO** | ❌ Irreversible |

## 🎯 Cuándo Usar Cada Script

### Rollback Parcial (Desarrollo)
```bash
# Solo revertir políticas RLS
supabase db reset --file supabase/rollback/rollback_02_rls_policies.sql

# Solo eliminar índices problemáticos
supabase db reset --file supabase/rollback/rollback_01_indexes.sql
```

### Rollback Completo (Reset Total)
```bash
# ⚠️ DESTRUYE TODA LA BASE DE DATOS
supabase db reset --file supabase/rollback/complete_rollback.sql
```

## 📋 Orden de Ejecución

Los scripts están numerados para ejecutarse en orden inverso a las migraciones:

1. **Storage** (05) - Primero, menos dependencias
2. **Fixes** (04) - Revertir modificaciones antes de eliminar tablas
3. **Triggers** (03) - Eliminar automatizaciones
4. **RLS Policies** (02) - Eliminar seguridad
5. **Indexes** (01) - Eliminar optimizaciones
6. **Schema** (00) - **Destruir todo** al final

## 🔍 Verificación Post-Rollback

### Después de rollback parcial:
```sql
-- Verificar qué quedó
SELECT schemaname, tablename FROM pg_tables WHERE schemaname = 'public';

-- Verificar índices restantes
SELECT indexname FROM pg_indexes WHERE schemaname = 'public';

-- Verificar políticas RLS
SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public';
```

### Después de rollback completo:
```sql
-- Todo debería estar vacío
SELECT COUNT(*) as tables FROM information_schema.tables WHERE table_schema = 'public';
SELECT COUNT(*) as indexes FROM pg_indexes WHERE schemaname = 'public';
SELECT COUNT(*) as policies FROM pg_policies WHERE schemaname = 'public';
SELECT COUNT(*) as buckets FROM storage.buckets;
```

## 🛠️ Casos de Uso Comunes

### 1. Reset de Desarrollo
```bash
# Limpiar todo y empezar desde cero
supabase db reset --file supabase/rollback/complete_rollback.sql
supabase db reset  # Recrear esquema básico
# Ejecutar seeds para datos de prueba
```

### 2. Problemas con Políticas RLS
```bash
# Si las políticas bloquean operaciones legítimas
supabase db reset --file supabase/rollback/rollback_02_rls_policies.sql
# Recrear políticas corregidas
```

### 3. Índices Problemáticos
```bash
# Si un índice causa problemas de performance o errores
supabase db reset --file supabase/rollback/rollback_01_indexes.sql
# Recrear solo los índices necesarios
```

### 4. Triggers Conflictivos
```bash
# Si triggers causan bucles infinitos o errores
supabase db reset --file supabase/rollback/rollback_03_triggers.sql
# Implementar triggers corregidos
```

## 🔧 Troubleshooting

### Error: "cannot drop X because other objects depend on it"
```
Solución: Ejecutar complete_rollback.sql que usa CASCADE
```

### Error: "policy X for table Y does not exist"
```
Solución: El script ignora errores IF EXISTS, continúa normalmente
```

### Storage no se elimina completamente
```
Solución: Los buckets pueden requerir eliminación manual desde Supabase Dashboard
```

### Funciones no se eliminan
```
Solución: Verificar dependencias con pg_depend o usar CASCADE
```

## 📝 Scripts Detallados

### rollback_00_schema.sql
- Elimina todas las tablas con `CASCADE`
- Elimina tipos enumerados
- Elimina extensiones
- **Resultado**: Base de datos completamente vacía

### rollback_01_indexes.sql
- Elimina todos los índices creados en migraciones
- Usa `IF EXISTS` para evitar errores
- Preserva índices del sistema

### rollback_02_rls_policies.sql
- Elimina todas las políticas RLS
- Deshabilita RLS en tablas
- Políticas de storage incluidas

### rollback_03_triggers.sql
- Elimina triggers y funciones
- Orden correcto: triggers primero, luego funciones
- Incluye funciones helper

### rollback_04_fixes.sql
- Revierte `ALTER TABLE` statements
- Elimina columnas agregadas
- Elimina constraints y validaciones

### rollback_05_storage.sql
- Vacía todos los buckets
- Elimina buckets
- Elimina políticas de storage

## 🎯 Mejores Prácticas

### ✅ Hacer Siempre
- [ ] **Backup antes de cualquier rollback**
- [ ] **Probar en staging primero**
- [ ] **Documentar por qué se hace rollback**
- [ ] **Verificar resultado con queries de verificación**

### ❌ Nunca Hacer
- [ ] Ejecutar en producción
- [ ] Ejecutar sin entender el impacto
- [ ] Ejecutar scripts parcialmente sin verificar dependencias
- [ ] Olvidar recrear esquema después de rollback completo

## 🔄 Recuperación Post-Rollback

Después de un rollback exitoso:

1. **Recrear esquema básico:**
   ```bash
   supabase db reset
   ```

2. **Ejecutar migraciones:**
   ```bash
   supabase migration up
   ```

3. **Poblar con seeds:**
   ```bash
   supabase db seed --file supabase/seed/init_seed_database.sql
   ```

4. **Verificar aplicación:**
   - Login funciona
   - CRUD operations funcionan
   - RLS policies correctas

## 📞 Soporte

Si algo sale mal:
1. Revisar logs de Supabase CLI
2. Verificar queries de verificación
3. Consultar documentación de Supabase
4. Preguntar en el equipo antes de continuar

**Recuerda: rollback es destructivo. Úsalo con responsabilidad.** 🛡️
