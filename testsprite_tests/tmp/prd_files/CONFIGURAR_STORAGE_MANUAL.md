# 🔧 Configuración Manual de Storage en Supabase

## 🚨 Problema Identificado

Los errores 403 que estás experimentando se deben a que los buckets de storage no están configurados correctamente o no tienen las políticas RLS apropiadas.

## 📋 Solución Paso a Paso

### 1. Acceder al Dashboard de Supabase

1. Ve a [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto: `phnkervuiijqmapgswkc`
3. Ve a **Storage** en el menú lateral

### 2. Crear los Buckets Necesarios

#### Bucket 1: `property-images` (Público)
- **ID**: `property-images`
- **Nombre**: `property-images`
- **Público**: ✅ Sí
- **Límite de archivo**: 10MB
- **Tipos MIME permitidos**: `image/jpeg, image/png, image/webp`

#### Bucket 2: `user-documents` (Privado)
- **ID**: `user-documents`
- **Nombre**: `user-documents`
- **Público**: ❌ No
- **Límite de archivo**: 50MB
- **Tipos MIME permitidos**: `application/pdf, image/jpeg, image/png`

#### Bucket 3: `images` (Público - Compatibilidad)
- **ID**: `images`
- **Nombre**: `images`
- **Público**: ✅ Sí
- **Límite de archivo**: 10MB
- **Tipos MIME permitidos**: `image/jpeg, image/png, image/webp`

#### Bucket 4: `files` (Privado - Compatibilidad)
- **ID**: `files`
- **Nombre**: `files`
- **Público**: ❌ No
- **Límite de archivo**: 50MB
- **Tipos MIME permitidos**: `application/pdf, image/jpeg, image/png`

### 3. Configurar Políticas RLS

Ve a **Storage** > **Policies** y crea las siguientes políticas:

#### Para el bucket `property-images`:

**Política 1: Upload de imágenes**
```sql
CREATE POLICY "Users can upload property images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'property-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

**Política 2: Visualizar imágenes**
```sql
CREATE POLICY "Anyone can view property images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'property-images');
```

**Política 3: Eliminar imágenes**
```sql
CREATE POLICY "Users can delete their own property images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'property-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

#### Para el bucket `user-documents`:

**Política 1: Upload de documentos**
```sql
CREATE POLICY "Users can upload their own documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

**Política 2: Visualizar documentos**
```sql
CREATE POLICY "Users can view their own documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'user-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

**Política 3: Eliminar documentos**
```sql
CREATE POLICY "Users can delete their own documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

### 4. Ejecutar Script SQL Completo (Alternativa)

Si prefieres ejecutar todo de una vez, ve a **SQL Editor** y ejecuta el script del archivo `fix_storage_buckets_and_policies.sql` que se creó en tu proyecto.

### 5. Verificar Configuración

Después de configurar todo:

1. **Verifica que los buckets existan** en Storage
2. **Verifica que las políticas estén activas** en Storage > Policies
3. **Prueba la aplicación** intentando subir una imagen o documento

## 🔍 Diagnóstico de Problemas

### Si sigues teniendo errores 403:

1. **Verifica que estés autenticado** - Los usuarios no autenticados no pueden subir archivos
2. **Verifica los permisos del bucket** - Asegúrate de que las políticas estén correctas
3. **Verifica el tamaño del archivo** - No debe exceder los límites configurados
4. **Verifica el tipo de archivo** - Debe ser uno de los tipos MIME permitidos

### Logs útiles:

Revisa la consola del navegador para ver los logs detallados que ahora incluye la aplicación:
- 🚀 Inicio de upload
- ✅ Éxito en subida
- ❌ Errores específicos
- ⚠️ Advertencias y fallbacks

## 🎯 Resultado Esperado

Después de esta configuración:
- ✅ Las imágenes de propiedades se subirán correctamente
- ✅ Los documentos se almacenarán de forma segura
- ✅ Los usuarios solo podrán acceder a sus propios archivos
- ✅ Las imágenes serán públicas para visualización
- ✅ Los documentos serán privados por usuario

## 📞 Soporte

Si tienes problemas con la configuración:
1. Revisa los logs en la consola del navegador
2. Verifica que todos los buckets y políticas estén creados correctamente
3. Asegúrate de estar autenticado en la aplicación
4. Prueba con archivos pequeños primero (< 1MB)

