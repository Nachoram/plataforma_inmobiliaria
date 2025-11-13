# Implementación: Sección de Perfil de Usuario

## 📋 Resumen

Se ha implementado una nueva sección completa de perfil de usuario que reemplaza la antigua sección de "Contratos" en el menú de navegación. Esta nueva funcionalidad permite a los usuarios:

1. **Declarar su perfil profesional** (corredor independiente, empresa de corretaje, buscar arriendo, buscar compra)
2. **Completar y editar información personal/tributaria**
3. **Cargar y gestionar documentos personales** (DICOM, carpeta tributaria, etc.)
4. **Gestionar avales frecuentes** con sus respectivos documentos

---

## 🎯 Características Implementadas

### 1. Declaración de Perfil
- ✅ Selector múltiple para tipos de perfil:
  - Corredor Independiente
  - Empresa de Corretaje
  - Busco Arriendo
  - Busco Comprar
- ✅ Interfaz visual con iconos y estados seleccionados

### 2. Información Personal/Empresarial
- ✅ Soporte para **Persona Natural**:
  - **Tipo de empleo**: Trabajador Dependiente o Independiente
  - Nombre completo (nombre, apellidos paterno y materno)
  - RUT
  - Dirección completa
  - Contacto (email, teléfono)

- ✅ Soporte para **Persona Jurídica**:
  - Razón social
  - RUT empresa
  - Representante legal (nombre y RUT)
  - Dirección y contacto

### 3. Gestión de Documentos Personales
- ✅ Carga de documentos específicos según tipo de entidad y empleo:
  
  **Persona Natural - Trabajador Dependiente:**
  - Informe DICOM Personal
  - Carpeta Tributaria
  - Cédula de Identidad
  - Certificado Antigüedad Laboral
  - Liquidaciones de Sueldo (últimos 3 meses)
  - Contrato de Trabajo

  **Persona Natural - Trabajador Independiente:**
  - Informe DICOM Personal
  - Carpeta Tributaria
  - Cédula de Identidad
  - Declaración de Impuestos (últimos 2 años / F22)
  - Boletas de Honorarios (últimos 6 meses)
  - Certificado de Cotizaciones
  - Inicio de Actividades

  **Persona Jurídica:**
  - Informe DICOM Empresa
  - Carpeta Tributaria Empresa
  - RUT Empresa
  - Escritura de Constitución
  - Poderes
  - Certificado de Vigencia

- ✅ Funcionalidades:
  - Subir documentos (PDF, imágenes)
  - Ver documentos (abrir en nueva pestaña)
  - Reemplazar documentos existentes
  - Eliminar documentos
  - Indicadores visuales de completitud

### 4. Gestión de Avales Frecuentes
- ✅ Agregar múltiples avales
- ✅ Soporte para avales persona natural y jurídica
- ✅ Información completa por aval:
  - Datos personales/empresariales
  - Contacto
  - Dirección
  - Documentos asociados

- ✅ Gestión de documentos por aval:
  - Mismos tipos de documentos que perfil personal
  - Carga, vista, reemplazo y eliminación

---

## 🗄️ Base de Datos

### Tablas Creadas

#### 1. `profiles` (extendida)
Nuevas columnas agregadas:
```sql
- user_profile_type: TEXT[] -- Array de tipos de perfil
- professional_type: TEXT -- Tipo profesional principal
- employment_type: TEXT -- 'dependiente' o 'independiente' (persona natural)
- company_legal_name: TEXT
- company_rut: TEXT
- legal_representative_name: TEXT
- legal_representative_rut: TEXT
- profile_completed: BOOLEAN
- profile_completed_at: TIMESTAMPTZ
```

#### 2. `user_documents`
Documentos personales del usuario:
```sql
- id: uuid (PK)
- user_id: uuid (FK -> auth.users)
- doc_type: text
- file_name: text
- file_url: text
- file_size: integer
- mime_type: text
- uploaded_at: timestamptz
- updated_at: timestamptz
```

#### 3. `user_guarantors`
Avales frecuentes del usuario:
```sql
- id: uuid (PK)
- user_id: uuid (FK -> auth.users)
- entity_type: text (natural/juridica)
- employment_type: text ('dependiente'/'independiente' para natural)
- first_name, paternal_last_name, maternal_last_name: text
- rut: text
- company_name, company_rut: text
- legal_representative_name, legal_representative_rut: text
- profession, monthly_income: text/numeric
- contact_email, contact_phone: text
- address_*: text (street, number, commune, region, etc)
- created_at, updated_at: timestamptz
```

