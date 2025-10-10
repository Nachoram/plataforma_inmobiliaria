# Guía de Sistemización Documental para Postulantes de Arriendo

Esta guía explica la nueva estructura sistematizada para manejar documentos de postulantes de arriendo, optimizada para integración con n8n.

## 🎯 Objetivo

Crear una estructura de base de datos ordenada que permita:
- Gestionar documentos de postulantes de manera estructurada
- Facilitar la extracción automática de contenido desde n8n
- Mantener trazabilidad completa del procesamiento documental

## 📋 Estructura de Tablas

### 1. `applicant_document_types`
Tabla de tipos de documentos estandarizados para postulantes.

**Campos principales:**
- `code`: Código único del tipo de documento
- `name`: Nombre descriptivo
- `category`: Categoría (identification, financial, employment, other)
- `is_required`: Si es obligatorio para postulaciones
- `processing_priority`: Prioridad de procesamiento en n8n

**Tipos incluidos:**
- `cedula_identidad`: Cédula de Identidad
- `informe_comercial`: Informe Comercial
- `liquidacion_sueldo`: Liquidación de Sueldo
- `certificado_antiguiedad`: Certificado de Antigüedad
- `pasaporte`: Pasaporte
- `contrato_trabajo`: Contrato de Trabajo
- `extracto_bancario`: Extracto Bancario
- `certificado_afp`: Certificado AFP
- Y más...

### 2. `applicant_document_content`
Tabla para almacenar contenido extraído de documentos.

**Campos principales:**
- `document_id`: Referencia al documento original
- `applicant_id`: Referencia al postulante
- `document_type_code`: Tipo de documento
- `extracted_data`: Datos estructurados en JSON
- `extraction_method`: Método de extracción (ocr, manual, api, ai)
- `confidence_score`: Puntuación de confianza (0.00-1.00)
- `full_name`, `rut`, `monthly_income`, etc.: Campos específicos extraídos

### 3. Mejoras en `documents`
Campos agregados para mejor gestión:
- `applicant_document_type_code`: Tipo específico para postulantes
- `processing_status`: Estado del procesamiento
- `ocr_text`: Texto extraído por OCR
- `metadata`: Metadatos adicionales en JSON

## 🔧 Funciones para n8n

### `get_pending_applicant_documents(applicant_uuid, limit_count)`
Obtiene documentos pendientes de procesamiento.

**Parámetros:**
- `applicant_uuid`: UUID del postulante (opcional)
- `limit_count`: Límite de resultados (default: 10)

**Retorna:**
- Lista de documentos con prioridad de procesamiento
- URLs de archivos para descargar
- Información del postulante

### `update_document_processing_status(document_uuid, new_status, ocr_content, metadata_json)`
Actualiza el estado de procesamiento de un documento.

**Parámetros:**
- `document_uuid`: UUID del documento
- `new_status`: Nuevo estado (uploaded, processing, processed, failed)
- `ocr_content`: Texto OCR (opcional)
- `metadata_json`: Metadatos adicionales (opcional)

### `insert_document_content(document_uuid, content_data, extraction_method, confidence, extracted_fields)`
Inserta contenido extraído de un documento.

**Parámetros:**
- `document_uuid`: UUID del documento
- `content_data`: Datos estructurados en JSON
- `extraction_method`: Método de extracción
- `confidence`: Puntuación de confianza
- `extracted_fields`: Campos específicos extraídos

## 👁️ Vistas para Consultas

### `applicant_documents_complete`
Vista completa que une toda la información documental.

**Campos incluidos:**
- Información del documento
- Tipo de documento
- Datos del postulante
- Contenido extraído
- Información de la aplicación

### `applicant_documents_pending_processing`
Vista específica para documentos pendientes de procesamiento por n8n.

## 🛠️ Solución de Problemas Comunes

### Error: "column d.applicant_id does not exist"

**Síntomas:** Error al ejecutar funciones que hacen JOIN con applicants.

**Causa:** Las columnas requeridas no se agregaron correctamente a la tabla `documents`.

**Solución:**
1. Ejecutar el script `solucion_error_applicant_id.sql`
2. Verificar con `verificar_antes_de_funciones.sql`
3. Proceder con las funciones

### Error: "table applicant_document_types does not exist"

**Causa:** Los pasos se ejecutaron en orden incorrecto.

**Solución:** Ejecutar los pasos en orden:
1. PASO 1 → PASO 2 → PASO 3 → PASO 4 → PASO 5 → PASO 6...

### Error: "permission denied for table"

**Causa:** Políticas RLS demasiado restrictivas.

**Solución:** Las políticas actuales permiten acceso amplio, pero las funciones manejan la seguridad.

## 🚀 Flujo de Trabajo con n8n

### 1. Obtener Documentos Pendientes
```sql
SELECT * FROM get_pending_applicant_documents(NULL, 5);
```

### 2. Procesar Documento
- Descargar archivo desde `file_url`
- Aplicar OCR o procesamiento AI
- Extraer datos estructurados

### 3. Actualizar Estado y Insertar Contenido
```sql
-- Actualizar estado
SELECT update_document_processing_status(
  'document-uuid',
  'processed',
  'texto extraído por OCR...',
  '{"confidence": 0.95, "pages": 2}'
);

-- Insertar contenido extraído
SELECT insert_document_content(
  'document-uuid',
  '{"full_name": "Juan Pérez", "rut": "12.345.678-9"}',
  'ocr',
  0.92,
  '{"full_name": "Juan Pérez", "rut": "12.345.678-9", "monthly_income": 800000}'
);
```

## 📊 Consultas Útiles

### Documentos por Postulante
```sql
SELECT
  adt.name as tipo_documento,
  d.file_url,
  adc.full_name,
  adc.monthly_income,
  adc.extraction_method
FROM applicant_document_content adc
JOIN documents d ON adc.document_id = d.id
JOIN applicant_document_types adt ON adc.document_type_code = adt.code
WHERE adc.applicant_id = 'applicant-uuid';
```

### Estadísticas de Procesamiento
```sql
SELECT
  processing_status,
  COUNT(*) as cantidad,
  AVG(confidence_score) as confianza_promedio
FROM applicant_document_content
GROUP BY processing_status;
```

### Documentos Requeridos Faltantes
```sql
SELECT
  a.full_name as postulante,
  adt.name as documento_requerido,
  adt.category
FROM applicants a
CROSS JOIN applicant_document_types adt
WHERE adt.is_required = true
  AND NOT EXISTS (
    SELECT 1 FROM applicant_document_content adc
    WHERE adc.applicant_id = a.id
      AND adc.document_type_code = adt.code
      AND adc.processing_status = 'completed'
  );
```

## 🔒 Seguridad (RLS)

- Los usuarios solo pueden acceder a documentos de sus propias postulaciones
- Políticas RLS implementadas en todas las tablas nuevas
- Funciones con `SECURITY DEFINER` para acceso controlado

## 📈 Optimización

- Índices GIN para búsqueda en JSON
- Índices específicos para campos de consulta frecuente
- Vistas materializadas para consultas complejas (si es necesario)

## 🛠️ Próximos Pasos

1. **Aplicar la migración** en producción
2. **Configurar n8n** para procesar documentos automáticamente
3. **Crear dashboards** para monitoreo del procesamiento
4. **Implementar validaciones** de datos extraídos
5. **Agregar machine learning** para mejor extracción de datos

## 📞 Soporte

Para preguntas sobre esta sistematización, revisar:
- Código de la migración: `supabase/migrations/20251010_applicant_documents_systematization.sql`
- Documentación de API de Supabase
- Workflows de n8n existentes
