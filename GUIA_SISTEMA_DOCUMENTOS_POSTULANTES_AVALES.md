# 📄 Guía del Sistema de Documentos para Postulantes y Avales

## 📋 Descripción General

Sistema completo para la gestión de documentos de postulantes y avales en el formulario de postulación de arriendo, con soporte para diferentes tipos de personas (Natural Dependiente, Natural Independiente, Persona Jurídica) y sus documentos específicos requeridos.

---

## 🗄️ Estructura de Base de Datos

### Tablas Principales

#### 1. `applicant_documents`
Almacena documentos de postulantes con estructura flexible.

```sql
- id (uuid, PK)
- applicant_id (uuid, FK → application_applicants)
- doc_type (text) - Tipo de documento flexible
- file_name (text) - Nombre original del archivo
- file_url (text) - URL pública en storage
- storage_path (text) - Path completo en Supabase
- file_size_bytes (bigint)
- mime_type (text)
- uploaded_by (uuid, FK → auth.users)
- uploaded_at (timestamptz)
- notes (text)
```

#### 2. `guarantor_documents`
Almacena documentos de avales con la misma estructura.

```sql
- id (uuid, PK)
- guarantor_id (uuid, FK → application_guarantors)
- doc_type (text) - Tipo de documento flexible
- file_name (text) - Nombre original del archivo
- file_url (text) - URL pública en storage
- storage_path (text) - Path completo en Supabase
- file_size_bytes (bigint)
- mime_type (text)
- uploaded_by (uuid, FK → auth.users)
- uploaded_at (timestamptz)
- notes (text)
```

### Características de las Tablas

✅ **DELETE CASCADE**: Los documentos se eliminan automáticamente al eliminar el postulante/aval
✅ **RLS Habilitado**: Solo usuarios autenticados con permisos pueden acceder
✅ **Índices Optimizados**: Búsquedas rápidas por applicant_id, guarantor_id, doc_type
✅ **Triggers**: Actualización automática de `updated_at`
✅ **Vistas**: `applicant_documents_complete` y `guarantor_documents_complete`

---

## 📦 Tipos de Documentos por Categoría

### 1. **Persona Jurídica** (Postulantes y Avales)

| Código | Nombre | Requerido |
|--------|--------|-----------|
| `informe_comercial` | Informe Comercial (Dicom) | ✅ Sí |
| `escritura_constitucion` | Escritura de Constitución | ✅ Sí |
| `certificado_vigencia` | Certificado de Vigencia | ✅ Sí |
| `rut_empresa` | RUT Empresa | ✅ Sí |
| `carpeta_tributaria` | Carpeta Tributaria SII | ✅ Sí |
| `poder_notarial` | Poder Notarial Representante | ⚪ No |
| `cedula_representante` | Cédula Representante Legal | ✅ Sí |

**Total obligatorios: 6 de 7 documentos**

### 2. **Persona Natural Dependiente** (Empleados)

| Código | Nombre | Requerido |
|--------|--------|-----------|
| `informe_comercial` | Informe Comercial (Dicom) | ✅ Sí |
| `liquidaciones_sueldo` | Últimas 3 Liquidaciones | ✅ Sí |
| `contrato_trabajo` | Contrato de Trabajo | ✅ Sí |
| `certificado_antiguedad` | Certificado de Antigüedad | ✅ Sí |
| `certificado_afp` | Certificado AFP | ✅ Sí |
| `cedula_identidad` | Cédula de Identidad | ✅ Sí |

**Total obligatorios: 6 de 6 documentos**

### 3. **Persona Natural Independiente** (Honorarios)

| Código | Nombre | Requerido |
|--------|--------|-----------|
| `informe_comercial` | Informe Comercial (Dicom) | ✅ Sí |
| `carpeta_tributaria` | Carpeta Tributaria SII | ✅ Sí |
| `declaracion_renta` | Declaración Anual de Renta | ✅ Sí |
| `boletas_honorarios` | 6 Últimas Boletas de Honorarios | ✅ Sí |
| `certificado_cotizaciones_independiente` | Certificado de Cotizaciones | ✅ Sí |
| `cedula_identidad` | Cédula de Identidad | ✅ Sí |

**Total obligatorios: 6 de 6 documentos**

---

## 🚀 Instalación y Configuración

### Paso 1: Aplicar la Migración SQL

```bash
# Opción A: Usando Supabase CLI
supabase db push

# Opción B: Copiar y ejecutar en Supabase Dashboard
# 1. Ir a SQL Editor en Supabase Dashboard
# 2. Copiar el contenido de: supabase/migrations/20251113000000_add_applicant_guarantor_documents.sql
# 3. Ejecutar la migración
```

### Paso 2: Verificar las Tablas