#### 4. `user_guarantor_documents`
Documentos de los avales:
```sql
- id: uuid (PK)
- user_guarantor_id: uuid (FK -> user_guarantors)
- doc_type: text
- file_name: text
- file_url: text
- file_size: integer
- mime_type: text
- uploaded_at: timestamptz
- updated_at: timestamptz
```

### Storage Bucket

**Bucket:** `user-documents`
- Acceso: Público (con RLS)
- Límite de tamaño: 10MB por archivo
- Tipos permitidos: PDF, JPEG, PNG, WebP
- Estructura de carpetas: `{user_id}/`, `{user_id}/guarantors/{guarantor_id}/`

### Row Level Security (RLS)

Todas las tablas tienen políticas RLS implementadas:
- ✅ Usuarios solo pueden ver/modificar sus propios datos
- ✅ Usuarios solo pueden acceder a documentos de sus propios avales
- ✅ Storage con políticas basadas en user_id en la ruta del archivo

### Función Helper

```sql
get_user_profile_with_documents(p_user_id uuid)
```
Retorna el perfil completo del usuario con documentos y avales en formato JSON.

---

## 🎨 Interfaz de Usuario

### Navegación

**Menú Desktop:**
- ✅ Nuevo botón "Mi Perfil" en el menú superior
- ✅ Icono: UserCircle
- ✅ Posicionado después de "Mis Postulaciones"

**Menú Mobile:**
- ✅ Nuevo botón "Mi Perfil" en navegación inferior
- ✅ También disponible en menú desplegable móvil

**Ruta:** `/perfil`

### Componente Principal: `UserProfilePage`

**3 Pestañas:**

1. **Perfil e Información**
   - Declaración de perfil (multi-selector visual)
   - Tipo de entidad (Natural/Jurídica)
   - **Tipo de empleo** (Dependiente/Independiente) - solo para persona natural
   - Formulario de información personal/empresarial
   - Dirección y contacto
   - Botón "Guardar Cambios"

2. **Mis Documentos**
   - **Documentos dinámicos** según tipo de entidad y empleo
   - Lista de tipos de documentos requeridos
   - Botones de acción: Ver, Subir, Reemplazar, Eliminar
   - Indicadores visuales de completitud (CheckCircle verde)
   - Estados de carga durante upload

3. **Mis Avales**
   - Lista lateral de avales
   - Panel de detalles del aval seleccionado
   - Botón "Agregar Aval"
   - Selector de tipo de entidad por aval
   - **Selector de tipo de empleo** por aval (si es persona natural)
   - Formulario de datos del aval
   - Sección de documentos del aval (documentos dinámicos según tipo)
   - Botón eliminar aval

### Estados y Feedback

- ✅ Loading spinner durante carga inicial
- ✅ Mensajes de éxito/error con banner temporal
- ✅ Estados de carga en botones (spinners)
- ✅ Indicadores visuales de documentos subidos
- ✅ Contadores de documentos y avales en pestañas

---

## 📁 Estructura de Archivos

```
src/
├── components/
│   ├── profile/
│   │   └── UserProfilePage.tsx    [NUEVO] Componente principal
│   ├── AppContent.tsx              [MODIFICADO] Agregada ruta /perfil
│   └── Layout.tsx                  [MODIFICADO] Navegación actualizada

supabase/
└── migrations/
    ├── 20251113100000_create_user_profile_tables.sql        [NUEVO]
    └── 20251113100001_create_user_documents_storage.sql     [NUEVO]
```

---

## 🔧 Tecnologías Utilizadas

- **React** (TypeScript)
- **React Hooks** (useState, useEffect)
- **React Router** (navegación)
- **Supabase Client** (auth, database, storage)
- **Lucide Icons** (iconografía)
- **Tailwind CSS** (estilos)

---

## 🚀 Cómo Usar

### Para Usuarios

1. **Acceder al Perfil:**
   - Click en "Mi Perfil" en el menú superior (desktop)
   - O en navegación inferior (mobile)

2. **Completar Perfil:**
   - Seleccionar uno o más tipos de perfil
   - Elegir tipo de entidad (Natural/Jurídica)
   - Completar información personal/empresarial
   - Guardar cambios

3. **Subir Documentos:**
   - Ir a pestaña "Mis Documentos"
   - Click en "Subir" para cada tipo de documento
   - Seleccionar archivo (PDF o imagen)
   - Confirmar que aparece el check verde

4. **Gestionar Avales:**
   - Ir a pestaña "Mis Avales"
   - Click en "Agregar Aval"
   - Completar información del aval
   - Subir documentos del aval
   - Repetir para múltiples avales

### Para Desarrolladores

#### Aplicar Migraciones

