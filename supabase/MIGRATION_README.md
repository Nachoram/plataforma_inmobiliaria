# 🚀 Aplicación Manual de Migraciones

## 📋 Migraciones Disponibles

### 1. 🔐 Sistema de Autorización de Documentos
### 2. 🏠 Documentos de Propiedad para Compradores

---

## 🔐 **MIGRACIÓN 1: Sistema de Autorización de Documentos**

### ❌ Error Actual
```
Failed to load resource: the server responded with a status of 404 (Not Found)
```
La tabla `document_authorizations` no existe en la base de datos.

### ✅ Solución: Aplicar Migración

#### Paso 1: Ejecutar Script Principal
1. Ve a [Supabase Dashboard](https://supabase.com/dashboard) → `phnkervuiijqmapgswkc` → **SQL Editor**
2. Copia contenido de: `supabase/manual_migration_document_authorizations.sql`
3. Ejecuta el script

#### Paso 2: Verificar
Mensaje esperado:
```
✅ Migración manual completada exitosamente
📋 Tabla creada: document_authorizations
🔒 Políticas RLS configuradas correctamente
```

---

## 🏠 **MIGRACIÓN 2: Documentos de Propiedad**

### 🎯 Funcionalidad
Ahora los compradores pueden ver los documentos oficiales de la propiedad en la pestaña "Documentos".

### ✅ Aplicar Migración

#### Paso 1: Verificar Tabla
Primero, asegúrate de que existe la tabla `property_sale_documents`. Si no existe:

1. Ejecuta el script: `supabase/migrations/04_fixes/20251113000001_create_property_sale_documents.sql`

#### Paso 2: Insertar Datos de Ejemplo
1. Copia contenido de: `supabase/seed_property_documents.sql`
2. Ejecuta en SQL Editor

#### Paso 3: Verificar
Los compradores ahora verán una nueva sección **"Documentos de la Propiedad"** con:
- ✅ Certificado de Dominio Vigente
- ✅ Certificado de Hipotecas y Gravámenes
- ✅ Avalúo Fiscal
- ✅ Planos de la Propiedad
- ✅ Certificado de Número Municipal

---

## 🎯 **Resultado Final**

Después de ambas migraciones, en **Mis Ofertas** → **Ver Detalles** → **Documentos**, verás:

### 🔵 Documentos de la Propiedad (Azul)
- Documentos oficiales de la propiedad que compras
- Siempre visibles para compradores
- Incluye certificados, planos, avaluos, etc.

### 🟢 Tus Documentos de Oferta (Verde)
- Documentos que tú debes subir para tu oferta
- Cédula, comprobantes de ingresos, etc.

### 🟠 Documentos Faltantes (Naranja)
- Lista de documentos que aún necesitas subir

### 🛡️ Autorización de Documentos (Gris/Deshabilitado)
- Sistema para compartir documentos con vendedores (requiere migración completa)

---

## 🔍 **Verificación Completa**

1. ✅ Actualiza la página después de migraciones
2. ✅ Ve a **Mis Ofertas** → selecciona oferta → **Ver Detalles**
3. ✅ Pestaña **Documentos** debe mostrar las 3 secciones claramente diferenciadas
4. ✅ Los compradores pueden ver documentos de propiedad + subir sus propios documentos

## 📞 **Soporte**
Si hay problemas, contacta al administrador del sistema.
