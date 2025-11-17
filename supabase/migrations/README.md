# Database Migrations Structure

Esta carpeta contiene todas las migraciones de base de datos de Supabase organizadas siguiendo una estructura lógica y ordenada.

## 📁 Estructura de Carpetas

```
supabase/migrations/
├── 00_schema/           # Definición inicial del esquema
├── 01_indexes/          # Índices de base de datos
├── 02_rls_policies/     # Políticas de Row Level Security
├── 03_triggers/         # Triggers y funciones relacionadas
├── 04_fixes/           # Modificaciones y correcciones
├── 05_storage_buckets/  # Configuración de Storage
└── README.md           # Este archivo
```

## 🔢 Orden de Ejecución

Las migraciones se ejecutan en el siguiente orden lógico:

1. **00_schema/** - Primero se crea la estructura base de tablas, tipos y relaciones
2. **01_indexes/** - Luego se crean los índices para optimizar consultas
3. **02_rls_policies/** - Se configuran las políticas de seguridad RLS
4. **03_triggers/** - Se implementan triggers y automatizaciones
5. **04_fixes/** - Se aplican correcciones y modificaciones adicionales
6. **05_storage_buckets/** - Finalmente se configura el storage

## 📋 Contenido de Cada Carpeta

### 00_schema/
Contiene migraciones que definen la estructura inicial de la base de datos:
- `CREATE TABLE` - Creación de tablas
- `CREATE TYPE` - Definición de tipos enumerados
- `CREATE EXTENSION` - Extensiones de PostgreSQL
- `ALTER TABLE` (solo para estructura inicial)

### 01_indexes/
Migraciones dedicadas exclusivamente a la creación de índices:
- `CREATE INDEX` - Índices para optimizar consultas
- `CREATE UNIQUE INDEX` - Índices únicos

### 02_rls_policies/
Políticas de seguridad y control de acceso:
- `CREATE POLICY` - Creación de políticas RLS
- `DROP POLICY` - Eliminación de políticas existentes
- `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`

### 03_triggers/
Automatizaciones y triggers de base de datos:
- `CREATE TRIGGER` - Triggers de base de datos
- `CREATE OR REPLACE FUNCTION` - Funciones relacionadas con triggers
- `DROP TRIGGER` - Eliminación de triggers

### 04_fixes/
Modificaciones, correcciones y actualizaciones:
- `ALTER TABLE` - Modificaciones de estructura
- `UPDATE` - Actualizaciones de datos
- Correcciones de datos existentes
- Migraciones de datos legacy

### 05_storage_buckets/
Configuración de Supabase Storage:
- `INSERT INTO storage.buckets` - Creación de buckets
- `CREATE POLICY` (para storage.objects)

## 🚀 Cómo Agregar Nuevas Migraciones

### 1. Determinar el Tipo
Identifica qué tipo de cambio vas a realizar y elige la carpeta correspondiente.

### 2. Nombrado de Archivos
Los archivos deben seguir el formato de timestamp de Supabase:
```
YYYYMMDDHHMMSS_descriptive_name.sql
```

**Ejemplos:**
- `20250115000000_add_user_preferences_table.sql` → `00_schema/`
- `20250115000001_add_user_preferences_indexes.sql` → `01_indexes/`
- `20250115000002_user_preferences_rls_policies.sql` → `02_rls_policies/`

### 3. Contenido del Archivo
Cada archivo debe contener:
- Comentario descriptivo al inicio explicando el propósito
- Solo el tipo de operaciones correspondiente a la carpeta
- Validación al final si es necesario

### 4. Pruebas
Antes de commitear:
1. Ejecuta `supabase db reset` para probar desde cero
2. Verifica que todas las migraciones se ejecuten correctamente
3. Confirma que la aplicación funciona con los cambios

## ⚠️ Importante

- **NO cambiar nombres de archivos existentes** - Los timestamps son críticos para el orden de ejecución
- **NO cambiar contenido SQL** - Solo mover archivos entre carpetas
- **Mantener orden de ejecución** - El prefijo numérico de las carpetas asegura el orden correcto
- **Una migración por cambio lógico** - Cada archivo debe tener un propósito claro

## 🔍 Verificación

Para verificar que todas las migraciones se detectan correctamente:
```bash
supabase migration list
```

Todas las migraciones deben aparecer en orden cronológico independientemente de su ubicación en subcarpetas.