```sql
-- Verificar que las tablas existen
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('applicant_documents', 'guarantor_documents');

-- Verificar índices
SELECT indexname, tablename 
FROM pg_indexes 
WHERE tablename IN ('applicant_documents', 'guarantor_documents');

-- Verificar políticas RLS
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('applicant_documents', 'guarantor_documents');
```

### Paso 3: Configurar Storage (Si no existe)

```sql
-- Verificar/crear bucket user-documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-documents',
  'user-documents',
  false,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;
```

---

## 💻 Uso en Frontend

### Estructura de Carpetas en Storage

```
user-documents/
├── {userId}/
│   ├── applicants/
│   │   └── {applicantId}/
│   │       ├── informe_comercial_1699999999999.pdf
│   │       ├── cedula_identidad_1699999999999.jpg
│   │       └── liquidaciones_sueldo_1699999999999.pdf
│   └── guarantors/
│       └── {guarantorId}/
│           ├── informe_comercial_1699999999999.pdf
│           ├── cedula_identidad_1699999999999.jpg
│           └── contrato_trabajo_1699999999999.pdf
```

### Ejemplo de Subida de Documento (Postulante)

```typescript
// 1. Subir archivo a Storage
const { data: uploadData, error: uploadError } = await supabase.storage
  .from('user-documents')
  .upload(
    `${userId}/applicants/${applicantId}/informe_comercial_${Date.now()}.pdf`,
    file
  );

// 2. Obtener URL pública
const { data: urlData } = supabase.storage
  .from('user-documents')
  .getPublicUrl(uploadData.path);

// 3. Guardar registro en BD
const { error } = await supabase
  .from('applicant_documents')
  .insert({
    applicant_id: applicantId,
    doc_type: 'informe_comercial',
    file_name: file.name,
    file_url: urlData.publicUrl,
    storage_path: uploadData.path,
    file_size_bytes: file.size,
    mime_type: file.type,
    uploaded_by: userId
  });
```

### Ejemplo de Consulta de Documentos

```typescript
// Obtener todos los documentos de un postulante
const { data: docs } = await supabase
  .from('applicant_documents')
  .select('*')
  .eq('applicant_id', applicantId)
  .order('uploaded_at', { ascending: false });

// Obtener documento específico más reciente
const { data: latestDoc } = await supabase
  .rpc('get_latest_applicant_document', {
    p_applicant_id: applicantId,
    p_doc_type: 'informe_comercial'
  });

// Contar documentos por tipo
const { data: counts } = await supabase
  .rpc('count_applicant_documents_by_type', {
    p_applicant_id: applicantId
  });
```

---

## 🔒 Seguridad (RLS)

### Políticas Implementadas

#### Postulantes (`applicant_documents`)

1. **SELECT**: Usuario puede ver documentos de sus propias postulaciones
2. **INSERT**: Usuario puede subir documentos para sus propias postulaciones
3. **UPDATE**: Usuario puede actualizar documentos que él subió
4. **DELETE**: Usuario puede eliminar documentos que él subió

#### Avales (`guarantor_documents`)

Las mismas políticas aplican para documentos de avales.

### Validación de Permisos

```sql
-- La política verifica que el usuario sea dueño de la postulación
uploaded_by = auth.uid()
OR
applicant_id IN (
  SELECT aa.id 
  FROM application_applicants aa
  JOIN applications app ON app.id = aa.application_id
  WHERE app.applicant_id = auth.uid()
)
```

---

## 🛠️ Funciones Auxiliares

### 1. Contar Documentos por Tipo

```sql
-- Para postulantes
SELECT * FROM count_applicant_documents_by_type('applicant-uuid-here');

-- Para avales
SELECT * FROM count_guarantor_documents_by_type('guarantor-uuid-here');
```

**Retorna:**
```
doc_type               | document_count
-----------------------|---------------
informe_comercial      | 1
cedula_identidad       | 1
liquidaciones_sueldo   | 3
```

### 2. Obtener Documento Más Reciente

```sql
-- Para postulantes
SELECT * FROM get_latest_applicant_document(
  'applicant-uuid-here',
  'informe_comercial'
);

-- Para avales
SELECT * FROM get_latest_guarantor_document(
  'guarantor-uuid-here',
  'informe_comercial'
);
```

---

## 📊 Vistas Completas

### Vista `applicant_documents_complete`

Proporciona información completa del documento con datos del postulante y aplicación.

```sql
SELECT * FROM applicant_documents_complete
WHERE applicant_id = 'uuid-here';
```

**Columnas incluidas:**
- Todos los campos del documento
- Nombre completo del postulante
- RUT del postulante
- Tipo de entidad (natural/jurídica)
- ID de la aplicación
- ID de la propiedad
- Estado de la aplicación

### Vista `guarantor_documents_complete`

Similar para documentos de avales.

---