```bash
# Opción 1: Usar Supabase CLI (recomendado)
npx supabase db push

# Opción 2: Aplicar manualmente
# Ejecutar los archivos .sql en orden:
# 1. 20251113100000_create_user_profile_tables.sql
# 2. 20251113100001_create_user_documents_storage.sql
```

#### Verificar Instalación

```sql
-- Verificar tablas
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'user_%';

-- Verificar bucket
SELECT * FROM storage.buckets WHERE id = 'user-documents';

-- Verificar políticas RLS
SELECT tablename, policyname FROM pg_policies 
WHERE tablename IN ('user_documents', 'user_guarantors', 'user_guarantor_documents');
```

---

## 📊 Flujo de Datos

```
Usuario → UserProfilePage
              ↓
    ┌─────────┴─────────┐
    ↓                   ↓
Supabase            Storage
Database            Bucket
    ↓                   ↓
profiles            user-documents/
user_documents          ├─ {user_id}/
user_guarantors         │  ├─ doc1.pdf
user_guarantor_docs     │  └─ doc2.pdf
                        └─ {user_id}/guarantors/
                           └─ {guarantor_id}/
                              └─ doc.pdf
```

---

## ✅ Checklist de Verificación

### Backend
- ✅ Tablas creadas con RLS habilitado
- ✅ Políticas RLS configuradas correctamente
- ✅ Bucket de storage creado
- ✅ Políticas de storage configuradas
- ✅ Triggers de updated_at funcionando
- ✅ Función helper get_user_profile_with_documents

### Frontend
- ✅ Componente UserProfilePage creado
- ✅ Ruta /perfil agregada a AppContent
- ✅ Navegación actualizada (desktop y mobile)
- ✅ 3 pestañas implementadas
- ✅ Formularios funcionando
- ✅ Upload de archivos funcionando
- ✅ Gestión de avales funcionando
- ✅ Estados de carga y feedback
- ✅ Sin errores de linter

### UX/UI
- ✅ Diseño consistente con resto de la app
- ✅ Responsive (mobile y desktop)
- ✅ Iconografía clara
- ✅ Feedback visual claro
- ✅ Mensajes de éxito/error
- ✅ Indicadores de progreso

---

## 🔮 Mejoras Futuras Sugeridas

1. **Validación de RUT**
   - Implementar validación de formato y dígito verificador chileno

2. **Progreso de Completitud**
   - Barra de progreso mostrando % de perfil completado
   - Checklist visual de secciones pendientes

3. **Reutilización en Postulaciones**
   - Pre-llenar formularios de postulación con datos del perfil
   - Seleccionar avales frecuentes directamente

4. **Notificaciones**
   - Recordatorios para actualizar documentos vencidos
   - Sugerencias para completar perfil

5. **Compartir Perfil**
   - Generar link compartible del perfil
   - PDF exportable con información y documentos

6. **Historial de Cambios**
   - Log de modificaciones al perfil
   - Versiones anteriores de documentos

---

## 🐛 Troubleshooting

### El bucket no se crea
**Problema:** Error al crear bucket de storage

**Solución:**
```sql
-- Verificar que existe el esquema storage
SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'storage';

-- Si no existe, crear manualmente el bucket desde Supabase Dashboard
-- Storage > Create Bucket > Name: user-documents, Public: true
```

### Políticas RLS no funcionan
**Problema:** Usuario no puede ver/subir documentos

**Solución:**
```sql
-- Verificar que RLS está habilitado
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' AND tablename LIKE 'user_%';

-- Verificar políticas activas
SELECT * FROM pg_policies WHERE tablename = 'user_documents';
```

### Error de CORS en uploads
**Problema:** Error al subir archivos a storage

**Solución:**
- Verificar que el bucket es público
- Verificar políticas de storage
- Verificar configuración CORS en Supabase Dashboard

---

## 👥 Créditos

Implementado como parte del sistema de gestión inmobiliaria.

**Fecha:** 13 de Noviembre, 2025

---

## 📝 Notas de Implementación

- Se mantuvo la ruta `/contracts` existente para backward compatibility
- El menú muestra "Mi Perfil" en lugar de "Contratos"
- Los documentos se almacenan en carpetas por user_id para seguridad
- Las políticas RLS garantizan que cada usuario solo acceda a sus datos
- El componente es completamente autónomo y reutilizable

---

## 🎉 Conclusión

La nueva sección de perfil de usuario está **100% funcional** y lista para producción. Proporciona una experiencia completa y profesional para que los usuarios gestionen su información, documentos y avales frecuentes, mejorando significativamente la UX del sistema inmobiliario.