## 📝 Validaciones en Frontend

### Validación de Tipo de Archivo

```typescript
const ALLOWED_TYPES = ['.pdf', '.jpg', '.jpeg', '.png'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

function validateFile(file: File): boolean {
  // Validar extensión
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (!ext || !ALLOWED_TYPES.includes(`.${ext}`)) {
    alert('Tipo de archivo no permitido');
    return false;
  }
  
  // Validar tamaño
  if (file.size > MAX_SIZE) {
    alert('El archivo es demasiado grande (máximo 10MB)');
    return false;
  }
  
  return true;
}
```

### Validación de Documentos Requeridos

```typescript
function validateRequiredDocuments(
  applicant: ApplicantData
): string[] {
  const errors: string[] = [];
  const requiredDocs = getRequiredDocuments(applicant);
  const uploadedDocs = applicant.documents || [];
  
  requiredDocs.forEach(reqDoc => {
    if (reqDoc.required) {
      const uploaded = uploadedDocs.find(d => d.type === reqDoc.type);
      if (!uploaded || (!uploaded.file && !uploaded.url)) {
        errors.push(`Falta: ${reqDoc.label}`);
      }
    }
  });
  
  return errors;
}
```

---

## 🎨 UI/UX Implementada

### Colores por Sección

- **Postulantes**: 🟦 Azul/Morado (Blue/Purple gradient)
- **Avales**: 🟩 Verde/Emerald (Green/Emerald gradient)

### Estados Visuales

- ✅ **Subido**: Checkmark verde + nombre de archivo
- 📤 **No subido**: Botón "Subir" azul/verde
- 🗑️ **Eliminar**: Botón rojo con icono de papelera

### Feedback al Usuario

- Validación de tamaño inmediata
- Mensajes de error claros
- Indicador de documento requerido (*)
- Información sobre formatos aceptados

---

## 🧪 Testing

### Tests Recomendados

1. **Test de Subida**
   - Subir documento válido
   - Verificar URL generada
   - Verificar registro en BD

2. **Test de Validación**
   - Intentar subir archivo > 10MB
   - Intentar subir tipo no permitido
   - Verificar mensaje de error

3. **Test de Permisos RLS**
   - Usuario A sube documento
   - Usuario B intenta acceder
   - Verificar acceso denegado

4. **Test de Eliminación en Cascada**
   - Eliminar postulante
   - Verificar que documentos se eliminan
   - Verificar que archivos en storage se mantienen (limpieza manual)

---

## 🔧 Mantenimiento

### Limpieza de Archivos Huérfanos

```sql
-- Buscar archivos en storage sin registro en BD
-- (Requiere script personalizado con acceso a Storage API)

-- Eliminar registros de documentos huérfanos
DELETE FROM applicant_documents
WHERE applicant_id NOT IN (
  SELECT id FROM application_applicants
);

DELETE FROM guarantor_documents
WHERE guarantor_id NOT IN (
  SELECT id FROM application_guarantors
);
```

### Monitoreo de Espacio

```sql
-- Ver tamaño total de documentos por postulante
SELECT 
  applicant_id,
  COUNT(*) as total_docs,
  SUM(file_size_bytes) as total_size_bytes,
  pg_size_pretty(SUM(file_size_bytes)::bigint) as total_size
FROM applicant_documents
GROUP BY applicant_id
ORDER BY SUM(file_size_bytes) DESC;

-- Similar para avales
SELECT 
  guarantor_id,
  COUNT(*) as total_docs,
  SUM(file_size_bytes) as total_size_bytes,
  pg_size_pretty(SUM(file_size_bytes)::bigint) as total_size
FROM guarantor_documents
GROUP BY guarantor_id
ORDER BY SUM(file_size_bytes) DESC;
```

---

## 📞 Soporte

Para problemas o preguntas:
1. Verificar logs de Supabase
2. Revisar políticas RLS
3. Validar permisos de storage
4. Consultar documentación de Supabase Storage

---

## ✅ Checklist de Implementación

- [x] Migración SQL aplicada
- [x] Tablas creadas correctamente
- [x] RLS habilitado y políticas configuradas
- [x] Índices creados
- [x] Funciones auxiliares disponibles
- [x] Vistas creadas
- [x] Storage bucket configurado
- [x] Frontend integrado con nuevas tablas
- [x] Validaciones implementadas
- [x] UI/UX consistente
- [ ] Tests ejecutados
- [ ] Documentación revisada

---

## 📚 Referencias

- [Supabase Storage Docs](https://supabase.com/docs/guides/storage)
- [Supabase RLS Docs](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Triggers](https://www.postgresql.org/docs/current/trigger-definition.html)

---

**Versión:** 1.0.0  
**Fecha:** 13 de Noviembre, 2025  
**Estado:** ✅ Producción Ready








